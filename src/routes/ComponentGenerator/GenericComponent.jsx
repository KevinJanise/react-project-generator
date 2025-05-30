import styles from "./GenericComponent.module.css";
import { useState, useEffect } from "react";
import { LoadingIndicator } from "components/LoadingIndicator";
import { useCommand } from "hooks/useCommand";
import { FindMessageCommand } from "services/FindMessageCommand";

function GenericComponent ({messageId, children, className = "", style = {}, ...rest}) {
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


  const combinedClassName = [styles.genericComponent, className].filter(Boolean).join(" ");

  return (
    <div data-testid="generic-component" className={combinedClassName} style={style} {...rest}>

      {/* implement component code */}


        {errorMessage && (
            <p className={styles.errorMessage}>{errorMessage}</p>
        )}

        <LoadingIndicator isLoading={isExecuting} renderDelay={250}>
          {message ? (
  <p>message is: {JSON.stringify(message)}</p>
) : (
  <p>No data available</p>
)}
      </LoadingIndicator>


      { children }


    </div>
  );
}

export { GenericComponent };
