import * as FormatUtils from "utils/FormatUtils";

/**
 * Creates React component skeletons with configurable features
 */
class ComponentBuilderClaude {
  constructor(config) {
    this.config = config;
    this.imports = new Set();
    this.reactImports = new Set();
    this.stateDeclarations = [];
  }

  /**
   * Generates the complete component code based on configuration
   */
  build() {
    const { component } = this.config;
    const componentName = component.name;
    const fileName = `${componentName}.jsx`;

    // Add required imports
    this.addImport('styles', `./${componentName}.module.css`);

    // React hooks needed for the component
    if (component.hasUseEffect) {
      this.addReactImport('useEffect');
      this.setupUseEffect();
    }
    this.addReactImport('useState');

    // Build the component code
    const content = this.generateComponentCode();

    return {
      directory: componentName,
      fileName,
      content
    };
  }

  /**
   * Sets up imports and state for useEffect
   */
  setupUseEffect() {
    const { useEffectConfig } = this.config;
    const { commandName, commandParams, commandStateVar } = useEffectConfig;

    // Add necessary imports
    this.addImport('useCommand', 'hooks/useCommand');
    this.addImport(commandName, `services/${commandName}`);

    // Add state for the command result
    const capitalizedStateVar = FormatUtils.toUpperFirstLetter(commandStateVar);
    this.addStateDeclaration(
      commandStateVar,
      `set${capitalizedStateVar}`,
      'null'
    );

    // Add loading state if needed
    if (useEffectConfig.showIsLoading) {
      this.addImport('LoadingIndicator', 'components/LoadingIndicator');
    }
  }

  /**
   * Adds a React import (useState, useEffect, etc.)
   */
  addReactImport(importName) {
    this.reactImports.add(importName);
  }

  /**
   * Adds an import statement to the component
   */
  addImport(importName, source, isDefault = false) {
    this.imports.add(
      isDefault
        ? `import ${importName} from "${source}";`
        : `import { ${importName} } from "${source}";`
    );
  }

  /**
   * Adds a useState declaration
   */
  addStateDeclaration(stateName, setterName, defaultValue) {
    this.stateDeclarations.push(
      `const [${stateName}, ${setterName}] = useState(${defaultValue});`
    );
  }

  /**
   * Generates the component parameter list
   */
  getParamList() {
    const { component } = this.config;
    const params = [...component.parameterList];

    if (component.hasChildren) {
      params.push('children');
    }

    // Add common props
    params.push('className = ""');
    params.push('style = {}');
    params.push('...rest');

    return params.join(', ');
  }

  /**
   * Generates the JSX for the component
   */
  generateJSX() {
    const { component, useEffectConfig } = this.config;
    const testId = FormatUtils.toKebabCase(component.name);

    let jsx = `<div data-testid="${testId}" className={combinedClassName} style={style} {...rest}>`;

    if (component.hasUseEffect && useEffectConfig.showIsLoading) {
      jsx += `
  <LoadingIndicator isLoading={isProcessing} renderDelay={300}>
    {/* Show component content when loaded */}
     ${component.hasChildren ? '{children}' : ''}
  </LoadingIndicator>`;
    } else {
      jsx += `
  {/* Implement component */}
  ${component.hasChildren ? '{children}' : ''}`;
    }

    jsx += `
</div>`;

    return jsx;
  }

  /**
   * Generates useEffect code
   */
  generateUseEffect() {
    const { commandName, commandParams, commandStateVar } = this.config.useEffectConfig;
    const commandVar = FormatUtils.toLowerFirstLetter(commandName);
    const capitalizedStateVar = FormatUtils.toUpperFirstLetter(commandStateVar);

    return `
  // Handle data fetching
  const { execute, cancel, isProcessing } = useCommand();

  useEffect(() => {
    async function init() {
      const ${commandVar} = new ${commandName}(${commandParams.join(', ')});
      const result = await execute(${commandVar});

      if (result.isCanceled) return;

      if (result.isSuccess) {
        set${capitalizedStateVar}(result.value);
      } else {
        console.error('Failed to fetch data:', result.error);
        // TODO: Add error handling
      }
    }

    init();

    return () => {
      cancel();
    };
  }, [execute, ${commandParams.join(', ')}]);`;
  }

  /**
   * Generates the complete component code
   */
  generateComponentCode() {
    const { component } = this.config;
    const className = FormatUtils.toLowerFirstLetter(component.name);

    // Generate import statements
    const reactImportCode = this.reactImports.size > 0
      ? `import { ${Array.from(this.reactImports).join(', ')} } from "react";\n`
      : '';

    const importsCode = Array.from(this.imports).join('\n');

    // Generate useState declarations
    const stateCode = this.stateDeclarations.length > 0
      ? this.stateDeclarations.join('\n  ') + '\n'
      : '';

    // Generate useEffect code if needed
    const useEffectCode = component.hasUseEffect
      ? this.generateUseEffect() + '\n'
      : '';

    // Generate component JSX
    const jsxCode = this.generateJSX();

    return `${reactImportCode}
${importsCode}

const ${component.name} = ({ ${this.getParamList()} }) => {
  ${stateCode}${useEffectCode}
  const combinedClassName = [styles.${className}, className].filter(Boolean).join(" ");

  return (${jsxCode}
  );
};

export { ${component.name} };`;
  }
}

// Example usage:
// const builder = new ComponentBuilder({
//   component: {
//     name: "EditNote",
//     parameterList: ["noteId"],
//     hasChildren: true,
//     hasUseEffect: true
//   },
//   useEffectConfig: {
//     commandName: "FindNoteCommand",
//     commandParams: ["noteId"],
//     commandStateVar: "note",
//     showIsLoading: true
//   }
// });
// const result = builder.build();

export {ComponentBuilderClaude};
