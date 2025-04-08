/*
    PageLayout is used as the overall layout for this application. The header and
    footer are the same for all pages and the body content is switched out using 
    a router associated with a URL the user is navigating to. This is setup in the
    App.tsx file.
*/

import styles from "./PageLayout.module.css";

import { DefaultFooter } from "./DefaultFooter";
import { DefaultHeader } from "./DefaultHeader";
import { MenuBar } from "components/MenuBar";

const PageLayout = ({ children }) => {
  return (
    <div className={styles.scrollablePageContainer}>
      <div className={styles.contentWrapper}>
        <DefaultHeader />

        <MenuBar />

        <div className={styles.pageBody}>{children}</div>
      </div>

      <DefaultFooter />
    </div>
  );
};

export { PageLayout };
