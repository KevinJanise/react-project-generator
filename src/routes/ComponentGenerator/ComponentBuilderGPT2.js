class ComponentBuilderGPT2 {
  constructor(config) {
    this.config = config;
    this.component = config.component;
    this.useEffectConfig = config.useEffectConfig || {};
  }

  generate() {
    const { name, parameterList = [], hasChildren } = this.component;
    const fileName = `${name}.jsx`;
    const cssClass = name.charAt(0).toLowerCase() + name.slice(1);
    const testId = this.toKebabCase(name);
    const props = [
      ...parameterList,
      ...(hasChildren ? ["children"] : []),
      'className = ""',
      "style = {}",
      "...rest",
    ];

    const parts = {
      imports: this.buildImports(),
      state: this.buildStateBlock(),
      effect: this.buildUseEffectBlock(),
      result: this.buildResultBlock(),
      wrapped: this.buildWrappedContent(),
      props: props.join(", "),
      cssClass,
      testId,
    };

    const content = this.buildComponentTemplate(parts);

    return {
      directory: name,
      fileName,
      content,
    };
  }

  buildImports() {
    const { name, hasUseEffect } = this.component;
    const { commandName, showIsLoading } = this.useEffectConfig;

    const imports = [
      `import styles from "./${name}.module.css";`,
      hasUseEffect && `import { useState, useEffect } from "react";`,
      hasUseEffect && `import { useCommand } from "hooks/useCommand";`,
      hasUseEffect &&
        `import { ${commandName} } from "services/${commandName}";`,
      hasUseEffect &&
        showIsLoading &&
        `import { LoadingIndicator } from "components/LoadingIndicator";`,
    ];

    return imports.filter(Boolean).join("\n");
  }

  buildStateBlock() {
    if (!this.component.hasUseEffect) return "";

    const { commandStateVar } = this.useEffectConfig;

    return `
  const [${commandStateVar}, set${this.capitalize(
      commandStateVar
    )}] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const { execute, isProcessing } = useCommand();
    `.trim();
  }

  buildUseEffectBlock() {
    if (!this.component.hasUseEffect) return "";

    const {
      commandName,
      commandParams = [],
      commandStateVar,
    } = this.useEffectConfig;

    const checks = commandParams
      .map(
        (p) => `
      if (!${p}) {
        setErrorMessage("${p} is required");
        return;
      }`
      )
      .join("");

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
  }, [${["execute", ...commandParams].join(", ")}]);
    `.trim();
  }

  buildResultBlock() {
    if (!this.component.hasUseEffect) return "";

    const { commandStateVar, stateVarIsList } = this.useEffectConfig;

    const content = stateVarIsList
      ? `
      <>
            <h2>List of Items</h2>

            <ul>
              {${commandStateVar}.map((item) => (
                <li key={item.id}>{item.description}</li>
              ))}
            </ul>
          </>
      `
      : `<p>Var is: {JSON.stringify(${commandStateVar})}</p>`;

    return `
        {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}

        {${commandStateVar} ? (
          ${content.trim()}
        ) : (
          <p>No data available</p>
        )}
    `.trim();
  }

  buildWrappedContent() {
    const { hasChildren, hasUseEffect } = this.component;
    const showLoading = this.useEffectConfig.showIsLoading;
    const result = this.buildResultBlock();
    const childrenBlock = hasChildren ? `\n        {children}` : "";

    if (hasUseEffect && showLoading) {
      return `
      <LoadingIndicator isLoading={isProcessing} renderDelay={300}>
        ${result}
        ${childrenBlock}
      </LoadingIndicator>
      `.trim();
    }

    return `
      ${result}
      ${childrenBlock}
    `.trim();
  }

  buildComponentTemplate({
    imports,
    state,
    effect,
    wrapped,
    props,
    cssClass,
    testId,
  }) {
    const { name } = this.component;

    return `${imports}

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
      ${wrapped}
      {/* implement remaining component code */}
    </div>
  );
}

export { ${name} };
    `.trim();
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  toKebabCase(str) {
    return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
  }
}

export { ComponentBuilderGPT2 };
