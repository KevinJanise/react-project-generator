import styles from "./GenericComponent.module.css";
import { useState, useEffect } from "react";
import { LoadingIndicator } from "components/LoadingIndicator";
import { useCommand } from "hooks/useCommand";
import { FindMessageCommand } from "services/FindMessageCommand";

function GenericComponent ({messageId, onUpdate, children, className = "", style = {}, ...rest}) {
  const [message, setMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const { execute, isExecuting } = useCommand();

  useEffect(() => {
    async function init() {
      if (!messageId) { setErrorMessage("MessageId is required"); return; }

      const command = new FindMessageCommand(messageId);
      const result = await execute(command);

      if (result.isCanceled) return;

      if (result.isSuccess) {
        setMessage(result.value);
      } else {
        setErrorMessage("Error retrieving message");
      }
    }

    init();

    return () => {
      // Cleanup logic if needed
    };
  }, [execute, messageId]);
    
  const handleOnUpdate = () => {
    // let parent know something happened
    console.log("notifying parent");
    onUpdate?.("something happened")
  };

  const combinedClassName = [styles.genericComponent, className].filter(Boolean).join(" ");

  return (
    <div data-testid="generic-component" className={combinedClassName} style={style} {...rest}>

      {/* implement component code */}

      <h3>GenericComponent</h3>

      <button type="button" onClick={handleOnUpdate}>Click Me</button>
      
      {errorMessage && (
          <p className={styles.error}>{errorMessage}</p>
      )}
        
      <LoadingIndicator isLoading={isExecuting} renderDelay={250}>
          {message ? (  
            <>
              <h2>List of Items</h2>
              <ul>
                {message?.map((item, index) => (
                  <li key={item?.id ?? index}>{item.description}</li>
                ))}
              </ul>
            </>
      
          ) : (
            <p className={styles.error}>No data available</p>
          )}
      </LoadingIndicator>
    
      { children }

    </div>
  );
}

export { GenericComponent };