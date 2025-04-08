import styles from "./LabeledValue.module.css";

const LabeledValue = ({ label, value, ...rest }) => {
  return (
    <div style={{ width: "100%" }}>
      <label className={styles.label}>{label}</label>{" "}
      <span style={{ width: "100%" }} className={styles.formControl} {...rest}>
        {value}
      </span>
    </div>
  );
};

export { LabeledValue };
