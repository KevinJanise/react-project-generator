import "assets/css/global.css";

import {AppRouter} from "./AppRouter";

import { BrowserRouter } from "react-router";

import { ConfigProvider } from "hooks/config";
import { PageLayout } from "components/PageLayout";

const ConfigLoading = () => <div>Loading configuration...</div>;
const ConfigError = (error) => <div>Error loading configuration: {String(error)}</div>;

export default function App() {
  const configUrl = `/dist/config/config.json`;

  console.log("loading config from: " + configUrl);

  return (
    <ConfigProvider configUrl={configUrl} storageEngine={sessionStorage} loadingComponent={ConfigLoading} errorComponent={ConfigError}>
      <BrowserRouter basename={"/"}>
          <PageLayout>
            <AppRouter baseHref={"/"} />
          </PageLayout>
      </BrowserRouter>
    </ConfigProvider>
  );
}
