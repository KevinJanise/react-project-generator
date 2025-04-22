class ComponentBuilderKevin {
  constructor(config) {
    this.config = config;
    this.componentConfig = config.component;
    this.useEffectConfig = config.useEffectConfig;
  }

  /*
const componentConfig = {
  component: {
    name: "GenericComponent",
    componentName: "GenericComponent",
    componentParams: ["messageId"],
    hasChildren: true,
    allowsChildren: true
  },
  useEffectConfig: {
    commandName: "FindMessageCommand",
    commandParams: ["messageId"],  // should be a subset of component.parameterList
    commandStateVar: "message",
    showIsLoading: true,
    stateVarIsList: false,
  }
};

// useEffectConfig can be null
*/

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
    let componentParams = this.buildComponentParams(
      componentConfig,
      useEffectConfig
    );

    let useEffectSource = this.buildUseEffect(useEffectConfig);
    let useEffectOutput = this.buildUseEffectOutput(useEffectConfig);
    let useStateSource = this.buildUseState(useEffectConfig);
    let callbackHandlers = this.buildCallbackHandlers(componentConfig?.callbackFunctions);

    let componentJsxBody = this.buildcomponentJsxBody(
      componentConfig,
      useEffectConfig
    );

    let componentSourceCode = `${importStatements}

function ${componentName} ({${componentParams}}) {
  ${useStateSource}${useEffectSource}${callbackHandlers.jsCode}
  const combinedClassName = [styles.${cssClass}, className].filter(Boolean).join(" ");

  return (
    <div data-testid="${testId}" className={combinedClassName} style={style} {...rest}>
      <h3>${componentName}</h3>

      {/* TODO implement component JSX */}${callbackHandlers.jsxCode}${useEffectOutput}${componentJsxBody}
    </div>
  );
}

export { ${componentName} };\n`;

    directory = componentName;
    fileName = `${componentName}.jsx`;

    return {
      directory,
      fileName,
      content: componentSourceCode,
    };
  }

  buildIsLoadingWrapper(content) {
    let loadingIndicator = `
      <LoadingIndicator isLoading={isExecuting} renderDelay={250}>${this.indent(content, 2)}\n      </LoadingIndicator>`;

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
        <p className={styles.error}>No data available</p>
      ))}`;

    if (showIsLoading) {
      useEffectOutput = this.buildIsLoadingWrapper(useEffectOutput);
    }

    useEffectOutput = `\n\n      {errorMessage && (
        <p className={styles.error}>{errorMessage}</p>
      )}
        ${useEffectOutput}
    `;

    return useEffectOutput;
  }

  buildcomponentJsxBody(componentConfig) {
    let componentJsxBody = componentConfig.allowsChildren ? `\n      { children }` : "";

    return componentJsxBody;
  }

  // roll into buildUseEffect since that is where it is used
  buildUseState(useEffectConfig) {
    if (!useEffectConfig?.commandStateVar) return "";

    let intCommandStateVar = "null";
    if (useEffectConfig.stateVarIsList) {
      intCommandStateVar = "[]";
    }
    const { commandStateVar } = useEffectConfig;
    return (
`const [${commandStateVar}, set${this.toUpperFirstLetter(commandStateVar)}] = useState(${intCommandStateVar});
  const [isInitialized, setIsInitialized] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const { execute, isExecuting } = useCommand();`);
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

  buildComponentParams(componentConfig) {
    let paramList = [];

    if (componentConfig.componentParams) {
      paramList = [...componentConfig.componentParams];
    }

    if (componentConfig.callbackFunctions) {
      paramList = [...paramList, ...componentConfig.callbackFunctions];
    }

    if (componentConfig.allowsChildren) {
      paramList.push("children");
    }

    paramList.push('className = ""');
    paramList.push("style = {}");

    paramList.push("...rest");

    return paramList.filter(Boolean).join(", ");
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

      if (useEffectConfig.showIsLoading) {
        imports.push(
          'import { LoadingIndicator } from "components/LoadingIndicator";'
        );
      }

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
        const handler = `handle${cb.charAt(0).toUpperCase()}${cb.slice(1)}`;
        return `\n  const ${handler} = () => {
    // TODO let parent know something happened
    console.log("notifying parent - ${cb}");
    ${cb}?.("${cb} happened!")
  };`;
      })
      .join("\n");


      // generate JSX code
      let jsxCode = callbacks
      .map((cb) => cb.trim())
      .filter(Boolean)
      .map((cb) => {
        const handler = `handle${cb.charAt(0).toUpperCase()}${cb.slice(1)}`;
//        return `<button type="button" onClick={() => {${handler}("something happened");}}>Click Me</button>`;
        return `\n      <button type="button" onClick={${handler}}>Click ${cb}</button>`;
      }).join("");

      jsCode = jsCode === "" ? "" : jsCode + "\n";

      jsxCode = jsxCode === "" ? "" : "\n" + jsxCode;

      return {jsCode, jsxCode};
  };

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
    const indentStr = ' '.repeat(numSpaces);
    return str.split('\n').map(line => indentStr + line).join('\n');
  }
}

export { ComponentBuilderKevin };
