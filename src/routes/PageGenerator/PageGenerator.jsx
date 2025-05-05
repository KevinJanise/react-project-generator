import styles from "./PageGenerator.module.css";

import { useState } from "react";

import { Grid, Row, Column } from "components/Grid";
import { LabeledTextInput } from "components/LabeledTextInput";
import { PageSection } from "components/PageSection";
import { PageTitle } from "components/PageTitle";
import { ButtonBar } from "components/ButtonBar";
import { CodeDisplay } from "components/CodeDisplay";

import { useErrorMessages } from "hooks/useErrorMessages";
import { useForm } from "hooks/useForm";

import iconZip from "./icon_zip.svg";

import { PageBuilder } from "./PageBuilder";

import * as FormatUtils from "utils/FormatUtils";
import * as Utils from "utils/Utils";

// have variant, bar, vertical, hamburger
function PageGenerator({
  children,
  propertyName = "default value",
  className = "",
  style = {},
  ...rest
}) {
  const [pageName, setComponentName] = useState("");
  const [pageCode, setPageCode] = useState("");
  const [routerCode, setRouterCode] = useState("");
  const [menuBarCode, setMenuBarCode] = useState("");
  const [indexCode, setIndexCode] = useState("");

  let initialFormState = {
    pageName: "",
    pageTitle: "",
    callbackFunctions: "",
    hasChildComponents: false,
    pathParameterName: "",
    commandName: "",
    commandParams: "",
    commandPropertyName: "",
    stateVarIsList: false,
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

  const formToConfig = (form) => {
    let callbackFunctions = Utils.parseParamList(form.callbackFunctions);

    let coreConfig = {
      componentName: form.pageName,
      pageTitle: form.pageTitle,
      callbackFunctions: callbackFunctions,
      pathParameterName: form.pathParameterName,
    };

    let initConfig = {
      commandName: formData.commandName,
      commandParams: Utils.parseParamList(formData.commandParams), // should be a subset of component.parameterList
      commandStateVar: formData.commandPropertyName,
      showIsLoading: true,
      stateVarIsList: formData.stateVarIsList,
    };

    let config = {};

    config.component = coreConfig;
    if (formData.commandName) {
      config.useEffectConfig = initConfig;
    }

    return config;
  };

  const handleGeneratePage = (event) => {
    event.preventDefault();

    setComponentName(formData.pageName);

    let theComponentConfig = formToConfig(formData);

    let pageBuilder = new PageBuilder(theComponentConfig);
    let componentFile = pageBuilder.generate();
    setPageCode(componentFile);

    setRouterCode(pageBuilder.generateRouterCode(theComponentConfig.component));
    setMenuBarCode(
      pageBuilder.generateMenuBarCode(theComponentConfig.component)
    );
    setIndexCode(pageBuilder.generateIndexCode(theComponentConfig.component));
  };

  const handleClear = () => {
    resetForm();
    setPageCode(null);
  };

  const combinedClassName = `${styles.componentGenerator} ${className}`;

  return (
    <div className={combinedClassName} style={style} {...rest}>
      <PageTitle title="Page Generator" />

      <PageSection>
        <form onSubmit={handleGeneratePage}>
          <PageSection
            title="Basic Info"
            contentStyle={{ paddingTop: ".5rem" }}
          >
            <Grid>
              <Row>
                <Column width="25%">
                  <LabeledTextInput
                    label="Page Name"
                    name="pageName"
                    onBlur={trimValue}
                    placeholder=""
                    onChange={handleChange}
                    value={formData.pageName}
                    type="text"
                    errorMessage={getErrorMessage("pageName")}
                  />
                </Column>

                <Column width="25%">
                  <LabeledTextInput
                    label="Page Title"
                    name="pageTitle"
                    onBlur={trimValue}
                    placeholder=""
                    onChange={handleChange}
                    value={formData.pageTitle}
                    type="text"
                    errorMessage={getErrorMessage("pageTitle")}
                  />
                </Column>
                <Column width="25%">
                  <LabeledTextInput
                    label='Callback Functions'
                    name="callbackFunctions"
                    placeholder="handle..."
                    onBlur={trimValue}
                    onChange={handleChange}
                    value={formData.callbackFunctions}
                    errorMessage={getErrorMessage("callbackFunctions")}
                  />
                </Column>
              </Row>
            </Grid>
          </PageSection>

          <PageSection
            title="Initialization"
            className={styles.pageInitializationSection}
          >
            <Grid>
              <Row>
                <Column width="25%">
                  <LabeledTextInput
                    label="Path Parameter Name"
                    name="pathParameterName"
                    onBlur={trimValue}
                    placeholder=""
                    onChange={handleChange}
                    value={formData.pathParameterName}
                    type="text"
                    errorMessage={getErrorMessage("pathParameterName")}
                  />
                </Column>
              </Row>

              <Row>
                <Column width="25%">
                  <LabeledTextInput
                    label="Command Name"
                    name="commandName"
                    onBlur={trimValue}
                    placeholder=""
                    onChange={handleChange}
                    value={formData.commandName}
                    type="text"
                    errorMessage={getErrorMessage("commandName")}
                  />
                </Column>
                <Column width="25%">
                  <LabeledTextInput
                    label="Command Params"
                    name="commandParams"
                    onBlur={trimValue}
                    onChange={handleChange}
                    value={formData.commandParams}
                    errorMessage={getErrorMessage("commandParams")}
                  />
                </Column>

                <Column width="25%">
                  <LabeledTextInput
                    label="State Variable"
                    name="commandPropertyName"
                    onBlur={trimValue}
                    placeholder=""
                    onChange={handleChange}
                    value={formData.commandPropertyName}
                    type="text"
                    errorMessage={getErrorMessage("commandPropertyName")}
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
                      name="stateVarIsList"
                      checked={formData.stateVarIsList}
                      onChange={handleChange}
                    />
                    State variable is a list
                  </label>
                </Column>
              </Row>
            </Grid>
          </PageSection>

          <ButtonBar style={{ marginTop: "1rem" }}>
            <button
              className="button"
              type="submit"
              style={{ marginRight: "1rem" }}
            >
              Generate Page
            </button>

            <button
              className="button"
              type="button"
              onClick={handleClear}
              style={{ marginRight: "1rem" }}
            >
              Clear
            </button>
          </ButtonBar>
        </form>
      </PageSection>

      {pageCode && (
        <PageSection
          title={`Code for Page - ${pageName}`}
          style={{ marginTop: "1rem" }}
        >
          <img
            src={iconZip}
            className={styles.zipIcon}
            alt="Download .zip file"
          />

          <CodeDisplay title="src/AppRouter.jsx" sourceCode={routerCode} />

          <CodeDisplay
            title="src/components/MenuBar/MenuBar.jsx"
            sourceCode={menuBarCode}
          />

          <CodeDisplay
            title={`src/routes/${pageCode.directory}/${pageCode.fileName}`}
            sourceCode={pageCode.content}
          />

          <CodeDisplay
            title={`src/routes/${pageCode.directory}/index.js`}
            sourceCode={indexCode}
          />

          <CodeDisplay
            title={`src/routes/${pageCode.directory}/${pageCode.directory}.module.css`}
            sourceCode={`.${FormatUtils.toLowerFirstLetter(
              pageCode.directory
            )} {\n   /* add CSS */ \n}`}
          />
        </PageSection>
      )}
    </div>
  );
}

export { PageGenerator };
