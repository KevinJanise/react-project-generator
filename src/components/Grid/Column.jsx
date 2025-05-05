
import styles from "./Grid.module.css";

import { useMemo } from "react";

/**
* A flexible column component for layout purposes. It resides in a Row component.
*
* @component
* @param {Object} props - The component props.
* @param {React.ReactNode} props.children - The content to be rendered inside the column.
* @param {string} [props.width="auto"] - The width of the column. Can be:
*   - "auto": Size to content
*   - "remainder": Expand to fill remaining space
*   - A string ending with "%": Proportional width, a percentage "25%"
*   - A string ending with "px": Fixed width even on resizing
* @param {string} [props.align="left"] - Horizontal alignment of content. Options: "left", "center", "right".
* @param {string} [props.valign="top"] - Vertical alignment of content. Options: "top", "middle", "bottom".
* @param {Object} [props.style] - Additional inline styles to apply to the column.
* @param {string} [props.className] - Additional CSS class names to apply to the column.
* @returns {React.ReactElement} A div element representing the column.
*
* @example
* <Column width="50%" align="center" valign="middle">
*   <p>Column content</p>
* </Column>
*/
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

