class ComponentBuilderKevin {
  constructor(config) {
    this.config = config;
    this.componentConfig = config.component;
    this.useEffectConfig = config.useEffectConfig;
  }

  generate() {
    const { componentName } = this.componentConfig;
    const componentSourceCode = this.buildComponentSource();
    return {
      directory: componentName,
      fileName: `${componentName}.jsx`,
      content: componentSourceCode,
    };
  }

  buildComponentSource() {
    const { componentName } = this.componentConfig;
    const cssClass = this.formatCase(componentName, 'camel');
    const testId = this.formatCase(componentName, 'kebab');
    const imports = this.buildImports();
    const params = this.buildComponentParams();
    const stateAndHooks = this.buildStateAndHooks();
    const eventHandlers = this.buildEventHandlers();
    const innerJsx = this.buildInnerJsx();
    const logicParts = [];
    if (stateAndHooks) {
      logicParts.push(this.indent(stateAndHooks, 2));
    }
    if (eventHandlers) {
      logicParts.push(this.indent(eventHandlers, 2));
    }
    const logicCode = logicParts.join('\n');
    const code = `
${imports}

function ${componentName}({${params}}) {
${logicCode}

  const combinedClassNames = [styles.${cssClass}, className].filter(Boolean).join(" ");

  return (
    <div data-testid="${testId}" className={combinedClassNames} style={style} {...rest}>
${this.indent(innerJsx, 6)}
    </div>
  );
}

export { ${componentName} };
`;
    return code.trim();
  }

  buildImports() {
    const imports = [];
    const { componentName } = this.componentConfig;
    imports.push(`import styles from "./${componentName}.module.css";`);
    if (this.useEffectConfig) {
      imports.push('import { useState, useEffect } from "react";');
      if (this.useEffectConfig.showIsLoading) {
        imports.push('import { LoadingIndicator } from "components/LoadingIndicator";');
      }
      imports.push('import { useCommand } from "hooks/useCommand";');
      const { commandName } = this.useEffectConfig;
      imports.push(`import { ${commandName} } from "services/${commandName}";`);
    }
    return imports.join('\n');
  }

  buildComponentParams() {
    const paramList = [];
    const { componentParams = [], callbackFunctions = [], allowsChildren } = this.componentConfig;
    if (componentParams.length) {
      paramList.push(...componentParams);
    }
    if (callbackFunctions?.length) {
      paramList.push(...callbackFunctions);
    }
    if (allowsChildren) {
      paramList.push('children');
    }
    paramList.push('className = ""');
    paramList.push('style = {}');
    paramList.push('...rest');
    return paramList.join(', ');
  }

  buildUseState() {
    if (!this.useEffectConfig?.commandStateVar) return '';
    const { commandStateVar, stateVarIsList } = this.useEffectConfig;
    const initialValue = stateVarIsList ? '[]' : 'null';
    const capitalizedVar = this.formatCase(commandStateVar, 'pascal');
    return `const [${commandStateVar}, set${capitalizedVar}] = useState(${initialValue});
const [isInitialized, setIsInitialized] = useState(false);
const [errorMessage, setErrorMessage] = useState(null);
const { execute, isExecuting } = useCommand();`;
  }

  buildUseEffect() {
    if (!this.useEffectConfig) return '';
    const {
      commandName,
      commandParams = [],
      commandStateVar,
    } = this.useEffectConfig;
    const dependencyList = ['execute', ...commandParams];
    const paramChecks = this.buildParamChecks(commandParams);
    const capitalizedVar = this.formatCase(commandStateVar, 'pascal');
    return `\nuseEffect(() => {
  const init = async () => {
    ${paramChecks}

    const command = new ${commandName}(${commandParams.join(', ')});
    const result = await execute(command);

    if (result.isCanceled) return;

    if (result.isSuccess) {
      set${capitalizedVar}(result.value);
    } else {
      setErrorMessage("Error retrieving ${commandStateVar}");
    }

    setIsInitialized(true);
  };

  init();

  return () => {
    // TODO Cleanup logic if needed
  };
}, [${dependencyList.join(', ')}]);`;
  }

