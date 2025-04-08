import styles from "./DefaultHeader.module.css";

const DefaultHeader = () => (
  <div className={styles.header}>
    <span className={styles.companyName}>Xynovation</span>
    <span className={styles.productName}>Knowledge Portal</span>
  </div>
);

export { DefaultHeader };
