
import styles from "./Grid.module.css";

import { useContext } from "react";

import {GridContext} from "./GridContext";

/**
* A flexible row component for layout purposes. Resides in a Grid and contains Columns.
*
 * @component
* @param {Object} props - The properties that define the Row component.
* @param {React.ReactNode} props.children - The child Column elements to be rendered inside the row.
* @param {Object} [props.style] - Additional inline styles to be applied to the row.
* @param {string} [props.className] - Additional CSS class names to be applied to the row.
* @param {boolean} [props.collapse] - Whether the row should collapse when resized. If not provided, it uses the value from GridContext.
* @param {('flex-start'|'center'|'flex-end'|'space-between'|'space-around'|'space-evenly')} [props.justify] - Justification of the row's content.
* @param {('flex-start'|'center'|'flex-end'|'stretch'|'baseline')} [props.align] - Alignment of the row's content.
*
 * @example
* <Row justify="center" align="flex-start">
*   <Column width="50%">Child 1</Column>
*   <Column width="50%">Child 2</Column>
* </Row>
*
 * @returns {React.ReactElement} A div element representing the row.
*/
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

