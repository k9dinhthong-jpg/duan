import { useMemo } from "react";
import { Link } from "react-router-dom";
import "./AboutUs.css";
import { toPublicPath } from "../../../utils/publicPath";
import { useCompanyInfo } from "../../../context/CompanyInfoContext";

function ensureHttp(url?: string) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

function sanitizeTel(phone?: string) {
  return (phone ?? "").replace(/\s+/g, "");
}

const milestones = [
  {
    year: "2016",
    title: "Khởi đầu hoạt động",
    description:
      "Xây dựng đội ngũ kỹ thuật và thiết lập hệ thống cung ứng máy công trình tại khu vực miền Bắc.",
  },
  {
    year: "2019",
    title: "Mở rộng danh mục",
    description:
      "Mở rộng thêm nhiều dòng máy xúc và máy công trình đáp ứng đa dạng nhu cầu công trình.",
  },
  {
    year: "2022",
    title: "Nâng cấp dịch vụ hậu mãi",
    description:
      "Chuẩn hóa quy trình bảo hành, sửa chữa và cung cấp phụ tùng chính hãng trên toàn quốc.",
  },
  {
    year: "2026",
    title: "Tăng tốc số hóa",
    description:
      "Đầu tư nền tảng tư vấn trực tuyến và tối ưu trải nghiệm khách hàng đa kênh.",
  },
];

const trustStats = [
  { value: "10+", label: "Năm kinh nghiệm" },
  { value: "1000+", label: "Khách hàng đã phục vụ" },
  { value: "3000+", label: "Thiết bị đã bàn giao" },
  { value: "24/7", label: "Hỗ trợ kỹ thuật" },
];

