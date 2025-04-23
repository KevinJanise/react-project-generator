class ComponentBuilderKevin {
  constructor(config) {
    this.config = config;
    this.componentConfig = config.component;
    this.useEffectConfig = config.useEffectConfig;
  }


  formatOutput(code) {
    const cleaned = code
      .split('\n')
      .map(line => line.trimEnd())
      .reduce((acc, line) => {
        if (line === '' && acc[acc.length - 1] === '') return acc;
        return [...acc, line];
      }, [])
      .join('\n');

    const spaced = cleaned
      // Ensure a blank line after all imports
      .replace(/(import\s+.*?;)(?!\n\n)/g, '$1\n')
      // Ensure a blank line before the component function
      .replace(/(?:^|\n)(function\s+\w+\s*\(.*?\)\s*{)/g, '\n$1')
      // Add blank line before return if not already present
      .replace(/([^\n])(\n\s*return\s*\()/g, '$1\n$2')
      // Remove excess line after <h3> or errorMessage
      .replace(/(<\/h3>|{errorMessage})\n{2,}/g, '$1\n')
      // Collapse 2+ blank lines to just one
      .replace(/\n{3,}/g, '\n\n');

    return spaced.trim() + '\n';
  }

  generate() {
    const { componentName } = this.componentConfig;

    return {
      directory: componentName,
      fileName: `${componentName}.jsx`,
      content: this.formatOutput(this.buildComponentSource()),
    };
  }

  buildComponentSource() {
    const { componentName } = this.componentConfig;
    const cssClass = this.formatCase(componentName, 'camel');
    const testId = this.formatCase(componentName, 'kebab');

    return `${this.generateImports()}

function ${componentName} ({ ${this.generateProps()} }) {
  ${this.generateStateHooks()}
  ${this.generateEffectHook()}
  ${this.generateHandlers().js}

  const combinedClassNames = [styles.${cssClass}, className].filter(Boolean).join(" ");

  return (
    <div data-testid="${testId}" className={combinedClassNames} style={style} {...rest}>
      <h3>${componentName}</h3>${this.generateHandlers().jsx}
      ${this.generateUseEffectJSX()}
      ${this.generateChildren()}
    </div>
  );
}

export { ${componentName} };
`;
  }

  generateImports() {
    const imports = [`import styles from "./${this.componentConfig.componentName}.module.css";`];
    if (this.useEffectConfig) {
      imports.push(`import { useState, useEffect } from "react";`);
      imports.push(`import { useCommand } from "hooks/useCommand";`);
      if (this.useEffectConfig.showIsLoading) {
        imports.push(`import { LoadingIndicator } from "components/LoadingIndicator";`);
      }
      imports.push(`import { ${this.useEffectConfig.commandName} } from "services/${this.useEffectConfig.commandName}";`);
    }
    return imports.join("\n");
  }

  generateProps() {
    const { componentParams = [], callbackFunctions = [], allowsChildren } = this.componentConfig;
    return [
      ...componentParams,
      ...callbackFunctions,
      ...(allowsChildren ? ['children'] : []),
      'className = ""',
      'style = {}',
      '...rest'
    ].join(', ');
  }

  generateStateHooks() {
    if (!this.useEffectConfig) return '';
    const { commandStateVar, stateVarIsList } = this.useEffectConfig;
    const capitalizedVar = this.formatCase(commandStateVar, 'pascal');
    return `
  const [${commandStateVar}, set${capitalizedVar}] = useState(${stateVarIsList ? '[]' : 'null'});
  const [isInitialized, setIsInitialized] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const { execute, isExecuting } = useCommand();`;
  }

  generateEffectHook() {
    if (!this.useEffectConfig) return '';
    const { commandName, commandParams, commandStateVar } = this.useEffectConfig;
    const capitalizedVar = this.formatCase(commandStateVar, 'pascal');
    const paramChecks = commandParams.map(param =>
      `if (!${param}) { setErrorMessage("${this.formatCase(param, 'pascal')} is required"); return; }`
    ).join("\n      ");

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
    };
    init();
    return () => {};
  }, [execute, ${commandParams.join(', ')}]);`;
  }

  generateUseEffectJSX() {
    if (!this.useEffectConfig) return '';
    const { commandStateVar, stateVarIsList, showIsLoading } = this.useEffectConfig;

    const renderData = stateVarIsList
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

    const wrappedData = `
      {/* isInitialized prevents flashing No data message before search is done */}
      {isInitialized && (${commandStateVar} ? (${renderData}) : (
        <p className={styles.error}>No data available</p>
      ))}`;

    const loadingWrapped = showIsLoading
      ? `<LoadingIndicator isLoading={isExecuting} renderDelay={250}>
        ${this.indent(wrappedData, 2)}
      </LoadingIndicator>`
      : wrappedData;

    return `
      {errorMessage && <p className={styles.error}>{errorMessage}</p>}
      ${loadingWrapped}`;
  }

  generateHandlers() {
    const callbacks = this.componentConfig.callbackFunctions || [];
    if (!callbacks.length) return { js: '', jsx: '' };

    const js = callbacks.map(cb => {
      const handler = `handle${this.formatCase(cb, 'pascal')}`;
      return `const ${handler} = () => {
    console.log("notifying parent - ${cb}");
    ${cb}?.("${cb} happened!");
  };`;
    }).join('\n');

    const jsx = callbacks.map(cb => {
      const handler = `handle${this.formatCase(cb, 'pascal')}`;
      return `<button type="button" onClick={${handler}}>Click ${cb}</button>`;
    }).join('\n      ');

    return { js: js ? `\n  ${js}` : '', jsx: jsx ? `\n      ${jsx}` : '' };
  }

  generateChildren() {
    return this.componentConfig.allowsChildren ? '\n      {children}' : '';
  }

  formatCase(str, format) {
    switch (format) {
      case 'camel': return str[0].toLowerCase() + str.slice(1);
      case 'pascal': return str[0].toUpperCase() + str.slice(1);
      case 'kebab': return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
      default: return str;
    }
  }

  indent(str, spaces) {
    const pad = ' '.repeat(spaces);
    return str.split('\n').map(line => pad + line).join('\n');
  }
}

export { ComponentBuilderKevin };
