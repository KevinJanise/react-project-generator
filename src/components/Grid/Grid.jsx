import styles from "./Grid.module.css";

import { useMemo } from "react";

import { GridContext } from "./GridContext";

/**
* A Grid component that provides a layout container for child elements.
*
* @component
* @param {Object} props - The properties that define the Grid component.
* @param {React.ReactNode} props.children - The child elements to be rendered inside the grid, Row components.
* @param {Object} [props.style] - Additional inline styles to be applied to the grid container.
* @param {string} [props.className] - Additional CSS class names to be applied to the grid container.
* @param {boolean} [props.collapse=true] - Determines if the grid should collapse when the screen is made smaller. Default is true.
*
* @example
* <Grid collapse={false} className="custom-grid">
*   <Row>
*     <Column width="100%">Content</Column>
*   </Row>
*   <Row>
*     <Column width="50%">Content</Column>
*      <Column width="50%">Content</Column>
*   </Row>
* </Grid>
*
* @returns {React.ReactElement} A div element representing the grid container with a GridContext.Provider.
*/
const Grid = ({ children, style, className, collapse = true }) => {
  const contextValue = useMemo(() => ({ collapse }), [collapse]);

  return (
    <div className={styles.gridOffset}>
      <div className={`${styles.grid} ${className || ""}`} style={style}>
        <GridContext.Provider value={contextValue}>{children}</GridContext.Provider>
      </div>
    </div>
  );
};

export { Grid };

