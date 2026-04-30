import { Link, NavLink } from "react-router-dom";
import { useMemo, useState } from "react";
import "./Setting.css";
import AccountSetting from "./AccountSetting/AccountSetting";
import SecuritySetting from "./SecuritySetting/SecuritySetting";
import LoginLogSetting from "./LoginLogSetting/LoginLogSetting";
import SystemSetting from "./SystemSetting/SystemSetting";

type SettingAccountPageProps = {
  onAdminNameChange: (name: string) => void;
};

type NotificationSetting = {
  orderAlert: boolean;
  inventoryAlert: boolean;
  weeklyReportEmail: boolean;
};

function readUsernameFromToken(): string {
  const token = localStorage.getItem("adminmct:token");
  if (!token) {
    return "admin";
  }

  try {
    const payload = token.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(window.atob(normalized));
    return typeof json.username === "string" ? json.username : "admin";
  } catch {
    return "admin";
  }
}

function readObjectFromStorage<T>(key: string): Partial<T> | null {
  const raw = localStorage.getItem(key);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Partial<T>;
  } catch {
    return null;
  }
}

const settingSections = [
  {
    title: "Tài khoản",
    description: "Thông tin tài khoản và đổi mật khẩu",
    path: "/settings/account",
  },
  {
    title: "Bảo mật",
    description: "Tùy chọn bảo mật và xác thực 2 lớp (2FA)",
    path: "/settings/security",
  },
  {
    title: "Thông báo quản trị",
    description: "Cài đặt các thông báo trong hệ thống",
    path: "/settings/notifications",
  },
  {
    title: "Hệ thống & phiên làm việc",
    description: "Theo dõi và thu hồi các phiên đăng nhập",
    path: "/settings/system",
  },
  {
    title: "Nhật ký bảo mật",
    description: "Lịch sử đăng nhập và hành động bảo mật",
    path: "/settings/login-logs",
  },
];

function SettingSidebar() {
  return (
    <aside className="panel setting-sidebar" aria-label="Menu cài đặt">
      <p className="setting-sidebar-label">Danh mục</p>

      <NavLink
        to="/settings"
        end
        className={({ isActive }) =>
          `setting-sidebar-link ${isActive ? "is-active" : ""}`
        }
      >
        Tổng quan
      </NavLink>

      {settingSections.map((section) => (
        <NavLink
          key={section.path}
          to={section.path}
          className={({ isActive }) =>
            `setting-sidebar-link ${isActive ? "is-active" : ""}`
          }
        >
          {section.title}
        </NavLink>
      ))}
    </aside>
  );
}

function Setting() {
  return (
    <section className="setting-page">
      <header className="topbar setting-topbar">
        <div>
          <p className="eyebrow">Tài khoản</p>
          <h1>Cài đặt</h1>
          <p className="setting-topbar-description">
            Quản lý tài khoản, bảo mật, phiên đăng nhập và lịch sử hoạt động.
          </p>
        </div>
      </header>

      <section className="setting-shell">
        <SettingSidebar />

        <section className="setting-content">
          <article className="panel setting-overview-panel">
            <div className="panel-head setting-head">
              <h2>Tổng quan cài đặt</h2>
            </div>

            <div className="setting-overview-list">
              {settingSections.map((section) => (
                <div key={section.path} className="setting-overview-item">
                  <div>
                    <p className="setting-overview-title">{section.title}</p>
                    <p className="setting-hint">{section.description}</p>
                  </div>
                  <Link className="ghost-btn" to={section.path}>
                    Mở
                  </Link>
                </div>
              ))}
            </div>
          </article>
        </section>
      </section>
    </section>
  );
}

type SettingSectionPageProps = {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
};

