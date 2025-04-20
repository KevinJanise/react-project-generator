function generateComponentCode(config) {
  const {
    component: { name, parameterList, hasChildren, hasUseEffect },
    useEffectConfig,
  } = config;

  const {
    commandName,
    commandParams,
    commandStateVar,
    showIsLoading,
    stateVarIsList,
  } = useEffectConfig || {};

  const componentFileName = name + ".jsx";
  const cssModuleName = name + ".module.css";
  const testId = toKebabCase(name);
  const propsList = [...parameterList];
  if (hasChildren) propsList.push("children");

  const destructuredProps = [
    ...propsList,
    'className = ""',
    "style = {}",
    "...rest",
  ].join(", ");
  const cssClass = name.charAt(0).toLowerCase() + name.slice(1);

  const imports = [
    `import styles from "./${cssModuleName}";`,
    hasUseEffect && `import { useState, useEffect } from "react";`,
    hasUseEffect && `import { useCommand } from "hooks/useCommand";`,
    hasUseEffect && `import { ${commandName} } from "services/${commandName}";`,
    hasUseEffect &&
      showIsLoading &&
      `import { LoadingIndicator } from "components/LoadingIndicator";`,
  ]
    .filter(Boolean)
    .join("\n");

  const stateDeclarations = hasUseEffect
    ? `  const [${commandStateVar}, set${capitalize(
        commandStateVar
      )}] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const { execute, isProcessing } = useCommand();`
    : "";

  const useEffectBlock = hasUseEffect
    ? `
  useEffect(() => {
    async function init() {
      ${commandParams
        .map(
          (p) => `if (!${p}) {
            setErrorMessage("${p} is required");

            return;
      }`
        )
        .join("\n      ")}

      const command = new ${commandName}(${commandParams.join(", ")});
      const result = await execute(command);

      if (result.isCanceled) return;

      if (result.isSuccess) {
        set${capitalize(commandStateVar)}(result.value);
      } else {
        setErrorMessage("Error retrieving ${commandStateVar}");
      }
    }

    init();

    return () => {
      // Cleanup logic if needed
    };
  }, [${["execute", ...commandParams].join(", ")}]);
  `
    : "";

  const loadingWrapperOpen =
    hasUseEffect && showIsLoading
      ? `<LoadingIndicator isLoading={isProcessing} renderDelay={300}>`
      : "";
  const loadingWrapperClose =
    hasUseEffect && showIsLoading ? `</LoadingIndicator>` : "";

  const childrenBlock = hasChildren ? `{children}` : "";

  const listBlock = stateVarIsList ? `<>
  <h2>List of Items</h2>
    <ul>
      {${commandStateVar}.map((item, index) => (
        <li key={item.id}>
          {item.description}
        </li>
      ))}
    </ul>
    </>
  ` : ``;

  let singleResult = `<p>Var is: {${commandStateVar}}</p>`;

  let theResult = stateVarIsList ? listBlock : singleResult;

  let resultBlock = hasUseEffect
    ? `
        {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
        {${commandStateVar} ? (
           ${theResult}
        ) : (
          <p>No data available</p>
        )}`
    : '';

  let componentSourceCode = `
${imports}

function ${name}({ ${destructuredProps} }) {
${stateDeclarations}

${useEffectBlock.trim()}

  const combinedClassName = [styles.${cssClass}, className]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      data-testid="${testId}"
      className={combinedClassName}
      style={style}
      {...rest}
    >
      ${loadingWrapperOpen}
      ${resultBlock}
      ${childrenBlock}
      {/* implement remaining component code */}
      ${loadingWrapperClose}
    </div>
  );
}

export { ${name} };
`.trim();

  return {
    directory: name,
    fileName: componentFileName,
    content: componentSourceCode,
  };
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function toKebabCase(name) {
  return name
    .replace(/([a-z])([A-Z])/g, '$1-$2') // insert dash between camelCase transitions
    .replace(/[\s_]+/g, '-')             // replace spaces/underscores with dash
    .toLowerCase();                      // convert to lowercase
}
export { generateComponentCode };