function AboutUs() {
  const { companyInfo: companyData } = useCompanyInfo();
  const companyDisplayName = companyData.shortName || companyData.name;
  const officeAddress = companyData.address.trim();
  const phoneNumber = companyData.phone.trim();
  const emailAddress = companyData.email.trim();

  const websiteUrl = useMemo(
    () => ensureHttp(companyData.website),
    [companyData.website],
  );

  return (
    <div className="aboutus-page">
      <section className="aboutus-banner">
        <div className="aboutus-banner-content">
          <h1>
            {companyDisplayName ? `Về ${companyDisplayName}` : "Về chúng tôi"}
          </h1>
          <p>
            Đơn vị cung cấp máy công trình uy tín với dịch vụ hậu mãi chuyên sâu
          </p>
          <div className="aboutus-banner-actions">
            <Link to="/product" className="aboutus-banner-btn is-primary">
              Xem sản phẩm
            </Link>
            <Link to="/contact" className="aboutus-banner-btn is-outline">
              Nhận tư vấn ngay
            </Link>
          </div>
        </div>
      </section>

      <section className="aboutus-section">
        <div className="aboutus-container">
          <h2 className="aboutus-section-title">Giới Thiệu Công Ty</h2>
          <div className="aboutus-intro-content">
            <div className="aboutus-intro-left">
              <img
                src={toPublicPath("img/IntroCompany/Company.png")}
                alt="Công ty Máy Công Trình Nhập Khẩu"
                className="aboutus-intro-image"
              />
            </div>
            <div className="aboutus-intro-right">
              <p className="aboutus-intro-text">
                {companyData.name ? <strong>{companyData.name}</strong> : null}{" "}
                chuyên cung cấp các dòng máy công trình chất lượng cao, đáp ứng
                nhu cầu thi công và khai thác tại nhiều lĩnh vực. Chúng tôi cam
                kết mang đến giải pháp phù hợp với chi phí tối ưu cho từng khách
                hàng.
              </p>
              <p className="aboutus-intro-text">
                Với đội ngũ giàu kinh nghiệm, hệ thống hậu mãi đồng bộ và quy
                trình vận hành minh bạch, chúng tôi luôn đồng hành để khách hàng
                vận hành thiết bị ổn định, bền bỉ và hiệu quả lâu dài.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="aboutus-section aboutus-section-metrics">
        <div className="aboutus-container">
          <h2 className="aboutus-section-title">Con Số Tin Cậy</h2>
          <div className="aboutus-metrics-grid">
            {trustStats.map((item) => (
              <div key={item.label} className="aboutus-metric-card">
                <p className="aboutus-metric-value">{item.value}</p>
                <p className="aboutus-metric-label">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="aboutus-section aboutus-section-alt">
        <div className="aboutus-container">
          <h2 className="aboutus-section-title">Tầm Nhìn & Sứ Mệnh</h2>
          <div className="aboutus-cards">
            <div className="aboutus-card">
              <div className="aboutus-card-icon">👁️</div>
              <h3>Tầm Nhìn</h3>
              <p>
                Trở thành nhà cung cấp máy công trình hàng đầu tại Việt Nam,
                mang lại giá trị tối đa cho khách hàng và xã hội.
              </p>
            </div>
            <div className="aboutus-card">
              <div className="aboutus-card-icon">🎯</div>
              <h3>Sứ Mệnh</h3>
              <p>
                Cung cấp các sản phẩm máy công trình chất lượng cao, dịch vụ bảo
                hành tốt nhất, hỗ trợ khách hàng phát triển kinh doanh.
              </p>
            </div>
            <div className="aboutus-card">
              <div className="aboutus-card-icon">💎</div>
              <h3>Giá Trị Cốt Lõi</h3>
              <p>
                Chất lượng, uy tín, tận tâm phục vụ khách hàng và cam kết phát
                triển bền vững.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="aboutus-section aboutus-section-timeline">
        <div className="aboutus-container">
          <h2 className="aboutus-section-title">Hành Trình Phát Triển</h2>
          <div className="aboutus-timeline">
            {milestones.map((item) => (
              <article key={item.year} className="aboutus-timeline-item">
                <div className="aboutus-timeline-year">{item.year}</div>
                <div className="aboutus-timeline-content">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="aboutus-section">
        <div className="aboutus-container">
          <h2 className="aboutus-section-title">Lợi Thế Cạnh Tranh</h2>
          <div className="aboutus-features">
            <div className="aboutus-feature-item">
              <h4>Sản Phẩm Chất Lượng</h4>
              <p>
                Máy xúc và máy công trình đạt tiêu chuẩn quốc tế, bền bỉ, hiệu
                suất cao.
              </p>
            </div>
            <div className="aboutus-feature-item">
              <h4>Giá Cạnh Tranh</h4>
              <p>
                Cung cấp giá tốt nhất trên thị trường với chất lượng đảm bảo.
              </p>
            </div>
            <div className="aboutus-feature-item">
              <h4>Dịch Vụ Sau Bán Hàng</h4>
              <p>Bảo hành, sửa chữa, cung cấp phụ tùng chính hãng toàn quốc.</p>
            </div>
            <div className="aboutus-feature-item">
              <h4>Kinh Nghiệm Lâu Năm</h4>
              <p>Nhiều năm kinh nghiệm trong lĩnh vực máy công trình.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="aboutus-section aboutus-section-contact">
        <div className="aboutus-container">
          <h2 className="aboutus-section-title">Liên Hệ Với Chúng Tôi</h2>
          <div className="aboutus-contact-info">
            {officeAddress ? (
              <div className="aboutus-contact-item">
                <h4>📍 Địa Chỉ</h4>
                <p>{officeAddress}</p>
              </div>
            ) : null}
            {phoneNumber ? (
              <div className="aboutus-contact-item">
                <h4>📞 Điện Thoại</h4>
                <p>
                  <a href={`tel:${sanitizeTel(phoneNumber)}`}>{phoneNumber}</a>
                </p>
              </div>
            ) : null}
            {emailAddress ? (
              <div className="aboutus-contact-item">
                <h4>✉️ Email</h4>
                <p>
                  <a href={`mailto:${emailAddress}`}>{emailAddress}</a>
                </p>
              </div>
            ) : null}
            {websiteUrl ? (
              <div className="aboutus-contact-item">
                <h4>🌐 Website</h4>
                <p>
                  <a href={websiteUrl} target="_blank" rel="noreferrer">
                    {companyData.website}
                  </a>
                </p>
              </div>
            ) : null}
          </div>

          <div className="aboutus-contact-cta">
            <Link to="/contact" className="aboutus-contact-btn">
              Gửi yêu cầu tư vấn
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AboutUs;
