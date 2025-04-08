import { retryableFetch } from "utils/retryableFetch";

const ONE_SECOND = 1000;
const DEFAULT_MAX_ATTEMPTS = 1;
const DEFAULT_BASE_DELAY = ONE_SECOND;
const DEFAULT_REQUEST_TIMEOUT = ONE_SECOND * 30;

/**
 * Base class for REST API commands.
 */
class Command {
  static OPERATION = "_UNDEFINED";

  // Response type constants
  static JSON = "json";
  static TEXT = "text";
  static BLOB = "blob";
  static ARRAY_BUFFER = "arrayBuffer";
  static FORM_DATA = "formData";

  /**
   * Creates a new Command instance.
   * @param {string} url The base URL for the API endpoint.
   * @param {object} [options={}] Additional options for the command.
   * @param {object} [options.fetchOptions={}] Options for the fetch API.
   * @param {object} [options.retryOptions={}] Options for the retry mechanism.
   * @throws {Error} If the URL is not provided or is invalid.
   */
  constructor(url, { fetchOptions = {}, retryOptions = {} } = {}) {
    if (!this.#isValidOptions(fetchOptions, retryOptions)) {
      throw new TypeError("fetchOptions and retryOptions must be objects");
    }

    if (!this.hasDefinedOperation()) {
      throw new Error(
        `${this.constructor.name} does not define static OPERATION = "OPERATION_NAME"`
      );
    }

    this.url = url;
    this.id = crypto.randomUUID();
    this.isCanceled = false;

    // Handle signal and abort controller setup
    this.abortController = !fetchOptions.signal ? new AbortController() : null;
    this.signal = fetchOptions.signal || this.abortController?.signal;

    // Set up fetch and retry options
    this.fetchOptions = { ...fetchOptions, signal: this.signal };
    this.retryOptions = {
      maxAttempts: DEFAULT_MAX_ATTEMPTS,
      baseDelay: DEFAULT_BASE_DELAY,
      timeout: DEFAULT_REQUEST_TIMEOUT,
      ...retryOptions,
    };
  }

  getOperation = function () {
    return this.constructor.OPERATION;
  };

  getId() {
    return this.id;
  }

  /**
   * Validates the subclass has defined a static OPERATION name.
   * @returns {boolean} Whether the OPERATION variable is defined or not.
   */
  hasDefinedOperation() {
    return !(
      this.constructor !== Command &&
      this.constructor.OPERATION === Command.OPERATION
    );
  }

