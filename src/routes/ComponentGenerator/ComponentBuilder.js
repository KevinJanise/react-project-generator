import * as FormatUtils from "utils/FormatUtils";
/*
const config = {
  component: {
    name: "EditNote",
    parameterList: ["noteId"],
    hasChildren: true,
    hasUseEffect: true
  },
  useEffectConfig: {
    commandName: "FindNoteCommand",
    commandParams: ["noteId"], // subset of component parameterList
    commandStateVar: "note",
    showIsLoading: true
  },
};
*/

class ComponentBuilder {
  constructor(config) {
    this.config = config;
    this.reactImports = [];
    this.importStatementList = [];
    this.componentParameterList = [];
    this.useStateStatementList = [];
  }

  generateParamList() {
    let theParamList = [...this.config.component.parameterList];
    if (this.config.component.hasChildren) {
      theParamList.push("children");
    }
    theParamList.push(`className = ""`);
    theParamList.push("style = {}");
    theParamList.push("...rest");

    return theParamList.join(", ");
  }

  // just the member: useState, useEffect, etc.
  addMemberToReactImport(memberName) {
    this.reactImports.push(memberName);
  }

  generateReactImport() {
    let memberList = this.reactImports.join(", ");
    return `import { ${memberList} } from "react";`
  }

  // Full import statement: import { Grid, Row, Column } from "components/Grid";
  addImportStatement(importStatement) {
    console.log("addImportStatement: " + importStatement);

    this.importStatementList.push("        " + importStatement);
  }

  generateImportStatementSource() {
    console.log(this.importStatementList);
    let temp = this.importStatementList.join('\n');
    console.log(temp);

    return temp;
  };

  // full useState statement: const [theVar, setTheVar] = useState("default value");
  addUseStateStatement(useStateStatement) {
    this.useStateStatementList.push(useStateStatement);
  }

  generateUseStateSource() {
    console.log(this.useStateStatementList);
    let temp = this.useStateStatementList.join('\n');
    console.log(temp);

    return temp;
  }

  generateComponentJSX() {
    let code = null;
    const testId = FormatUtils.toKebabCase(this.config.component.name);

    let childrenSrc = (this.config.component.hasChildren) ? "{children}" : "";

    if (this.config.component.hasUseEffect && this.config.useEffectConfig.showIsLoading) {

      this.addImportStatement(`import {LoadingIndicator} from "components/LoadingIndicator";`);

      code = `
      <div data-testid="${testId}" className={combinedClassName} style={style} {...rest}>
          <LoadingIndicator isLoading={isProcessing} renderDelay={300}>

            {errorMessage && (
                <p className={styles.errorMessage}>{errorMessage}</p>
            )}

            {${this.config.useEffectConfig.commandStateVar} && (
                <p>Var is: {${this.config.useEffectConfig.commandStateVar}}</p>
            )}

            {${this.config.useEffectConfig.commandStateVar} ? (
              <p>Var is: {${this.config.useEffectConfig.commandStateVar}}</p>
            ) : (
              <p>No data available</p>
            )}


            {/* implement component */}
            ${childrenSrc}

          </LoadingIndicator>
       </div>
       `
    } else {
      code = `
      <div data-testid="${testId}" className={combinedClassName} style={style} {...rest}>
          {/* implement component */}
          ${{childrenSrc}}
       </div>
     `;
    }

    return code;
  }

  generateComponent() {
      let component = this.config.component;

      let stylesImportSourceCode = this.generateStylesImport(component.name);

      this.addMemberToReactImport("useState");

      const className = FormatUtils.toLowerFirstLetter(component.name);


      let useEffectSourceCode = "";

      if (component.hasUseEffect) {
        useEffectSourceCode = this.generateUseEffect({...this.config.useEffectConfig});
      }

      // BEGIN GENERATING COMPONENT SOURCE CODE

      let componentParams = this.generateParamList();

      let reactImportSourceCode = this.generateReactImport();

      let useStateSourceCode = this.generateUseStateSource();

      let jsxSourceCode = this.generateComponentJSX();

      console.log(stylesImportSourceCode);

      let importStatementsSourceCode = this.generateImportStatementSource();
      console.log(importStatementsSourceCode);

      let componentSourceCode =
      `
      ${stylesImportSourceCode}

      ${reactImportSourceCode}

      ${importStatementsSourceCode}

      function ${component.name} ({ ${componentParams} }) {

        ${useStateSourceCode}

        ${useEffectSourceCode}

        const combinedClassName = [styles.${className}, className].filter(Boolean).join(" ");
        return (
        ${jsxSourceCode}
        );
    }

      export { ${component.name} };
      `;
      // END GENERATING COMPONENT SOURCE CODE



      return {
        directory: component.name,
        fileName: `${component.name}.jsx`,
        content: componentSourceCode,
      };
  }

  generateStylesImport(componentName) {
    return `import styles from "./${componentName}.module.css";`;
  }


  /*
    commandName: "FindNotesCommand",
    commandParamNames: ["userId", "noteId"],
    commandStateVar: "noteList",
    showIsLoading: true

    commandName: "FindNotesCommand",
    commandParams: ["userId", "noteId"],
    commandStateVar: "noteList",
    showIsLoading: true
  */

  generateUseEffect({commandName, commandParams, commandStateVar}) {
    this.addMemberToReactImport("useEffect");

    this.addImportStatement(`import { useCommand } from "hooks/useCommand";`);
    this.addImportStatement(`import {${commandName}} from "services/${commandName}";`);
    this.addUseStateStatement(`const [${commandStateVar}, set${FormatUtils.toUpperFirstLetter(commandStateVar)}] = useState(null);`);
    this.addUseStateStatement(`const [errorMessage, setErrorMessage] = useState(null);`);

    let commandVar = FormatUtils.toLowerFirstLetter(commandName);

    let sourceCode = `
    const { execute, isProcessing } = useCommand();

      useEffect(() => {
          async function init() {
            if (!${commandParams.join(" && !")}) {
              setErrorMessage("${commandParams.join(", ")} is required");
              return;
            }

            const ${commandVar} = new ${commandName}(${commandParams.join(", ")});
            let result = await execute(${commandVar});

            if (result.isCanceled) return;

            if (result.isSuccess) {
              // TODO: Transform result.value here or in ${commandName} if API response structure differs
              set${FormatUtils.toUpperFirstLetter(commandStateVar)}(result.value);
            } else {
              // TODO: display error message to user, some type of feedback
              setErrorMessage("Error retrieving ${commandStateVar}");
            }
          }

          init();

          return () => {
            // TODO: Additional cleanup logic can be added here
            //       Commands executed with execute() are automatically canceled when component unmounts
          };
        }, [execute, ${commandParams.join(", ")}]);
    `;

    return sourceCode;
  }
}

export { ComponentBuilder };
