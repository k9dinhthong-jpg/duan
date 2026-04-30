import { useEffect, useState } from "react";
import "../Setting.css";

type SecurityLogItem = {
  id: number;
  action: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  meta: Record<string, unknown>;
};

type LoginLogSettingProps = {
  refreshKey?: number;
};

function LoginLogSetting({ refreshKey = 0 }: LoginLogSettingProps) {
  const [securityLogs, setSecurityLogs] = useState<SecurityLogItem[]>([]);

  function getAccessToken() {
    return localStorage.getItem("adminmct:token") ?? "";
  }

  async function fetchSecurityLogs() {
    const token = getAccessToken();
    if (!token) {
      return;
    }

    try {
      const res = await fetch("/api/account/security-logs?limit=30", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        return;
      }

      const data = await res.json();
      setSecurityLogs(Array.isArray(data.items) ? data.items : []);
    } catch {
      // Ignore transient read errors.
    }
  }

  useEffect(() => {
    void fetchSecurityLogs();
  }, [refreshKey]);

  return (
    <article className="panel setting-panel-full">
      <div className="panel-head setting-head">
        <h2>Nhật ký bảo mật</h2>
      </div>

      <div className="setting-log-list">
        {securityLogs.map((log) => (
          <div key={log.id} className="setting-log-item">
            <p className="setting-log-title">{log.action}</p>
            <p className="setting-log-meta">
              {new Date(log.createdAt).toLocaleString("vi-VN")} - IP:{" "}
              {log.ipAddress || "N/A"}
            </p>
            <p className="setting-log-meta">
              Thiết bị: {log.userAgent || "N/A"}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

export default LoginLogSetting;