function SettingSectionPage({
  title,
  eyebrow = "Cài đặt",
  children,
}: SettingSectionPageProps) {
  return (
    <section className="setting-page">
      <header className="topbar setting-topbar">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
        </div>
      </header>

      <section className="setting-shell">
        <SettingSidebar />

        <section className="setting-content">
          <nav className="setting-breadcrumb" aria-label="Điều hướng cài đặt">
            <Link className="setting-breadcrumb-link" to="/settings">
              Cài đặt
            </Link>
            <span className="setting-breadcrumb-sep">/</span>
            <span className="setting-breadcrumb-current">{title}</span>
          </nav>

          <section className="setting-grid setting-section-grid">
            {children}
          </section>
        </section>
      </section>
    </section>
  );
}

function NotificationSettingSection() {
  const notificationsFromStorage = useMemo(
    () =>
      readObjectFromStorage<NotificationSetting>(
        "adminmct:setting-notifications",
      ),
    [],
  );

  const [notifications, setNotifications] = useState<NotificationSetting>({
    orderAlert: notificationsFromStorage?.orderAlert ?? true,
    inventoryAlert: notificationsFromStorage?.inventoryAlert ?? true,
    weeklyReportEmail: notificationsFromStorage?.weeklyReportEmail ?? false,
  });
  const [notificationMessage, setNotificationMessage] = useState("");

  function handleNotificationSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    localStorage.setItem(
      "adminmct:setting-notifications",
      JSON.stringify(notifications),
    );
    setNotificationMessage("Đã lưu cài đặt thông báo.");
  }

  return (
    <article className="panel">
      <div className="panel-head setting-head">
        <h2>Thông báo quản trị</h2>
      </div>

      <form className="setting-form" onSubmit={handleNotificationSave}>
        <label className="setting-toggle">
          <input
            type="checkbox"
            checked={notifications.orderAlert}
            onChange={(event) =>
              setNotifications((prev) => ({
                ...prev,
                orderAlert: event.target.checked,
              }))
            }
          />
          <span>Thông báo khi có đơn hàng mới</span>
        </label>

        <label className="setting-toggle">
          <input
            type="checkbox"
            checked={notifications.inventoryAlert}
            onChange={(event) =>
              setNotifications((prev) => ({
                ...prev,
                inventoryAlert: event.target.checked,
              }))
            }
          />
          <span>Thông báo khi tồn kho thấp</span>
        </label>

        <label className="setting-toggle">
          <input
            type="checkbox"
            checked={notifications.weeklyReportEmail}
            onChange={(event) =>
              setNotifications((prev) => ({
                ...prev,
                weeklyReportEmail: event.target.checked,
              }))
            }
          />
          <span>Nhận email báo cáo tổng hợp hàng tuần</span>
        </label>

        <div className="setting-actions">
          <button className="primary-btn" type="submit">
            Lưu thông báo
          </button>
        </div>

        {notificationMessage ? (
          <p className="setting-message">{notificationMessage}</p>
        ) : null}
      </form>
    </article>
  );
}

function SettingAccountPage({ onAdminNameChange }: SettingAccountPageProps) {
  return (
    <SettingSectionPage title="Tài khoản">
      <AccountSetting
        onAdminNameChange={onAdminNameChange}
        onUsernameChange={() => {
          // Username in token is immutable in current backend flow.
        }}
      />
    </SettingSectionPage>
  );
}

function SettingSecurityPage() {
  return (
    <SettingSectionPage title="Bảo mật">
      <SecuritySetting />
    </SettingSectionPage>
  );
}

function SettingNotificationPage() {
  return (
    <SettingSectionPage title="Thông báo quản trị">
      <NotificationSettingSection />
    </SettingSectionPage>
  );
}

function SettingSystemPage() {
  const currentUsername = readUsernameFromToken();

  return (
    <SettingSectionPage title="Hệ thống & phiên làm việc">
      <SystemSetting currentUsername={currentUsername} />
    </SettingSectionPage>
  );
}

function SettingLoginLogPage() {
  return (
    <SettingSectionPage title="Nhật ký bảo mật">
      <LoginLogSetting />
    </SettingSectionPage>
  );
}

export default Setting;
export {
  SettingAccountPage,
  SettingSecurityPage,
  SettingNotificationPage,
  SettingSystemPage,
  SettingLoginLogPage,
};
