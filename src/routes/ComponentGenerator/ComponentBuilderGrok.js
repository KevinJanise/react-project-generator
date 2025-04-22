class ComponentBuilder {
  constructor(config) {
    this.config = config;
    this.componentConfig = config.component;
    this.useEffectConfig = config.useEffectConfig;
  }

  generate() {
    const { componentName } = this.componentConfig;
    const cssClass = this.toLowerFirstLetter(componentName);
    const testId = this.toKebabCase(componentName);

    const imports = this.buildImports();
    const params = this.buildComponentParams();
    const stateAndEffect = this.buildStateAndEffect();
    const jsxBody = this.buildJsxBody();

    // Use a consistent indent of 2 spaces
    const indent = "  ";
    const componentSourceCode = `
${imports}

function ${componentName}({ ${params} }) {
${stateAndEffect ? `${indent}${stateAndEffect}` : ""}

${indent}const combinedClassName = [styles.${cssClass}, className].filter(Boolean).join(" ");

${indent}return (
${indent}${indent}<div data-testid="${testId}" className={combinedClassName} style={style} {...rest}>
${indent}${indent}${indent}${jsxBody}
${indent}${indent}</div>
${indent});
}

export { ${componentName} };
    `.trim();

    return {
      directory: componentName,
      fileName: `${componentName}.jsx`,
      content: componentSourceCode,
    };
  }

  buildImports() {
    const { componentName } = this.componentConfig;
    const { useEffectConfig } = this;
    const imports = [`import styles from "./${componentName}.module.css";`];

    if (useEffectConfig) {
      imports.push('import { useState, useEffect } from "react";');
      imports.push('import { useCommand } from "hooks/useCommand";');
      imports.push(`import { ${useEffectConfig.commandName} } from "services/${useEffectConfig.commandName}";`);
      if (useEffectConfig.showIsLoading) {
        imports.push('import { LoadingIndicator } from "components/LoadingIndicator";');
      }
    }

    return imports.join("\n");
  }

  buildComponentParams() {
    const { componentParams, allowsChildren } = this.componentConfig;
    const params = [...componentParams];

    if (allowsChildren) params.push("children");
    params.push('className = ""', "style = {}", "...rest");

    return params.join(", ");
  }

  buildStateAndEffect() {
    const { useEffectConfig } = this;
    if (!useEffectConfig) return "";

    const { commandName, commandParams = [], commandStateVar, stateVarIsList, showIsLoading } = useEffectConfig;
    const stateVarSetter = `set${this.toUpperFirstLetter(commandStateVar)}`;
    const dependencyList = ["execute", ...commandParams];
    const indent = "  ";

    // State declarations
    const stateCode = `
const [${commandStateVar}, ${stateVarSetter}] = useState(null);
const [errorMessage, setErrorMessage] = useState(null);
const { execute, isExecuting } = useCommand();
    `.trim();

    // useEffect logic
    const checks = commandParams
      .map((p) => `${indent}${indent}if (!${p}) { setErrorMessage("${this.toUpperFirstLetter(p)} is required"); return; }`)
      .join("\n");
    const effectCode = `
useEffect(() => {
${indent}async function init() {
${checks}
${indent}${indent}const command = new ${commandName}(${commandParams.join(", ")});
${indent}${indent}const result = await execute(command);

${indent}${indent}if (result.isCanceled) return;
${indent}${indent}if (result.isSuccess) {
${indent}${indent}${indent}${stateVarSetter}(result.value);
${indent}${indent}} else {
${indent}${indent}${indent}setErrorMessage("Error retrieving ${commandStateVar}");
${indent}${indent}}
${indent}}

${indent}init();
${indent}return () => {};
}, [${dependencyList.join(", ")}]);
    `.trim();

    // Output JSX
    let outputJsx = stateVarIsList
      ? `
<>
${indent}<h2>List of Items</h2>
${indent}<ul>
${indent}${indent}{${commandStateVar}?.map((item, index) => (
${indent}${indent}${indent}<li key={item?.id ?? index}>{item.description}</li>
${indent}${indent}))}
${indent}</ul>
</>
      `
      : `<p>${commandStateVar} is: {JSON.stringify(${commandStateVar})}</p>`;

    outputJsx = `
{${commandStateVar} ? (
${indent}${outputJsx}${indent}) : (
${indent}<p>No data available</p>
)}
    `.trim();

    if (showIsLoading) {
      outputJsx = `
<LoadingIndicator isLoading={isExecuting} renderDelay={250}>
${indent}${outputJsx}
</LoadingIndicator>
      `.trim();
    }

    const outputCode = `
{errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
${outputJsx}
    `.trim();

    return [stateCode, effectCode, outputCode].join("\n\n");
  }

  buildJsxBody() {
    const { allowsChildren } = this.componentConfig;
    return allowsChildren ? "{children}" : "";
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
}

export { ComponentBuilder };
