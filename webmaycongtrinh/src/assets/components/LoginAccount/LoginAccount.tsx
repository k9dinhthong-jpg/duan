import { useState } from "react";
import {
  FaEnvelope,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaShieldAlt,
} from "react-icons/fa";
import "./LoginAccount.css";

function LoginAccount() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <section className="login-account" aria-labelledby="login-account-title">
      <div className="login-account-shell">
        <div className="login-account-intro">
          <p className="login-account-kicker">Truy cập hệ thống</p>
          <h2 className="login-account-title" id="login-account-title">
            Đăng nhập tài khoản để quản lý thông tin nhanh hơn
          </h2>
          <p className="login-account-text">
            Khu vực đăng nhập giúp bạn theo dõi thông tin liên hệ, cập nhật nhu
            cầu tư vấn và đồng bộ dữ liệu làm việc một cách tập trung.
          </p>

          <ul className="login-account-benefits" aria-label="Lợi ích đăng nhập">
            <li>
              <FaShieldAlt aria-hidden="true" />
              Bảo mật thông tin và tài khoản truy cập rõ ràng.
            </li>
            <li>
              <FaShieldAlt aria-hidden="true" />
              Hỗ trợ lưu lịch sử thao tác và quản lý yêu cầu tư vấn.
            </li>
            <li>
              <FaShieldAlt aria-hidden="true" />
              Phù hợp cho hệ thống quản trị và khách hàng đăng ký tài khoản.
            </li>
          </ul>
        </div>

        <form
          className="login-account-card"
          onSubmit={(event) => event.preventDefault()}
        >
          <div className="login-account-card-head">
            <p className="login-account-card-kicker">Đăng nhập</p>
            <h3>Chào mừng quay trở lại</h3>
            <p>Nhập thông tin tài khoản để tiếp tục sử dụng hệ thống.</p>
          </div>

          <label className="login-account-field">
            <span>Email hoặc tên đăng nhập</span>
            <div className="login-account-input-wrap">
              <FaEnvelope aria-hidden="true" />
              <input
                type="text"
                name="username"
                autoComplete="username"
                placeholder="Nhập email hoặc tên đăng nhập"
              />
            </div>
          </label>

          <label className="login-account-field">
            <span>Mật khẩu</span>
            <div className="login-account-input-wrap is-password">
              <FaLock aria-hidden="true" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                placeholder="Nhập mật khẩu"
              />
              <button
                type="button"
                className="login-account-toggle"
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </label>

          <div className="login-account-actions-row">
            <label className="login-account-check">
              <input type="checkbox" name="remember" />
              <span>Ghi nhớ đăng nhập</span>
            </label>

            <a href="/forgot-password" className="login-account-link">
              Quên mật khẩu?
            </a>
          </div>

          <button type="submit" className="login-account-submit">
            Đăng nhập tài khoản
          </button>

          <p className="login-account-footnote">
            Chưa có tài khoản? <a href="/contact">Liên hệ quản trị viên</a> để
            được cấp quyền truy cập.
          </p>
        </form>
      </div>
    </section>
  );
}

export default LoginAccount;
