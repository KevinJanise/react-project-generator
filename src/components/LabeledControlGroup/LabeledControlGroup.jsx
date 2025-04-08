import styles from "./LabeledControlGroup.module.css"; // Renamed!
import { ErrorMessage } from "components/ErrorMessage";

const LabeledControlGroup = ({ label, children, errorMessage, style, layout = "column", required = false, isSelected = false, ...rest }) => { // isSelected prop
  const containerClassName = `${styles.formControl} ${errorMessage ? styles.error : ''}`;

  return (
    <div style={{ width: "100%", position: "relative", ...style }}>
      <label className={styles.label}>
        {label}
        {required && <span className={isSelected ? styles.requiredSelected : styles.required}>*</span>}
      </label>
      <div
        className={containerClassName}
        style={{
          display: "flex",
          flexDirection: layout === "row" ? "row" : "column",
          flexWrap: layout === "row" ? "wrap" : "nowrap",
          gap: ".5rem",
          padding: ".375rem .75rem",

        }}
      >
        {children} {/* Children are now mandatory */}
      </div>
      <ErrorMessage style={{ fontSize: ".85rem" }}>{errorMessage}</ErrorMessage>
    </div>
  );
};

export { LabeledControlGroup }; // Export the renamed component
