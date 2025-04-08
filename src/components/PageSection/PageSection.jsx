import styles from "./PageSection.module.css";

const PageSection = ({ title, headerComponent, children, className = "", style = {}, ...rest }) => (
  <section className={`${styles.pageSection} ${className}`} style={style} {...rest}>
    {headerComponent || (title && <h4 className={styles.title}>{title}</h4>)}
    <div className={styles.content}>{children}</div>
  </section>
);

export { PageSection };
