class ComponentBuilderGrok {
  constructor(config) {
    this.config = config;
    this.component = config.component;
    this.useEffect = config.useEffectConfig || {};
  }

  generate() {
    const { name, parameterList = [], hasChildren } = this.component;
    const props = this.buildProps(parameterList, hasChildren);
    const parts = {
      imports: this.buildImports(),
      logic: this.buildLogic(),
      content: this.buildContent(),
      props: props.join(", "),
      cssClass: this.toCamelCase(name),
      testId: this.toKebabCase(name),
    };

    return {
      directory: name,
      fileName: `${name}.jsx`,
      content: this.renderTemplate(parts),
    };
  }

  buildProps(parameterList, hasChildren) {
    return [
      ...parameterList,
      ...(hasChildren ? ["children"] : []),
      'className = ""',
      "style = {}",
      "...rest",
    ];
  }

  buildImports() {
    const { name, hasUseEffect } = this.component;
    const { commandName, showIsLoading } = this.useEffect;
    const imports = [
      { condition: true, line: `import styles from "./${name}.module.css";` },
      { condition: hasUseEffect, line: `import { useState, useEffect } from "react";` },
      { condition: hasUseEffect, line: `import { useCommand } from "hooks/useCommand";` },
      {
        condition: hasUseEffect && commandName,
        line: `import { ${commandName} } from "services/${commandName}";`,
      },
      {
        condition: hasUseEffect && showIsLoading,
        line: `import { LoadingIndicator } from "components/LoadingIndicator";`,
      },
    ];

    return imports.filter(({ condition }) => condition).map(({ line }) => line).join("\n");
  }

  buildLogic() {
    if (!this.component.hasUseEffect) return "";
    const { commandStateVar, commandName, commandParams = [] } = this.useEffect;

    return `
      const [${commandStateVar}, set${this.capitalize(commandStateVar)}] = useState(null);
      const [errorMessage, setErrorMessage] = useState(null);
      const { execute, isProcessing } = useCommand();

      useEffect(() => {
        async function fetchData() {
          ${this.buildParamChecks(commandParams)}
          const command = new ${commandName}(${commandParams.join(", ")});
          const result = await execute(command);

          if (result.isCanceled) return;
          set${this.capitalize(commandStateVar)}(result.isSuccess ? result.value : null);
          setErrorMessage(result.isSuccess ? null : "Error retrieving ${commandStateVar}");
        }
        fetchData();
      }, [${["execute", ...commandParams].join(", ")}]);
    `.trim();
  }

  buildParamChecks(params) {
    return params
      .map((param) => `
        if (!${param}) {
          setErrorMessage("${param} is required");
          return;
        }
      `)
      .join("");
  }

  buildContent() {
    const { hasChildren, hasUseEffect } = this.component;
    const { showIsLoading, commandStateVar, stateVarIsList } = this.useEffect;
    const childrenBlock = hasChildren ? "{children}" : "";
    const result = this.buildResult(commandStateVar, stateVarIsList);

    if (hasUseEffect && showIsLoading) {
      return `
        <LoadingIndicator isLoading={isProcessing} renderDelay={300}>
          ${result}
          ${childrenBlock}
        </LoadingIndicator>
      `;
    }
    return `${result}\n${childrenBlock}`;
  }

  buildResult(stateVar, isList) {
    if (!this.component.hasUseEffect) return "";
    const content = isList
      ? `<>
          <h2>List of Items</h2>
          <ul>
            {${stateVar}.map((item) => (
              <li key={item.id}>{item.description}</li>
            ))}
          </ul>
        </>
      `
      : `<p>Var is: {JSON.stringify(${stateVar})}</p>`;

    return `
      {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
      {${stateVar} ? (${content}) : (<p>No data available</p>)}
    `.trim();
  }

  renderTemplate({ imports, logic, content, props, cssClass, testId }) {
    const { name } = this.component;
    return `
      ${imports}

      function ${name}({ ${props} }) {
        ${logic}

        const combinedClassName = [styles.${cssClass}, className].filter(Boolean).join(" ");

        return (
          <div
            data-testid="${testId}"
            className={combinedClassName}
            style={style}
            {...rest}
          >
            ${content}
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

  toCamelCase(str) {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }

  toKebabCase(str) {
    return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
  }
}

export { ComponentBuilderGrok };
