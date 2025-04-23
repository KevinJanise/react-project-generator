class ComponentBuilderKevin {
  constructor(config) {
    this.config = config;
    this.componentConfig = config.component;
    this.useEffectConfig = config.useEffectConfig;
  }

  generate() {
    const { componentName } = this.componentConfig;
    const cssClass = this.toLowerFirstLetter(componentName);
    const testId = this.toKebabCase(componentName);

    const importStatements = this.buildImports();
    const componentParams = this.buildComponentParams();
    const { jsCode: callbackJs, jsxCode: callbackJsx } = this.buildCallbackHandlers();

    const componentSourceCode = `${importStatements}

function ${componentName}({ ${componentParams} }) {
  ${this.buildStateHooks()}
  ${this.buildEffectHook()}${callbackJs}
  const combinedClassNames = [styles.${cssClass}, className].filter(Boolean).join(" ");

  return (
    <div data-testid="${testId}" className={combinedClassNames} style={style} {...rest}>
      <h3>${componentName}</h3>
      ${callbackJsx}${this.buildDataOutput()}
      ${this.buildChildren()}
    </div>
  );
}

export { ${componentName} };
`;

    return {
      directory: componentName,
      fileName: `${componentName}.jsx`,
      content: componentSourceCode,
    };
  }

  buildStateHooks() {
    if (!this.useEffectConfig?.commandStateVar) return "";

    const { commandStateVar, stateVarIsList } = this.useEffectConfig;
    const initialValue = stateVarIsList ? "[]" : "null";

    return `const [${commandStateVar}, set${this.toUpperFirstLetter(commandStateVar)}] = useState(${initialValue});
  const [isInitialized, setIsInitialized] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const { execute, isExecuting } = useCommand();`;
  }

  buildEffectHook() {
    if (!this.useEffectConfig) return "";

    const { commandName, commandParams = [], commandStateVar } = this.useEffectConfig;
    const dependencyList = ["execute", ...commandParams];

    const paramChecks = commandParams
      .map(p => `if (!${p}) { setErrorMessage("${this.toUpperFirstLetter(p)} is required"); return; }`)
      .join("\n      ");

    return `
  useEffect(() => {
    const init = async () => {
      ${paramChecks}

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
  }, [${dependencyList.join(", ")}]);
`;
  }

  buildDataOutput() {
    if (!this.useEffectConfig) return "";

    const { commandStateVar, stateVarIsList, showIsLoading } = this.useEffectConfig;
    let output = stateVarIsList
      ? this.buildListOutput(commandStateVar)
      : `\n        <p>${commandStateVar} is: {JSON.stringify(${commandStateVar})}</p>`;

    output = `
      {isInitialized && (${commandStateVar} ? (${output}
      ) : (
        <p className={styles.error}>No data available</p>
      ))}`;

    if (showIsLoading) {
      output = this.wrapWithLoadingIndicator(output);
    }

    return `
      {errorMessage && (
        <p className={styles.error}>{errorMessage}</p>
      )}
      ${output}`;
  }

  buildListOutput(commandStateVar) {
    return `
        <>
          <h2>List of Items</h2>
          <ul>
            {${commandStateVar}?.map((item, index) => (
              <li key={item?.id ?? index}>{item.description}</li>
            ))}
          </ul>
        </>`;
  }

  wrapWithLoadingIndicator(content) {
    return `
      <LoadingIndicator isLoading={isExecuting} renderDelay={250}>
        ${this.indent(content, 2)}
      </LoadingIndicator>`;
  }

  buildChildren() {
    return this.componentConfig.allowsChildren ? `\n      {children}` : "";
  }

  buildComponentParams() {
    const params = [
      ...(this.componentConfig.componentParams || []),
      ...(this.componentConfig.callbackFunctions || []),
      ...(this.componentConfig.allowsChildren ? ["children"] : []),
      'className = ""',
      "style = {}",
      "...rest"
    ];

    return params.filter(Boolean).join(", ");
  }

  buildImports() {
    const imports = [
      `import styles from "./${this.componentConfig.componentName}.module.css";`
    ];

    if (this.useEffectConfig) {
      imports.push('\nimport { useState, useEffect } from "react";');
      imports.push('import { useCommand } from "hooks/useCommand";');
      imports.push(`import { ${this.useEffectConfig.commandName} } from "services/${this.useEffectConfig.commandName}";`);

      if (this.useEffectConfig.showIsLoading) {
        imports.push('import { LoadingIndicator } from "components/LoadingIndicator";');
      }
    }

    return imports.join("\n");
  }

  buildCallbackHandlers() {
    const callbacks = (this.componentConfig.callbackFunctions || []).map(cb => cb.trim()).filter(Boolean);

    const jsCode = callbacks.map(cb => {
      const handler = `handle${this.toUpperFirstLetter(cb)}`;
      return `
  const ${handler} = () => {
    console.log("notifying parent - ${cb}");
    ${cb}?.("${cb} happened!");
  };`;
    }).join("\n");

    const jsxCode = callbacks.map(cb => {
      const handler = `handle${this.toUpperFirstLetter(cb)}`;
      return `\n      <button type="button" onClick={${handler}}>Click ${cb}</button>`;
    }).join("");

    return {
      jsCode: jsCode ? jsCode + "\n" : "",
      jsxCode: jsxCode ? "\n" + jsxCode : ""
    };
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
    return str.split('\n').map(line => ' '.repeat(numSpaces) + line).join('\n');
  }
}

export { ComponentBuilderKevin };
