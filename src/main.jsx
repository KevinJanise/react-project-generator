// main.jsx
import "assets/css/normalize.css";
import "assets/css/global.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

/*
  <StrictMode>
    <App />
  </StrictMode>
*/

const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
