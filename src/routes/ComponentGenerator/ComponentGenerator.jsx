import styles from "./ComponentGenerator.module.css";

import { useState } from "react";

import { Grid, Row, Column } from "components/Grid";
import { LabeledTextInput } from "components/LabeledTextInput";
import { PageSection } from "components/PageSection";
import { PageTitle } from "components/PageTitle";
import { CodeDisplay } from "components/CodeDisplay";

import { useErrorMessages } from "hooks/useErrorMessages";
import { useForm } from "hooks/useForm";

import iconZip from "./icon_zip.svg";

import * as FormatUtils from "utils/FormatUtils";

// have variant, bar, vertical, hamburger
function ComponentGenerator({
  children,
  propertyName = "default value",
  className = "",
  style = {},
  ...rest
}) {
  const [componentName, setComponentName] = useState("");
  const [component, setComponent] = useState();

  let initialFormState = {
    componentName: "",
    hasChildComponents: false,
    parameterNames: "",
    callbackFunctions: ""
  };
  const { formData, resetForm, handleChange, setFormData, trimValue } =
    useForm(initialFormState);

  const {
    addErrorMessage,
    clearErrorMessages,
    getErrorMessage,
    hasFieldSpecificErrors,
    setFocusOnFirstError,
  } = useErrorMessages();

  // Have an assembler who knows where the different pieces go
  const assemble = (indexFile, componentFile, cssFile) => {
    let componentParts = { indexFile, componentFile, cssFile };

    console.log(componentParts);

    setComponent(componentParts);
  };

  const generateIndexFile = (componentName) => ({
    directory: componentName,
    fileName: "index.js",
    content: `export { ${componentName} } from './${componentName}';`,
  });

  const generateParameterList = (hasChildComponents, parameterNames, callbackFunctions = "") => {
    const baseParams = ['className = ""', 'style = {}', '...rest'];
    const allParams = [];

    if (hasChildComponents) allParams.push("children");
    if (parameterNames) allParams.push(parameterNames);
    if (callbackFunctions) {
      allParams.push(...callbackFunctions.split(",").map(s => s.trim()));
    }

    return [...allParams, ...baseParams].join(", ");
  };

  const generateCallbackHandlers = (callbackFunctions = "") => {
    if (!callbackFunctions) return "";

    return callbackFunctions
      .split(",")
      .map(fn => fn.trim())
      .filter(fn => fn) // remove empty entries
      .map(fn => {
        const handlerName = `handle${fn.charAt(0).toUpperCase()}${fn.slice(1)}`;
        return `
    const ${handlerName} = (...args) => {
      if (typeof ${fn} === "function") {
        ${fn}(...args);
      }
    };`;
      })
      .join("\n");
  };

  const generateComponentFile = (
    componentName,
    hasChildComponents,
    parameterNames,
    callbackFunctions = ""
  ) => {
    const parameterList = generateParameterList(hasChildComponents, parameterNames, callbackFunctions);
    const className = FormatUtils.toLowerFirstLetter(componentName);
    const directory = componentName;
    const fileName = `${componentName}.jsx`;

    const childrenBlock = hasChildComponents ? `\n      {children}` : "";
    const callbackHandlers = generateCallbackHandlers(callbackFunctions);

    const sourceCode = `import styles from "./${componentName}.module.css";
  import { Link } from "react-router";

  function ${componentName}({ ${parameterList} }) {
    const combinedClassName = \`\${styles.${className}} \${className}\`;

    ${callbackHandlers}

    return (
      <div className={combinedClassName} style={style} {...rest}>
        {/* Implement component */}
        {/* Do something with the property */}${childrenBlock}
      </div>
    );
  }

  export { ${componentName} };
  `;

    return { directory, fileName, content: sourceCode };
  };

  const generateCssFile = (componentName) => {
    const className = FormatUtils.toLowerFirstLetter(componentName);

    return {
      directory: componentName,
      fileName: `${componentName}.module.css`,
      content: `.${className} {\n    /* add CSS */\n  }`,
    };
  };

  const generateComponentPieces = (
    componentName,
    hasChildComponents,
    parameterNames, callbackFunctions
  ) => {
    let indexFile = generateIndexFile(componentName);
    let componentFile = generateComponentFile(
      componentName,
      hasChildComponents,
      parameterNames, callbackFunctions
    );
    let cssFile = generateCssFile(componentName);

    assemble(indexFile, componentFile, cssFile);
  };

  const handleGenerateComponent = (event) => {
    event.preventDefault();

    let componentName = formData.componentName;
    let hasChildComponents = formData.hasChildComponents;
    let parameterNames = formData.parameterNames;
    let callbackFunctions = formData.callbackFunctions;

    generateComponentPieces(componentName, hasChildComponents, parameterNames, callbackFunctions);
  };

  const handleClear = () => {
    resetForm();
    setComponent(null);
  };

  const combinedClassName = `${styles.componentGenerator} ${className}`;

  return (
    <div className={combinedClassName} style={style} {...rest}>
      <PageTitle title="Component Generator" />

      <PageSection>
        <form onSubmit={handleGenerateComponent}>
          <Grid>
            <Row>
              <Column width="25%">
                <LabeledTextInput
                  label="Component Name"
                  name="componentName"
                  onBlur={trimValue}
                  placeholder=""
                  onChange={handleChange}
                  value={formData.componentName}
                  type="text"
                  errorMessage={getErrorMessage("componentName")}
                />
              </Column>
              <Column width="25%">
                <LabeledTextInput
                  label="Parameter Names"
                  name="parameterNames"
                  onBlur={trimValue}
                  placeholder=""
                  onChange={handleChange}
                  value={formData.parameterNames}
                  type="text"
                  errorMessage={getErrorMessage("parameterNames")}
                />
              </Column>
              <Column width="25%">
                <LabeledTextInput
                  label={`Callback Functions ("on???")`}
                  name="callbackFunctions"
                  onBlur={trimValue}
                  placeholder=""
                  onChange={handleChange}
                  value={formData.callbackFunctions}
                  type="text"
                  errorMessage={getErrorMessage("callbackFunctions")}
                />
              </Column>
            </Row>
            <Row>
              <Column
                width="50%"
                valign="center"
                style={{ paddingTop: "2rem" }}
              >
                <div>
                  <input
                    className={styles.checkbox}
                    id="hasChildComponents"
                    type="checkbox"
                    onChange={handleChange}
                    name="hasChildComponents"
                    checked={formData.hasChildComponents}
                  />
                  <label htmlFor="hasChildComponents">
                    Can have child components
                  </label>
                </div>
              </Column>
            </Row>
          </Grid>

          <Row>
            <Column width="50%" align="left">
              <button
                className="button"
                type="submit"
                style={{ marginRight: "1rem", width: "auto" }}
              >
                Generate Component
              </button>

              <button
                className="button"
                type="button"
                onClick={handleClear}
                style={{ marginRight: "1rem", width: "auto" }}
              >
                Clear
              </button>
            </Column>
          </Row>
        </form>
      </PageSection>

      {component && (
        <PageSection title={`Code for ${componentName} Component`}>
          <span style={{ marginLeft: "1rem" }}>
            Download all files in one zip file. Unzip in /src/components{" "}
            <img
              src={iconZip}
              className={styles.zipIcon}
              alt="Download .zip file"
            />
          </span>

          <CodeDisplay
            title={`src/components/${component.indexFile.directory}/${component.indexFile.fileName}`}
            sourceCode={component.indexFile.content}
          />

          <CodeDisplay
            title={`src/components/${component.cssFile.directory}/${component.cssFile.fileName}`}
            sourceCode={component.cssFile.content}
          />

          <CodeDisplay
            title={`src/components/${component.componentFile.directory}/${component.componentFile.fileName}`}
            sourceCode={component.componentFile.content}
          />
        </PageSection>
      )}
    </div>
  );
}

export { ComponentGenerator };
