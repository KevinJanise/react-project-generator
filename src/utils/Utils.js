/**
 * Creates a debounced version of the provided function that delays its execution until after a specified
 * amount of time has passed since the last time it was invoked.
 *
 * @param {Function} func - The function to debounce. This function will be invoked after the delay.
 * @param {number} delay - The number of milliseconds to wait after the last call before invoking the function.
 * @param {Object} [options={}] - Configuration options to customize the debouncing behavior.
 * @param {boolean} [options.leading=false] - If `true`, the function will be invoked on the leading edge (immediately on the first call).
 * @param {boolean} [options.trailing=true] - If `true`, the function will be invoked on the trailing edge (after the specified delay).
 * @param {Object} [options.context=null] - The context (`this`) to use when invoking the function.
 *
 * @returns {Function} - A debounced version of the provided function.
 * The returned debounced function has the following methods:
 *  - `cancel()`: Cancels any pending invocation of the debounced function.
 *  - `flush()`: Immediately invokes the function, regardless of the delay.
 *  - `pending()`: Returns `true` if there is a pending invocation, otherwise `false`.
 *
 * @throws {TypeError} Throws an error if `func` is not a function, `delay` is not a positive number, or `options` is not an object.
 *
 * @example
 * // Example usage in a search input field:
 * const debouncedSearch = debounce(
 *   (query) => { console.log('Searching for:', query); },
 *   500,
 *   { leading: false, trailing: true }
 * );
 *
 * // Simulate input change events that trigger the debounced search function
 * debouncedSearch('first query'); // Will wait for 500ms before calling the search function
 * debouncedSearch('second query'); // Will reset the 500ms delay, and call the search function once the typing pauses.
 * debouncedSearch.flush(); // Will immediately call the search function, regardless of the delay.
 * debouncedSearch.cancel(); // Cancels any pending search.
 */
export const debounce = (func, delay, options = {}) => {
  if (typeof func !== "function") {
    throw new TypeError("Expected a function");
  }

  if (typeof delay !== "number" || delay < 0) {
    throw new TypeError("Delay must be a positive number");
  }

  if (typeof options !== "object") {
    throw new TypeError("Options must be an object");
  }

  const { leading = false, trailing = true, context = null } = options;

  let timeoutId;
  let lastArgs;
  let lastCallTime = 0;
  let result;

  const debounced = function (...args) {
    const time = Date.now();
    const invokeImmediately = leading && !lastCallTime;
    lastArgs = args;
    lastCallTime = time;

    // If leading invocation is requested and it's time to invoke
    if (invokeImmediately) {
      result = func.apply(context, args);
    }

    // Clear previous timeout
    clearTimeout(timeoutId);

    // Schedule the trailing invocation if needed
    if (trailing) {
      timeoutId = setTimeout(() => {
        if (lastArgs) {
          result = func.apply(context, lastArgs);
          lastArgs = undefined; // reset after invocation
        }
      }, delay);
    }

    return result;
  };

  // Cancels any pending invocations
  debounced.cancel = () => {
    clearTimeout(timeoutId);
    timeoutId = null;
    lastArgs = null;
    lastCallTime = 0;
  };

  // Immediately invokes the function if it hasn't been called recently (flushes pending invocation)
  debounced.flush = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
      if (lastArgs) {
        result = func.apply(context, lastArgs);
        lastArgs = null; // Reset the arguments after flushing
      }
    }
    return result;
  };

  // Returns whether there is a pending invocation
  debounced.pending = () => {
    return timeoutId !== null;
  };

  return debounced;
};

// returns true if the object has no properties
export function isObjectEmpty(obj) {
  if (obj == null) return true; // Handles null and undefined
  if (typeof obj !== "object" || Array.isArray(obj)) return false;
  return Object.keys(obj).length === 0;
}

// For security reasons, the Clipboard API only works in secure contexts (HTTPS)
// and requires user permission. The permission is usually granted automatically
// when triggered by a user action like a button click.
export function copyToClipboard(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      console.log("Text copied to clipboard");
    })
    .catch(err => {
      console.error("Failed to copy text: ", err);
    });
}

export function resolveFullUrl(relativePath) {
  console.log("resolveFullUrl *************** " + relativePath);

  if (!relativePath) return '';

  try {
    // Check if it's already a full URL
    const url = new URL(relativePath);
    console.log("URL is complete: " + relativePath);

    return url.href;
  } catch (e) {
    console.log(e);

    // Not a full URL, resolve relative path
    const anchor = document.createElement('a');
    anchor.href = relativePath;

    if (relativePath.startsWith('/')) {
      return new URL(relativePath, window.location.origin).href;
    }

    return anchor.href;
  }
}

// returns everything after the host
export function parseUrl(url) {
 // const forecastHourlyUrl = "https://api.weather.gov/gridpoints/FWD/92,118/forecast/hourly";

 let path = null;

  try {
    const urlObject = new URL(url);
    path = urlObject.pathname + urlObject.search + urlObject.hash;
    console.log(path); // Output: /gridpoints/FWD/92,118/forecast/hourly
  } catch (error) {
    console.error("Invalid URL:", error);
  }

  return path;
}


/**
 * Parses a string of parameter names (separated by spaces and/or commas)
 * into an array of normalized, valid JavaScript identifiers.
 *
 * - Trims whitespace around entries.
 * - Supports both comma and space as separators.
 * - Normalizes each name to start with a lowercase letter (unless it begins with `_` or `$`).
 * - Validates that each resulting name is a legal JavaScript identifier.
 * - Throws an error if any invalid identifiers are found, listing all of them.
 *
 * @param {string} input - A string containing parameter names separated by commas or whitespace.
 * @returns {string[]} An array of valid, normalized parameter names.
 *
 * @throws {Error} If any of the parameter names are not valid JavaScript identifiers.
 *
 * @example
 * parseParamList("paramOne, _Private, secondParam  $extra, 9invalid, not-valid")
 * // Throws: Error: Invalid parameter name(s): 9invalid, not-valid
 *
 * @example
 * parseParamList("First, Second third, _internal, $dollar")
 * // Returns: ["first", "second", "third", "_internal", "$dollar"]
 */
export function parseParamList(input) {
  const isValidIdentifier = str => /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(str);

  const rawItems = input
    .split(/[\s,]+/)
    .map(str => str.trim())
    .filter(Boolean);

  const normalized = rawItems.map(str => {
    if (str.startsWith('_')) {
      return '_' + (str[1] ? str[1].toLowerCase() + str.slice(2) : '');
    }
    if (str.startsWith('$')) {
      return '$' + (str[1] ? str[1].toLowerCase() + str.slice(2) : '');
    }
    return str[0].toLowerCase() + str.slice(1);
  });

  const invalid = normalized.filter(str => !isValidIdentifier(str));

  if (invalid.length > 0) {
    throw new Error(`Invalid parameter name(s): ${invalid.join(', ')}`);
  }

  return normalized;
}

export const pause = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
};