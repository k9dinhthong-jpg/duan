import { useEffect, useState } from "react";
import iconZalo from "./img/Zalo.svg.png";
import "./ButtonContact.css";
import { toPublicPath } from "../../../utils/publicPath";

type CompanyContactData = {
  phone?: string;
  zalo?: string;
  wechat?: string;
  telegram?: string;
  tiktok?: string;
};

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
  const [companyContact, setCompanyContact] = useState<CompanyContactData>({
    phone: "0966 121 686",
    zalo: "https://zalo.me/0966121686",
    wechat: "#",
    telegram: "https://t.me/sugar88_vn",
    tiktok: "https://www.tiktok.com/@sugar88_vn",
  });

  useEffect(() => {
    async function fetchCompanyContact() {
      try {
        const response = await fetch(
          toPublicPath("data/Company/DataCompany.json"),
        );
        if (!response.ok) return;

        const data = (await response.json()) as CompanyContactData;
        setCompanyContact((prev) => ({
          phone: data.phone?.trim() || prev.phone,
          zalo: data.zalo?.trim() || prev.zalo,
          wechat: data.wechat?.trim() || prev.wechat,
          telegram: data.telegram?.trim() || prev.telegram,
          tiktok: data.tiktok?.trim() || prev.tiktok,
        }));
      } catch {
        // Keep fallback values when loading fails.
      }
    }

    fetchCompanyContact();
  }, []);

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
        <i className="fa-brands fa-weixin"></i>
      </a>

      <a
        href={companyContact.telegram || "#"}
        className="contact-btn telegram"
        target="_blank"
        rel="noreferrer"
        aria-label="Telegram"
      >
        <i className="fa-brands fa-telegram"></i>
      </a>

      <a
        href={companyContact.tiktok || "#"}
        className="contact-btn tiktok"
        target="_blank"
        rel="noreferrer"
        aria-label="TikTok"
      >
        <i className="fa-brands fa-tiktok"></i>
      </a>

      <a
        href={`tel:${sanitizeTel(companyContact.phone)}`}
        className="contact-btn phone"
      >
        <span className="phone-ripple phone-ripple--1"></span>
        <span className="phone-ripple phone-ripple--2"></span>
        <i className="fa-solid fa-phone"></i>
      </a>
    </div>
  );
}
export default ButtonContact;
