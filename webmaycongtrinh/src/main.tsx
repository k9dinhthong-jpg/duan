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
import { MenuBrandProvider } from "./context/MenuBrandContext";
import { MenuServicesProvider } from "./context/MenuServices";
import { MenuIntroductionProvider } from "./context/MenuIntroduction";
import { ListAllProductsProvider } from "./context/ListAllProducts";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <CompanyInfoProvider>
        <IntroCompanyProvider>
          <MenuBrandProvider>
            <ListAllProductsProvider>
              <MenuServicesProvider>
                <MenuIntroductionProvider>
                  <NewsProvider>
                    <BrowserRouter>
                      <App />
                    </BrowserRouter>
                  </NewsProvider>
                </MenuIntroductionProvider>
              </MenuServicesProvider>
            </ListAllProductsProvider>
          </MenuBrandProvider>
        </IntroCompanyProvider>
      </CompanyInfoProvider>
    </ErrorBoundary>
  </StrictMode>,
);
