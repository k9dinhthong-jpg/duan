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
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./Footer.css";
import { toPublicPath } from "../../../utils/publicPath";

type CompanyData = {
  name?: string;
  shortName?: string;
  taxCode?: string;
  establishedYear?: string;
  phone?: string;
  address?: string;
  email?: string;
  website?: string;
  facebook?: string;
  tiktok?: string;
  instagram?: string;
};

function ensureHttp(url?: string) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

function sanitizeTel(phone?: string) {
  return (phone ?? "").replace(/\s+/g, "");
}

function Footer() {
  const [companyData, setCompanyData] = useState<CompanyData>({
    name: "Thuận Phát Máy Công Trình",
    shortName: "Thuận Phát Máy Công Trình",
    taxCode: "Đang cập nhật",
    establishedYear: "2020",
    phone: "0948 299 444",
    address: "Số 168 - Khu 4 - Xã Tề Lỗ - Tỉnh Phú Thọ",
    email: "k9dinhthong@gmail.com",
    website: "maycongtrinhthuanphat.com",
    facebook: "#",
    tiktok: "#",
    instagram: "#",
  });

  useEffect(() => {
    async function fetchCompanyData() {
      try {
        const response = await fetch(
          toPublicPath("data/Company/DataCompany.json"),
        );
        if (!response.ok) return;
        const data = (await response.json()) as CompanyData;

        setCompanyData((prev) => ({
          name: data.name?.trim() || prev.name,
          shortName:
            data.shortName?.trim() || data.name?.trim() || prev.shortName,
          taxCode: data.taxCode?.trim() || prev.taxCode,
          establishedYear: data.establishedYear?.trim() || prev.establishedYear,
          phone: data.phone?.trim() || prev.phone,
          address: data.address?.trim() || prev.address,
          email: data.email?.trim() || prev.email,
          website: data.website?.trim() || prev.website,
          facebook: data.facebook?.trim() || prev.facebook,
          tiktok: data.tiktok?.trim() || prev.tiktok,
          instagram: data.instagram?.trim() || prev.instagram,
        }));
      } catch {
        // Keep fallback values when loading fails.
      }
    }

    fetchCompanyData();
  }, []);

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

  return (
    <div className="site-footer">
      <section className="footer-top">
        <div className="footer-col footer-company">
          <h3 className="footer-heading">{companyData.shortName}</h3>
          <p className="footer-text">
            Công ty TNHH sản xuất kinh doanh xuất nhập khẩu <br /> máy công
            trình Thuận Phát.
          </p>
          <ul className="footer-contact-list">
            <li>
              <FaMapMarkerAlt />
              <span>{companyData.address}</span>
            </li>
            <li>
              <FaPhoneAlt />
              <a href={`tel:${sanitizeTel(companyData.phone)}`}>
                {companyData.phone}
              </a>
            </li>
            <li>
              <FaEnvelope />
              <a href={`mailto:${companyData.email}`}>{companyData.email}</a>
            </li>
            <li>
              <FaGlobe />
              <a href={websiteUrl} target="_blank" rel="noreferrer">
                {companyData.website}
              </a>
            </li>
            <li>
              <FaAngleRight />
              <span>MST: {companyData.taxCode}</span>
            </li>
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
          <nav aria-label="Mang xa hoi">
            <ul className="footer-social-list">
              <li>
                <a href={companyData.facebook} aria-label="Facebook">
                  <FaFacebookF />
                </a>
              </li>
              <li>
                <a href={companyData.instagram} aria-label="Instagram">
                  <FaInstagram />
                </a>
              </li>
              <li>
                <a href={companyData.tiktok} aria-label="TikTok">
                  <FaTiktok />
                </a>
              </li>
            </ul>
          </nav>
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
