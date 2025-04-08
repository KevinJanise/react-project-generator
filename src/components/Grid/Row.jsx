import styles from "./Grid.module.css";

import { useContext } from "react";

import {GridContext} from "./GridContext";

// Row component - A horizontal flex container for columns, collapsible on small screens
const Row = ({ children, style, className, collapse, justify, align }) => {
  // Get collapse from context if not explicitly set
  const { collapse: contextCollapse } = useContext(GridContext);
  const shouldCollapse = collapse ?? contextCollapse; // Use nullish coalescing

  // Validation for justify/align props
  const validJustify = {
    'flex-start': true, center: true, 'flex-end': true,
    'space-between': true, 'space-around': true, 'space-evenly': true
  };
  const validAlign = {
    'flex-start': true, center: true, 'flex-end': true, stretch: true, baseline: true
  };

  const rowStyle = {
    ...style,
    justifyContent: validJustify[justify] ? justify : undefined,
    alignItems: validAlign[align] ? align : undefined,
  };

  return (
    <div
      className={`${styles.row} ${shouldCollapse ? styles.rowCollapse : ''} ${className || ''}`.trim()}
      style={rowStyle}
    >
      {children}
    </div>
  );
};

export { Row };
