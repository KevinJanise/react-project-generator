import * as FormatUtils from "utils/FormatUtils";
import * as Utils from "utils/Utils";

class PageBuilder {
  constructor(config) {
    this.config = config;
    this.componentConfig = config.component;
    this.useEffectConfig = config.useEffectConfig;
  }

  generate() {
    let directory = null;
    let fileName = null;
    let componentConfig = this.componentConfig;
    let useEffectConfig = this.useEffectConfig;

    console.log("useEffectConfig: ", useEffectConfig);

    // import statements, function/component declaration, state variables, hooks, useEffect, export

    // Assemble source code
    let componentName = componentConfig.componentName;
    let cssClass = this.toLowerFirstLetter(componentName);
    let testId = this.toKebabCase(componentName);

    let importStatements = this.buildImports(componentConfig, useEffectConfig);
    let useEffectSource = this.buildInitializationJsCode(useEffectConfig);

    let jsxOutputBlock = this.buildInitializationJsx(
      componentConfig,
      useEffectConfig
    );

    let useHooksStatements = this.buildUseHooksStatements(
      componentConfig,
      useEffectConfig
    );
    let errorMessageOutput = this.buildErrorMessageOutput(useEffectConfig);
    let callbackHandlers = this.buildCallbackHandlers(
      componentConfig?.callbackFunctions
    );
    let componentSourceCode = `${importStatements}

function ${componentName} () {
${this.indent(useHooksStatements, 2)}${useEffectSource}${
      callbackHandlers.jsCode
    }

  return (       ${jsxOutputBlock}
  );
}

export { ${componentName} };\n`;

    directory = componentName;
    fileName = `${componentName}.jsx`;

    return {
      directory,
      fileName,
      componentName: componentName,
      content: componentSourceCode,
    };
  }

  generateIndexCode = (componentConfig) => {
    let pageName = componentConfig.componentName;
    let theCode = `export { ${pageName} } from "./${pageName}";`;
    return theCode;
  };

  generateMenuBarCode = (componentConfig) => {
    let pageName = componentConfig.componentName;
    let pageTitle = componentConfig.pageTitle;

    let theCode = `<Link to="/${FormatUtils.toLowerFirstLetter(
      pageName
    )}" className={\`\${styles.menuItem} underlineFromCenter\`}>
  ${pageTitle}
</Link>`;

    return theCode;
  };

  generateRouterCode = (componentConfig) => {
    let pageName = componentConfig.componentName;
    let parameterType = componentConfig.pathParameterType;
    let pathParameterName = componentConfig.pathParameterName;
    let routeCode = null;

    if (pathParameterName === null && parameterType === null) {
      return "// no router parameters";
    }

    if (parameterType === "STATE") {
      let path = FormatUtils.toLowerFirstLetter(pageName);
      routeCode = `<Route exact path="/${path}" component={${pageName}} />

// TODO Add link in another page and populate state properies
<Link
  to={{
    pathname: "/${path}",
    state: {
      ${pathParameterName}: "value of ${pathParameterName}",  // set key-value pairs here, value can be an object
    }
  }}
>Anchor Text</Link>
        `;

      // react-router-dom 5.x uses component, later ones use element
      // <Route exact path="/findUsers" element={<FindUsers />} />   5.x
      // <Route exact path="/findUsers" component={FindUsers} />   > 5.x
    } else if (parameterType === "PATH") {
      let path = FormatUtils.toLowerFirstLetter(pageName);
      routeCode = `<Route exact path="/${path}/:${pathParameterName}" component={${pageName}} />

// TODO Add link in another page and populate the ${pathParameterName} value in the URL
<Link to="/${path}/${pathParameterName}Value">Anchor Text</Link>
`;
    }

    let theCode = `import {${pageName}} from "routes/${pageName}";
...
${routeCode}
`;

    return theCode;
  };

  buildErrorMessageOutput(useEffectConfig) {
    if (!useEffectConfig) return "";

    return `<BlockMessage variant="error" style={{ marginBottom: "1rem" }}>
          {errorMessage}
        </BlockMessage>\n`;
  }

  buildIsLoadingWrapper(content) {
    let loadingIndicator = `<PageStateContainer
          state={pageLoadingState}
          initializationErrorMessage={pageInitializationErrorMessage}
          onRetry={handleRetry}
          renderDelay={333}
        >
          {pageState === PAGE_STATE.READY && (${this.indent(
            content,
            4
          )}\n        </PageStateContainer>`;

    return loadingIndicator;
  }






