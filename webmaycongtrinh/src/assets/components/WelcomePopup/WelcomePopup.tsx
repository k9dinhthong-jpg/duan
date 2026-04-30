import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./WelcomePopup.css";

const storageKey = "welcome-popup-last-seen";
const hideDurationMs = 0 * 60 * 60 * 1000;

const sponsors = [
  "Máy Công Trình Đài Soạn",
  "Máy Công Trình Thảo Vân",
  "Công ty Xây Dựng DEF",
  "Công ty Xây Dựng GHI",
];

function shouldShowPopup() {
  try {
    const lastSeenRaw = localStorage.getItem(storageKey);
    if (!lastSeenRaw) return true;

    const lastSeen = Number.parseInt(lastSeenRaw, 10);
    if (Number.isNaN(lastSeen)) return true;

    return Date.now() - lastSeen > hideDurationMs;
  } catch {
    return true;
  }
}

function rememberClosed() {
  try {
    localStorage.setItem(storageKey, String(Date.now()));
  } catch {
    // Ignore storage errors in private mode or restricted browsers.
  }
}

function WelcomePopup() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!shouldShowPopup()) return;

    const timer = window.setTimeout(() => {
      setIsVisible(true);
    }, 350);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  function closePopup() {
    rememberClosed();
    setIsVisible(false);
  }

  if (!isVisible) return null;

  return (
    <div className="welcome-popup-overlay" role="dialog" aria-modal="true">
      <div className="welcome-popup-card">
        <button
          type="button"
          className="welcome-popup-close"
          aria-label="Đóng thông báo"
          onClick={closePopup}
        >
          ×
        </button>

        <p className="welcome-popup-kicker">Chào mừng bạn đến với</p>
        <h2 className="welcome-popup-title">Máy Công Trình Nhập Khẩu</h2>
        <p className="welcome-popup-desc">
          Cập nhật liên tục máy công trình nhập khẩu và dịch vụ hỗ trợ kỹ thuật
          nhanh. Cần tư vấn ngay, đội ngũ của chúng tôi luôn sẵn sàng hỗ trợ.
        </p>

        <div className="welcome-popup-sponsor">
          <strong>Nhà tài trợ:</strong>
          <div className="welcome-popup-sponsors-list">
            {sponsors.map((sponsor, index) => (
              <span key={index} className="welcome-popup-sponsor-item">
                {sponsor}
              </span>
            ))}
          </div>
        </div>

        <div className="welcome-popup-actions">
          <Link
            to="/product"
            className="welcome-popup-btn primary"
            onClick={closePopup}
          >
            Xem sản phẩm
          </Link>
          <Link
            to="/contact"
            className="welcome-popup-btn secondary"
            onClick={closePopup}
          >
            Liên hệ tư vấn
          </Link>
        </div>
      </div>
    </div>
  );
}

export default WelcomePopup;
