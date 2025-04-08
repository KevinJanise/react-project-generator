import { useRef, useLayoutEffect, useCallback } from "react";

/**
 * A custom React hook that returns a stable function reference,
 * ensuring it always calls the latest version of the provided function.
 * Useful for preventing stale closures in event handlers, effects, or callbacks.
 *
 * @template TArgs
 * @template TResult
 * @param {(...args: TArgs) => TResult} fn - The function to stabilize.
 * @returns {(...args: TArgs) => TResult} A stable function reference that always calls the latest version of `fn`.
 *
 * @example
 * function MyComponent() {
 *   const handleClick = useStableFunction(() => {
 *     console.log("Latest state value:", state);
 *   });
 *
 *   return <button onClick={handleClick}>Click Me</button>;
 * }
 *
 * @example
 * function MyComponent() {
 *   const fetchData = useStableFunction(async () => {
 *     const response = await fetch("/api/data");
 *     console.log(await response.json());
 *   });
 *
 *   useEffect(() => {
 *     fetchData();
 *   }, [fetchData]); // Won't cause an infinite loop
 * }
 */
function useStableFunction(fn) {
  const fnRef = useRef(fn);

  useLayoutEffect(() => {
    fnRef.current = fn;
  }, [fn]); // Ensures fnRef always points to the latest function

  return useCallback((...args) => {
    return fnRef.current(...args);
  }, []); // Returns a stable function reference
}

export { useStableFunction };
