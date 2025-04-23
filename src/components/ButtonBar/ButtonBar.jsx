import styles from "./ButtonBar.module.css";

function ButtonBar ({align = "left", variant, children, className = "", style = {}, ...rest}) {

  const combinedClassNames = [
    styles.buttonBar,
    className,
    styles[align],
    variant ? (styles[variant] || "undefined") : null
  ].filter(Boolean).join(' ');

  return (
    <div data-testid="button-bar" className={combinedClassNames} style={style} {...rest}>
      { children }
    </div>
  );
}

export { ButtonBar };
