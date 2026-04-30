import { useEffect, useMemo, useState } from "react";
import "../Setting.css";

type AccountSettingProps = {
  onAdminNameChange: (name: string) => void;
  onUsernameChange: (username: string) => void;
  onPasswordChanged?: () => void;
};

type AccountProfile = {
  name: string;
  username: string;
  email: string;
  phone: string;
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

function AccountSetting({
  onAdminNameChange,
  onUsernameChange,
  onPasswordChanged,
}: AccountSettingProps) {
  const profileFromStorage = useMemo(
    () => readObjectFromStorage<AccountProfile>("adminmct:account-profile"),
    [],
  );

  const [profile, setProfile] = useState<AccountProfile>({
    name:
      profileFromStorage?.name ??
      localStorage.getItem("adminmct:admin-name") ??
      "",
    username: profileFromStorage?.username ?? readUsernameFromToken(),
    email: profileFromStorage?.email ?? "",
    phone: profileFromStorage?.phone ?? "",
  });

  const [profileMessage, setProfileMessage] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordMessage, setPasswordMessage] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProfileFromApi() {
      const token = localStorage.getItem("adminmct:token");
      if (!token) {
        return;
      }

      try {
        const res = await fetch("/api/account/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          return;
        }

        const data = await res.json();

        if (!isMounted) {
          return;
        }

        const nextProfile = {
          name: data.name ?? localStorage.getItem("adminmct:admin-name") ?? "",
          username: data.username ?? readUsernameFromToken(),
          email: data.email ?? "",
          phone: data.phone ?? "",
        };

        setProfile(nextProfile);
        onUsernameChange(nextProfile.username);

        if (nextProfile.name) {
          localStorage.setItem("adminmct:admin-name", nextProfile.name);
          onAdminNameChange(nextProfile.name);
        }
      } catch {
        // Keep local fallback data if API is temporarily unavailable.
      }
    }

    void loadProfileFromApi();

    return () => {
      isMounted = false;
    };
  }, [onAdminNameChange, onUsernameChange]);

  async function handleProfileSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!profile.name.trim()) {
      setProfileMessage("Vui lòng nhập họ và tên.");
      return;
    }

    const token = localStorage.getItem("adminmct:token");
    if (!token) {
      setProfileMessage("Bạn chưa đăng nhập hợp lệ. Vui lòng đăng nhập lại.");
      return;
    }

    setIsSavingProfile(true);
    setProfileMessage("");

    try {
      const res = await fetch("/api/account/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profile.name.trim(),
          email: profile.email.trim(),
          phone: profile.phone.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setProfileMessage(data.message ?? "Không thể lưu thông tin tài khoản.");
        setIsSavingProfile(false);
        return;
      }

      const nextProfile = {
        ...profile,
        name: data.name ?? profile.name.trim(),
        username: data.username ?? profile.username,
        email: data.email ?? profile.email,
        phone: data.phone ?? profile.phone,
      };

      setProfile(nextProfile);
      localStorage.setItem("adminmct:admin-name", nextProfile.name);
      localStorage.setItem(
        "adminmct:account-profile",
        JSON.stringify(nextProfile),
      );
      onAdminNameChange(nextProfile.name);
      onUsernameChange(nextProfile.username);
      setProfileMessage("Đã lưu thông tin tài khoản.");
      setIsSavingProfile(false);
    } catch {
      setProfileMessage("Không kết nối được tới máy chủ.");
      setIsSavingProfile(false);
    }
  }

  async function handlePasswordSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      setPasswordMessage("Vui lòng nhập đầy đủ thông tin mật khẩu.");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordMessage("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage("Xác nhận mật khẩu mới chưa khớp.");
      return;
    }

    const token = localStorage.getItem("adminmct:token");
    if (!token) {
      setPasswordMessage("Bạn chưa đăng nhập hợp lệ. Vui lòng đăng nhập lại.");
      return;
    }

    setIsChangingPassword(true);
    setPasswordMessage("");

    try {
      const res = await fetch("/api/account/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPasswordMessage(data.message ?? "Không thể cập nhật mật khẩu.");
        setIsChangingPassword(false);
        return;
      }

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordMessage("Đã cập nhật mật khẩu thành công.");
      onPasswordChanged?.();
      setIsChangingPassword(false);
    } catch {
      setPasswordMessage("Không kết nối được tới máy chủ.");
      setIsChangingPassword(false);
    }
  }

  return (
    <article className="panel">
      <div className="panel-head setting-head">
        <h2>Tài khoản</h2>
      </div>

      <form className="setting-form" onSubmit={handleProfileSave}>
        <h3 className="setting-subtitle">Thông tin tài khoản đăng nhập</h3>

        <label className="setting-field">
          <span>Họ và tên</span>
          <input
            type="text"
            value={profile.name}
            onChange={(event) =>
              setProfile((prev) => ({ ...prev, name: event.target.value }))
            }
            placeholder="Nhập họ và tên"
          />
        </label>

        <label className="setting-field">
          <span>Tên đăng nhập</span>
          <input type="text" value={profile.username} readOnly />
        </label>

        <label className="setting-field">
          <span>Email liên hệ</span>
          <input
            type="email"
            value={profile.email}
            onChange={(event) =>
              setProfile((prev) => ({ ...prev, email: event.target.value }))
            }
            placeholder="admin@company.com"
          />
        </label>

        <label className="setting-field">
          <span>Số điện thoại</span>
          <input
            type="tel"
            value={profile.phone}
            onChange={(event) =>
              setProfile((prev) => ({ ...prev, phone: event.target.value }))
            }
            placeholder="090..."
          />
        </label>

        <div className="setting-actions">
          <button
            className="primary-btn"
            type="submit"
            disabled={isSavingProfile}
          >
            {isSavingProfile ? "Đang lưu..." : "Lưu thông tin"}
          </button>
        </div>

        {profileMessage ? (
          <p className="setting-message">{profileMessage}</p>
        ) : null}
      </form>

      <div className="setting-divider"></div>

      <form className="setting-form" onSubmit={handlePasswordSave}>
        <h3 className="setting-subtitle">Đổi mật khẩu</h3>

        <label className="setting-field">
          <span>Mật khẩu hiện tại</span>
          <input
            type="password"
            value={passwordForm.currentPassword}
            onChange={(event) =>
              setPasswordForm((prev) => ({
                ...prev,
                currentPassword: event.target.value,
              }))
            }
            placeholder="Nhập mật khẩu hiện tại"
          />
        </label>

        <label className="setting-field">
          <span>Mật khẩu mới</span>
          <input
            type="password"
            value={passwordForm.newPassword}
            onChange={(event) =>
              setPasswordForm((prev) => ({
                ...prev,
                newPassword: event.target.value,
              }))
            }
            placeholder="Nhập mật khẩu mới"
          />
        </label>

        <label className="setting-field">
          <span>Nhập lại mật khẩu mới</span>
          <input
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(event) =>
              setPasswordForm((prev) => ({
                ...prev,
                confirmPassword: event.target.value,
              }))
            }
            placeholder="Xác nhận mật khẩu mới"
          />
        </label>

        <div className="setting-actions">
          <button
            className="primary-btn"
            type="submit"
            disabled={isChangingPassword}
          >
            {isChangingPassword ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
          </button>
        </div>

        {passwordMessage ? (
          <p className="setting-message">{passwordMessage}</p>
        ) : null}
      </form>
    </article>
  );
}

export default AccountSetting;
