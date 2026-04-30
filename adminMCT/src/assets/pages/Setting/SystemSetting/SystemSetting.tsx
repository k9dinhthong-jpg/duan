import { useEffect, useState } from "react";
import "../Setting.css";

type SessionItem = {
  id: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  lastSeenAt: string;
  isCurrent: boolean;
};

type SystemSettingProps = {
  currentUsername: string;
  refreshKey?: number;
  onSessionsChanged?: () => void;
};

function SystemSetting({
  currentUsername,
  refreshKey = 0,
  onSessionsChanged,
}: SystemSettingProps) {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [sessionsMessage, setSessionsMessage] = useState("");

  function getAccessToken() {
    return localStorage.getItem("adminmct:token") ?? "";
  }

  async function fetchSessions() {
    const token = getAccessToken();
    if (!token) {
      return;
    }

    try {
      const res = await fetch("/api/account/sessions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        return;
      }

      const data = await res.json();
      setSessions(Array.isArray(data.items) ? data.items : []);
    } catch {
      // Ignore transient read errors.
    }
  }

  useEffect(() => {
    void fetchSessions();
  }, [refreshKey]);

  async function handleRevokeSession(sessionId: string) {
    const token = getAccessToken();
    if (!token) {
      setSessionsMessage("Bạn chưa đăng nhập hợp lệ. Vui lòng đăng nhập lại.");
      return;
    }

    try {
      const res = await fetch(`/api/account/sessions/${sessionId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setSessionsMessage(data.message ?? "Không thể thu hồi phiên.");
        return;
      }

      setSessionsMessage("Đã thu hồi phiên đăng nhập.");
      void fetchSessions();
      onSessionsChanged?.();
    } catch {
      setSessionsMessage("Không kết nối được tới máy chủ.");
    }
  }

  async function handleRevokeOtherSessions() {
    const token = getAccessToken();
    if (!token) {
      setSessionsMessage("Bạn chưa đăng nhập hợp lệ. Vui lòng đăng nhập lại.");
      return;
    }

    try {
      const res = await fetch("/api/account/sessions/revoke-others", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setSessionsMessage(data.message ?? "Không thể thu hồi các phiên khác.");
        return;
      }

      setSessionsMessage("Đã thu hồi tất cả phiên khác.");
      void fetchSessions();
      onSessionsChanged?.();
    } catch {
      setSessionsMessage("Không kết nối được tới máy chủ.");
    }
  }

  return (
    <article className="panel setting-panel-full">
      <div className="panel-head setting-head">
        <h2>Hệ thống & phiên làm việc</h2>
        <button
          className="ghost-btn"
          type="button"
          onClick={handleRevokeOtherSessions}
        >
          Thu hồi phiên khác
        </button>
      </div>

      <div className="setting-system-grid">
        <div>
          <p className="setting-system-label">Tài khoản hiện tại</p>
          <strong>{currentUsername}</strong>
        </div>

        <div>
          <p className="setting-system-label">Vai trò</p>
          <strong>Admin</strong>
        </div>

        <div>
          <p className="setting-system-label">Token đăng nhập</p>
          <strong>
            {localStorage.getItem("adminmct:token")
              ? "Đang hoạt động"
              : "Không có"}
          </strong>
        </div>

        <div>
          <p className="setting-system-label">API Endpoint</p>
          <strong>/api</strong>
        </div>
      </div>

      <div className="setting-divider"></div>

      <div className="setting-session-list">
        {sessions.map((session) => (
          <div key={session.id} className="setting-session-item">
            <div>
              <p className="setting-session-title">
                {session.isCurrent ? "Phiên hiện tại" : "Phiên đăng nhập"}
              </p>
              <p className="setting-session-meta">
                IP: {session.ipAddress || "N/A"}
              </p>
              <p className="setting-session-meta">
                Thiết bị: {session.userAgent || "N/A"}
              </p>
              <p className="setting-session-meta">
                Tạo lúc: {new Date(session.createdAt).toLocaleString("vi-VN")}
              </p>
              <p className="setting-session-meta">
                Hoạt động gần nhất:{" "}
                {new Date(session.lastSeenAt).toLocaleString("vi-VN")}
              </p>
            </div>

            {!session.isCurrent ? (
              <button
                className="ghost-btn"
                type="button"
                onClick={() => void handleRevokeSession(session.id)}
              >
                Thu hồi
              </button>
            ) : null}
          </div>
        ))}
      </div>

      {sessionsMessage ? (
        <p className="setting-message">{sessionsMessage}</p>
      ) : null}
    </article>
  );
}

export default SystemSetting;
