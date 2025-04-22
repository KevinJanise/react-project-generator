import styles from "./GenericComponent.module.css";

import { useState, useEffect } from "react";
import { useCommand } from "hooks/useCommand";
import { FindMessageCommand } from "services/FindMessageCommand";

function GenericComponent ({messageId, onClick, onEdit, children, className = "", style = {}, ...rest}) {
  const [messageList, setMessageList] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const { execute, isExecuting } = useCommand();

  useEffect(() => {
    async function init() {
      if (!messageId) { setErrorMessage("MessageId is required"); return; }

      const command = new FindMessageCommand(messageId);
      const result = await execute(command);

      if (result.isCanceled) return;

      if (result.isSuccess) {
        setMessageList(result.value);
      } else {
        setErrorMessage("Error retrieving messageList");
      }

      setIsInitialized(true);
    }

    init();

    return () => {
      // TODO Cleanup logic if needed
    };
  }, [execute, messageId]);

  const handleOnClick = () => {
    // TODO let parent know something happened
    console.log("notifying parent - onClick");
    onClick?.("onClick happened!")
  };

  const handleOnEdit = () => {
    // TODO let parent know something happened
    console.log("notifying parent - onEdit");
    onEdit?.("onEdit happened!")
  };

  const combinedClassName = [styles.genericComponent, className].filter(Boolean).join(" ");

  return (
    <div data-testid="generic-component" className={combinedClassName} style={style} {...rest}>
      <h3>GenericComponent</h3>

      {/* TODO implement component JSX */}

      <button type="button" onClick={handleOnClick}>Click onClick</button>
      <button type="button" onClick={handleOnEdit}>Click onEdit</button>

      {errorMessage && (
        <p className={styles.error}>{errorMessage}</p>
      )}

      {isInitialized && (messageList ? (
        <p>messageList is: {JSON.stringify(messageList)}</p>
      ) : (
        <p className={styles.error}>No data available</p>
      ))}

      { children }
    </div>
  );
}

export { GenericComponent };
