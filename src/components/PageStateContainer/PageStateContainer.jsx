import { useState, useEffect } from "react";
import { Button } from "csg-react-magnetic/button";
import { BlockMessage } from "components/BlockMessage";
import styles from "./PageStateContainer.module.css";

// Define page state constants
const PAGE_STATE = {
  LOADING: "loading",
  ERROR: "error",
  READY: "ready"
};

const LoadingIndicator = ({ style }) => (
  <div style={style} className={styles.pageLoadingIndicator}>
    <div className={styles.square}></div>
    <div className={styles.bars}>
      <div className={styles.bar}></div>
      <div className={styles.bar}></div>
      <div className={styles.bar}></div>
    </div>
  </div>
);

const ErrorView = ({ message, onRetry, style }) => (
  <div style={style}>
    <BlockMessage variant="error">{message}</BlockMessage>
    {onRetry && (
      <Button icon="refresh" type="button" onClick={onRetry} style={{ marginTop: "1rem" }}>
        Retry
      </Button>
    )}
  </div>
);

/**
 * PageStateContainer - Manages the loading, error, and ready states of page content
 *
 * @param {string} state - Current state of the page (use PAGE_STATE constants)
 * @param {string} initializationErrorMessage - Error message to display when state is ERROR
 * @param {function} onRetry - Function to call when retry button is clicked
 * @param {number} renderDelay - Delay in ms before showing loading indicator
 * @param {React.ReactNode} children - Content to render when state is READY
 * @param {string} className - Additional CSS class
 * @param {object} style - Additional inline styles
 */
function PageStateContainer({
  state = PAGE_STATE.LOADING,
  initializationErrorMessage,
  onRetry,
  renderDelay = 0,
  children,
  className = "",
  style = {},
  errorStyle = {},
  loadingStyle = {},
  ...rest
}) {
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    if (state !== PAGE_STATE.LOADING) {
      setShowLoading(false);
      return;
    }

    if (renderDelay <= 0) {
      setShowLoading(true);
      return;
    }

    const timeoutId = setTimeout(() => setShowLoading(true), renderDelay);
    return () => clearTimeout(timeoutId);
  }, [state, renderDelay]);

  // Handle loading state
  if (state === PAGE_STATE.LOADING && showLoading) {
    return <LoadingIndicator style={loadingStyle} />;
  }

  // Handle error state
  if (state === PAGE_STATE.ERROR) {
    return <ErrorView style={errorStyle} message={initializationErrorMessage} onRetry={onRetry} />;
  }

  // Handle ready state
  return state === PAGE_STATE.READY ? (
    <div className={className} style={style} {...rest}>
      {children}
    </div>
  ) : null;
}

export { PageStateContainer, PAGE_STATE };
