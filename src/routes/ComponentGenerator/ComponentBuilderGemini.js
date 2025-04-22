class ComponentBuilder {
  constructor(config) {
    this.config = config;
    // Keep direct access for clarity within methods if needed
    this.componentConfig = config.component;
    this.useEffectConfig = config.useEffectConfig;
  }

  // --- Utility Methods (Keep these as they are useful and self-contained) ---
  _toLowerFirstLetter(str) {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }

  _toUpperFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  _toKebabCase(str) {
    // Added check for null/undefined input
    return str ? str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase() : '';
  }

  // --- Code Generation Helpers ---

  _buildImports() {
    const { componentName } = this.componentConfig;
    const imports = [`import styles from "./${componentName}.module.css";`];

    if (this.useEffectConfig) {
      const { commandName, showIsLoading } = this.useEffectConfig;
      imports.push('import { useState, useEffect } from "react";');
      imports.push('import { useCommand } from "hooks/useCommand";');
      imports.push(`import { ${commandName} } from "services/${commandName}";`);
      if (showIsLoading) {
        imports.push('import { LoadingIndicator } from "components/LoadingIndicator";');
      }
    }
    return imports.join("\n");
  }

  _buildComponentParams() {
    const { componentParams = [], allowsChildren } = this.componentConfig;
    const params = [...componentParams];

    if (allowsChildren) {
      params.push("children");
    }
    // Add standard props
    params.push('className = ""', "style = {}", "...rest");

    return params.join(", ");
  }

  _buildEffectLogic() {
    if (!this.useEffectConfig) {
      return { stateHooks: "", effectHook: "", effectJsx: "" };
    }

    const {
      commandName,
      commandParams = [],
      commandStateVar,
      stateVarIsList = false,
      showIsLoading = false,
    } = this.useEffectConfig;

    const stateSetterName = `set${this._toUpperFirstLetter(commandStateVar)}`;

    // 1. State Hooks
    const stateHooks = `
  const [${commandStateVar}, ${stateSetterName}] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const { execute, isExecuting } = useCommand();
    `.trim();

    // 2. Effect Hook
    const dependencyList = ["execute", ...commandParams].join(", ");
    const paramChecks = commandParams
      .map(p => `if (!${p}) { console.warn("${this._toUpperFirstLetter(p)} is required for ${commandName}"); return; }`) // Changed to console.warn, setting error message here might be premature
      .join("\n    ");

    const effectHook = `
  useEffect(() => {
    async function fetchData() {
      // Reset state on new fetch trigger
      setErrorMessage(null);
      // ${stateSetterName}(null); // Optional: Reset data state too

      ${paramChecks} // Check if essential params are present

      const command = new ${commandName}(${commandParams.join(", ")});
      const result = await execute(command);

      if (result.isCanceled) return;

      if (result.isSuccess) {
        ${stateSetterName}(result.value);
      } else {
        // Consider more specific error messages if available from result
        setErrorMessage("Error retrieving data");
        console.error("Command execution failed:", result.error); // Log error details
      }
    }

    fetchData();

    // Cleanup function (optional, e.g., for aborting requests)
    // return () => { };
  }, [${dependencyList}]); // Dependencies trigger refetch
    `.trim();


    // 3. Effect JSX Output
    let resultJsx;
    if (stateVarIsList) {
      resultJsx = `
        <ul>
          {${commandStateVar}?.map((item, index) => (
            <li key={item?.id ?? index}>{/* TODO: Replace with relevant item property */} {JSON.stringify(item)}</li>
          ))}
        </ul>
        {!${commandStateVar}?.length && <p>No items found.</p>}
      `;
    } else {
        resultJsx = `
        <p>Data: {JSON.stringify(${commandStateVar})}</p>
      `;
    }

    // Wrap with conditional rendering based on data/error state
    let effectJsx = `
      {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
      {!errorMessage && ${commandStateVar} !== null && (
        <>
          ${resultJsx.trim()}
        </>
      )}
      {!errorMessage && ${commandStateVar} === null && !isExecuting && <p>No data available.</p>}
    `; // Added check for initial load state


    // Wrap with LoadingIndicator if configured
    if (showIsLoading) {
      // Note: LoadingIndicator needs to handle the `isExecuting` state internally or be passed explicitly
      // Assuming LoadingIndicator takes an `isLoading` prop
      effectJsx = `
      <LoadingIndicator isLoading={isExecuting} renderDelay={250}>
        ${effectJsx.trim()}
      </LoadingIndicator>
      `;
    }

    return {
      stateHooks,
      effectHook,
      effectJsx: effectJsx.trim(), // Trim the final JSX string
    };
  }


  generate() {
    const { componentName, allowsChildren } = this.componentConfig;
    const cssClass = this._toLowerFirstLetter(componentName);
    const testId = this._toKebabCase(componentName);

    const importStatements = this._buildImports();
    const componentParams = this._buildComponentParams();
    const { stateHooks, effectHook, effectJsx } = this._buildEffectLogic();

    // Optional children placeholder
    const childrenJsx = allowsChildren ? "{children}" : "{/* This component does not render children */}";

    const componentSourceCode = `
${importStatements}

function ${componentName}({ ${componentParams} }) {
  ${stateHooks ? stateHooks + '\n' : ''}
  ${effectHook ? effectHook + '\n' : ''}
  // Combine className prop with component-specific styles
  const combinedClassName = [styles.${cssClass}, className].filter(Boolean).join(" ");

  return (
    <div data-testid="${testId}" className={combinedClassName} style={style} {...rest}>
      {/* Component Content Start */}

      ${effectJsx ? effectJsx + '\n' : ''}
      ${childrenJsx}

      {/* Component Content End */}
    </div>
  );
}

export { ${componentName} };
    `.trim() + '\n'; // Add trailing newline for POSIX compatibility

    return {
      directory: componentName,
      fileName: `${componentName}.jsx`,
      content: componentSourceCode,
    };
  }
}

export { ComponentBuilder };
