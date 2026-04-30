import { useState } from "react";
import type { FormEvent } from "react";
import "./LoginAccount.css";
import { loginWithApi } from "../../Context/AccountContext/AccountContext";

type LoginAccountProps = {
  onLoginSuccess: (name: string) => void;
};

type LoginForm = {
  username: string;
  password: string;
  twoFactorCode: string;
};

function LoginAccount({ onLoginSuccess }: LoginAccountProps) {
  const [form, setForm] = useState<LoginForm>({
    username: "",
    password: "",
    twoFactorCode: "",
  });
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.username.trim() || !form.password.trim()) {
      setMessage("Vui lòng nhập tên đăng nhập và mật khẩu.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    const result = await loginWithApi(
      form.username.trim(),
      form.password,
      form.twoFactorCode.trim() || undefined,
    );

    if (
      !result.ok &&
      "requiresTwoFactor" in result &&
      result.requiresTwoFactor
    ) {
      setIsSubmitting(false);
      setRequiresTwoFactor(true);
      setMessage(result.message);
      return;
    }

    if (!result.ok) {
      setIsSubmitting(false);
      setMessage(result.message);
      return;
    }

    localStorage.setItem("adminmct:is-auth", "1");
    localStorage.setItem("adminmct:token", result.token);
    localStorage.setItem("adminmct:admin-name", result.name);
    setIsSubmitting(false);
    onLoginSuccess(result.name);
  }

  return (
    <section className="login-page">
      <div className="login-backdrop" aria-hidden="true"></div>

      <article className="login-card">
        <header className="login-head">
          <p className="login-kicker">Admin MCT</p>
          <h1>Đăng nhập quản trị</h1>
          <p className="login-subtitle">
            Vui lòng đăng nhập để truy cập trang quản trị hệ thống.
          </p>
        </header>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-field">
            <span>Tên đăng nhập</span>
            <input
              type="text"
              value={form.username}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, username: e.target.value }))
              }
              autoComplete="username"
              placeholder="Nhập tên đăng nhập"
            />
          </label>

          <label className="login-field">
            <span>Mật khẩu</span>
            <input
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, password: e.target.value }))
              }
              autoComplete="current-password"
              placeholder="Nhập mật khẩu"
            />
          </label>

          {requiresTwoFactor ? (
            <label className="login-field">
              <span>Mã xác thực 2FA</span>
              <input
                type="text"
                value={form.twoFactorCode}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    twoFactorCode: e.target.value,
                  }))
                }
                placeholder="Nhập mã 6 số"
                inputMode="numeric"
              />
            </label>
          ) : null}

          <button
            className="primary-btn login-btn"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>

          {message ? <p className="login-message">{message}</p> : null}
        </form>
      </article>
    </section>
  );
}

export default LoginAccount;