      buildObjectJsx(stateVar, resultCanBeEmpty) {
      let checkVar = "has" + this.toUpperFirstLetter(stateVar);
      let theJsx = "";

      if (resultCanBeEmpty) {
    theJsx = `
              {${checkVar} && (
                <h2>Item</h2>

                <Grid>
                  <Row>
                    <Column width="50%">
                      <p>{JSON.stringify(${stateVar})}</p>
                    </Column>
                  </Row>
                </Grid>
              ) : (
                 <BlockMessage variant="info">${stateVar} is empty.</BlockMessage>
              )}
        `;
      } else {
theJsx =
`
              <h2>Item Value</h2>

              <Grid>
                <Row>
                  <Column width="50%">
                    {JSON.stringify(${stateVar})}
                  </Column>
                </Row>
              </Grid>`;
      }


    return theJsx;
  }


    buildListJsx(stateVar, resultCanBeEmpty) {
      let checkVar = "has" + this.toUpperFirstLetter(stateVar);

    let theJsx = `

              {${checkVar} && (
                <h2>List of Items</h2>

                <ul>
                  {${stateVar}?.map((item, index) => (
                    // TODO: Each key should be unique and unchanging, ideally from your data
                    <li key={item?.id ?? index}>{JSON.stringify(item)}</li>
                  ))}
                </ul>
              ) : (
                 <BlockMessage variant="info">${stateVar} is empty.</BlockMessage>
              )}
        `;

    return theJsx;
  }

  // What should display once the page is initialized? Data may be present or may not be present.
  // The data may be a list or not.
  buildJsxOutput(componentConfig, useEffectConfig) {
    if (!useEffectConfig) return "";

    let componentName = componentConfig.componentName;
    let cssClass = this.toLowerFirstLetter(componentName);
    let testId = this.toKebabCase(componentName);
    let jsxOutput = "";

    const {
      commandName,
      commandParams = [],
      commandStateVar,
      stateVarIsList,
      resultCanBeEmpty,
    } = useEffectConfig;

    if (stateVarIsList) {
      jsxOutput = this.buildListJsx(commandStateVar, resultCanBeEmpty);
    } else {
      jsxOutput = this.buildObjectJsx(commandStateVar, resultCanBeEmpty);
    }

    return jsxOutput;
  }

  buildSimpleJsxOutput(componentConfig) {
    let componentName = componentConfig.componentName;
    let cssClass = this.toLowerFirstLetter(componentName);
    let testId = this.toKebabCase(componentName);
    let jsxOutput = "";
    let message = "";

    if (componentConfig.pathParameterName) {
      message = `<p>${componentConfig.pathParameterName} has the value {${componentConfig.pathParameterName}}.</p>`;
    } else {
      message = "<p>Here is a message.</p>";
    }

    jsxOutput =
`
    <div data-testid="${testId}" className={styles.${cssClass}}>
      <PageTitle title="${componentConfig.pageTitle}" />

      <PageSection>
        <BlockMessage variant="info" style={{ marginBottom: "1rem" }}>
          ${message}
        </BlockMessage>

        <Grid>
          <Row>
            <Column width="50%">
              <p>Page's JSX Goes Here!</p>
            </Column>
          </Row>
        </Grid>
      </PageSection>
    </div>
`;

    return jsxOutput;
  }

  buildInitializationJsx(componentConfig, useEffectConfig) {
    if (!useEffectConfig) return this.buildSimpleJsxOutput(componentConfig);

    let componentName = componentConfig.componentName;
    let cssClass = this.toLowerFirstLetter(componentName);
    let testId = this.toKebabCase(componentName);
    let jsxOutput = "";

    const {
      commandName,
      commandParams = [],
      commandStateVar,
      stateVarIsList,
      resultCanBeEmpty,
    } = useEffectConfig;

      jsxOutput = this.buildJsxOutput(componentConfig, useEffectConfig);

    const code =
    `
    <div data-testid="${testId}" className={styles.${cssClass}}>
      <PageTitle title="${componentConfig.pageTitle}" />

      <PageSection>
        <PageStateContainer
          state={pageLoadingState}
          initializationErrorMessage={pageInitializationErrorMessage}
          onRetry={handleRetry}
          renderDelay={333}
        >
          {pageLoadingState === PAGE_STATE.READY && (
            <>
              <BlockMessage variant="info" style={{marginBottom: "1rem"}}>
                <span>Complete the page's JSX.</span>
              </BlockMessage>
              ${jsxOutput}
            </>
          )}
        </PageStateContainer>
      </PageSection>
    </div>`;

    return code;
  }