  /**
   * Validates options objects.
   * @param {object} fetchOptions The fetch options to validate.
   * @param {object} retryOptions The retry options to validate.
   * @returns {boolean} Whether the options are valid.
   */
  #isValidOptions(fetchOptions, retryOptions) {
    return (
      (!fetchOptions || typeof fetchOptions === "object") &&
      (!retryOptions || typeof retryOptions === "object")
    );
  }

  /**
   * Executes the command.  This method must be implemented by subclasses.
   * @returns {Promise<any>} A promise that resolves with the response data.
   * @throws {Error} If the execute() method is not implemented.
   */
  async execute() {
    throw new Error("execute() method must be implemented in subclasses");
  }

  getFetchErrorMessage(response) {
    const statusCodeMap = {
      400: "400 Error - Bad Request: The server could not understand the request due to invalid syntax.",
      401: "401 Error - Unauthorized: Authentication is required and has failed or has not been provided.",
      402: "402 Error - Payment Required: Reserved for future use, typically related to digital payment systems.",
      403: "403 Error - Forbidden: The server understood the request but refuses to authorize it.",
      404: "404 Error - Not Found: The requested resource could not be found.",
      405: "405 Error - Method Not Allowed: The request method is not supported for the requested resource.",
      406: "406 Error - Not Acceptable: The requested resource is capable of generating only content not acceptable according to the Accept headers sent in the request.",
      408: "408 Error - Request Timeout: The server timed out waiting for the request.",
      409: "409 Error - Conflict: The request conflicts with the current state of the server.",
      410: "410 Error - Gone: The requested resource is no longer available and will not be available again.",
      413: "413 Error - Payload Too Large: The request is larger than the server is willing or able to process.",
      414: "414 Error - URI Too Long: The requested URL is too long for the server to process.",
      415: "415 Error - Unsupported Media Type: The request entity has a media type that the server or resource does not support.",
      418: "418 Error - I'm a Teapot: This is an April Fools' joke from the HTCPCP protocol (RFC 2324).",
      422: "422 Error - Unprocessable Entity: The request was well-formed but could not be processed due to semantic errors.",
      425: "425 Error - Too Early: The server is unwilling to risk processing a request that might be replayed.",
      426: "426 Error - Upgrade Required: The client needs to switch to a different protocol.",
      429: "429 Error - Too Many Requests: The user has sent too many requests in a given amount of time.",
      431: "431 Error - Request Header Fields Too Large: The server is unwilling to process the request because its headers are too large.",
      500: "500 Error - Internal Server Error: The server encountered an unexpected condition.",
      501: "501 Error - Not Implemented: The server does not support the functionality required to fulfill the request.",
      502: "502 Error - Bad Gateway: The server received an invalid response from the upstream server.",
      503: "503 Error - Service Unavailable: The server is not ready to handle the request.",
      504: "504 Error - Gateway Timeout: The upstream server failed to send a request in the time allowed by the server.",
      505: "505 Error - HTTP Version Not Supported: The server does not support the HTTP version used in the request.",
      511: "511 Error - Network Authentication Required: The client needs to authenticate to gain network access.",
    };

    let errorMessage = null;

    if (!response.ok) {
      errorMessage =
        statusCodeMap[response.status] ||
        `${response.status} Error - An unexpected error occurred.`;
    }

    return errorMessage;
  }

  /**
   * Sends a request to the specified URL using the given method and body.
   * @param {string} url The URL to send the request to.
   * @param {string} method The HTTP method to use (e.g., "GET", "POST").
   * @param {any} [body=null] The request body.
   * @param {string} [responseType="json"] The expected response type (e.g., "json", "text", "blob", "arrayBuffer", "formData").
   * @returns {Promise<any>} A promise that resolves with the parsed response data.
   * @throws {Error} If the request fails or the response is not valid.
   */
  async sendRequest(url, method, body = null, responseType = Command.JSON) {
    const headers = {
      "Content-Type": "application/json",
      ...this.fetchOptions.headers,
    };

    const computedFetchOptions = {
      ...this.fetchOptions,
      method,
      headers,
    };

    console.log("Command sendRequest URL = " + url);

    if (body) {
      computedFetchOptions.body = JSON.stringify(body);
    }

    try {
      const response = await retryableFetch(
        url,
        computedFetchOptions,
        this.retryOptions
      );

      if (!response.ok) {
        let fetchErrorMessage = this.getFetchErrorMessage(response);
        const error = new Error(fetchErrorMessage);
        error.response = response;

        throw error;
      }

      let data;
      switch (responseType) {
        case "json":
          try {
            data = await response.json();
          } catch (jsonError) {
            console.error("Error parsing JSON:", jsonError);
            console.log(response);
            console.log(data);
            throw new Error("Invalid JSON response");
          }
          break;
        case Command.TEXT:
          data = await response.text();
          break;
        case Command.BLOB:
          data = await response.blob();
          break;
        case Command.ARRAY_BUFFER:
          data = await response.arrayBuffer();
          break;
        case Command.FORM_DATA:
          data = await response.formData();
          break;
        default:
          throw new Error(`Unsupported response type: ${responseType}`);
      }

      return data;
    } catch (error) {
      console.error(`Request failed: ${error}`, error);

      throw error;
    }
  }

  objectToQueryString(params) {
    if (
      !params ||
      typeof params !== "object" ||
      Object.keys(params).length === 0
    ) {
      return "";
    }

    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((v) => searchParams.append(key, v.toString()));
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });

    return searchParams.toString();
  }

  /**
   * Sends a GET request to the API endpoint.
   * @param {object} [params={}] The URL parameters. Appended a query parameters.
   * @param {string} [responseType="json"] The expected response type.
   * @returns {Promise<any>} A promise that resolves with the parsed response data.
   */
  async get(params = {}, responseType = Command.JSON) {
    const queryString = this.objectToQueryString(params);
    let requestUrl = this.url;

    if (queryString) {
      // Check if the URL already contains a query string
      const separator = this.url.includes("?") ? "&" : "?";

      // Append the query string to the URL using the appropriate separator
      requestUrl += separator + queryString;
    }

    return this.sendRequest(requestUrl, "GET", null, responseType);
  }

  /**
   * Sends a POST request to the API endpoint.
   * @param {any} body The request body.
   * @param {string} [responseType="json"] The expected response type.
   * @returns {Promise<any>} A promise that resolves with the parsed response data.
   */
  async post(body, responseType = Command.JSON) {
    return this.sendRequest(this.url, "POST", body, responseType);
  }

  /**
   * Sends a PUT request to the API endpoint.
   * @param {any} body The request body.
   * @param {string} [responseType="json"] The expected response type.
   * @returns {Promise<any>} A promise that resolves with the parsed response data.
   */
  async put(body, responseType = Command.JSON) {
    return this.sendRequest(this.url, "PUT", body, responseType);
  }

  /**
   * Sends a PATCH request to the API endpoint.
   * @param {any} body The request body.
   * @param {string} [responseType="json"] The expected response type.
   * @returns {Promise<any>} A promise that resolves with the parsed response data.
   */
  async patch(body, responseType = Command.JSON) {
    return this.sendRequest(this.url, "PATCH", body, responseType);
  }

  /**
   * Sends a DELETE request to the API endpoint.
   * @param {string} [responseType="json"] The expected response type.
   * @returns {Promise<any>} A promise that resolves with the parsed response data.
   */
  async delete(responseType = Command.JSON) {
    return this.sendRequest(this.url, "DELETE", null, responseType);
  }

  cancel() {
    if (this.abortController) {
      this.isCanceled = true;
      // Only call abort if WE created the controller
      console.log("Command - cancel() calling abort on " + this.id);
      this.abortController.abort();
    } else {
      console.warn(
        "Cannot cancel: External signal provided.  Cancellation must be handled by the caller via abort() function on AbortController."
      );
    }
  }

  getIsCanceled() {
    return this.isCanceled;
  }
}

export { Command };
