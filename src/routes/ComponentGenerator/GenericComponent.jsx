import styles from "./GenericComponent.module.css";

function GenericComponent({ itemId, className = "", style = {}, ...rest }) {
  const combinedClassName = [styles.genericComponent, className]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      data-testid="genericComponent"
      className={combinedClassName}
      style={style}
      {...rest}
    >
      {/* implement remaining component code */}
    </div>
  );
}

export { GenericComponent };
