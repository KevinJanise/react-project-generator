import * as FormatUtils from "utils/FormatUtils";


export const generateIndexFile = (componentName) => ({
  directory: componentName,
  fileName: "index.js",
  content: `export { ${componentName} } from './${componentName}';`,
});


export const generateCssFile = (name) => {
  const className = FormatUtils.toLowerFirstLetter(name);

  return {
    directory: name,
    fileName: `${name}.module.css`,
    content: `.${className} {\n  /* add CSS */\n}\n\n.error { \n  color: "red";\n}`,
  };
};


export const generateParameterList = (
  hasChildren,
  parameters,
  callbacks = ""
) => {
  const base = ['className = ""', "style = {}", "...rest"];
  const all = [];

  if (hasChildren) all.push("children");
  if (parameters) all.push(parameters);
  if (callbacks) all.push(...callbacks.split(",").map((s) => s.trim()));

  // if (callbacks) all.push(...callbacks.split(",").map(s => {
  // return `${s.trim()} = () => {}`}));

  return [...all, ...base].join(", ");
};

export const generateCallbackHandlers = (callbacks = "") => {
  if (!callbacks.trim()) return "";

  return callbacks
    .split(",")
    .map((cb) => cb.trim())
    .filter(Boolean)
    .map((cb) => {
      const handler = `handle${cb.charAt(0).toUpperCase()}${cb.slice(1)}`;
      return `  const ${handler} = (...args) => {
    // do processing

    ${cb}?.(...args)
  };`;
    })
    .join("\n\n");
};

const generateUseEffect = ({ commandName,  paramNames, stateVar}) => {
  let commandVar = FormatUtils.toLowerFirstLetter(commandName);

  let useEffectImports = `import {${commandName}} from "services/${commandName};`;

  let useEffectStateVariable = `const [${stateVar}, set${FormatUtils.toUpperFirstLetter(stateVar)}] = useState();`;

  let useEffectSourceCode = `
 useEffect(() => {
    async function init() {
      const ${commandVar} = new ${commandName}(${paramNames.join(', ')});
      let result = await execute(${commandVar});
      console.log(result);

      if (result.isCanceled) return;

      if (result.isSuccess) {
        // may need to adjust depending on object returned from command
        set${FormatUtils.toUpperFirstLetter(stateVar)}(result.value);
        console.log(result);
      } else {
        // display error message to user, some type of feedback
        console.log(result.error);
      }
    }

    init();

    return () => {
      // Additional cleanup logic to perform when component unmounts
    };
  }, [execute, ${paramNames.join(', ')}]);
    `;

  return {useEffectImports, useEffectStateVariable, useEffectSourceCode};
};

export const generateUseEffect2 = () => {
  const template = `  useEffect(() => {
     async function init() {
          // Initialization logic, fetching, or subscriptions
    }

    init();

    return () => {
      // Cleanup logic
    };
  }, []);`;

  return template;
};

export const generateCommand = () => {};

export const generateComponentFile = (
  name,
  hasChildren,
  parameters,
  callbacks,
  useEffectConfig,
  showLoading
) => {
  const paramList = generateParameterList(hasChildren, parameters, callbacks);
  const handlers = generateCallbackHandlers(callbacks);
  const className = FormatUtils.toLowerFirstLetter(name);
  const testId = FormatUtils.toKebabCase(name);

  const {useEffectImports, useEffectStateVariable, useEffectSourceCode} = generateUseEffect(useEffectConfig);

  return {
    directory: name,
    fileName: `${name}.jsx`,
    content: `import styles from "./${name}.module.css";

import { useEffect, useState } from 'react';
import { Link } from "react-router";
${showLoading ? 'import {LoadingIndicator} from "components/LoadingIndicator"' : ''}
${useEffectImports}

function ${name}({ ${paramList} }) {
  const combinedClassName = \`\${styles.${className}} \${className}\`;

  ${useEffectStateVariable}

${useEffectSourceCode}

${handlers}

  return (
    <div data-testid="${testId}" className={combinedClassName} style={style} {...rest}>

    <h3>${name} Component</h3>

    ${showLoading ? '<LoadingIndicator isLoading={isExecuting}>\n{${stateVar} && <>' : ''}


          {/* Implement component */}

          {/* Do something with the property */}

          ${hasChildren ? `{children}` : ""}

          <button type="button" onClick={handle${FormatUtils.toUpperFirstLetter(callbacks)}}>Click Me</button>


      ${showLoading ? '\n  </>\n  }\n  </LoadingIndicator>' : ''}
    </div>
  );
}

export { ${name} };
`,
  };
};

