import styles from "./PageTitle.module.css";

import { Grid, Row, Column } from "components/Grid";

const PageTitle = ({ title, className = "", style = {}, ...rest }) => (
  <h3 className={`${styles.pageTitle} ${className}`} style={style} {...rest} >{title}</h3>
);

export { PageTitle };
