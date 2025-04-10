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
  const [pageCode, setPageCode] = useState("");
  const [routerCode, setRouterCode] = useState("");
  const [menuBarCode, setMenuBarCode] = useState("");

  let initialFormState = {
    pageName: "",
    pageTitle: "",
    hasPathParameter: false,
    pathParameterName: "",
    commandName: "",
    commandPropertyName: ""
  };
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

  const generateRouterCode = (thePageName, thePathParameterName) => {
    let pathParameter = thePathParameterName ? `/:${thePathParameterName}` : "";
    let path = `path="/${FormatUtils.toLowerFirstLetter(
      thePageName
    )}${pathParameter}"`;

    let theCode = `import {${thePageName}} from "routes/${thePageName}";
    ...
  <Route exact ${path} element={<${thePageName} />} />
    `;

    return theCode;
  };

  const generateUseEffect = (commandName, paramName, commandPropertyName) => {
    let commandVar = FormatUtils.toLowerFirstLetter(commandName);

    let theCode = `
 useEffect(() => {
    async function init() {
      const ${commandVar} = new ${commandName}(${paramName});
      let result = await execute(${commandVar});
      console.log(result);

      if (result.isCanceled) return;

      if (result.isSuccess) {
        set${FormatUtils.toUpperFirstLetter(commandPropertyName)}(result.value);
        console.log(result);
      } else {
        setStatusMessage("Error finding order: " + orderNumber);
        console.log(result.error);
      }
    }

    init();
  }, [execute, ${paramName}]);
    `;

    return theCode;
  };

  const generatePageCode = (
    thePageName,
    thePageTitle,
    thePathParameterName,
    commandName,
    theCommandPropertyName
  ) => {
    console.log("handleGeneratePage");
    let useEffectCode = generateUseEffect(commandName, thePathParameterName, theCommandPropertyName);

    let componentTemplate = `import styles from "./${thePageName}.module.css";

  import { useEffect, useState } from "react";

  import { Link, useParams } from "react-router";

  import { Grid, Row, Column } from "components/Grid";
  import { PageSection } from "components/PageSection";
  import { PageTitle } from "components/PageTitle";

  import { useCommand } from "hooks/useCommand";

  import { ${commandName} } from "services/${commandName}";

  function ${thePageName}({ children, onStatusUpdate, propertyName = "default value", className = "", style = {}, ...rest }) {

  const {${thePathParameterName}} = useParams();  // get ${thePathParameterName} from URL
  const { execute, isExecuting, cancel } = useCommand();
  const [${theCommandPropertyName}, set${FormatUtils.toUpperFirstLetter(theCommandPropertyName)}] = useState(null);

  const combinedClassName = \`\${styles.${FormatUtils.toLowerFirstLetter(
    thePageName
  )}} \${className}\`;

    const handleStatusUpdate = () => {
        let status = "some value";

        onStatusUpdate(status);
    };

    ${useEffectCode}

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

    return componentTemplate;
  };

  const handleGeneratePage = (event) => {
    event.preventDefault();

    setComponentName(formData.pageName);

    setRouterCode(
      generateRouterCode(formData.pageName, formData.pathParameterName)
    );
    setMenuBarCode(generateMenuBarCode(formData.pageName, formData.pageTitle));
    setPageCode(
      generatePageCode(
        formData.pageName,
        formData.pageTitle,
        formData.pathParameterName,
        formData.commandName,
        formData.commandPropertyName
      )
    );
  };

  const handleClear = () => {
    resetForm();
    setPageCode(null);
  };

  const combinedClassName = `${styles.componentGenerator} ${className}`;

  return (
    <div className={combinedClassName} style={style} {...rest}>
      <PageTitle title="Page Generator" />

      <PageSection>
        <form onSubmit={handleGeneratePage}>
          <PageSection title="Basic Info" style={{ margin: "1rem" }}>
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
            </Grid>
          </PageSection>

          <PageSection title="Page Initialization" style={{ margin: "1rem" }}>
            <Grid>
              <Row>
                <Column
                  width="25%"
                  valign="center"
                  style={{ paddingTop: "2rem" }}
                >
                  <input
                    className={styles.checkbox}
                    id="hasPathParameter"
                    type="checkbox"
                    onChange={handleChange}
                    name="hasPathParameter"
                    checked={formData.hasPathParameter}
                  />
                  <label htmlFor="hasPathParameter">
                    Initialize page using path parameter
                  </label>
                </Column>
                <Column width="25%">
                  <LabeledTextInput
                    label="Path Parameter Name"
                    name="pathParameterName"
                    onBlur={trimValue}
                    placeholder=""
                    onChange={handleChange}
                    value={formData.pathParameterName}
                    type="text"
                    errorMessage={getErrorMessage("pathParameterName")}
                  />
                </Column>
                <Column width="25%">
                  <LabeledTextInput
                    label="Command Name"
                    name="commandName"
                    onBlur={trimValue}
                    placeholder=""
                    onChange={handleChange}
                    value={formData.commandName}
                    type="text"
                    errorMessage={getErrorMessage("commandName")}
                  />
                </Column>
              </Row>

              <Row>
              <Column width="25%">
                  <LabeledTextInput
                    label="Property name to hold Command result"
                    name="commandPropertyName"
                    onBlur={trimValue}
                    placeholder=""
                    onChange={handleChange}
                    value={formData.commandPropertyName}
                    type="text"
                    errorMessage={getErrorMessage("commandPropertyName")}
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
          </PageSection>
          <Grid>
            <Row>
              <Column width="auto" align="left">
                <button
                  className="button"
                  type="submit"
                  style={{ marginRight: "1rem" }}
                >
                  Generate Page
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
          </Grid>
        </form>
      </PageSection>

      {pageCode && (
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
            sourceCode={pageCode}
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
