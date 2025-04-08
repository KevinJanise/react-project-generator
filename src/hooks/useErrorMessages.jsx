import { useRef, useCallback, useReducer } from "react";

const focusableSelector = [
  'a[href]:not([disabled]):not([aria-hidden="true"]):not([hidden])',
  'area[href]:not([disabled]):not([aria-hidden="true"]):not([hidden])',
  'input:not([disabled]):not([type="hidden"]):not([aria-hidden="true"]):not([hidden])',
  'select:not([disabled]):not([aria-hidden="true"]):not([hidden])',
  'textarea:not([disabled]):not([aria-hidden="true"]):not([hidden])',
  'button:not([disabled]):not([aria-hidden="true"]):not([hidden])',
  'iframe:not([aria-hidden="true"]):not([hidden])',
  'object:not([aria-hidden="true"]):not([hidden])',
  'embed:not([aria-hidden="true"]):not([hidden])',
  '[tabindex]:not([tabindex="-1"]):not([disabled]):not([aria-hidden="true"]):not([hidden])',
  '[contenteditable]:not([disabled]):not([aria-hidden="true"]):not([hidden])',
  'audio[controls]:not([disabled]):not([aria-hidden="true"]):not([hidden])',
  'video[controls]:not([disabled]):not([aria-hidden="true"]):not([hidden])',
  'summary:not([disabled]):not([aria-hidden="true"]):not([hidden])'
].join(",");

const useErrorMessages = () => {
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  const errorMessagesRef = useRef(new Map());
  const globalErrorsRef = useRef(new Set());

  const addErrorMessage = useCallback((field, message) => {
    const currentMessages = errorMessagesRef.current.get(field) || [];
    errorMessagesRef.current.set(field, [...currentMessages, message]);
    if (field === "global") globalErrorsRef.current.add(message);
    forceUpdate();
  }, []);

  const clearErrorMessages = useCallback(() => {
    errorMessagesRef.current.clear();
    globalErrorsRef.current.clear();
    console.log("cleared error messages ... forcing update");
    
    forceUpdate();
  }, []);

  const hasErrorMessages = useCallback(() => errorMessagesRef.current.size > 0, []);
  const hasFieldSpecificErrors = useCallback(() => errorMessagesRef.current.size > globalErrorsRef.current.size, []);

  const getErrorMessage = useCallback(field => {
    return errorMessagesRef.current.get(field) || null;
  }, []);

  const setFocusOnFirstError = useCallback(() => {
    const isVisible = element =>
      element instanceof HTMLElement && element.offsetParent !== null && window.getComputedStyle(element).visibility !== "hidden";

    const findFirstFocusableElement = container => {
      const elements = container.querySelectorAll(focusableSelector);
      return (
        Array.from(elements).find(element => {
          return element instanceof HTMLElement && isVisible(element);
        }) || null
      );
    };

    const findInputForFirstError = () => {
      const errorDiv = document.querySelector(".magErrorMessage");
      if (!errorDiv) return null;

      let currentElement = errorDiv.previousElementSibling;
      while (currentElement) {
        const focusableElement = findFirstFocusableElement(currentElement);
        if (focusableElement) return focusableElement;
        currentElement = currentElement.previousElementSibling;
      }

      return findFirstFocusableElement(errorDiv.parentElement || document.body);
    };

    setTimeout(() => {
      const element = findInputForFirstError();
      if (element instanceof HTMLElement) {
        element.focus();
      } else {
        console.error("No input found to focus on for the first error.");
      }
    }, 0);
  }, []);

  return {
    addErrorMessage,
    clearErrorMessages,
    hasErrorMessages,
    hasFieldSpecificErrors,
    setFocusOnFirstError,
    getErrorMessage
  };
};

export { useErrorMessages };
