import {
  FaPhoneAlt,
  FaTelegramPlane,
  FaTiktok,
  FaWeixin,
} from "react-icons/fa";
import { useEffect, useState } from "react";
import iconZalo from "./img/Zalo.svg.png";
import "./ButtonContact.css";
import { toPublicPath } from "../../../utils/publicPath";
import { useCompanyInfo } from "../../../context/CompanyInfoContext";

function sanitizeTel(phone?: string) {
  return (phone ?? "").replace(/\s+/g, "");
}

function normalizeUrl(value?: string) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  const cleanedPath = value.replace(/^\.\//, "").replace(/^\/+/, "");
  return toPublicPath(cleanedPath);
}

function ButtonContact() {
  const { companyInfo: companyContact } = useCompanyInfo();
  const [isCompactOpen, setIsCompactOpen] = useState(false);

  const zaloUrl = companyContact.zalo ?? "";
  const telegramUrl = companyContact.telegram ?? "";
  const tiktokUrl = companyContact.tiktok ?? "";
  const wechatUrl = normalizeUrl(companyContact.wechat);
  const phoneValue = sanitizeTel(companyContact.phone);

  useEffect(() => {
    function closeCompactOnDesktop() {
      if (window.innerWidth > 1024) {
        setIsCompactOpen(false);
      }
    }

    window.addEventListener("resize", closeCompactOnDesktop);
    return () => {
      window.removeEventListener("resize", closeCompactOnDesktop);
    };
  }, []);

  return (
    <div className="contact-fixed">
      <div className="contact-stack" aria-label="Danh sách kênh liên hệ nhanh">
        {zaloUrl && (
          <a
            href={zaloUrl}
            className="contact-btn zalo"
            target="_blank"
            rel="noreferrer"
          >
            <img src={iconZalo} alt="Zalo" />
          </a>
        )}

        {wechatUrl && (
          <a
            href={wechatUrl}
            className="contact-btn wechat"
            target="_blank"
            rel="noreferrer"
            aria-label="WeChat QR"
          >
            <FaWeixin aria-hidden="true" />
          </a>
        )}

        {telegramUrl && (
          <a
            href={telegramUrl}
            className="contact-btn telegram"
            target="_blank"
            rel="noreferrer"
            aria-label="Telegram"
          >
            <FaTelegramPlane aria-hidden="true" />
          </a>
        )}

        {tiktokUrl && (
          <a
            href={tiktokUrl}
            className="contact-btn tiktok"
            target="_blank"
            rel="noreferrer"
            aria-label="TikTok"
          >
            <FaTiktok aria-hidden="true" />
          </a>
        )}

        {phoneValue && (
          <a href={`tel:${phoneValue}`} className="contact-btn phone">
            <span className="phone-ripple phone-ripple--1"></span>
            <span className="phone-ripple phone-ripple--2"></span>
            <FaPhoneAlt aria-hidden="true" />
          </a>
        )}
      </div>

      <div className="contact-compact">
        <button
          type="button"
          className="contact-menu-toggle"
          aria-expanded={isCompactOpen}
          aria-controls="contact-compact-list"
          onClick={() => setIsCompactOpen((prev) => !prev)}
        >
          <FaPhoneAlt aria-hidden="true" />
          <span>Liên hệ tại đây</span>
        </button>

        <div
          id="contact-compact-list"
          className={`contact-compact-list ${isCompactOpen ? "is-open" : ""}`}
        >
          {zaloUrl && (
            <a
              href={zaloUrl}
              className="contact-compact-item"
              target="_blank"
              rel="noreferrer"
              onClick={() => setIsCompactOpen(false)}
            >
              <img src={iconZalo} alt="Zalo" />
              <span>Zalo</span>
            </a>
          )}

          {wechatUrl && (
            <a
              href={wechatUrl}
              className="contact-compact-item"
              target="_blank"
              rel="noreferrer"
              onClick={() => setIsCompactOpen(false)}
            >
              <FaWeixin aria-hidden="true" />
              <span>WeChat</span>
            </a>
          )}

          {telegramUrl && (
            <a
              href={telegramUrl}
              className="contact-compact-item"
              target="_blank"
              rel="noreferrer"
              onClick={() => setIsCompactOpen(false)}
            >
              <FaTelegramPlane aria-hidden="true" />
              <span>Telegram</span>
            </a>
          )}

          {tiktokUrl && (
            <a
              href={tiktokUrl}
              className="contact-compact-item"
              target="_blank"
              rel="noreferrer"
              onClick={() => setIsCompactOpen(false)}
            >
              <FaTiktok aria-hidden="true" />
              <span>TikTok</span>
            </a>
          )}

          {phoneValue && (
            <a
              href={`tel:${phoneValue}`}
              className="contact-compact-item"
              onClick={() => setIsCompactOpen(false)}
            >
              <FaPhoneAlt aria-hidden="true" />
              <span>Gọi ngay</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
export default ButtonContact;
