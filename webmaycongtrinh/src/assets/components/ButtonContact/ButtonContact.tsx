import {
  FaPhoneAlt,
  FaTelegramPlane,
  FaTiktok,
  FaWeixin,
} from "react-icons/fa";
import iconZalo from "./img/Zalo.svg.png";
import "./ButtonContact.css";
import { toPublicPath } from "../../../utils/publicPath";
import { useCompanyInfo } from "../../context/CompanyInfoContext";

function sanitizeTel(phone?: string) {
  return (phone ?? "").replace(/\s+/g, "");
}

function normalizeUrl(value?: string) {
  if (!value) return "#";
  if (/^https?:\/\//i.test(value)) return value;
  const cleanedPath = value.replace(/^\.\//, "").replace(/^\/+/, "");
  return toPublicPath(cleanedPath);
}

function ButtonContact() {
  const { companyInfo: companyContact } = useCompanyInfo();

  const wechatUrl = normalizeUrl(companyContact.wechat);

  return (
    <div className="contact-fixed">
      <a
        href={companyContact.zalo || "#"}
        className="contact-btn zalo"
        target="_blank"
        rel="noreferrer"
      >
        <img src={iconZalo} alt="Zalo" />
      </a>

      <a
        href={wechatUrl}
        className="contact-btn wechat"
        target="_blank"
        rel="noreferrer"
        aria-label="WeChat QR"
      >
        <FaWeixin aria-hidden="true" />
      </a>

      <a
        href={companyContact.telegram || "#"}
        className="contact-btn telegram"
        target="_blank"
        rel="noreferrer"
        aria-label="Telegram"
      >
        <FaTelegramPlane aria-hidden="true" />
      </a>

      <a
        href={companyContact.tiktok || "#"}
        className="contact-btn tiktok"
        target="_blank"
        rel="noreferrer"
        aria-label="TikTok"
      >
        <FaTiktok aria-hidden="true" />
      </a>

      <a
        href={`tel:${sanitizeTel(companyContact.phone)}`}
        className="contact-btn phone"
      >
        <span className="phone-ripple phone-ripple--1"></span>
        <span className="phone-ripple phone-ripple--2"></span>
        <FaPhoneAlt aria-hidden="true" />
      </a>
    </div>
  );
}
export default ButtonContact;
