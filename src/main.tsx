import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./styles/reset.css";
import "./styles/variables.css";
import "./styles/global.css";
import "./styles/breakpoints.css";
import { BrowserRouter, HashRouter } from "react-router-dom";
import ErrorBoundary from "./assets/components/ErrorBoundary/ErrorBoundary";
import { CompanyInfoProvider } from "./assets/context/CompanyInfoContext";
import { NewsProvider } from "./assets/context/NewsContext";
import { ProductsHitachiProvider } from "./assets/context/ProductsHitachi";
import { ProductsKobelcoProvider } from "./assets/context/ProductsKobelco";
import { ProductsKomatsuProvider } from "./assets/context/ProductsKomatsu";

const useBrowserRouter = import.meta.env.VITE_USE_HASH_ROUTER === "false";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <CompanyInfoProvider>
        <ProductsHitachiProvider>
          <ProductsKobelcoProvider>
            <ProductsKomatsuProvider>
              <NewsProvider>
                {useBrowserRouter ? (
                  <BrowserRouter>
                    <App />
                  </BrowserRouter>
                ) : (
                  <HashRouter>
                    <App />
                  </HashRouter>
                )}
              </NewsProvider>
            </ProductsKomatsuProvider>
          </ProductsKobelcoProvider>
        </ProductsHitachiProvider>
      </CompanyInfoProvider>
    </ErrorBoundary>
  </StrictMode>,
);