  buildParamChecks(params) {
    return params
      .map(param => {
        const capitalizedParam = this.formatCase(param, 'pascal');
        return `if (!${param}) { setErrorMessage("${capitalizedParam} is required"); return; }`;
      })
      .join('\n    ');
  }

  buildCallbackHandlers() {
    const callbacks = this.componentConfig?.callbackFunctions || [];
    const jsCode = callbacks
      .map(cb => cb.trim())
      .filter(Boolean)
      .map(cb => {
        const handler = `handle${this.formatCase(cb, 'pascal')}`;
        return `\nconst ${handler} = () => {
  // TODO let parent know something happened
  console.log("notifying parent - ${cb}");
  ${cb}?.("${cb} happened!");
};`;
      })
      .join('\n');
    const jsxCode = callbacks
      .map(cb => cb.trim())
      .filter(Boolean)
      .map(cb => {
        const handler = `handle${this.formatCase(cb, 'pascal')}`;
        return `<button type="button" onClick={${handler}}>Click ${cb}</button>`;
      })
      .join('\n');
    return {
      jsCode: jsCode ? jsCode : '',
      jsxCode: jsxCode ? jsxCode : ''
    };
  }

  buildStateAndHooks() {
    const useStateCode = this.buildUseState();
    const useEffectCode = this.buildUseEffect();
    return [useStateCode, useEffectCode].filter(Boolean).join('\n');
  }

  buildEventHandlers() {
    return this.buildCallbackHandlers().jsCode;
  }

  buildDataDisplay() {
    if (!this.useEffectConfig) return '';
    const { commandStateVar, stateVarIsList, showIsLoading } = this.useEffectConfig;

    const dataOutput = stateVarIsList
      ? `<ul>
  {${commandStateVar}?.map((item, index) => (
    // TODO: Each key should be unique and unchanging, ideally from your data
    <li key={item?.id ?? index}>{item.description}</li>
  ))}
</ul>`
      : `<p>${commandStateVar} is: {JSON.stringify(${commandStateVar})}</p>`;

    let mainContent = `{isInitialized && (${commandStateVar} ? (
  ${dataOutput}
) : (
  <p className={styles.error}>No data available</p>
))}`;

//mainContent = this.indent(mainContent, 2);

    const wrappedContent = showIsLoading
      ? `\n<LoadingIndicator isLoading={isExecuting} renderDelay={250}>
  ${mainContent}
</LoadingIndicator>`
      : mainContent;
    const errorPart = `\n{errorMessage && (
  <p className={styles.error}>{errorMessage}</p>
)}`;
    return `${errorPart}\n${wrappedContent}`;
  }

  buildInnerJsx() {
    const parts = [];
    parts.push(`<h3>${this.componentConfig.componentName}</h3>`);
    parts.push(`\n{/* TODO implement component JSX */}`);
    const callbackButtons = this.buildCallbackHandlers().jsxCode;
    if (callbackButtons) {
      parts.push(callbackButtons);
    }
    const dataDisplay = this.buildDataDisplay();
    if (dataDisplay) {
      parts.push(dataDisplay);
    }
    if (this.componentConfig.allowsChildren) {
      parts.push('\n{children}');
    }
    return parts.join('\n');
  }

  formatCase(str, format) {
    switch (format) {
      case 'camel':
        return str.charAt(0).toLowerCase() + str.slice(1);
      case 'pascal':
        return str.charAt(0).toUpperCase() + str.slice(1);
      case 'kebab':
        return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
      default:
        return str;
    }
  }

  indent(str, spaces) {
    const indent = ' '.repeat(spaces);
    return str.split('\n').map(line => indent + line).join('\n');
  }
}

export { ComponentBuilderKevin };