  buildUseHooksStatements(componentConfig, useEffectConfig) {
    const hookArray = [];

      // if using state to pass values to destination page
    if (componentConfig?.pathParameterType === "STATE") {
      const { pathParameterName } = componentConfig;

      hookArray.push(`const location = useLocation();`);
      hookArray.push(
        `const { ${pathParameterName} } = location.state || {}; // get data from behind the scenes`
      );
    } else if (componentConfig?.pathParameterType === "PATH") {
      // if using state to pass values to destination page
      const { pathParameterName } = componentConfig;
      hookArray.push(
        `const { ${pathParameterName} } = useParams();  // get ${pathParameterName} from URL`
      );
    }

    if (useEffectConfig?.commandStateVar) {
      const { commandStateVar, stateVarIsList } = useEffectConfig;
      const initialState = stateVarIsList ? "[]" : "null";

      hookArray.push(
        `const [${commandStateVar}, set${this.toUpperFirstLetter(
          commandStateVar
        )}] = useState(${initialState});`
      );
      hookArray.push(
        `const [pageLoadingState, setPageLoadingState] = useState(PAGE_STATE.LOADING);`
      );
      hookArray.push(
        `const [pageInitializationErrorMessage, setPageInitializationErrorMessage] = useState(null);`
      );
      hookArray.push(`const [errorMessage, setErrorMessage] = useState(null);`);
      hookArray.push(`const { execute } = useCommand();`);

      hookArray.push(`const has${this.toUpperFirstLetter(commandStateVar)} = Utils.isNotEmpty(${commandStateVar});`);
    }

    return this.toMergedString(hookArray);
  }

  buildInitializationJsCode(useEffectConfig) {
    if (!useEffectConfig) return "";

    const {
      commandName,
      commandParams = [],
      commandStateVar,
      stateVarIsList,
      resultCanBeEmpty,
    } = useEffectConfig;

    let emptyTest =
`
        // Check if ${commandStateVar} was found
        if (Utils.isObjectEmpty(result.value)) {
          setPageInitializationErrorMessage("${commandStateVar} was not found!");
          setPageLoadingState(PAGE_STATE.ERROR);
          return;
        }
`;

    if (resultCanBeEmpty) {
      emptyTest = ``;
    }

    const initialState = stateVarIsList ? "[]" : "null";

        const checks = commandParams
      .map((p) =>
`if (!${p}) {
      setPageInitializationErrorMessage("${p} is required");
      setPageLoadingState(PAGE_STATE.ERROR);

      return;
    }`)
      .join("\n      ");


let code =
`

  const clear = () => {
    set${this.toUpperFirstLetter(commandStateVar)}(${initialState});
    setErrorMessage(null);
    setPageInitializationErrorMessage(null);
  };

  const initializePage = useStableFunction(async () => {
    setPageLoadingState(PAGE_STATE.LOADING);
    clear();

    ${checks}

    // Executing Command should never return an error but we'll use a try-catch just in case
    try {
      const command = new ${commandName}(${commandParams.join(", ")});
      const result = await execute(command);

      // Handle canceled request - normally because user left the page and page unmounted
      if (result.isCanceled) return;

      // Handle successful API call
      if (result.isSuccess) {${emptyTest}
        // Process valid ${commandStateVar}
        set${this.toUpperFirstLetter(commandStateVar)}(result.value);
        setPageLoadingState(PAGE_STATE.READY);
        return;
      }

      // Handle API error
      throw new Error(result.error?.message || "Unknown error occurred");
    } catch (error) {
      console.error("Error loading page:", error);
      setPageInitializationErrorMessage(\`Oops! There was an error loading the page. - \${error.message}\`);
      setPageLoadingState(PAGE_STATE.ERROR);
    }
  });

  useEffect(() => {
    initializePage();

    return () => {
      // TODO Cleanup logic if needed
    };
  }, [initializePage]);

  const handleRetry = () => {
    initializePage();
  };`;

    return code;
  }

