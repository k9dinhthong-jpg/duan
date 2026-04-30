import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./styles/reset.css";
import "./styles/variables.css";
import "./styles/global.css";
import "./styles/breakpoints.css";
import { BrowserRouter } from "react-router-dom";
import ErrorBoundary from "./assets/components/ErrorBoundary/ErrorBoundary";
import { CompanyInfoProvider } from "./context/CompanyInfoContext";
import { IntroCompanyProvider } from "./context/IntroCompany";
import { NewsProvider } from "./context/NewsContext";
import { ProductsHitachiProvider } from "./context/ProductsHitachiContext";
import { ProductsKobelcoProvider } from "./context/ProductsKobelcoContext";
import { ProductsKomatsuProvider } from "./context/ProductsKomatsuContext";
import { MenuBrandProvider } from "./context/MenuBrandContext";
import { MenuItemsProvider } from "./context/MenuItemsContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <CompanyInfoProvider>
        <IntroCompanyProvider>
          <ProductsHitachiProvider>
            <ProductsKobelcoProvider>
              <ProductsKomatsuProvider>
                <MenuBrandProvider>
                  <MenuItemsProvider>
                    <NewsProvider>
                      <BrowserRouter>
                        <App />
                      </BrowserRouter>
                    </NewsProvider>
                  </MenuItemsProvider>
                </MenuBrandProvider>
              </ProductsKomatsuProvider>
            </ProductsKobelcoProvider>
          </ProductsHitachiProvider>
        </IntroCompanyProvider>
      </CompanyInfoProvider>
    </ErrorBoundary>
  </StrictMode>,
);
