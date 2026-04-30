import { useEffect, useMemo, useState } from "react";
import "../Setting.css";

type SecuritySettingProps = {
  onSecurityChanged?: () => void;
};

type SecuritySettingState = {
  loginAlert: boolean;
  autoLogoutIdle: boolean;
  maskSensitiveData: boolean;
};

type TwoFactorStatus = {
  enabled: boolean;
  hasPendingSetup: boolean;
};

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

function SecuritySetting({ onSecurityChanged }: SecuritySettingProps) {
  const securityFromStorage = useMemo(
    () =>
      readObjectFromStorage<SecuritySettingState>("adminmct:setting-security"),
    [],
  );

  const [security, setSecurity] = useState<SecuritySettingState>({
    loginAlert: securityFromStorage?.loginAlert ?? true,
    autoLogoutIdle: securityFromStorage?.autoLogoutIdle ?? true,
    maskSensitiveData: securityFromStorage?.maskSensitiveData ?? true,
  });
  const [securityMessage, setSecurityMessage] = useState("");

  const [twoFactorStatus, setTwoFactorStatus] = useState<TwoFactorStatus>({
    enabled: false,
    hasPendingSetup: false,
  });
  const [twoFactorSecret, setTwoFactorSecret] = useState("");
  const [twoFactorOtpUri, setTwoFactorOtpUri] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorDisablePassword, setTwoFactorDisablePassword] = useState("");
  const [twoFactorMessage, setTwoFactorMessage] = useState("");

  function getAccessToken() {
    return localStorage.getItem("adminmct:token") ?? "";
  }

  async function fetchTwoFactorStatus() {
    const token = getAccessToken();
    if (!token) {
      return;
    }

    try {
      const res = await fetch("/api/account/2fa/status", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        return;
      }

      const data = await res.json();
      setTwoFactorStatus({
        enabled: Boolean(data.enabled),
        hasPendingSetup: Boolean(data.hasPendingSetup),
      });
    } catch {
      // Ignore transient read errors.
    }
  }

  useEffect(() => {
    void fetchTwoFactorStatus();
  }, []);

  function handleSecuritySave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    localStorage.setItem("adminmct:setting-security", JSON.stringify(security));
    setSecurityMessage("Đã lưu cài đặt bảo mật.");
  }

  async function handleTwoFactorSetupStart() {
    const token = getAccessToken();
    if (!token) {
      setTwoFactorMessage("Bạn chưa đăng nhập hợp lệ. Vui lòng đăng nhập lại.");
      return;
    }

    setTwoFactorMessage("");

    try {
      const res = await fetch("/api/account/2fa/setup", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) {
        setTwoFactorMessage(data.message ?? "Không tạo được thiết lập 2FA.");
        return;
      }

      setTwoFactorSecret(data.secret ?? "");
      setTwoFactorOtpUri(data.otpauthUrl ?? "");
      setTwoFactorMessage(
        "Đã tạo mã bí mật. Mở app Authenticator để thêm tài khoản.",
      );
      setTwoFactorStatus((prev) => ({ ...prev, hasPendingSetup: true }));
    } catch {
      setTwoFactorMessage("Không kết nối được tới máy chủ.");
    }
  }

  async function handleTwoFactorEnable(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!twoFactorCode.trim()) {
      setTwoFactorMessage("Vui lòng nhập mã xác thực 6 số để kích hoạt 2FA.");
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setTwoFactorMessage("Bạn chưa đăng nhập hợp lệ. Vui lòng đăng nhập lại.");
      return;
    }

    try {
      const res = await fetch("/api/account/2fa/enable", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: twoFactorCode.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setTwoFactorMessage(data.message ?? "Không thể kích hoạt 2FA.");
        return;
      }

      setTwoFactorCode("");
      setTwoFactorSecret("");
      setTwoFactorOtpUri("");
      setTwoFactorMessage("Đã bật xác thực 2 lớp (2FA).");
      setTwoFactorStatus({ enabled: true, hasPendingSetup: false });
      onSecurityChanged?.();
    } catch {
      setTwoFactorMessage("Không kết nối được tới máy chủ.");
    }
  }

  async function handleTwoFactorDisable(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!twoFactorDisablePassword) {
      setTwoFactorMessage("Vui lòng nhập mật khẩu hiện tại để tắt 2FA.");
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setTwoFactorMessage("Bạn chưa đăng nhập hợp lệ. Vui lòng đăng nhập lại.");
      return;
    }

    try {
      const res = await fetch("/api/account/2fa/disable", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword: twoFactorDisablePassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setTwoFactorMessage(data.message ?? "Không thể tắt 2FA.");
        return;
      }

      setTwoFactorDisablePassword("");
      setTwoFactorStatus({ enabled: false, hasPendingSetup: false });
      setTwoFactorMessage("Đã tắt xác thực 2 lớp.");
      onSecurityChanged?.();
    } catch {
      setTwoFactorMessage("Không kết nối được tới máy chủ.");
    }
  }

  const isTwoFactorReadyToEnable =
    twoFactorStatus.hasPendingSetup || twoFactorSecret;

  return (
    <article className="panel">
      <div className="panel-head setting-head">
        <h2>Bảo mật</h2>
      </div>

      <form className="setting-form" onSubmit={handleSecuritySave}>
        <label className="setting-toggle">
          <input
            type="checkbox"
            checked={security.loginAlert}
            onChange={(event) =>
              setSecurity((prev) => ({
                ...prev,
                loginAlert: event.target.checked,
              }))
            }
          />
          <span>Gửi cảnh báo khi có đăng nhập mới</span>
        </label>

        <label className="setting-toggle">
          <input
            type="checkbox"
            checked={security.autoLogoutIdle}
            onChange={(event) =>
              setSecurity((prev) => ({
                ...prev,
                autoLogoutIdle: event.target.checked,
              }))
            }
          />
          <span>Tự đăng xuất khi không hoạt động 30 phút</span>
        </label>

        <label className="setting-toggle">
          <input
            type="checkbox"
            checked={security.maskSensitiveData}
            onChange={(event) =>
              setSecurity((prev) => ({
                ...prev,
                maskSensitiveData: event.target.checked,
              }))
            }
          />
          <span>Ẩn dữ liệu nhạy cảm trong giao diện quản trị</span>
        </label>

        <div className="setting-actions">
          <button className="primary-btn" type="submit">
            Lưu bảo mật
          </button>
        </div>

        {securityMessage ? (
          <p className="setting-message">{securityMessage}</p>
        ) : null}
      </form>

      <div className="setting-divider"></div>

      <div className="setting-form">
        <h3 className="setting-subtitle">Xác thực 2 lớp (2FA)</h3>

        <p className="setting-hint">
          Trạng thái: {twoFactorStatus.enabled ? "Đã bật" : "Chưa bật"}
        </p>

        {twoFactorStatus.enabled ? (
          <form className="setting-form" onSubmit={handleTwoFactorDisable}>
            <label className="setting-field">
              <span>Nhập mật khẩu hiện tại để tắt 2FA</span>
              <input
                type="password"
                value={twoFactorDisablePassword}
                onChange={(event) =>
                  setTwoFactorDisablePassword(event.target.value)
                }
                placeholder="Mật khẩu hiện tại"
              />
            </label>

            <div className="setting-actions">
              <button className="ghost-btn" type="submit">
                Tắt 2FA
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="setting-actions">
              <button
                className="ghost-btn"
                type="button"
                onClick={handleTwoFactorSetupStart}
              >
                {isTwoFactorReadyToEnable ? "Tạo lại mã 2FA" : "Thiết lập 2FA"}
              </button>
            </div>

            {isTwoFactorReadyToEnable ? (
              <form className="setting-form" onSubmit={handleTwoFactorEnable}>
                {twoFactorSecret ? (
                  <p className="setting-hint">
                    Secret key: <strong>{twoFactorSecret}</strong>
                  </p>
                ) : null}

                {twoFactorOtpUri ? (
                  <p className="setting-hint setting-wrap">{twoFactorOtpUri}</p>
                ) : null}

                <label className="setting-field">
                  <span>Nhập mã 6 số từ Google Authenticator</span>
                  <input
                    type="text"
                    value={twoFactorCode}
                    onChange={(event) => setTwoFactorCode(event.target.value)}
                    inputMode="numeric"
                    placeholder="123456"
                  />
                </label>

                <div className="setting-actions">
                  <button className="primary-btn" type="submit">
                    Xác nhận bật 2FA
                  </button>
                </div>
              </form>
            ) : null}
          </>
        )}

        {twoFactorMessage ? (
          <p className="setting-message">{twoFactorMessage}</p>
        ) : null}
      </div>
    </article>
  );
}

export default SecuritySetting;
