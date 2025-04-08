import styles from "./Home.module.css";

import { useState, useEffect } from "react";

import { useLocation } from "react-router";

import { PageSection } from "components/PageSection";
import { PageTitle } from "components/PageTitle";

import * as FormatUtils from "utils/FormatUtils";

function Home({ className = "", style = {} }) {
  let componentName = "ComponentGenerator";

  const handleGenerateComponent = () => {
    console.log("handleGenerateComponent");

    let componentTemplate = `
import styles from "./${componentName}.module.css";

import { Link } from "react-router";

// have variant, bar, vertical, hamburger
function ${componentName}({ children, propertyName = "default value", className = "", style = {}, ...rest }) {
  const combinedClassName = \`\${styles.${FormatUtils.toLowerFirstLetter(componentName)}} \${className}\`;

  return (
    <div className={combinedClassName} style={style} {...rest}>
        // implement component
        // do something with propertyName
    </div>
  );
}

export { ${componentName} };
    `;

    console.log(`${componentName}.jsx`);
    console.log(componentTemplate);

    console.log("\nindex.js");
    console.log(`export { ${componentName} } from './${componentName}';`);

    console.log(`\n${componentName}.module.css`);
    console.log(`.${FormatUtils.toLowerFirstLetter(componentName)} {
}`)

  };

  const handleGenerateProject = () => {
    console.log("handleGenerateProject");
  };

  return (
    <div className={`${styles.home} ${className}`} style={style}>
      <PageTitle title="Home" />

      <PageSection>
        <h2>Home</h2>

        <button
          className="button"
          type="button"
          onClick={handleGenerateComponent}
          style={{ marginRight: "1rem" }}
        >
          Generate Component
        </button>

        <button
          className="button"
          type="button"
          onClick={handleGenerateProject}
          style={{ marginRight: "1rem" }}
        >
          Generate Project
        </button>
      </PageSection>
    </div>
  );
}

export { Home };
