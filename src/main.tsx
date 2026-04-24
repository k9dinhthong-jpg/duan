import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./styles/reset.css";
import "./styles/variables.css";
import "./styles/global.css";
import "./styles/breakpoints.css";
import { BrowserRouter, HashRouter } from "react-router-dom";
import ErrorBoundary from "./assets/components/ErrorBoundary/ErrorBoundary";

const useBrowserRouter = import.meta.env.VITE_USE_HASH_ROUTER === "false";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      {useBrowserRouter ? (
        <BrowserRouter>
          <App />
        </BrowserRouter>
      ) : (
        <HashRouter>
          <App />
        </HashRouter>
      )}
    </ErrorBoundary>
  </StrictMode>,
);
