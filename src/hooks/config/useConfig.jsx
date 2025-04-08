// useConfig.jsx
import { useContext } from "react";
import { ConfigContext } from "./ConfigContext";

// Hook for React components
const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error("useConfig must be used within a ConfigProvider.");
  }

  return context;
};

export { useConfig };
