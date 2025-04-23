import styles from "./GenericComponent.module.css";
import { useState, useEffect } from "react";
import { useCommand } from "hooks/useCommand";
import { FindMessageCommand } from "services/FindMessageCommand";

function GenericComponent ({messageId, onClick, onEdit, children, className = "", style = {}, ...rest}) {
  const [messageList, setMessageList] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const { execute, isExecuting } = useCommand();

  useEffect(() => {
    const init = async () => {
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

  const combinedClassNames = [styles.genericComponent, className].filter(Boolean).join(" ");

  return (
    <div data-testid="generic-component" className={combinedClassNames} style={style} {...rest}>
      <h3>GenericComponent</h3>

      {/* TODO implement component JSX */}

      <button type="button" onClick={handleOnClick}>Click onClick</button>
      <button type="button" onClick={handleOnEdit}>Click onEdit</button>

      {errorMessage && (
        <p className={styles.error}>{errorMessage}</p>
      )}

      {/* isInitialized prevents flashing No data message before search is done */}
      {isInitialized && (messageList ? (
        <>
           <h2>List of Items</h2>
           <ul>
            {messageList?.map((item, index) => (
              // TODO: Each key should be unique and unchanging, ideally from your data
              <li key={item?.id ?? index}>{item.description}</li>
            ))}
          </ul>
        </>
      ) : (
        <p className={styles.error}>No data available</p>
      ))}

      { children }
    </div>
  );
}

export { GenericComponent };
