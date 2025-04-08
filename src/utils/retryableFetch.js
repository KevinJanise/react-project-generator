const ONE_SECOND = 1000;
const MAX_DELAY = ONE_SECOND * 30;

const RETRYABLE_ERRORS = [
  408, // REQUEST_TIMEOUT
  425, // TOO_EARLY
  429, // TOO_MANY_REQUESTS
  500, // INTERNAL_SERVER_ERROR
  502, // BAD_GATEWAY
  503, // SERVICE_UNAVAILABLE
  504 // GATEWAY_TIMEOUT
];

const calculateRetryDelay = (baseDelay, attempt) => {
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 0.2 * exponentialDelay;
  return Math.min(exponentialDelay + jitter, MAX_DELAY);
};

const sleep = (ms, signal, message = "Sleep aborted") =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException(message, "AbortError"));

    const timeoutId = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timeoutId);
        reject(new DOMException(message, "AbortError"));
      },
      { once: true }
    );
  });

const retryableFetch = async (url, fetchOptions = {}, retryOptions = {}) => {
  const {
    maxAttempts = 1,
    baseDelay = ONE_SECOND,
    timeout = MAX_DELAY,
    isRetryable = status => {
      return RETRYABLE_ERRORS.includes(status);
    }
  } = retryOptions;

  const { signal: userSignal, ...restFetchOptions } = fetchOptions;
  let lastResponse, lastError;
  let userAbortHandler; // Store the handler function

  let startTime = 0;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`Attempt ${attempt}: ${url}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(new DOMException("Request timeout", "AbortError")), timeout);

    // Link user's abort signal
    userAbortHandler = () => controller.abort(); // Assign the function to the variable
    userSignal?.addEventListener("abort", userAbortHandler, { once: true });

    try {
      startTime = performance.now();
      lastResponse = await fetch(url, { ...restFetchOptions, signal: controller.signal });
      console.log(`fetch took ${Math.round(performance.now() - startTime)}ms`);

      if (lastResponse.ok || !isRetryable(lastResponse.status)) {
        return lastResponse;
      }
    } catch (error) {
      console.log(`fetch took ${Math.round(performance.now() - startTime)}ms`);
      console.error(error);

      if (userSignal?.aborted) throw error;
      lastError = error;
    } finally {
      clearTimeout(timeoutId);
      userSignal?.removeEventListener("abort", userAbortHandler); // Remove the listener
    }

    if (attempt < maxAttempts) {
      console.log("waiting for next attempt...");
      await sleep(calculateRetryDelay(baseDelay, attempt), userSignal, "signal is aborted without reason");
    }
  }

  return lastResponse || Promise.reject(lastError);
};

export { retryableFetch };
