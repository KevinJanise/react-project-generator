import styles from "./DefaultFooter.module.css";

const DefaultFooter = () => (
  <footer className={styles.footer}>
    <div style={{ display: "flex", alignItems: "center" }}>
      <a href="https://www.enlyte.com/" className={styles.logoLink} target="_blank" rel="noreferrer">
      LOGO
      </a>

      <a className={`${styles.link} underlineFromCenter`} href="https://www.enlyte.com/terms-use" target="_blank" rel="noreferrer">
        Terms & Conditions
      </a>
      <a className={`${styles.link} underlineFromCenter`} href="https://www.enlyte.com/privacy-policy" target="_blank" rel="noreferrer">
        Privacy Policy
      </a>
    </div>

    <span className={styles.copyright}>&copy; {new Date().getFullYear()} Xynovation Inc.</span>
  </footer>
);

export { DefaultFooter };
