// https://airbnb.io/javascript/react/

import styles from "./ComponentGenerator.module.css";
import JSZip from "jszip";
import { saveAs } from "file-saver";

import iconZip from "./icon_zip.svg";

import { useState } from "react";
import { Grid, Row, Column } from "components/Grid";
import { LabeledTextInput } from "components/LabeledTextInput";
import { PageSection } from "components/PageSection";
import { PageTitle } from "components/PageTitle";
import { CodeDisplay } from "components/CodeDisplay";

import { useForm } from "hooks/useForm";
import { useErrorMessages } from "hooks/useErrorMessages";

import { ComponentBuilder } from "./ComponentBuilder";

import { ComponentBuilderGrok } from "./ComponentBuilderGrok";

//import { generateComponentCode } from "./ComponentBuilderGPT";

import { ComponentBuilderGPT2 } from "./ComponentBuilderGPT2";
import { ComponentBuilderGemini } from "./ComponentBuilderGemini";
import { ComponentBuilderClaude } from "./ComponentBuilderClaude";
import { ComponentBuilderKevin } from "./ComponentBuilderKevin";


import * as Utils from "utils/Utils";

import {
  generateComponentFile,
  generateCssFile,
  generateIndexFile,
} from "./ComponentTemplateUtils";


const componentConfig = {
  component: {
    name: "NoteDisplay",
    componentName: "NoteDisplay",
    parameterList: ["noteId", "userId", "userName"],
    componentParams: ["noteId", "userId", "userName"],
    hasChildren: true,
    allowsChildren: true
  },
  useEffectConfig: {
    commandName: "FindNoteCommand",
    commandParams: ["noteId", "userId"],  // should be a subset of component.parameterList
    commandStateVar: "note",
    showIsLoading: true,
    stateVarIsList: true,
  }
};

// componentConfig.useEffectConfig = null;


