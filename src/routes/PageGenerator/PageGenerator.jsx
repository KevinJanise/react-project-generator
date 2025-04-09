import styles from "./PageGenerator.module.css";

import { useState } from "react";

import { Grid, Row, Column } from "components/Grid";
import { LabeledTextInput } from "components/LabeledTextInput";
import { PageSection } from "components/PageSection";
import { PageTitle } from "components/PageTitle";
import { CodeDisplay } from "components/CodeDisplay";

import { useErrorMessages } from "hooks/useErrorMessages";
import { useForm } from "hooks/useForm";

import iconZip from "./icon_zip.svg";

import * as FormatUtils from "utils/FormatUtils";

// have variant, bar, vertical, hamburger
function PageGenerator({
  children,
  propertyName = "default value",
  className = "",
  style = {},
  ...rest
}) {
  const [pageName, setComponentName] = useState("");
  const [componentCode, setComponentCode] = useState("");
  const [routerCode, setRouterCode] = useState("");
  const [menuBarCode, setMenuBarCode] = useState("");

  let initialFormState = { pageName: "", pageTitle: "Default Title" };
  const { formData, resetForm, handleChange, setFormData, trimValue } =
    useForm(initialFormState);

  const {
    addErrorMessage,
    clearErrorMessages,
    getErrorMessage,
    hasFieldSpecificErrors,
    setFocusOnFirstError,
  } = useErrorMessages();

  const generateMenuBarCode = (thePageName, thePageTitle) => {
    let theCode = `<Link to="/${FormatUtils.toLowerFirstLetter(
      thePageName
    )}" className={\`\${styles.menuItem} underlineFromCenter\`}>
      ${thePageTitle}
  </Link>`;
    return theCode;
  };

  const generateRouterCode = (thePageName) => {
    let theCode = `import {${thePageName}} from "routes/${thePageName}";
    ...
  <Route exact path="/${FormatUtils.toLowerFirstLetter(
    thePageName
  )}" element={<${thePageName} />} />
    `;
    return theCode;
  };

  const handleGeneratePage = (event) => {
    event.preventDefault();

    let thePageName = formData.pageName;
    let thePageTitle = formData.pageTitle;

    setRouterCode(generateRouterCode(formData.pageName));
    setMenuBarCode(generateMenuBarCode(formData.pageName, formData.pageTitle));

    // let pageName = formData.pageName;
    setComponentName(formData.pageName);

    //    let builder = new ComponentBuilder(componentTemplate);
    //  let code = builder.pageName("CodeDisplay").param("name", "default value").state("message", "default").state("other").build();

    console.log("handleGeneratePage");

    let componentTemplate = `import styles from "./${thePageName}.module.css";

  import { Link } from "react-router";
  
  import { Grid, Row, Column } from "components/Grid";
  import { PageSection } from "components/PageSection";
  import { PageTitle } from "components/PageTitle";

  function ${thePageName}({ children, onStatusUpdate, propertyName = "default value", className = "", style = {}, ...rest }) {
    const combinedClassName = \`\${styles.${FormatUtils.toLowerFirstLetter(
      thePageName
    )}} \${className}\`;

    const handleStatusUpdate = () => {
        let status = "some value";

        onStatusUpdate(status);
    };

    return (
      <div className={combinedClassName} style={style} {...rest}>
         <PageTitle title="${thePageTitle}" />

         <PageSection>
            <Grid>
               <Row>
                  <Column width="50%">
                      <p>Component goes here</p>
                  </Column>

                  <Column width="50%">
                      <p>Component goes here</p>
                  </Column>
               </Row>
            </Grid>

            {/* Implement page */}
            {/*
            Do something with
            the property
            */}

            {children}
          </PageSection>
      </div>
    );
  }

  export { ${thePageName} };
      `;

    setComponentCode(componentTemplate);

    console.log(`${thePageName}.jsx`);
    console.log(componentTemplate);

    console.log("\nindex.js");
    console.log(`export { ${thePageName} } from './${thePageName}';`);

    console.log(`\n${thePageName}.module.css`);
    console.log(`.${FormatUtils.toLowerFirstLetter(thePageName)} {
  }`);
  };

  const handleClear = () => {
    resetForm();
    setComponentCode(null);
  };

  const combinedClassName = `${styles.componentGenerator} ${className}`;

  return (
    <div className={combinedClassName} style={style} {...rest}>
      <PageTitle title="Page Generator" />

      <PageSection>
        <form onSubmit={handleGeneratePage}>
          <Grid>
            <Row>
              <Column width="25%">
                <LabeledTextInput
                  label="Page Name"
                  name="pageName"
                  onBlur={trimValue}
                  placeholder=""
                  onChange={handleChange}
                  value={formData.pageName}
                  type="text"
                  errorMessage={getErrorMessage("pageName")}
                />
              </Column>

              <Column width="25%">
                <LabeledTextInput
                  label="Page Title"
                  name="pageTitle"
                  onBlur={trimValue}
                  placeholder=""
                  onChange={handleChange}
                  value={formData.pageTitle}
                  type="text"
                  errorMessage={getErrorMessage("pageTitle")}
                />
              </Column>
            </Row>
            <Row>
              <Column width="50%">
                <p>
                  Will child components be passed to this component. For
                  example:
                </p>
                <pre>
                  <code>
                    &lt;MyComponent&gt; &lt;p&gt;Here is a child
                    component&lt;/p&gt; &lt;/MyComponent&gt;
                  </code>
                </pre>
              </Column>
            </Row>
          </Grid>

          <Row>
            <Column width="auto" align="left">
              <button
                className="button"
                type="submit"
                style={{ marginRight: "1rem" }}
              >
                Generate Component
              </button>

              <button
                className="button"
                type="button"
                onClick={handleClear}
                style={{ marginRight: "1rem" }}
              >
                Clear
              </button>
            </Column>
          </Row>
        </form>
      </PageSection>

      {componentCode && (
        <PageSection title={`Code for ${pageName} Component`}>
          <img
            src={iconZip}
            className={styles.zipIcon}
            alt="Download .zip file"
          />

          <CodeDisplay title="src/AppRouter.jsx" sourceCode={routerCode} />

          <CodeDisplay
            title="src/components/MenuBar/MenuBar.jsx"
            sourceCode={menuBarCode}
          />

          <CodeDisplay
            title={`src/routes/${pageName}/${pageName}.jsx`}
            sourceCode={componentCode}
          />

          <CodeDisplay
            title={`src/routes/${pageName}/index.js`}
            sourceCode={`export { ${pageName} } from './${pageName}';`}
          />

          <CodeDisplay
            title={`src/routes/${pageName}/${pageName}.module.css`}
            sourceCode={`.${FormatUtils.toLowerFirstLetter(
              pageName
            )}\n  {\n     /* add CSS */ \n  }`}
          />
        </PageSection>
      )}
    </div>
  );
}

export { PageGenerator };
