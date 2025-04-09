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
  const [componentCode, setComponentCode] = useState("");

  let initialFormState = { componentName: "" };
  const { formData, resetForm, handleChange, setFormData, trimValue } =
    useForm(initialFormState);

  const {
    addErrorMessage,
    clearErrorMessages,
    getErrorMessage,
    hasFieldSpecificErrors,
    setFocusOnFirstError,
  } = useErrorMessages();

  const handleGenerateComponent = (event) => {
    event.preventDefault();

    let theComponentName = formData.componentName;

    // let componentName = formData.componentName;
    setComponentName(formData.componentName);

    //    let builder = new ComponentBuilder(componentTemplate);
    //  let code = builder.componentName("CodeDisplay").param("name", "default value").state("message", "default").state("other").build();

    console.log("handleGenerateComponent");

    let componentTemplate = `import styles from "./${theComponentName}.module.css";

  import { Link } from "react-router";

  function ${theComponentName}({ children, onStatusUpdate, propertyName = "default value", className = "", style = {}, ...rest }) {
    const combinedClassName = \`\${styles.${FormatUtils.toLowerFirstLetter(
      theComponentName
    )}} \${className}\`;

    const handleStatusUpdate = () => {
        let status = "some value";

        onStatusUpdate(status);
    };

    return (
      <div className={combinedClassName} style={style} {...rest}>
         {/* Implement component */}
         {/*
           Do something with
           the property
         */}

          {children}
      </div>
    );
  }

  export { ${theComponentName} };
      `;

    setComponentCode(componentTemplate);

    console.log(`${theComponentName}.jsx`);
    console.log(componentTemplate);

    console.log("\nindex.js");
    console.log(`export { ${theComponentName} } from './${theComponentName}';`);

    console.log(`\n${theComponentName}.module.css`);
    console.log(`.${FormatUtils.toLowerFirstLetter(theComponentName)} {
  }`);
  };

  const handleClear = () => {
    resetForm();
    setComponentCode(null);
  };

  const combinedClassName = `${styles.componentGenerator} ${className}`;

  // <CodeDisplay title={componentName} code={} />

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
            </Row>
            <Row>
              <Column width="50%">
                <p>
                  Will child components be passed to this component. For
                  example:
                </p>
                <pre>
                  <code>
                    &lt;MyComponent&gt; &lt;p&gt;Here is a child
                    component&lt;/p&gt; &lt;/MyComponent&gt;
                  </code>
                </pre>
              </Column>
            </Row>
          </Grid>

          <Row>
            <Column width="auto" align="left">
              <button
                className="button"
                type="submit"
                style={{ marginRight: "1rem" }}
              >
                Generate Component
              </button>

              <button
                className="button"
                type="button"
                onClick={handleClear}
                style={{ marginRight: "1rem" }}
              >
                Clear
              </button>
            </Column>
          </Row>
        </form>
      </PageSection>

      {componentCode && (
        <PageSection title={`Code for ${componentName} Component`}>
          <img
            src={iconZip}
            className={styles.zipIcon}
            alt="Download .zip file"
          />

          <CodeDisplay
            title={`src/components/${componentName}/${componentName}.jsx`}
            sourceCode={componentCode}
          />

          <CodeDisplay
            title={`src/components/${componentName}/index.js`}
            sourceCode={`export { ${componentName} } from './${componentName}';`}
          />

          <CodeDisplay
            title={`src/components/${componentName}/${componentName}.module.css`}
            sourceCode={`.${FormatUtils.toLowerFirstLetter(
              componentName
            )}\n  {\n     /* add CSS */ \n  }`}
          />
        </PageSection>
      )}
    </div>
  );
}

export { ComponentGenerator };
