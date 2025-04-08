import styles from "./ProgressIndicator.module.css";

// Put in a div and it will go along the top or bottom of it
function ProgressIndicator({ className = "", style = {}, ...rest }) {
  return (
    <div className={`${styles.progressBar} ${className}`} style={style} {...rest}>
      <div className={styles.progress}></div>

      <p>Progress</p>
    </div>
  );
}

export { ProgressIndicator };
