import React from "react";
import styles from "./ErrorMessage.module.css";

function ErrorMessage({ children, className = "", style = {}, ...rest }) {
  const renderChild = (child, index) => {
    if (React.isValidElement(child)) {
      // If it's a React element, clone it and pass along any extra props
      return React.cloneElement(child, { ...rest });
    } else if (child) {
      // If it's a non-empty string or other truthy value, render it as an error message
      return (
        <div key={index} className={`${styles.errorMessage} ${className}`} style={style} {...rest}>
          {child}
        </div>
      );
    }
    // If it's null, undefined, or an empty string, don't render anything
    return null;
  };

  return <>{React.Children.map(children, renderChild)}</>;
}

export { ErrorMessage };
