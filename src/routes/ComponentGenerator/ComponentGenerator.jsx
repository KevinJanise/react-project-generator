import styles from "./ComponentGenerator.module.css";
import iconZip from "./icon_zip.svg";

import { useState, useCallback } from "react";
import { Grid, Row, Column } from "components/Grid";
import { LabeledTextInput } from "components/LabeledTextInput";
import { PageSection } from "components/PageSection";
import { PageTitle } from "components/PageTitle";
import { CodeDisplay } from "components/CodeDisplay";

import { useForm } from "hooks/useForm";
import { useErrorMessages } from "hooks/useErrorMessages";
import {
  generateComponentFile,
  generateCssFile,
  generateIndexFile,
} from "./ComponentTemplateUtils";

function ComponentGenerator({ className = "", style = {}, ...rest }) {
  const [component, setComponent] = useState(null);

  const initialFormState = {
    componentName: "",
    hasChildComponents: false,
    parameterNames: "",
    callbackFunctions: "",
  };

  const { formData, resetForm, handleChange, trimValue } = useForm(initialFormState);
  const { getErrorMessage } = useErrorMessages();

  const {
    componentName,
    hasChildComponents,
    parameterNames,
    callbackFunctions,
  } = formData;

  const generateComponentPieces = useCallback(() => {
    const indexFile = generateIndexFile(componentName);
    const componentFile = generateComponentFile(componentName, hasChildComponents, parameterNames, callbackFunctions);
    const cssFile = generateCssFile(componentName);

    setComponent({ indexFile, componentFile, cssFile });
  }, [componentName, hasChildComponents, parameterNames, callbackFunctions]);

  const handleGenerateComponent = (event) => {
    event.preventDefault();
    generateComponentPieces();
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
                  onChange={handleChange}
                  value={componentName}
                  errorMessage={getErrorMessage("componentName")}
                />
              </Column>
              <Column width="25%">
                <LabeledTextInput
                  label="Parameter Names"
                  name="parameterNames"
                  onBlur={trimValue}
                  onChange={handleChange}
                  value={parameterNames}
                  errorMessage={getErrorMessage("parameterNames")}
                />
              </Column>
              <Column width="25%">
                <LabeledTextInput
                  label='Callback Functions ("on???")'
                  name="callbackFunctions"
                  onBlur={trimValue}
                  onChange={handleChange}
                  value={callbackFunctions}
                  errorMessage={getErrorMessage("callbackFunctions")}
                />
              </Column>
            </Row>
            <Row>
              <Column width="50%" valign="center" style={{ paddingTop: "2rem" }}>
                <label>
                  <input
                    className={styles.checkbox}
                    type="checkbox"
                    name="hasChildComponents"
                    checked={hasChildComponents}
                    onChange={handleChange}
                  />
                  Can have child components
                </label>
              </Column>
            </Row>
            <Row>
              <Column width="50%" align="left">
                <button type="submit" className="button" style={{ marginRight: "1rem" }}>
                  Generate Component
                </button>
                <button type="button" className="button" onClick={handleClear}>
                  Clear
                </button>
              </Column>
            </Row>
          </Grid>
        </form>
      </PageSection>

      {component && (
        <PageSection title={`Code for ${componentName} Component`}>
          <span style={{ marginLeft: "1rem" }}>
            Download all files in one zip file. Unzip in /src/components{" "}
            <img src={iconZip} className={styles.zipIcon} alt="Download .zip file" />
          </span>

          {["indexFile", "cssFile", "componentFile"].map((type) => (
            <CodeDisplay
              key={type}
              title={`src/components/${component[type].directory}/${component[type].fileName}`}
              sourceCode={component[type].content}
            />
          ))}
        </PageSection>
      )}
    </div>
  );
}

export { ComponentGenerator };
