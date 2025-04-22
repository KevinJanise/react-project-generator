class ComponentBuilderClaude {
  constructor(config) {
    this.config = config;
  }

  generate() {
    const { component, useEffectConfig = {} } = this.config;
    const { name, parameterList = [], hasChildren = false, hasUseEffect = false } = component;

    // Prepare core component properties
    const cssClass = this.toKebabCase(name);
    const props = this.extractProps(parameterList, hasChildren);

    // Build component sections
    const sections = {
      imports: this.buildImports(name, hasUseEffect, useEffectConfig),
      stateHooks: hasUseEffect ? this.buildStateHooks(useEffectConfig) : "",
      effects: hasUseEffect ? this.buildEffect(useEffectConfig) : "",
      renderContent: this.buildRenderContent(hasUseEffect, useEffectConfig, hasChildren)
    };

    // Assemble the component
    const componentContent = `
${sections.imports}

function ${name}({ ${props} }) {
  ${sections.stateHooks}
  ${sections.effects}

  const combinedClassName = [styles.${cssClass}, className].filter(Boolean).join(" ");

  return (
    <div
      data-testid="${cssClass}"
      className={combinedClassName}
      style={style}
      {...rest}
    >
      ${sections.renderContent}
    </div>
  );
}

export { ${name} };`.trim();

    return {
      directory: name,
      fileName: `${name}.jsx`,
      content: componentContent
    };
  }

  extractProps(parameterList, hasChildren) {
    const baseProps = [...parameterList, 'className = ""', "style = {}", "...rest"];
    return hasChildren ? [...baseProps, "children"].join(", ") : baseProps.join(", ");
  }

  buildImports(name, hasUseEffect, useEffectConfig) {
    const importMap = {
      styles: `import styles from "./${name}.module.css";`,
      react: hasUseEffect ? 'import { useState, useEffect } from "react";' : null,
      useCommand: hasUseEffect ? 'import { useCommand } from "hooks/useCommand";' : null,
      command: hasUseEffect && useEffectConfig.commandName ?
        `import { ${useEffectConfig.commandName} } from "services/${useEffectConfig.commandName}";` : null,
      loadingIndicator: hasUseEffect && useEffectConfig.showIsLoading ?
        'import { LoadingIndicator } from "components/LoadingIndicator";' : null
    };

    return Object.values(importMap)
      .filter(Boolean)
      .join("\n");
  }

  buildStateHooks(useEffectConfig) {
    const { commandStateVar } = useEffectConfig;
    if (!commandStateVar) return "";

    return `
  const [${commandStateVar}, set${this.capitalize(commandStateVar)}] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const { execute, isProcessing } = useCommand();`.trim();
  }

  buildEffect(useEffectConfig) {
    const { commandName, commandParams = [], commandStateVar } = useEffectConfig;
    if (!commandName || !commandStateVar) return "";

    const dependencyList = ["execute", ...commandParams];
    const paramChecks = commandParams
      .map(p => `if (!${p}) { setErrorMessage("${this.capitalize(p)} is required"); return; }`)
      .join("\n      ");

    return `
  useEffect(() => {
    async function init() {
      ${paramChecks}

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
  }, [${dependencyList.join(", ")}]);`.trim();
  }

  buildRenderContent(hasUseEffect, useEffectConfig, hasChildren) {
    // Create content elements in order of nesting
    let content = this.buildDataDisplay(useEffectConfig);

    // Add conditional rendering for data
    if (hasUseEffect && useEffectConfig.commandStateVar) {
      content = `
        {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
        {${useEffectConfig.commandStateVar} ? (
          ${content}
        ) : (
          <p>No data available</p>
        )}`;
    }

    // Add loading wrapper if needed
    if (hasUseEffect && useEffectConfig.showIsLoading) {
      content = `
        <LoadingIndicator isLoading={isProcessing} renderDelay={300}>
          ${content}
        </LoadingIndicator>`;
    }

    // Add children if needed
    if (hasChildren) {
      content = `${content}\n      {children}`;
    }

    return content.trim();
  }

  buildDataDisplay(useEffectConfig) {
    if (!useEffectConfig?.commandStateVar) return "<p>No data available</p>";

    const { commandStateVar, stateVarIsList } = useEffectConfig;

    return stateVarIsList ?
      `<>
          <h2>List of Items</h2>
          <ul>
            {${commandStateVar}?.map((item, index) => (
              <li key={item?.id ?? index}>{item.description}</li>
            ))}
          </ul>
        </>` :
      `<p>Var is: {JSON.stringify(${commandStateVar})}</p>`;
  }

  // Utility methods
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  toKebabCase(str) {
    return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
  }
}

export { ComponentBuilderClaude };
