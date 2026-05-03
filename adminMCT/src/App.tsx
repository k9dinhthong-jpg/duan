import { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import Footer from "./assets/components/Footer/Footer.tsx";
import Header from "./assets/components/Header/Header.tsx";
import Home from "./assets/pages/Home/Home.tsx";
import SetCompany from "./assets/pages/Company/SetCompany.tsx";
import Products from "./assets/pages/Products/Products.tsx";
import News from "./assets/pages/News/News.tsx";
import LoginAccount from "./assets/pages/LoginAccount/LoginAccount.tsx";
import { BrandContextProvider } from "./assets/Context/BrandContext/BrandContext.tsx";
import { ProductContextProvider } from "./assets/Context/ProductContext/ProductContext.tsx";
import Setting, {
  SettingAccountPage,
  SettingSecurityPage,
  SettingNotificationPage,
  SettingSystemPage,
  SettingLoginLogPage,
} from "./assets/pages/Setting/Setting.tsx";

type PlaceholderPageProps = {
  title: string;
};

function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <section className="panel">
      <header className="topbar">
        <div>
          <p className="eyebrow">Đang chuẩn bị</p>
          <h1>{title}</h1>
        </div>
      </header>
      <p style={{ margin: 0, color: "var(--color-text-muted)" }}>
        Trang này để riêng cho bạn thiết kế tiếp và gắn route sau.
      </p>
    </section>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminName, setAdminName] = useState("");

  useEffect(() => {
    setIsAuthenticated(localStorage.getItem("adminmct:is-auth") === "1");
    setAdminName(localStorage.getItem("adminmct:admin-name") ?? "");
  }, []);

  if (!isAuthenticated) {
    return (
      <LoginAccount
        onLoginSuccess={(name) => {
          setAdminName(name);
          setIsAuthenticated(true);
        }}
      />
    );
  }

  function handleLogout() {
    localStorage.removeItem("adminmct:is-auth");
    localStorage.removeItem("adminmct:token");
    localStorage.removeItem("adminmct:admin-name");
    setAdminName("");
    setIsAuthenticated(false);
  }

  return (
    <BrandContextProvider>
      <ProductContextProvider>
        <section className="admin-shell">
          <Header onLogout={handleLogout} adminName={adminName} />
          <main className="main">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/company" element={<SetCompany />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<Products />} />
              <Route path="/news" element={<News />} />
              <Route path="/settings" element={<Setting />} />
              <Route
                path="/settings/account"
                element={
                  <SettingAccountPage onAdminNameChange={setAdminName} />
                }
              />
              <Route
                path="/settings/security"
                element={<SettingSecurityPage />}
              />
              <Route
                path="/settings/notifications"
                element={<SettingNotificationPage />}
              />
              <Route path="/settings/system" element={<SettingSystemPage />} />
              <Route
                path="/settings/login-logs"
                element={<SettingLoginLogPage />}
              />
              <Route
                path="/reports"
                element={<PlaceholderPage title="Báo cáo" />}
              />
              <Route
                path="/support"
                element={<PlaceholderPage title="Hỗ trợ" />}
              />
            </Routes>
          </main>
          <Footer />
        </section>
      </ProductContextProvider>
    </BrandContextProvider>
  );
}

export default App;
