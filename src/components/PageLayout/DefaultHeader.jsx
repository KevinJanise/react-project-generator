import styles from "./DefaultHeader.module.css";

const DefaultHeader = () => (
  <div className={styles.header}>
    <span className={styles.companyName}>Enlyte</span>
    <span className={styles.productName}>React Code Generator</span>
  </div>
);

export { DefaultHeader };
