import { useState, useEffect } from "react";
import { Config } from "./Config";
import { ConfigContext } from "./ConfigContext";

const DEFAULT_STORAGE_ENGINE = sessionStorage;

const ConfigProvider = ({
  configUrl,
  storageEngine = DEFAULT_STORAGE_ENGINE,
  loadingComponent: Loading = () => <div>Loading...</div>,
  errorComponent: Error = ({ error }) => <div>Error: {error}</div>,
  children,
}) => {
  const [state, setState] = useState({
    config: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const configInstance = Config.getInstance(configUrl, storageEngine);
        await configInstance.initialize();
        setState({
          config: configInstance,
          isLoading: false,
          error: null,
        });
      } catch (err) {
        setState({
          config: null,
          isLoading: false,
          error: err.message,
        });
      }
    };

    loadConfig();
  }, [configUrl, storageEngine]);

  if (state.isLoading) return <Loading />;
  if (state.error) return <Error error={state.error} />;

  return (
    <ConfigContext.Provider value={state.config}>
      {children}
    </ConfigContext.Provider>
  );
};

export { ConfigProvider };
