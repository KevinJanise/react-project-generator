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
    let useEffectSource = this.buildUseEffect(useEffectConfig);
    let useEffectOutput = this.buildUseEffectOutput(useEffectConfig);
    let useHooksStatements = this.buildUseHooksStatements(componentConfig, useEffectConfig);
    let errorMessageOutput = this.buildErrorMessageOutput(useEffectConfig);
    let callbackHandlers = this.buildCallbackHandlers(componentConfig?.callbackFunctions);
    let componentSourceCode = `${importStatements}

function ${componentName} () {
${this.indent(useHooksStatements, 2)}${useEffectSource}${callbackHandlers.jsCode}
  return (
    <div data-testid="${testId}" className={styles.${cssClass}}>
      <PageTitle title="${componentConfig.pageTitle}" />

      <PageSection>
         {/* TODO implement page JSX */}
         ${errorMessageOutput}
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
        ${useEffectOutput}
      </PageSection>
    </div>
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

      let theCode =
`<Link to="/${FormatUtils.toLowerFirstLetter(pageName)}" className={\`\${styles.menuItem} underlineFromCenter\`}>
  ${pageTitle}
</Link>`;

      return theCode;
    };

    generateRouterCode = (componentConfig) => {
      let pathParameterName = componentConfig.pathParameterName;
      let pageName = componentConfig.componentName;

      let pathParameter = pathParameterName ? `/:${pathParameterName}` : "";
      let path = `path="/${FormatUtils.toLowerFirstLetter(
        pageName
      )}${pathParameter}"`;

      let theCode =
`import {${pageName}} from "routes/${pageName}";
...
<Route exact ${path} element={<${pageName} />} />
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
    let loadingIndicator = `<LoadingIndicator isLoading={isExecuting} renderDelay={250}>${this.indent(content, 4)}\n        </LoadingIndicator>`;

    return loadingIndicator;
  }

  buildUseEffectOutput(useEffectConfig) {
    if (!useEffectConfig) return "";

    const { commandStateVar, stateVarIsList, showIsLoading } = useEffectConfig;

    let useEffectOutput = null;

    if (stateVarIsList) {
      useEffectOutput = `
        <>
           <h2>List of Items</h2>
           <ul>
            {${commandStateVar}?.map((item, index) => (
              // TODO: Each key should be unique and unchanging, ideally from your data
              <li key={item?.id ?? index}>{item.description}</li>
            ))}
          </ul>
        </>`;
    } else {
      // single line
      useEffectOutput = `\n        <p>${commandStateVar} is: {JSON.stringify(${commandStateVar})}</p>`;
    }

    useEffectOutput = `\n      {/* isInitialized prevents flashing No data message before search is done */}
      {isInitialized && (${commandStateVar} ? (     ${useEffectOutput}
      ) : (
        <BlockMessage variant="info">
          <span>No data found.</span>
        </BlockMessage>
      ))}`;

    if (showIsLoading) {
      useEffectOutput = this.buildIsLoadingWrapper(useEffectOutput);
    }

    useEffectOutput = `
        ${useEffectOutput}`;

    return useEffectOutput;
  }

  buildUseHooksStatements(componentConfig, useEffectConfig) {
    const hookArray = [];

    if (componentConfig?.pathParameterName) {
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
      hookArray.push(`const [isInitialized, setIsInitialized] = useState(false);`);
      hookArray.push(`const [errorMessage, setErrorMessage] = useState(null);`);
      hookArray.push(`const { execute, isExecuting } = useCommand();`);
    }

    return this.toMergedString(hookArray);
  }

  buildUseEffect(useEffectConfig) {
    if (!useEffectConfig) return "";

    const {
      commandName,
      commandParams = [],
      commandStateVar,
    } = useEffectConfig;

    const dependencyList = ["execute", ...commandParams];
    const checks = commandParams
      .map(
        (p) =>
          `if (!${p}) { setErrorMessage("${this.toUpperFirstLetter(
            p
          )} is required"); return; }`
      )
      .join("\n      ");

    return `

  useEffect(() => {
    const init = async () => {
      setIsInitalized(false);

      ${checks}

      const command = new ${commandName}(${commandParams.join(", ")});
      const result = await execute(command);

      if (result.isCanceled) return;

      if (result.isSuccess) {
        set${this.toUpperFirstLetter(commandStateVar)}(result.value);
      } else {
        setErrorMessage("Error retrieving ${commandStateVar}");
      }

      setIsInitialized(true);
    }

    init();

    return () => {
      // TODO Cleanup logic if needed
    };
  }, [${dependencyList.join(", ")}]);\n`;
  }

  // returns an array of import statements each of which is a string
  buildImports(componentConfig, useEffectConfig) {
    console.log("buildImports useEffectConfig: ", useEffectConfig);
    let imports = [];

    imports.push(
      `import styles from "./${componentConfig.componentName}.module.css";`
    );

    if (useEffectConfig) {
      imports.push('\nimport { useState, useEffect } from "react";');
    }

    if (componentConfig.pathParameterName) {
      imports.push(`import { useParams } from "react-router";`);
    }

    imports.push(`import { Grid, Row, Column } from "components/Grid";`);
    if (useEffectConfig?.showIsLoading) {
      imports.push(
        'import { LoadingIndicator } from "components/LoadingIndicator";'
      );
    }
    imports.push(`import { PageSection } from "components/PageSection";`);
    imports.push(`import { PageTitle } from "components/PageTitle";`);

    if (useEffectConfig) {
      imports.push('import { useCommand } from "hooks/useCommand";');
      imports.push(
        `import { ${useEffectConfig.commandName} } from "services/${useEffectConfig.commandName}";`
      );
    }

    return imports.filter(Boolean).join("\n");
  }

  buildCallbackHandlers = (callbacks = []) => {
    // generate JavaScript code
    let jsCode = callbacks
      .map((cb) => cb.trim())
      .filter(Boolean)
      .map((cb) => {
        let onHandler = Utils.convertHandleToOn(cb);

        const handler = `${cb}`;
        return `\n\n  const ${handler} = (params) => {
    // TODO callback allowing a child component to return informaton to ${this.componentConfig.componentName} page
    //      pass into child's parameters as ${onHandler} = {${handler}}
  }`;
      })
      .join("\n");

    jsCode = jsCode === "" ? "" : jsCode + "\n";

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
    if (typeof str !== 'string') {
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
