class ComponentBuilderKevin {
  constructor(config) {
    this.config = config;
    this.componentConfig = config.component;
    this.useEffectConfig = config.useEffectConfig;
  }

  /*
 const componentConfig = {
  component: {
    name: "NoteDisplay",
    parameterList: ["noteId", "userId", "userName"],
    hasChildren: true,
    hasUseEffect: false,  // shouldInitialize
  },
  useEffectConfig: {
    commandName: "FindNoteCommand",
    commandParams: ["noteId", "userId"],
    commandStateVar: "note",
    showIsLoading: true,
    stateVarIsList: true,
  }
};
*/

  generate() {
    let directory = null;
    let fileName = null;
    let content = null;
    let componentConfig = this.componentConfig;
    let useEffectConfig = this.useEffectConfig;

    console.log("useEffectConfig: ", useEffectConfig);



    // import statements, function/component declaration, state variables, hooks, useEffect, export


    // Assemble source code
    let componentName = componentConfig.componentName;
    let cssClass = this.toLowerFirstLetter(componentName);
    let testId =  this.toKebabCase(componentName);;

    let importStatements = this.buildImports(componentConfig, useEffectConfig);
    let componentParams = this.buildComponentParams(componentConfig, useEffectConfig);

    let useEffectSource = this.buildUseEffect(useEffectConfig);
    let useEffectOutput = this.buildUseEffectOutput(useEffectConfig);
    let useStateSource = this.buildUseState(useEffectConfig);

    let componentJsxBody = this.buildcomponentJsxBody(componentConfig, useEffectConfig);

    let componentSourceCode =
    `${importStatements}

function ${componentName} (${componentParams}) {
  ${useStateSource}${useEffectSource}

  const combinedClassName = [styles.${cssClass}, className].filter(Boolean).join(" ");

  return (
    <div data-testid="${testId}" className={combinedClassName} style={style} {...rest}>

      {/* implement component code */}

      ${useEffectOutput}
      ${componentJsxBody}

    </div>
  );
}

export { ${componentName} };
    `.trim();

    directory = componentName;
    fileName = `${componentName}.jsx`;

    return {
      directory,
      fileName,
      content: componentSourceCode,
    };
  }

  buildIsLoadingWrapper(content) {
    let loadingIndicator =
  `
        <LoadingIndicator isLoading={isProcessing} renderDelay={250}>
          ${content}
      </LoadingIndicator>
  `.trim();;

    return loadingIndicator;
  }

  buildUseEffectOutput(useEffectConfig) {
    if (!useEffectConfig) return "";

    const { commandStateVar, stateVarIsList, showIsLoading } = useEffectConfig;

    let useEffectOutput = null;

    if (stateVarIsList) {
      useEffectOutput =
`    <>
          <h2>List of Items</h2>
          <ul>
            {${commandStateVar}?.map((item, index) => (
              <li key={item?.id ?? index}>{item.description}</li>
            ))}
          </ul>
        </>
      `.trim();
      } else {  // single line
      useEffectOutput = `<p>${commandStateVar} is: {JSON.stringify(${commandStateVar})}</p>`;
    }

    // conditional output
    useEffectOutput =
`
      {${commandStateVar} && (
          ${useEffectOutput}
      )}
`;

useEffectOutput =
`
    {errorMessage && (
        <p className={styles.errorMessage}>{errorMessage}</p>
    )}

    ${useEffectOutput}
`;

    if (showIsLoading) {
      useEffectOutput = this.buildIsLoadingWrapper(useEffectOutput);
    }

    return useEffectOutput;
  }

  buildcomponentJsxBody(componentConfig)  {
    let children = componentConfig.allowsChildren ? "{ children }" : "";

    let componentJsxBody =
`
      ${children}
`;

      return componentJsxBody;
  }

  // roll into buildUseEffect since that is where it is used
  buildUseState(useEffectConfig) {
    if (!useEffectConfig?.commandStateVar) return "";

    const { commandStateVar } = useEffectConfig;
    return `
  const [${commandStateVar}, set${this.toUpperFirstLetter(commandStateVar)}] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const { execute, isProcessing } = useCommand();
    `.trim();
  }

  buildUseEffect(useEffectConfig) {
    if (!useEffectConfig) return "";

    const { commandName, commandParams = [], commandStateVar } = useEffectConfig;

    const dependencyList = ["execute", ...commandParams];
    const checks = commandParams
      .map(p => `if (!${p}) { setErrorMessage("${this.toUpperFirstLetter(p)} is required"); return; }`)
      .join("\n      ");

    return `

  useEffect(() => {
    async function init() {
      ${checks}

      const command = new ${commandName}(${commandParams.join(", ")});
      const result = await execute(command);

      if (result.isCanceled) return;

      if (result.isSuccess) {
        set${this.toUpperFirstLetter(commandStateVar)}(result.value);
      } else {
        setErrorMessage("Error retrieving ${commandStateVar}");
      }
    }

    init();

    return () => {
      // Cleanup logic if needed
    };
  }, [${dependencyList.join(", ")}]);
    `;
  }


  buildComponentParams(componentConfig) {
    let paramList = [...componentConfig.componentParams];

    if (componentConfig.allowsChildren) {
      paramList.push("children");
    }

    paramList.push('className = ""');
    paramList.push("style = {}");

    paramList.push("...rest")

    return paramList.filter(Boolean).join(", ");
  }

  // returns an array of import statements each of which is a string
  buildImports(componentConfig, useEffectConfig) {
    console.log("buildImports useEffectConfig: ", useEffectConfig);
    let imports = [];

    imports.push(`import styles from "${componentConfig.componentName}.module.css";`);

    if (useEffectConfig) {
      imports.push('import { useState, useEffect } from "react";');

      if (useEffectConfig.showIsLoading) {
        imports.push('import { LoadingIndicator } from "components/LoadingIndicator";');
      }

      imports.push('import { useCommand } from "hooks/useCommand";');
      imports.push(`import { ${useEffectConfig.commandName} } from "services/${useEffectConfig.commandName}";`);

    }

    return imports.filter(Boolean).join("\n");
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

export { ComponentBuilderKevin };
