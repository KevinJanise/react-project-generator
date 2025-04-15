import styles from "./MenuBar.module.css";

import { Link } from "react-router";

// have variant, bar, vertical, hamburger
function MenuBar({ children, className = "", style = {}, ...rest }) {
  const combinedClassName = `${styles.menuBar} ${className}`;

  return (
    <nav className={combinedClassName} style={style} {...rest}>
      <div>
        <Link to="/home" className={`${styles.menuItem} underlineFromCenter`}>
          Home
        </Link>

        <Link to="/componentGenerator" className={`${styles.menuItem} underlineFromCenter`}>
          Generate Component
        </Link>

        <Link to="/gptComponentGenerator" className={`${styles.menuItem} underlineFromCenter`}>
          GPT Generate Component
        </Link>

        <Link to="/pageGenerator" className={`${styles.menuItem} underlineFromCenter`}>
          Generate Page
        </Link>
      </div>
    </nav>
  );
}

export { MenuBar };
