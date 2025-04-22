class ComponentBuilder {
  constructor(config) {
    this.config = config;
    this.component = config.component;
    this.effect = config.useEffectConfig;
  }

  generate() {
    const { componentName } = this.component;
    const imports = this.buildImports();
    const params = this.buildParams();
    const state = this.buildState();
    const useEffect = this.buildEffect();
    const output = this.buildOutput();
    const body = this.component.allowsChildren ? "{ children }" : "";
    const className = this.toLowerFirst(componentName);
    const testId = this.toKebabCase(componentName);

    const content = `
${imports}

function ${componentName}({ ${params} }) {
  ${state}
  ${useEffect}

  const combinedClassName = [styles.${className}, className].filter(Boolean).join(" ");

  return (
    <div data-testid="${testId}" className={combinedClassName} style={style} {...rest}>
      {/* implement component code */}
      ${output}
      ${body}
    </div>
  );
}

export { ${componentName} };
    `.trim();

    return {
      directory: componentName,
      fileName: `${componentName}.jsx`,
      content
    };
  }

  buildImports() {
    const { componentName } = this.component;
    const lines = [`import styles from "./${componentName}.module.css";`];

    if (this.effect) {
      lines.push('import { useState, useEffect } from "react";');
      lines.push('import { useCommand } from "hooks/useCommand";');
      lines.push(`import { ${this.effect.commandName} } from "services/${this.effect.commandName}";`);

      if (this.effect.showIsLoading) {
        lines.push('import { LoadingIndicator } from "components/LoadingIndicator";');
      }
    }

    return lines.join("\n");
  }

  buildParams() {
    const { componentParams = [], allowsChildren } = this.component;
    return [
      ...componentParams,
      allowsChildren && "children",
      'className = ""',
      "style = {}",
      "...rest"
    ].filter(Boolean).join(", ");
  }

  buildState() {
    if (!this.effect) return "";

    const varName = this.effect.commandStateVar;
    const upper = this.toUpperFirst(varName);

    return [
      `const [${varName}, set${upper}] = useState(null);`,
      `const [errorMessage, setErrorMessage] = useState(null);`,
      `const { execute, isExecuting } = useCommand();`
    ].join("\n");
  }

  buildEffect() {
    if (!this.effect) return "";

    const { commandName, commandParams = [], commandStateVar } = this.effect;
    const setter = `set${this.toUpperFirst(commandStateVar)}`;
    const checks = commandParams.map(p => `if (!${p}) return setErrorMessage("${this.toUpperFirst(p)} is required");`).join("\n      ");

    return `
  useEffect(() => {
    async function init() {
      ${checks}
      const command = new ${commandName}(${commandParams.join(", ")});
      const result = await execute(command);
      if (result.isCanceled) return;
      result.isSuccess
        ? ${setter}(result.value)
        : setErrorMessage("Error retrieving ${commandStateVar}");
    }
    init();
  }, [execute, ${commandParams.join(", ")}]);
    `.trim();
  }

  buildOutput() {
    if (!this.effect) return "";

    const { commandStateVar, stateVarIsList, showIsLoading } = this.effect;

    const content = stateVarIsList
      ? `
<>
  <h2>List of Items</h2>
  <ul>
    {${commandStateVar}?.map((item, index) => (
      <li key={item?.id ?? index}>{item.description}</li>
    ))}
  </ul>
</>`
      : `<p>${commandStateVar} is: {JSON.stringify(${commandStateVar})}</p>`;

    const wrapped = `
{${commandStateVar} ? (
  ${content}
) : (
  <p>No data available</p>
)}
    `.trim();

    const loadingWrapped = showIsLoading
      ? `
<LoadingIndicator isLoading={isExecuting} renderDelay={250}>
  ${wrapped}
</LoadingIndicator>
      `.trim()
      : wrapped;

    return `
{errorMessage && (
  <p className={styles.errorMessage}>{errorMessage}</p>
)}
${loadingWrapped}
    `.trim();
  }

  toLowerFirst(str) {
    return str[0].toLowerCase() + str.slice(1);
  }

  toUpperFirst(str) {
    return str[0].toUpperCase() + str.slice(1);
  }

  toKebabCase(str) {
    return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
  }
}

export {ComponentBuilder};