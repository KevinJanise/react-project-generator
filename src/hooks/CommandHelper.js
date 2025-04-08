// CommandHelper.js
class CommandHelper {
  constructor({ onCommandComplete } = {}) {
    this.isExecuting = false;
    this.commandStatuses = {};
    this.executingCommands = new Set();
    this.startTimes = {};
    this.onCommandComplete = onCommandComplete;
  }

  updateCommandStatus(commandId, status, result = null) {
    if (this.commandStatuses[commandId]?.status === status) return;

    this.commandStatuses[commandId] = {
      id: commandId,
      status,
      result,
      startTime: this.startTimes[commandId] || performance.now(),
      executionTime:
        status !== "executing"
          ? performance.now() -
            (this.startTimes[commandId] || performance.now())
          : null,
    };
  }

  async executeCommand(command) {
    const commandId = command.getId?.() || `command-${performance.now()}`;

    console.log("!!!!!!!!!!! executeCommand " + commandId);

    this.startTimes[commandId] = performance.now();
    this.updateCommandStatus(commandId, "executing");
    this.executingCommands.add(command);
    this.isExecuting = true;

    try {
      const value = await command.execute();
      this.updateCommandStatus(commandId, "success", value);

      const result = {
        command,
        commandId,
        isCanceled: command.getIsCanceled(),
        isSuccess: true,
        isError: false,
        value,
        error: null,
      };

      this.onCommandComplete?.(result);
      this.executingCommands.delete(command);
      this.isExecuting = this.executingCommands.size > 0;

      return result;
    } catch (error) {
      console.log("useCommand caught error: ", error);
      console.log("error.response", error.response);
      this.updateCommandStatus(commandId, "error", error);

      const result = {
        command,
        commandId,
        isCanceled: command.getIsCanceled(),
        isSuccess: false,
        isError: true,
        value: null,
        error,
      };

      this.onCommandComplete?.(result);
      this.executingCommands.delete(command);
      this.isExecuting = this.executingCommands.size > 0;

      return result;
    }
  }

  async execute(command) {
    return this.executeCommand(command);
  }

  async executeAsync(commands) {
    const commandArray = Array.isArray(commands) ? commands : [commands];
    if (commandArray.length === 0) return [];

    this.isExecuting = true;
    const results = await Promise.allSettled(
      commandArray.map((cmd) => this.executeCommand(cmd))
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
  }

  cancel() {
    this.executingCommands.forEach((cmd) => {
      console.log("!!!!!!!!!!!!!! cancel command: " + cmd.getId());
      const commandId = cmd.getId?.() || `command-${performance.now()}`;
      this.updateCommandStatus(commandId, "cancelled");
      cmd.cancel?.();
    });

    this.executingCommands.clear();
    this.isExecuting = false;
  }

  clearStatus(commandId) {
    if (!this.commandStatuses[commandId]) return;

    delete this.commandStatuses[commandId];
    delete this.startTimes[commandId];
  }

  clearAllStatuses() {
    this.commandStatuses = {};
    this.startTimes = {};
  }

  getState() {
    return {
      isExecuting: this.isExecuting,
      commandStatuses: { ...this.commandStatuses },
    };
  }
}

export { CommandHelper };
