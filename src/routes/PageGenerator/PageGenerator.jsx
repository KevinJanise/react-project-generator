import styles from "./PageGenerator.module.css";

import { useState } from "react";

import { Grid, Row, Column } from "components/Grid";
import { LabeledTextInput } from "components/LabeledTextInput";
import { PageSection } from "components/PageSection";
import { PageTitle } from "components/PageTitle";
import { ButtonBar } from "components/ButtonBar";
import { CodeDisplay } from "components/CodeDisplay";

import { useErrorMessages } from "hooks/useErrorMessages";
import { useForm } from "hooks/useForm";

import iconZip from "./icon_zip.svg";

import { PageBuilder } from "./PageBuilder";

import * as FormatUtils from "utils/FormatUtils";
import * as Utils from "utils/Utils";

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
  const [indexCode, setIndexCode] = useState("");

  let initialFormState = {
    pageName: "",
    pageTitle: "",
    callbackFunctions: "",
    hasPathParameter: false,
    hasChildComponents: false,
    pathParameterName: "",
    commandName: "",
    commandParams: "",
    commandPropertyName: "",
    stateVarIsList: false,
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
    let useEffectCode = generateUseEffect(
      commandName,
      thePathParameterName,
      theCommandPropertyName
    );

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
  const [${theCommandPropertyName}, set${FormatUtils.toUpperFirstLetter(
      theCommandPropertyName
    )}] = useState(null);

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

  /*
    pageName: "",
    pageTitle: "",
    callbackFunctions: "",
    hasPathParameter: false,
    hasChildComponents: false,
    pathParameterName: "",
    commandName: "",
    commandParams: "",
    commandPropertyName: "",
    stateVarIsList: false
*/
  const formToConfig = (form) => {
    let callbackFunctions = Utils.parseParamList(form.callbackFunctions);

    let theComponentConfig = {
      component: {
        componentName: "Coverage",
        pageTitle: "Coverage Setup",
//        componentParams: ["accountId"],
        callbackFunctions: ["Edit"], // just descriptive part of name such as Edit, UpdateUser
//        allowsChildren: true,
        pathParameterName: "theAccountId",
      },

      useEffectConfig: {
        commandName: "FindCoverage",
        commandParams: ["accountId"], // should be a subset of component.parameterList
        commandStateVar: "coverageList",
        showIsLoading: true,
        stateVarIsList: true,
      },
    };

    let config = {};

    config.component = {
      componentName: form.pageName,
      pageTitle: form.pageTitle,
      callbackFunctions: callbackFunctions,
      pathParameterName: form.pathParameterName
    };

    config.useEffectConfig = {
      commandName: formData.commandName,
      commandParams: Utils.parseParamList(formData.commandParams), // should be a subset of component.parameterList
      commandStateVar: formData.commandPropertyName,
      showIsLoading: true,
      stateVarIsList: formData.stateVarIsList
    };



    return config;
  };

  const handleGeneratePage = (event) => {
    event.preventDefault();

    setComponentName(formData.pageName);

    setRouterCode(
      generateRouterCode(formData.pageName, formData.pathParameterName)
    );

    setMenuBarCode(generateMenuBarCode(formData.pageName, formData.pageTitle));
/*
    pageName: "",
    pageTitle: "",
    callbackFunctions: "",
    hasPathParameter: false,
    hasChildComponents: false,
    pathParameterName: "",
    commandName: "",
    commandParams: "",
    commandPropertyName: "",
    stateVarIsList: false
*/
/*
let theComponentConfig = {
  component: {
    componentName: formData.pageName,
    pageTitle: formData.pageTitle,
    componentParams: ,
    callbackFunctions: Utils.parseParamList(input), // just descriptive part of name such as Edit, UpdateUser
    allowsChildren: true,
    pathParameterName: "theAccountId",
  },

  useEffectConfig: {
    commandName: "FindCoverage",
    commandParams: ["accountId"], // should be a subset of component.parameterList
    commandStateVar: "coverageList",
    showIsLoading: true,
    stateVarIsList: true,
  },
};
*/

let theComponentConfig = {
      component: {
        componentName: "Coverage",
        pageTitle: "Coverage Setup",
//        componentParams: ["accountId"],
        callbackFunctions: ["Edit"], // just descriptive part of name such as Edit, UpdateUser
//        allowsChildren: true,
        pathParameterName: "theAccountId",
      },

      useEffectConfig: {
        commandName: "FindCoverage",
        commandParams: ["accountId"], // should be a subset of component.parameterList
        commandStateVar: "coverageList",
        showIsLoading: true,
        stateVarIsList: true,
      },
    };

    theComponentConfig = formToConfig(formData);

    let pageBuilder = new PageBuilder(theComponentConfig);
    let componentFile = pageBuilder.generate();
    setPageCode(componentFile);

    setRouterCode(pageBuilder.generateRouterCode(theComponentConfig.component));
    setMenuBarCode(pageBuilder.generateMenuBarCode(theComponentConfig.component));
    setIndexCode(pageBuilder.generateIndexCode(theComponentConfig.component));

    /*
    setPageCode(
      generatePageCode(
        formData.pageName,
        formData.pageTitle,
        formData.pathParameterName,
        formData.commandName,
        formData.commandPropertyName
      )
    );
    */
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
                <Column width="25%">
                  <LabeledTextInput
                    label='Callback Functions ("handle???")'
                    name="callbackFunctions"
                    onBlur={trimValue}
                    onChange={handleChange}
                    value={formData.callbackFunctions}
                    errorMessage={getErrorMessage("callbackFunctions")}
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
                  <label>
                    <input
                      className={styles.checkbox}
                      type="checkbox"
                      name="hasPathParameter"
                      checked={formData.hasPathParameter}
                      onChange={handleChange}
                    />
                    Has path parameter
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
              </Row>

              <Row>
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
                <Column width="25%" valign="bottom">
                  <LabeledTextInput
                    label="Command Params"
                    name="commandParams"
                    onBlur={trimValue}
                    onChange={handleChange}
                    value={formData.commandParams}
                    errorMessage={getErrorMessage("commandParams")}
                  />
                </Column>

                <Column width="25%">
                  <LabeledTextInput
                    label="State Variable"
                    name="commandPropertyName"
                    onBlur={trimValue}
                    placeholder=""
                    onChange={handleChange}
                    value={formData.commandPropertyName}
                    type="text"
                    errorMessage={getErrorMessage("commandPropertyName")}
                  />
                </Column>

                <Column
                  width="25%"
                  valign="center"
                  style={{ paddingTop: "2rem" }}
                >
                  <label>
                    <input
                      className={styles.checkbox}
                      type="checkbox"
                      name="stateVarIsList"
                      checked={formData.stateVarIsList}
                      onChange={handleChange}
                    />
                    State variable is a list
                  </label>
                </Column>
              </Row>
            </Grid>
          </PageSection>

          <ButtonBar style={{ marginTop: "1rem" }}>
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
                </ButtonBar>
        </form>
      </PageSection>

      {pageCode && (
        <PageSection title={`Code for Page - ${pageName}`} style={{marginTop: "1rem"}}>
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
            title={ `src/routes/${pageCode.directory}/${pageCode.fileName}`}
            sourceCode={pageCode.content}
          />

          <CodeDisplay
            title={`src/routes/${pageCode.directory}/index.js`}
            sourceCode={indexCode}
          />

          <CodeDisplay
            title={`src/routes/${pageCode.directory}/${pageCode.directory}.module.css`}
            sourceCode={`.${FormatUtils.toLowerFirstLetter(
              pageCode.directory
            )}\n  {\n     /* add CSS */ \n  }`}
          />
        </PageSection>
      )}
    </div>
  );
}

export { PageGenerator };
