import { NavLink } from "react-router-dom";
import "./Header.css";

type HeaderProps = {
  onLogout: () => void;
  adminName: string;
};

type NavItem = {
  label: string;
  to: string;
};

const navItems: NavItem[] = [
  { label: "Tổng quan", to: "/" },
  { label: "Công ty", to: "/company" },
  { label: "Sản phẩm", to: "/products" },
  { label: "Tin tức", to: "/news" },
  { label: "Cài đặt", to: "/settings" },
];

function Header({ onLogout, adminName }: HeaderProps) {
  return (
    <section className="site-header">
      <div className="brand">
        <span className="brand-dot" aria-hidden="true"></span>
        <div className="brand-text">
          <p className="brand-title">AdminMCT</p>
          <p className="brand-subtitle">Bảng điều khiển</p>
        </div>
      </div>

      <nav className="nav-list" aria-label="Điều hướng chính">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `nav-item${isActive ? " is-active" : ""}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="header-storage">
        <span className="storage-label">Tài khoản</span>
        <span className="storage-value">{adminName || "Admin"}</span>
        <button type="button" className="logout-btn" onClick={onLogout}>
          Đăng xuất
        </button>
      </div>
    </section>
  );
}

export default Header;
