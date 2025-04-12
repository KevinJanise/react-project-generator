import * as FormatUtils from "utils/FormatUtils";

export const generateIndexFile = (componentName) => ({
  directory: componentName,
  fileName: "index.js",
  content: `export { ${componentName} } from './${componentName}';`,
});

export const generateParameterList = (hasChildren, parameters, callbacks = "") => {
  const base = ['className = ""', 'style = {}', '...rest'];
  const all = [];

  if (hasChildren) all.push("children");
  if (parameters) all.push(parameters);
  if (callbacks) all.push(...callbacks.split(",").map(s => s.trim()));

  return [...all, ...base].join(", ");
};

export const generateCallbackHandlers = (callbacks = "") => {
  if (!callbacks.trim()) return "";

  return callbacks
    .split(",")
    .map(cb => cb.trim())
    .filter(Boolean)
    .map(cb => {
      const handler = `handle${cb.charAt(0).toUpperCase()}${cb.slice(1)}`;
      return (
`  const ${handler} = (...args) => {
    if (typeof ${cb} === "function") {
      ${cb}(...args);
    }
  };`);
    })
    .join("\n\n");
};

export const generateComponentFile = (name, hasChildren, parameters, callbacks) => {
  const paramList = generateParameterList(hasChildren, parameters, callbacks);
  const handlers = generateCallbackHandlers(callbacks);
  const className = FormatUtils.toLowerFirstLetter(name);

  return {
    directory: name,
    fileName: `${name}.jsx`,
    content: `import styles from "./${name}.module.css";
import { Link } from "react-router";

function ${name}({ ${paramList} }) {
  const combinedClassName = \`\${styles.${className}} \${className}\`;

${handlers}

  return (
    <div className={combinedClassName} style={style} {...rest}>
      {/* Implement component */}
      {/* Do something with the property */}${hasChildren ? `\n      {children}` : ""}
    </div>
  );
}

export { ${name} };
`,
  };
};

export const generateCssFile = (name) => {
  const className = FormatUtils.toLowerFirstLetter(name);

  return {
    directory: name,
    fileName: `${name}.module.css`,
    content: `.${className} {\n  /* add CSS */\n}`,
  };
};
