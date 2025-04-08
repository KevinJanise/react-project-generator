import styles from "./LabeledTextInput.module.css";

import { ErrorMessage } from "components/ErrorMessage";

const LabeledTextInput = ({ label, placeholder, errorMessage, ...rest }) => {
  return (
    <div style={{ width: "100%" }}>
      <label className={styles.label} htmlFor={rest.id || label}>
        {label}
      </label>{" "}
      <input
        style={{ width: "100%" }}
        className={styles.formControl}
        type="text"
        id={rest.id || label}
        placeholder={placeholder}
        {...rest}
      />
      <ErrorMessage style={{ fontSize: ".85rem" }}>{errorMessage}</ErrorMessage>
    </div>
  );
};

export { LabeledTextInput };
