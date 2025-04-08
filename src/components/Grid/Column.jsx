import styles from "./Grid.module.css";

import { useMemo } from "react";

const Column = ({ children, width = "auto", align = "left", valign = "top", style, className }) => {
  const columnStyle = useMemo(() => {
    if (typeof width === "string" && (width.endsWith("px") || width.endsWith("%"))) {
      return { width, ...style }; // Directly apply width for fixed sizes
    }

    let flexValue;
    if (width === "auto") {
      flexValue = "0 0 auto"; // Size to content
    } else if (width === "remainder") {
      flexValue = "1 1 0"; // Expand to fill remaining space
    } else if (Number.isFinite(width)) {
      flexValue = `${width} 1 0%`; // Proportional width
    } else {
      flexValue = "0 1 auto"; // Default flex fallback
    }

    return { flex: flexValue, ...style };
  }, [width, style]);

  const alignClass = styles[`align${align.charAt(0).toUpperCase() + align.slice(1)}`] || "";
  const valignClass = styles[`valign${valign.charAt(0).toUpperCase() + valign.slice(1)}`] || "";
  const classNames = `${styles.column} ${alignClass} ${valignClass} ${className || ""}`.trim();

  return (
    <div className={classNames} style={columnStyle}>
      {children}
    </div>
  );
};

export { Column };
