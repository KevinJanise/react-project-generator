import { useState, useEffect } from "react";
import styles from "./LoadingIndicator.module.css";

// renderDelay - wait this long before showing loading indicator, loading may be complete before
// this time expires so don't show the indicator. Will give faster perceived speed to the user.
function LoadingIndicator({ isLoading, children, className = "", style = {}, renderDelay = 333 }) {
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    let timeoutId;

    if (isLoading) {
      if (renderDelay > 0) {
        timeoutId = setTimeout(() => setShowLoading(true), renderDelay);
      } else {
        setShowLoading(true);
      }
    } else {
      setShowLoading(false);
      clearTimeout(timeoutId);
    }

    return () => clearTimeout(timeoutId);
  }, [isLoading, renderDelay]);

  const renderLoadingIndicator = () => {
    return (
      <div className={`${styles.loadingIndicator} ${className}`} style={style}>
        <div className={styles.nest1}></div>
      </div>
    );
  };

  return (
    <div>
      {showLoading && renderLoadingIndicator()}

      {!isLoading && children}
    </div>
  );
}

export { LoadingIndicator };