function ComponentGenerator({ className = "", style = {}, ...rest }) {
  const [component, setComponent] = useState(null);

  const initialFormState = {
    componentName: "",
    hasChildComponents: false,
    parameterNames: "",
    callbackFunctions: "",
    doInitialization: false,
    commandName: "",
    commandParams: "",
    stateVariable: "",
    showLoading: false,
  };

  const { formData, resetForm, handleChange, trimValue } =
    useForm(initialFormState);
  const { getErrorMessage } = useErrorMessages();

  const {
    componentName,
    hasChildComponents,
    parameterNames,
    callbackFunctions,
    doInitialization,
    commandName,
    stateVariable,
    showLoading,
    commandParams,
  } = formData;

  let useEffectConfig = {
    commandName: commandName,
    paramNames: Utils.parseParamList(commandParams),
    stateVar: stateVariable,
  };

  const generateComponentPieces = () => {
    const indexFile = generateIndexFile(componentName);

    // put these in a javascript object and be able to turn into JSON and save and parse again later on
    const componentFile = generateComponentFile(
      componentName,
      hasChildComponents,
      parameterNames,
      callbackFunctions,
      useEffectConfig,
      stateVariable,
      showLoading
    );

    const cssFile = generateCssFile(componentName);

    setComponent({ indexFile, componentFile, cssFile });
  };

  const handleGenerateComponent = (event) => {
    event.preventDefault();
    generateComponentPieces();
  };

  const handleClear = () => {
    resetForm();
    setComponent(null);
  };

  // Remove useCallback if no heavy re-renders or optimization needed
  // let zipContent = [{directory, fileContent}, {directory, fileContent}]
  // handleDownloadZip(zipContent);
  const handleDownloadZip = () => {
    if (!component || !componentName) return;

    const zip = new JSZip();

    // Add all component files inside a single directory (component name)
    const componentDir = componentName; // This will create a folder named "EditNote"

    // Add the files (index.js, component.jsx, and .module.css) inside this directory
    zip.file(
      `${componentDir}/${component.indexFile.fileName}`,
      component.indexFile.content
    );
    zip.file(
      `${componentDir}/${component.componentFile.fileName}`,
      component.componentFile.content
    );
    zip.file(
      `${componentDir}/${component.cssFile.fileName}`,
      component.cssFile.content
    );

    // Generate the zip file and trigger download
    zip.generateAsync({ type: "blob" }).then((blob) => {
      saveAs(blob, `${componentName}.zip`);
    });
  };

  const doTest = () => {
    let builder = new ComponentBuilder(componentConfig);
    let componentFile = builder.generateComponent();
    console.log(componentFile);

    let indexFile = "";
    let cssFile = "";

    setComponent({ indexFile, componentFile, cssFile });
  };

  const doTestGemini = () => {
    let bldr = new ComponentBuilderGemini(componentConfig);
    let c = bldr.generate();


     console.log(c);
     // directory: componentName,
     // fileName,
     // content

     setComponent({ indexFile: "", componentFile: c, cssFile: "" });
  };

  const doTestGrok = () => {
    let bldr = new ComponentBuilderGrok(componentConfig);
    let c = bldr.generate();


     console.log(c);
     // directory: componentName,
     // fileName,
     // content

     setComponent({ indexFile: "", componentFile: c, cssFile: "" });
  };

  const doTestGpt = () => {
    // Example usage:

    let bldr = new ComponentBuilderGPT2(componentConfig);
    let c = bldr.generate();


     console.log(c);
     // directory: componentName,
     // fileName,
     // content

     setComponent({ indexFile: "", componentFile: c, cssFile: "" });
  };

  const doTestClaude = () => {
    // Example usage:

    let bldr = new ComponentBuilderClaude(componentConfig);
    let c = bldr.generate();


     console.log(c);
     // directory: componentName,
     // fileName,
     // content

     setComponent({ indexFile: "", componentFile: c, cssFile: "" });
  };

  const doTestKevin = () => {
    // Example usage:

    let componentBuilder = new ComponentBuilderKevin(componentConfig);
    let component = componentBuilder.generate();


     console.log(component);
     // directory: componentName,
     // fileName,
     // content

     setComponent({ indexFile: "", componentFile: component, cssFile: "" });
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
              <Column
                width="50%"
                valign="center"
                style={{ paddingTop: "2rem" }}
              >
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
              <Column
                width="25%"
                valign="center"
                style={{ paddingTop: "2rem" }}
              >
                <label>
                  <input
                    className={styles.checkbox}
                    type="checkbox"
                    name="doInitialization"
                    checked={doInitialization}
                    onChange={handleChange}
                  />
                  Do Initialization
                </label>
              </Column>
              <Column width="25%">
                <LabeledTextInput
                  label="Command Name"
                  name="commandName"
                  onBlur={trimValue}
                  onChange={handleChange}
                  value={commandName}
                  errorMessage={getErrorMessage("commandName")}
                />
              </Column>
              <Column width="25%">
                <LabeledTextInput
                  label="State Variable"
                  name="stateVariable"
                  onBlur={trimValue}
                  onChange={handleChange}
                  value={stateVariable}
                  errorMessage={getErrorMessage("stateVariable")}
                />
              </Column>

              <Column
                width="25%"
                valign="center"
                style={{ paddingTop: "2rem" }}
              >
                <label>
                  <input
                    className={styles.checkbox}
                    type="checkbox"
                    name="showLoading"
                    checked={showLoading}
                    onChange={handleChange}
                  />
                  Show Loading
                </label>
              </Column>
            </Row>

            <Row>
              <Column width="25%">
                <LabeledTextInput
                  label="Command Params"
                  name="commandParams"
                  onBlur={trimValue}
                  onChange={handleChange}
                  value={commandParams}
                  errorMessage={getErrorMessage("commandParams")}
                />
              </Column>
            </Row>

            <Row>
              <Column width="100%" align="left">
                <button
                  type="submit"
                  className="button"
                  style={{ marginRight: "1rem" }}
                >
                  Generate Component
                </button>
                <button
                  type="button"
                  className="button"
                  onClick={handleClear}
                  style={{ marginRight: "1rem" }}
                >
                  Clear
                </button>

                <button type="button" className="button" onClick={doTestKevin} style={{ marginRight: "1rem" }}>
                  Kevin
                </button>


                <button type="button" className="button" onClick={doTest} style={{ marginRight: "1rem" }}>
                  Do Test
                </button>

                <button type="button" className="button" onClick={doTestGemini} style={{ marginRight: "1rem" }}>
                  Gemini
                </button>

                <button type="button" className="button" onClick={doTestGrok} style={{ marginRight: "1rem" }}>
                  Grok
                </button>

                <button type="button" className="button" onClick={doTestClaude} style={{ marginRight: "1rem" }}>
                  Claude
                </button>

                <button type="button" className="button" onClick={doTestGpt} style={{ marginRight: "1rem" }}>
                  GPT
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
            <img
              src={iconZip}
              className={styles.zipIcon}
              alt="Download .zip file"
              onClick={handleDownloadZip}
            />
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
