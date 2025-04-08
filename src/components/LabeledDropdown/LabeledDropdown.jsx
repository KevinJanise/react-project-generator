import styles from "./LabeledDropdown.module.css";
import { ErrorMessage } from "components/ErrorMessage";

const LabeledDropdown = ({ label, options, children, errorMessage, style, ...rest }) => {
  return (
    <div style={{ width: "100%", position: "relative" }}>
      <label className={styles.label} htmlFor={rest.id || label}>
        {label}
      </label>
      <div style={{ width: "100%", position: "relative", ...style }}>
        <select
          style={{ width: "100%", paddingRight: "2rem" }}
          className={styles.formControl}
          id={rest.id || label}
          {...rest}
        >
{children || (options).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}        </select>
        <span
          style={{
            position: "absolute",
            right: "0.75rem",
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
            color: "#505050",
            fontSize: ".8rem"
          }}
        >
          &#9660;
        </span>
      </div>
      <ErrorMessage style={{ fontSize: ".85rem" }}>{errorMessage}</ErrorMessage>
    </div>
  );
};

export { LabeledDropdown };
