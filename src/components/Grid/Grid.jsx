import styles from "./Grid.module.css";

import { useMemo } from "react";

import { GridContext } from "./GridContext";

// Grid component - A container for rows, providing collapse behavior context
const Grid = ({ children, style, className, collapse = true }) => {
  const contextValue = useMemo(() => ({ collapse }), [collapse]);

  return (
    <div className={`${styles.grid} ${className || ""}`} style={style}>
      <GridContext.Provider value={contextValue}>{children}</GridContext.Provider>
    </div>
  );
};

export { Grid };
