import styles from "./MenuBar.module.css";

import { Link } from "react-router";

// have variant, bar, vertical, hamburger
function MenuBar({ children, className = "", style = {} }) {
  return (
    <nav className={`${styles.menuBar} ${className}`} style={style}>
      <div>
        <Link to="/home" className={`${styles.menuItem} underlineFromCenter`}>
          Home
        </Link>

        <Link to="/componentGenerator" className={`${styles.menuItem} underlineFromCenter`}>
          Generate Component
        </Link>
      </div>
    </nav>
  );
}

export { MenuBar };