  buildUseEffect(useEffectConfig) {
    if (!useEffectConfig) return "";

    const {
      commandName,
      commandParams = [],
      commandStateVar,
      stateVarIsList,
    } = useEffectConfig;

    const initialState = stateVarIsList ? "[]" : "null";

    const dependencyList = ["execute", ...commandParams];
    const checks = commandParams
      .map((p) => `if (!${p}) { setErrorMessage("${p} is required"); return; }`)
      .join("\n      ");

    return `

  const clear = () => {
      set${this.toUpperFirstLetter(commandStateVar)}(${initialState});
      setErrorMessage(null);
      setIsInitialized(false);
  };

  const initializePage = useStableFunction(async () => {
      setPageLoadingState(PAGE_STATE.LOADING);
      clear();

      ${checks}

      const command = new ${commandName}(${commandParams.join(", ")});
      const result = await execute(command);

      if (result.isCanceled) return;

      if (result.isSuccess) {
        set${this.toUpperFirstLetter(commandStateVar)}(result.value);
      } else {
        setErrorMessage("Error retrieving ${commandStateVar}");
      }



    if (result.isSuccess) {
      set${this.toUpperFirstLetter(commandStateVar)}(result.value);

      // Do an error check here, was value retrieved as expected?
      if (Utils.isEmpty(${commandStateVar})) {
        setPageLoadingState(PAGE_STATE.ERROR);
        setPageInitializationErrorMessage("Error retrieving ${commandStateVar}");
      } else {
        setPageLoadingState(PAGE_STATE.READY);
      }
    } else {
      console.error(result.error);
      setPageLoadingState(PAGE_STATE.ERROR);
      setPageInitializationErrorMessage("Oops! There was an error loading the page.");
    }
  };

  useEffect(() => {
    initializePage();

    return () => {
      // TODO Cleanup logic if needed
    };
  }, [initializePage]);

  \n`;
  }

  // returns an array of import statements each of which is a string
  buildImports(componentConfig, useEffectConfig) {
    console.log("buildImports useEffectConfig: ", useEffectConfig);
    let imports = [];

    imports.push(
      `import styles from "./${componentConfig.componentName}.module.css";\n`
    );

    if (useEffectConfig) {
      imports.push('\nimport { useState, useEffect } from "react";');
    }

    if (componentConfig.pathParameterType === "PATH") {
      imports.push(`import { useParams } from "react-router";\n`);
    }

    if (componentConfig.pathParameterType === "STATE") {
      imports.push(`import { useLocation } from "react-router";\n`);
    }

    imports.push(`import { BlockMessage } from "components/BlockMessage";`);
    imports.push(`import { Grid, Row, Column } from "components/Grid";`);
    if (useEffectConfig) {
      imports.push(
        `import { PageStateContainer, PAGE_STATE } from "components/PageStateContainer";`
      );
    }
    imports.push(`import { PageSection } from "components/PageSection";`);
    imports.push(`import { PageTitle } from "components/PageTitle";\n`);

    if (useEffectConfig) {
      imports.push(
        `import { useStableFunction } from "hooks/useStableFunction";`
      );
      imports.push('import { useCommand } from "hooks/useCommand";');
      imports.push(
        `import { ${useEffectConfig.commandName} } from "services/${useEffectConfig.commandName}";`
      );
      imports.push('import * as Utils from "utils/Utils";');
    }

    return imports.filter(Boolean).join("\n");
  }

  buildCallbackHandlers = (callbacks = []) => {
    if (callbacks === null) {
      callbacks = [];
    }

    // generate JavaScript code
    let jsCode = callbacks
      .map((cb) => cb.trim())
      .filter(Boolean)
      .map((cb) => {
        let onHandler = Utils.convertHandleToOn(cb);

        const handler = `${cb}`;
        return `  const ${handler} = (params) => {
    // TODO callback allowing a child component to return informaton to ${this.componentConfig.componentName} page
    //      pass into child's parameters as ${onHandler} = {${handler}}
  }`;
      })
      .join("\n\n");

    jsCode = jsCode === "" ? "" : "\n\n" + jsCode;

    let jsxCode = "";

    return { jsCode, jsxCode };
  };

  toMergedString(statementArray) {
    let combinedStatement = statementArray
      .map((statement) => statement.trim())
      .filter(Boolean)
      .map((statement) => {
        return `${statement}`;
      })
      .join("\n");

    return combinedStatement;
  }

  // Utility methods
  toLowerFirstLetter(str) {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }

  toUpperFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  toKebabCase(str) {
    return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
  }

  indent(str, numSpaces) {
    const indentStr = " ".repeat(numSpaces);
    return str
      .split("\n")
      .map((line) => indentStr + line)
      .join("\n");
  }

  replaceHandleWithOn(str) {
    if (typeof str !== "string") {
      return "Invalid input: Please provide a string."; // Handle non-string input
    }
    if (str.startsWith("handle")) {
      return "on" + str.slice(6); // Replace "handle" with "on"
    } else {
      return str; // Return the original string if it doesn't start with "handle"
    }
  }
}

export { PageBuilder };
