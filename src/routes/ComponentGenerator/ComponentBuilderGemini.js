class ComponentBuilderKevin {
  constructor(config) {
    this.config = config;
    this.componentConfig = config.component;
    this.useEffectConfig = config.useEffectConfig;
    this.componentName = this.componentConfig.componentName;
    this.cssClass = this.toLowerFirstLetter(this.componentName);
    this.testId = this.toKebabCase(this.componentName);
  }

  generate() {
    const importStatements = this.buildImports();
    const componentParams = this.buildComponentParams();
    const useStateSource = this.buildUseState();
    const useEffectSource = this.buildUseEffect();
    const useEffectOutput = this.buildUseEffectOutput();
    const callbackHandlers = this.buildCallbackHandlers(
      this.componentConfig?.callbackFunctions
    );
    const componentJsxBody = this.buildComponentJsxBody();

    const componentSourceCode = `${importStatements}

function ${this.componentName} ({${componentParams}}) {
  ${useStateSource}${useEffectSource}${callbackHandlers.jsCode}
  const combinedClassNames = [styles.${this.cssClass}, className].filter(Boolean).join(" ");

  return (
    <div data-testid="${this.testId}" className={combinedClassNames} style={style} {...rest}>
      <h3>${this.componentName}</h3>

      {/* TODO implement component JSX */}${callbackHandlers.jsxCode}${useEffectOutput}${componentJsxBody}
    </div>
  );
}

export { ${this.componentName} };\n`;

    return {
      directory: this.componentName,
      fileName: `${this.componentName}.jsx`,
      content: componentSourceCode,
    };
  }

  buildImports() {
    const imports = [`import styles from "./${this.componentName}.module.css";`];

    if (this.useEffectConfig) {
      imports.push('\nimport { useState, useEffect } from "react";');
      if (this.useEffectConfig.showIsLoading) {
        imports.push(
          'import { LoadingIndicator } from "components/LoadingIndicator";'
        );
      }
      imports.push('import { useCommand } from "hooks/useCommand";');
      imports.push(
        `import { ${this.useEffectConfig.commandName} } from "services/${this.useEffectConfig.commandName}";`
      );
    }

    return imports.filter(Boolean).join("\n");
  }

  buildComponentParams() {
    const { componentParams = [], callbackFunctions = [], allowsChildren } =
      this.componentConfig;
    const params = [...componentParams, ...callbackFunctions];
    if (allowsChildren) {
      params.push("children");
    }
    params.push('className = ""', "style = {}", "...rest");
    return params.filter(Boolean).join(", ");
  }

  buildUseState() {
    if (!this.useEffectConfig?.commandStateVar) return "";

    const { commandStateVar, stateVarIsList } = this.useEffectConfig;
    const initialValue = stateVarIsList ? "[]" : "null";

    return `const [${commandStateVar}, set${this.toUpperFirstLetter(
      commandStateVar
    )}] = useState(${initialValue});
  const [isInitialized, setIsInitialized] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const { execute, isExecuting } = useCommand();`;
  }

  buildUseEffect() {
    if (!this.useEffectConfig) return "";

    const { commandName, commandParams = [], commandStateVar } =
      this.useEffectConfig;
    const dependencyList = ["execute", ...commandParams];
    const checks = commandParams
      .map(
        (p) =>
          `if (!${p}) { setErrorMessage("${this.toUpperFirstLetter(
            p
          )} is required"); return; }`
      )
      .join("\n    ");

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
    };

    init();

    return () => {
      // TODO Cleanup logic if needed
    };
  }, [${dependencyList.join(", ")}]);\n`;
  }

  buildUseEffectOutput() {
    if (!this.useEffectConfig) return "";

    const { commandStateVar, stateVarIsList, showIsLoading } =
      this.useEffectConfig;

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
      useEffectOutput = `\n      <p>${commandStateVar} is: {JSON.stringify(${commandStateVar})}</p>`;
    }

    useEffectOutput = `\n    {/* isInitialized prevents flashing No data message before search is done */}
    {isInitialized && (${commandStateVar} ? (      ${useEffectOutput}
    ) : (
      <p className={styles.error}>No data available</p>
    ))}`;

    if (showIsLoading) {
      useEffectOutput = this.buildIsLoadingWrapper(useEffectOutput);
    }

    return `\n\n    {errorMessage && (
      <p className={styles.error}>{errorMessage}</p>
    )}
      ${useEffectOutput}
    `;
  }

  buildIsLoadingWrapper(content) {
    return `
      <LoadingIndicator isLoading={isExecuting} renderDelay={250}>${this.indent(
        content,
        2
      )}
      </LoadingIndicator>`;
  }

  buildComponentJsxBody() {
    return this.componentConfig.allowsChildren ? `\n    { children }` : "";
  }

  buildCallbackHandlers = (callbacks = []) => {
    const jsCode = callbacks
      .filter(Boolean)
      .map((cb) => {
        const handler = `handle${this.toUpperFirstLetter(cb)}`;
        return `\n  const ${handler} = () => {
    // TODO let parent know something happened
    console.log("notifying parent - ${cb}");
    ${cb}?.("${cb} happened!")
  };`;
      })
      .join("\n");

    const jsxCode = callbacks
      .filter(Boolean)
      .map((cb) => {
        const handler = `handle${this.toUpperFirstLetter(cb)}`;
        return `\n    <button type="button" onClick={${handler}}>Click ${cb}</button>`;
      })
      .join("");

    return { jsCode: jsCode ? jsCode + "\n" : "", jsxCode: jsxCode ? "\n" + jsxCode : "" };
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
    return str.split('\n').map((line) => indentStr + line).join('\n');
  }
}

export { ComponentBuilderKevin };
