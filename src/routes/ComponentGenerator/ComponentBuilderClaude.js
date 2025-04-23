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

    return `${this.buildImports()}

function ${componentName} ({${this.buildComponentParams()}}) {
  ${this.buildHooksAndState()}
  const combinedClassNames = [styles.${cssClass}, className].filter(Boolean).join(" ");

  return (
    <div data-testid="${testId}" className={combinedClassNames} style={style} {...rest}>
      <h3>${componentName}</h3>

      {/* TODO implement component JSX */}${this.buildCallbackHandlers().jsxCode}${this.buildUseEffectOutput()}${this.buildComponentJsxBody()}
    </div>
  );
}

export { ${componentName} };\n`;
  }

  buildHooksAndState() {
    const useStateCode = this.buildUseState();
    const useEffectCode = this.buildUseEffect();
    const callbackHandlers = this.buildCallbackHandlers().jsCode;

    return [useStateCode, useEffectCode, callbackHandlers]
      .filter(Boolean)
      .join('');
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

    // Always include these standard props
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

    return `

  useEffect(() => {
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
    }

    init();

    return () => {
      // TODO Cleanup logic if needed
    };
  }, [${dependencyList.join(', ')}]);\n`;
  }

  buildParamChecks(params) {
    return params
      .map(param => {
        const capitalizedParam = this.formatCase(param, 'pascal');
        return `if (!${param}) { setErrorMessage("${capitalizedParam} is required"); return; }`;
      })
      .join('\n      ');
  }

  buildUseEffectOutput() {
    if (!this.useEffectConfig) return '';

    const { commandStateVar, stateVarIsList, showIsLoading } = this.useEffectConfig;

    let output = this.buildDataOutput(commandStateVar, stateVarIsList);

    // Wrap with initialization check
    output = `\n      {/* isInitialized prevents flashing No data message before search is done */}
      {isInitialized && (${commandStateVar} ? (     ${output}
      ) : (
        <p className={styles.error}>No data available</p>
      ))}`;

    // Add loading indicator if needed
    if (showIsLoading) {
      output = this.wrapWithLoadingIndicator(output);
    }

    // Add error message handling
    output = `\n\n      {errorMessage && (
        <p className={styles.error}>{errorMessage}</p>
      )}
        ${output}
    `;

    return output;
  }

  buildDataOutput(stateVar, isList) {
    if (isList) {
      return `
        <>
           <h2>List of Items</h2>
           <ul>
            {${stateVar}?.map((item, index) => (
              // TODO: Each key should be unique and unchanging, ideally from your data
              <li key={item?.id ?? index}>{item.description}</li>
            ))}
          </ul>
        </>`;
    } else {
      return `\n        <p>${stateVar} is: {JSON.stringify(${stateVar})}</p>`;
    }
  }

  wrapWithLoadingIndicator(content) {
    return `
      <LoadingIndicator isLoading={isExecuting} renderDelay={250}>${this.indent(content, 2)}
      </LoadingIndicator>`;
  }

  buildComponentJsxBody() {
    return this.componentConfig.allowsChildren ? `\n\n      { children }` : '';
  }

  buildCallbackHandlers() {
    const callbacks = this.componentConfig?.callbackFunctions || [];

    // generate JavaScript code
    const jsCode = callbacks
      .map(cb => cb.trim())
      .filter(Boolean)
      .map(cb => {
        const handler = `handle${this.formatCase(cb, 'pascal')}`;
        return `\n  const ${handler} = () => {
    // TODO let parent know something happened
    console.log("notifying parent - ${cb}");
    ${cb}?.("${cb} happened!")
  };`;
      })
      .join('\n');

    // generate JSX code
    const jsxCode = callbacks
      .map(cb => cb.trim())
      .filter(Boolean)
      .map(cb => {
        const handler = `handle${this.formatCase(cb, 'pascal')}`;
        return `\n      <button type="button" onClick={${handler}}>Click ${cb}</button>`;
      })
      .join('');

    return {
      jsCode: jsCode ? `${jsCode}\n` : '',
      jsxCode: jsxCode ? `\n${jsxCode}` : ''
    };
  }

  // Unified utility method for different case formats
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
