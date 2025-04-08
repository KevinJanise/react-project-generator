import { useEffect, useRef, useCallback } from "react";

const NO_TIMEOUT = -1;

/**
 * A React hook for saving and restoring page state using a storage engine. The typical behavior is to
 * automatically save page state when the component unmounts or the page is refreshed. You can disable
 * this behavior and save the save explicity by calling savePageState.
 * 
 * A React hook for saving and restoring page state using a storage engine. The page state is
 * stored when the page/component unmounts and is restored when it mounts. You can also save
 * and clear state at any time using savePageState and clearPageState functions. For example,
 * you save the state when a user clicks a search button and clear the state when the user
 * presses a clear button. If you don't want to automatically save the state pass in null or
 * undefined for the onSave function.

 *
 * @param {string} storageKey - Unique key used to store/retrieve state.
 * @param {function} onLoad - Callback to restore the page state. Returns a JavaScript object.
 * @param {function|null} onSave - Callback to save the page state; null or undefined to disable automatic
 *                                 saving otherwise it should return a JavaScript object containing the state wanted to save.
 * @param {Storage} [storageEngine=sessionStorage] - Storage engine to use.
 * @returns {object} Methods (savePageState, clearPageState) to save and clear page state.
 */
const usePageState = (storageKey, onLoad, onSave, storageEngine = sessionStorage) => {
  if (typeof storageKey !== "string" || !onLoad || !storageEngine) {
    throw new Error("Invalid arguments passed to usePageState.");
  }

  const onSaveRef = useRef(onSave);
  const onLoadRef = useRef(onLoad);

  onSaveRef.current = onSave;
  onLoadRef.current = onLoad;

  const _savePageState = useCallback((state = null, delay = 10) => {
      const saveState = () => {
        try {
          const pageState = state ?? onSaveRef.current?.();

          if (pageState !== null && pageState !== undefined) {
            storageEngine.setItem(storageKey, JSON.stringify(pageState));
          } else {
              console.warn("Cannot save null or undefined state.");
          }
        } catch (err) {
          console.error("Failed to save state:", err);
        }
      };

      if (delay >= 0) {
        setTimeout(saveState, delay);
      } else {
        saveState();
      }
    }, [storageKey, storageEngine]);

  // Restore state on mount
  useEffect(() => {
    try {
      const savedState = storageEngine.getItem(storageKey);

      if (savedState) {
        onLoadRef.current(JSON.parse(savedState));
      }
    } catch (err) {
      console.error("Failed to load state:", err);
    }
  }, [storageKey, storageEngine]);

  // Save state on unmount and page reload if onSave is provided
  useEffect(() => {
    if (!onSaveRef.current) {
      return; // Skip setting up automatic saving if onSave is null or undefined
    }

    const handleBeforeUnload = () => _savePageState(null, NO_TIMEOUT);

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);

      if (!onSaveRef.current) {
        return; // Skip setting up automatic saving if onSave is null or undefined
      }

      // accounts for StrictMode mount, unmount, mount behavior
      _savePageState(null, 10);
    };
  }, [_savePageState]);

  const savePageState = useCallback((state) => {
      _savePageState(state);
    }, [_savePageState]);

  const clearPageState = useCallback(() => {
    try {
      storageEngine.removeItem(storageKey);
    } catch (err) {
      console.error("Failed to clear state:", err);
    }
  }, [storageKey, storageEngine]);

  return { savePageState, clearPageState };
};

export { usePageState };


