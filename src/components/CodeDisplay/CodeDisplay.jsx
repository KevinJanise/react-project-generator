import styles from "./CodeDisplay.module.css";

import { useState } from "react";
import iconCopy from "./icon_copy.svg";
import iconZip from "./icon_zip.svg";
import * as Utils from "utils/Utils";

function CodeDisplay({
  title,
  sourceCode,
  className = "",
  style = {},
  ...rest
}) {
  const [wasCopied, setWasCopied] = useState(false);

  const handleCopyToClipboard = () => {
    Utils.copyToClipboard(sourceCode);
    setWasCopied(true);
  };

  const combinedClassName = `${styles.codeDisplay} ${className}`;

  return (
    <div className={combinedClassName} style={style} {...rest}>
      <h3 className={styles.title}>
        {title}{" "}
        <img
          src={iconCopy}
          className={styles.copyIcon}
          alt="Copy code"
          title="Copy to clipboard"
          onClick={handleCopyToClipboard}
        />
        {wasCopied && <span className={styles.checkMark}>&#10003;</span>}
        </h3>

      <pre style={{margin: "1rem"}}>
        <code className={styles.code}>{sourceCode}</code>
      </pre>
    </div>
  );
}

export { CodeDisplay };
