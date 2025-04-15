import  { useState } from 'react';

function GPTComponentGenerator () {
  const [componentName, setComponentName] = useState('');
  const [useStateHook, setUseStateHook] = useState(false);
  const [useEffectHook, setUseEffectHook] = useState(false);
  const [includeCallback, setIncludeCallback] = useState(false);
  const [includeCSS, setIncludeCSS] = useState(true);
  const [includePropTypes, setIncludePropTypes] = useState(true);

  const toKebab = (str) =>
    str && str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

  const generateJSX = () => {
    const comp = componentName || 'MyComponent';
    const imports = [
      `import React${useStateHook || useEffectHook ? ', { ' : ''}${[
        useStateHook ? 'useState' : '',
        useEffectHook ? 'useEffect' : '',
      ]
        .filter(Boolean)
        .join(', ')}${useStateHook || useEffectHook ? ' }' : ''} from 'react';`,
      includePropTypes ? `import PropTypes from 'prop-types';` : '',
      includeCSS ? `import styles from './${comp}.module.css';` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const state = useStateHook
      ? `  const [internalState, setInternalState] = useState(null);\n`
      : '';

    const effect = useEffectHook
      ? `  useEffect(() => {\n    // Initialization logic\n    return () => {\n      // Cleanup\n    };\n  }, []);\n\n`
      : '';

    const callback = includeCallback
      ? `  const handleClick = () => {\n    if (onAction) onAction();\n  };\n\n`
      : '';

    const className = includeCSS
      ? `\`\${styles.container}\${isActive ? ' ' + styles.active : ''}\``
      : `"container"`;

    const render = `  return (\n    <div className=${className}>\n      <h2>${'${title}'}</h2>\n      ${
      includeCallback ? `<button onClick={handleClick}>Do Action</button>` : ''
    }\n    </div>\n  );`;

    const propTypes = includePropTypes
      ? `\n\n${comp}.propTypes = {\n  title: PropTypes.string.isRequired,\n  isActive: PropTypes.bool,\n  ${
          includeCallback ? 'onAction: PropTypes.func,\n' : ''
        }};`
      : '';

    return `${imports}

const ${comp} = ({ title, isActive = false${
      includeCallback ? ', onAction' : ''
    } }) => {
${state}${effect}${callback}${render}
};

${propTypes}

export default ${comp};
`;
  };

  const generateCSS = () => `/* ${componentName || 'MyComponent'}.module.css */\n\n.container {\n  padding: 1rem;\n  border-radius: 8px;\n  background-color: #f9f9f9;\n}\n\n.active {\n  border: 2px solid #007bff;\n}`;

  const generateIndex = () =>
    `export { default } from './${componentName || 'MyComponent'}';`;

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    } catch (err) {
      alert('Copy failed.');
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>React Component Generator</h1>

      <label>
        Component Name:
        <input
          type="text"
          value={componentName}
          onChange={(e) => setComponentName(e.target.value)}
          placeholder="MyComponent"
          style={{ marginLeft: '1rem', width: '200px' }}
        />
      </label>

      <div style={{ margin: '1rem 0' }}>
        <label><input type="checkbox" checked={useStateHook} onChange={() => setUseStateHook(!useStateHook)} /> useState</label><br />
        <label><input type="checkbox" checked={useEffectHook} onChange={() => setUseEffectHook(!useEffectHook)} /> useEffect</label><br />
        <label><input type="checkbox" checked={includeCallback} onChange={() => setIncludeCallback(!includeCallback)} /> Include onAction callback</label><br />
        <label><input type="checkbox" checked={includePropTypes} onChange={() => setIncludePropTypes(!includePropTypes)} /> Include PropTypes</label><br />
        <label><input type="checkbox" checked={includeCSS} onChange={() => setIncludeCSS(!includeCSS)} /> Include CSS Module</label>
      </div>

      <hr />

      <h2>{componentName || 'MyComponent'}.jsx</h2>
      <button onClick={() => copy(generateJSX())}>Copy JSX</button>
      <pre style={{ background: '#eee', padding: '1rem', whiteSpace: 'pre-wrap' }}>{generateJSX()}</pre>

      {includeCSS && (
        <>
          <h2>{componentName || 'MyComponent'}.module.css</h2>
          <button onClick={() => copy(generateCSS())}>Copy CSS</button>
          <pre style={{ background: '#eee', padding: '1rem' }}>{generateCSS()}</pre>
        </>
      )}

      <h2>index.js</h2>
      <button onClick={() => copy(generateIndex())}>Copy index.js</button>
      <pre style={{ background: '#eee', padding: '1rem' }}>{generateIndex()}</pre>
    </div>
  );
};

export {GPTComponentGenerator};
