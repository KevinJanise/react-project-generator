// refactor so you can use basically the same thing in a plain JavaScript file

import { useState, useCallback, useEffect, useRef } from "react";

function useCommand({ onCommandComplete } = {}) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [commandStatuses, setCommandStatuses] = useState({});
  const executingCommands = useRef(new Set());
  const startTimes = useRef({});

  const updateCommandStatus = useCallback(
    (commandId, status, result = null) => {
      setCommandStatuses((prev) => {
        if (prev[commandId]?.status === status) return prev; // Avoid redundant updates

        return {
          ...prev,
          [commandId]: {
            id: commandId,
            status,
            result,
            startTime: startTimes.current[commandId] || performance.now(),
            executionTime:
              status !== "executing"
                ? performance.now() -
                  (startTimes.current[commandId] || performance.now())
                : null,
          },
        };
      });
    },
    []
  );

  const executeCommand = useCallback(
    async (command) => {
      const commandId = command.getId?.() || `command-${performance.now()}`;

      // Store start time
      startTimes.current[commandId] = performance.now();
      updateCommandStatus(commandId, "executing");

      executingCommands.current.add(command);
      setIsExecuting(true);

      try {
        const value = await command.execute();
        updateCommandStatus(commandId, "success", value);
        onCommandComplete?.({
          command,
          commandId,
          isCanceled: command.getIsCanceled(),
          isSuccess: true,
          isError: false,
          value,
          error: null,
        });

        return {
          command,
          commandId,
          isCanceled: command.getIsCanceled(),
          isSuccess: true,
          isError: false,
          value,
          error: null,
        };
      } catch (error) {
        console.log("useCommand caught error: ", error);
        console.log("error.response", error.response);
        updateCommandStatus(commandId, "error", error);
        onCommandComplete?.({
          command,
          commandId,
          isCanceled: command.getIsCanceled(),
          isSuccess: false,
          isError: true,
          value: null,
          error,
        });
        return {
          command,
          commandId,
          isCanceled: command.getIsCanceled(),
          isSuccess: false,
          isError: true,
          value: null,
          error,
        };
      } finally {
        executingCommands.current.delete(command);
        setIsExecuting(executingCommands.current.size > 0);
      }
    },
    [onCommandComplete, updateCommandStatus]
  );

  const execute = useCallback(
    async (command) => executeCommand(command),
    [executeCommand]
  );

  const executeAsync = useCallback(
    async (commands) => {
      const commandArray = Array.isArray(commands) ? commands : [commands];
      if (commandArray.length === 0) return [];

      setIsExecuting(true);
      const results = await Promise.allSettled(
        commandArray.map(executeCommand)
      );

      return results.map(({ status, value, reason }, index) =>
        status === "fulfilled"
          ? value
          : {
              command: commandArray[index],
              commandId: commandArray[index]?.getId?.() || `unknown-${index}`,
              isCanceled: commandArray[index]?.getIsCanceled(),
              isSuccess: false,
              isError: true,
              value: null,
              error: reason,
            }
      );
    },
    [executeCommand]
  );

  const cancel = useCallback(() => {
    executingCommands.current.forEach((cmd) => {
      const commandId = cmd.getId?.() || `command-${performance.now()}`;
      updateCommandStatus(commandId, "cancelled");
      cmd.cancel?.();
    });

    executingCommands.current.clear();
    setIsExecuting(false);
  }, [updateCommandStatus]);

  const clearStatus = useCallback((commandId) => {
    setCommandStatuses((prev) => {
      if (!prev[commandId]) return prev; // Avoid unnecessary state updates

      const newStatuses = { ...prev };
      delete newStatuses[commandId];
      return newStatuses;
    });

    delete startTimes.current[commandId];
  }, []);

  const clearAllStatuses = useCallback(() => {
    setCommandStatuses({});
    startTimes.current = {};
  }, []);

  useEffect(() => {
    return cancel;
  }, [cancel]);

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
