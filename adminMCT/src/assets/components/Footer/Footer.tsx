import { NavLink } from "react-router-dom";
import "./Footer.css";

function Footer() {
  const year = new Date().getFullYear();

  return (
    <section className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="footer-dot" aria-hidden="true"></span>
          <div>
            <p className="footer-name">AdminMCT</p>
            <p className="footer-tagline">Hệ thống quản trị nội bộ</p>
          </div>
        </div>

        <nav className="footer-nav" aria-label="Footer navigation">
          <NavLink to="/" end className="footer-link">
            Tổng quan
          </NavLink>
          <span className="footer-sep" aria-hidden="true"></span>
          <NavLink to="/reports" className="footer-link">
            Báo cáo
          </NavLink>
          <span className="footer-sep" aria-hidden="true"></span>
          <NavLink to="/support" className="footer-link">
            Hỗ trợ
          </NavLink>
          <span className="footer-sep" aria-hidden="true"></span>
          <NavLink to="/settings" className="footer-link">
            Cài đặt
          </NavLink>
        </nav>

        <p className="footer-copy">&copy; {year} MCT. Bảo lưu mọi quyền.</p>
      </div>
    </section>
  );
}

export default Footer;
