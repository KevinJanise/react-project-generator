import styles from "./CodeDisplay.module.css";
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
  const handleCopyToClipboard = () => {
    Utils.copyToClipboard(sourceCode);
  };

  const combinedClassName = `${styles.codeDisplay} ${className}`;

  return (
    <div className={combinedClassName} style={style} {...rest}>
      <h3 className={styles.title}>{title} <img src={iconCopy} className={styles.copyIcon} alt="Copy code" onClick={handleCopyToClipboard}/></h3>

      <pre>
        <code className={styles.code}>{sourceCode}</code>
      </pre>
    </div>
  );
}

export { CodeDisplay };
