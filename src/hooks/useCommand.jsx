import { useState, useCallback, useEffect, useRef } from "react";
import {CommandHelper} from "./CommandHelper";

function useCommand({ onCommandComplete } = {}) {
  const commandHelperRef = useRef(null);
  if (!commandHelperRef.current) {
    commandHelperRef.current = new CommandHelper({ onCommandComplete });
  }

  const [, setState] = useState({});

  // Force re-render when state changes
  const updateState = useCallback(() => {
    setState(commandHelperRef.current.getState());
  }, []);

  const execute = useCallback(async (command) => {
    const result = await commandHelperRef.current.execute(command);
    updateState();
    return result;
  }, [updateState]);

  const executeAsync = useCallback(async (commands) => {
    const results = await commandHelperRef.current.executeAsync(commands);
    updateState();
    return results;
  }, [updateState]);

  const cancel = useCallback(() => {
    commandHelperRef.current.cancel();
    updateState();
  }, [updateState]);

  const clearStatus = useCallback((commandId) => {
    commandHelperRef.current.clearStatus(commandId);
    updateState();
  }, [updateState]);

  const clearAllStatuses = useCallback(() => {
    commandHelperRef.current.clearAllStatuses();
    updateState();
  }, [updateState]);

  const { isExecuting, commandStatuses } = commandHelperRef.current.getState();

  return {
    execute,
    executeAsync,
    cancel,
    isExecuting,
    commandStatuses,
    clearStatus,
    clearAllStatuses,
  };
}

export { useCommand };
