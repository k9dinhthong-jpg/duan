import {
  FaAngleRight,
  FaEnvelope,
  FaFacebookF,
  FaGlobe,
  FaInstagram,
  FaMapMarkerAlt,
  FaPhoneAlt,
} from "react-icons/fa";
import { FaTiktok } from "react-icons/fa6";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import "./Footer.css";
import { useCompanyInfo } from "../../../context/CompanyInfoContext";

function ensureHttp(url?: string) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

function sanitizeTel(phone?: string) {
  return (phone ?? "").replace(/\s+/g, "");
}

function Footer() {
  const { companyInfo: companyData } = useCompanyInfo();
  const companyDisplayName = companyData.name.trim();
  const aboutText = companyData.about?.trim() ?? "";
  const officeAddress = companyData.address.trim();
  const phoneNumber = companyData.phone.trim();
  const emailAddress = companyData.email.trim();
  const taxCode = companyData.taxCode.trim();

  const websiteUrl = useMemo(
    () => ensureHttp(companyData.website),
    [companyData.website],
  );
  const currentYear = new Date().getFullYear();
  const foundedYear = Number.parseInt(companyData.establishedYear ?? "", 10);
  const copyrightYears = Number.isNaN(foundedYear)
    ? `${currentYear}`
    : foundedYear < currentYear
      ? `${foundedYear} - ${currentYear}`
      : `${foundedYear}`;
  const socialItems = [
    {
      key: "facebook",
      label: "Facebook",
      href: companyData.facebook,
      icon: <FaFacebookF />,
    },
    {
      key: "instagram",
      label: "Instagram",
      href: companyData.instagram,
      icon: <FaInstagram />,
    },
    {
      key: "tiktok",
      label: "TikTok",
      href: companyData.tiktok,
      icon: <FaTiktok />,
    },
  ].filter((item) => item.href.trim());

  return (
    <div className="site-footer">
      <section className="footer-top">
        <div className="footer-col footer-company">
          {companyDisplayName ? (
            <h3 className="footer-heading">{companyDisplayName}</h3>
          ) : null}
          {aboutText ? <p className="footer-text">{aboutText}</p> : null}
          <ul className="footer-contact-list">
            {officeAddress ? (
              <li>
                <FaMapMarkerAlt />
                <span>{officeAddress}</span>
              </li>
            ) : null}
            {phoneNumber ? (
              <li>
                <FaPhoneAlt />
                <a href={`tel:${sanitizeTel(phoneNumber)}`}>{phoneNumber}</a>
              </li>
            ) : null}
            {emailAddress ? (
              <li>
                <FaEnvelope />
                <a href={`mailto:${emailAddress}`}>{emailAddress}</a>
              </li>
            ) : null}
            {websiteUrl ? (
              <li>
                <FaGlobe />
                <a href={websiteUrl} target="_blank" rel="noreferrer">
                  {companyData.website}
                </a>
              </li>
            ) : null}
            {taxCode ? (
              <li>
                <FaAngleRight />
                <span>MST: {taxCode}</span>
              </li>
            ) : null}
          </ul>
        </div>

        <div className="footer-col">
          <h3 className="footer-heading">Chính Sách</h3>
          <nav aria-label="Chinh sach">
            <ul className="footer-link-list">
              <li>
                <FaAngleRight />
                <Link to="/policy/privacy">Chính sách bảo mật</Link>
              </li>
              <li>
                <FaAngleRight />
                <Link to="/policy/terms">Điều khoản sử dụng</Link>
              </li>
              <li>
                <FaAngleRight />
                <Link to="/policy/warranty">Chính sách bảo hành</Link>
              </li>
              <li>
                <FaAngleRight />
                <Link to="/policy/payment">Chính sách thanh toán</Link>
              </li>
              <li>
                <FaAngleRight />
                <Link to="/policy/shipping">Chính sách vận chuyển</Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="footer-col">
          <h3 className="footer-heading">Danh Mục Sản Phẩm</h3>
          <nav aria-label="Danh muc san pham">
            <ul className="footer-link-list">
              <li>
                <FaAngleRight />
                <a href="#">Máy xúc bánh lốp</a>
              </li>
              <li>
                <FaAngleRight />
                <a href="#">Máy xúc bánh xích</a>
              </li>
              <li>
                <FaAngleRight />
                <a href="#">Máy xúc lật</a>
              </li>
              <li>
                <FaAngleRight />
                <a href="#">Máy ủi</a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="footer-col">
          <h3 className="footer-heading">Kết Nối Với Chúng Tôi</h3>
          <p className="footer-text">
            Theo dõi để cập nhật sản phẩm và ưu đãi mới.
          </p>
          {socialItems.length > 0 ? (
            <nav aria-label="Mang xa hoi">
              <ul className="footer-social-list">
                {socialItems.map((item) => (
                  <li key={item.key}>
                    <a href={item.href} aria-label={item.label}>
                      {item.icon}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </div>
      </section>

      <section className="footer-bottom">
        <small>
          © <time dateTime={`${currentYear}`}>{copyrightYears}</time>{" "}
          {companyData.shortName}. Bảo lưu mọi quyền.
        </small>
      </section>
    </div>
  );
}

export default Footer;
