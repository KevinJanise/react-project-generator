class ComponentBuilderGemini {
  constructor(config) {
    this.config = config;
  }

  buildComponentContent() {
    const { component, useEffectConfig } = this.config;
    const { name, parameterList = [], hasChildren, hasUseEffect } = component;

    const fileName = `${name}.jsx`;
    const cssClass = this.toKebabCase(name);
    const testId = cssClass;
    const props = this.buildPropTypes(parameterList, hasChildren);
    const imports = this.buildImports(name, hasUseEffect, useEffectConfig);
    const state = this.buildState(hasUseEffect, useEffectConfig);
    const effect = this.buildEffect(hasUseEffect, useEffectConfig);
    const innerContent = this.buildDataDisplay(useEffectConfig); // Corrected method call
    const wrappedContent = this.buildWrappedContent(hasUseEffect, useEffectConfig, innerContent, hasChildren);

    const componentTemplate = `
${imports}

function ${name}({ ${props} }) {
  ${state}

  ${effect}

  const combinedClassName = [styles.${cssClass}, className].filter(Boolean).join(" ");

  return (
    <div
      data-testid="${testId}"
      className={combinedClassName}
      style={style}
      {...rest}
    >
      ${wrappedContent}
      {/* implement remaining component code */}
    </div>
  );
}

export { ${name} };
    `.trim();

    return {
      directory: name,
      fileName,
      content: componentTemplate,
    };
  }

  buildPropTypes(parameterList, hasChildren) {
    const coreProps = [...parameterList, 'className = ""', "style = {}", "...rest"];
    return hasChildren ? [...coreProps, "children"].join(", ") : coreProps.join(", ");
  }

  buildImports(componentName, hasUseEffect, useEffectConfig) {
    const imports = [`import styles from "./${componentName}.module.css";`];
    if (hasUseEffect) {
      imports.push('import { useState, useEffect } from "react";');
      imports.push('import { useCommand } from "hooks/useCommand";');
      if (useEffectConfig.commandName) {
        imports.push(`import { ${useEffectConfig.commandName} } from "services/${useEffectConfig.commandName}";`);
      }
      if (useEffectConfig.showIsLoading) {
        imports.push('import { LoadingIndicator } from "components/LoadingIndicator";');
      }
    }
    return imports.filter(Boolean).join("\n");
  }

  buildState(hasUseEffect, useEffectConfig) {
    if (!hasUseEffect || !useEffectConfig.commandStateVar) return "";
    const { commandStateVar } = useEffectConfig;
    return `
  const [${commandStateVar}, set${this.capitalize(commandStateVar)}] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const { execute, isProcessing } = useCommand();
    `.trim();
  }

  buildEffect(hasUseEffect, useEffectConfig) {
    if (!hasUseEffect || !useEffectConfig.commandName) return "";
    const { commandName, commandParams = [], commandStateVar } = useEffectConfig;

    const dependencyList = ["execute", ...commandParams];
    const checks = commandParams
      .map(p => `if (!${p}) { setErrorMessage("${this.capitalize(p)} is required"); return; }`)
      .join("\n    ");

    return `
  useEffect(() => {
    async function init() {
      ${checks}

      const command = new ${commandName}(${commandParams.join(", ")});
      const result = await execute(command);

      if (result.isCanceled) return;

      if (result.isSuccess) {
        set${this.capitalize(commandStateVar)}(result.value);
      } else {
        setErrorMessage("Error retrieving ${commandStateVar}");
      }
    }

    init();
  }, [${dependencyList.join(", ")}]);
    `.trim();
  }

  buildDataDisplay(useEffectConfig) {
    if (!useEffectConfig?.commandStateVar) return "<p>No data available</p>";
    const { commandStateVar, stateVarIsList } = useEffectConfig;

    if (stateVarIsList) {
      return `
        <>
          <h2>List of Items</h2>
          <ul>
            {${commandStateVar}?.map((item) => (
              <li key={item.id}>{item.description}</li>
            ))}
          </ul>
        </>
      `;
    } else {
      return `<p>Var is: {JSON.stringify(${commandStateVar})}</p>`;
    }
  }

  buildErrorMessage(hasUseEffect) {
    return hasUseEffect ? `{errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}` : "";
  }

  buildLoadingIndicator(hasUseEffect, useEffectConfig, content) {
    if (hasUseEffect && useEffectConfig?.showIsLoading) {
      return `
      <LoadingIndicator isLoading={isProcessing} renderDelay={300}>
        ${content}
      </LoadingIndicator>
      `;
    }
    return content;
  }

  buildWrappedContent(hasUseEffect, useEffectConfig, innerContent, hasChildren) {
    const errorMessage = this.buildErrorMessage(hasUseEffect);
    const dataDisplay = this.buildDataDisplay(useEffectConfig);
    const conditionalContent = hasUseEffect
      ? `${errorMessage}\n      {${useEffectConfig.commandStateVar} ? (\n        ${dataDisplay}\n      ) : (\n        <p>No data available</p>\n      )}`
      : innerContent;
    const withLoading = this.buildLoadingIndicator(hasUseEffect, useEffectConfig, conditionalContent);
    const childrenBlock = hasChildren ? `\n      {children}` : "";

    return `${withLoading}${childrenBlock}`;
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  toKebabCase(str) {
    return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
  }

  generate() {
    return this.buildComponentContent();
  }
}

export {ComponentBuilderGemini};