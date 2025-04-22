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

import { ComponentBuilderKevin } from "./ComponentBuilderKevin";
//import { ComponentBuilder as ComponentBuilderKevin } from "./ComponentBuilderGemini";
//import { ComponentBuilder as ComponentBuilderKevin } from "./ComponentBuilderGPT";
//import { ComponentBuilder as ComponentBuilderKevin } from "./ComponentBuilderGrok";

import * as Utils from "utils/Utils";

import {
  generateComponentFile,
  generateCssFile,
  generateIndexFile,
} from "./ComponentTemplateUtils";

const componentConfig = {
  component: {
    name: "GenericComponent",
    componentName: "GenericComponent",
    componentParams: ["messageId"],
    callbackFunctions: ["onUpdate"],
    hasChildren: true,
    allowsChildren: true,
  },
  useEffectConfig: {
    commandName: "FindMessageCommand",
    commandParams: ["messageId"], // should be a subset of component.parameterList
    commandStateVar: "message",
    showIsLoading: true,
    stateVarIsList: true,
  },
};

//componentConfig.useEffectConfig = null;

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
    stateVarIsList: false,
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
    stateVarIsList,
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
    if (!component) return;

    // Add all component files inside a single directory (component name)
    const componentDir = component.componentFile.directory;
    let zipFileName = componentDir;

    const zip = new JSZip();

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
      saveAs(blob, `${zipFileName}.zip`);
    });
  };

  const buildComponentConfig = () => {
    /*
    const componentConfig = {
  component: {
    name: "GenericComponent",
    componentName: "GenericComponent",
    componentParams: ["messageId"],
    callbackFunctions: ["onUpdate"],
    hasChildren: true,
    allowsChildren: true
  },
  useEffectConfig: {
    commandName: "FindMessageCommand",
    commandParams: ["messageId"],  // should be a subset of component.parameterList
    commandStateVar: "message",
    showIsLoading: true,
    stateVarIsList: true,
  }
};

    componentName,
    hasChildComponents,
    parameterNames,
    callbackFunctions,
    doInitialization,
    commandName,
    stateVariable,
    showLoading,
    commandParams,

    */

    let componentConfig = {
      componentName: formData.componentName,
      componentParams: Utils.parseParamList(formData.parameterNames),
      callbackFunctions: Utils.parseParamList(formData.callbackFunctions),
      allowsChildren: formData.hasChildComponents,
    };

    console.log("componentConfig: ", componentConfig);

    let theComponentConfig = {
      component: componentConfig,
    };

    if (formData.doInitialization) {
      theComponentConfig.useEffectConfig = {
        commandName: formData.commandName,
        commandParams: Utils.parseParamList(formData.commandParams), // should be a subset of component.parameterList
        commandStateVar: formData.stateVariable,
        showIsLoading: formData.showLoading,
        stateVarIsList: formData.stateVarIsList
      };
    }


    theComponentConfig = {
      component: {
        componentName: "NotesList",
        componentParams: ["notesId"],
        callbackFunctions: [], // ["onClick", "onEdit"],
        allowsChildren: true,
      }

      ,
      useEffectConfig: {
        commandName: "FindNotes",
        commandParams: ["notesId"],  // should be a subset of component.parameterList
        commandStateVar: "notesList",
        showIsLoading: false,
        stateVarIsList: true,
      }

    };

    return theComponentConfig;
  };

  const doTestKevin = () => {
    let theComponentConfig = buildComponentConfig();
    console.log("theComponentConfig: ", theComponentConfig);

    let componentName = theComponentConfig.component.componentName;
    const indexFile = generateIndexFile(componentName);
    const cssFile = generateCssFile(componentName);

    // each should return
    // directory: componentName,
    // fileName,
    // content

    // put these in a javascript object and be able to turn into JSON and save and parse again later on
    let componentBuilder = new ComponentBuilderKevin(theComponentConfig);
    let componentFile = componentBuilder.generate();

    setComponent({ indexFile, componentFile, cssFile });
  };

  const combinedClassName = `${styles.componentGenerator} ${className}`;
  /*
  <GenericComponent messageId="abc123" className={styles.content}>
  <p>Here is a child component</p>
  </GenericComponent>
*/
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
              <Column
                width="25%"
                valign="center"
                style={{ paddingTop: "2rem" }}
              >
                <label>
                  <input
                    className={styles.checkbox}
                    type="checkbox"
                    name="stateVarIsList"
                    checked={stateVarIsList}
                    onChange={handleChange}
                  />
                  State variable is a list
                </label>
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

                <button
                  type="button"
                  className="button"
                  onClick={doTestKevin}
                  style={{ marginRight: "1rem" }}
                >
                  Kevin
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
