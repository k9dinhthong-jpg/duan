import "./AboutUs.css";
import { toPublicPath } from "../../../utils/publicPath";

function AboutUs() {
  return (
    <div className="aboutus-page">
      {/* Banner Section */}
      <section className="aboutus-banner">
        <div className="aboutus-banner-content">
          <h1>Về Công Ty Thuận Phát</h1>
          <p>
            Tổng đại lý phân phối độc quyền máy công trình chất lượng hàng đầu
          </p>
        </div>
      </section>

      {/* Introduction Section */}
      <section className="aboutus-section">
        <div className="aboutus-container">
          <h2 className="aboutus-section-title">Giới Thiệu Công Ty</h2>
          <div className="aboutus-intro-content">
            <div className="aboutus-intro-left">
              <img
                src={toPublicPath("img/IntroCompany/Company.png")}
                alt="Công ty Thuận Phát"
                className="aboutus-intro-image"
              />
            </div>
            <div className="aboutus-intro-right">
              <p className="aboutus-intro-text">
                <strong>Công ty TNHH Sản xuất và Kinh doanh Thuận Phát</strong>{" "}
                là tổng đại lý phân phối độc quyền máy xúc Hyundai tại Việt Nam.
                Chúng tôi tự hào vì mang đến những sản phẩm chất lượng, giá tốt
                để phục vụ mục đích sử dụng của khách hàng.
              </p>
              <p className="aboutus-intro-text">
                Chúng tôi là công ty độc quyền cung cấp các sản phẩm máy công
                trình bao gồm máy xúc đào bánh xích, máy xúc đào bánh lốp, máy
                xúc đào mini, máy xúc đào tổng hợp, máy xúc lật. Rất hân hạnh
                được hỗ trợ các khách hàng khi ghé xem.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
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

      {/* Values Section */}
      <section className="aboutus-section">
        <div className="aboutus-container">
          <h2 className="aboutus-section-title">Lợi Thế Cạnh Tranh</h2>
          <div className="aboutus-features">
            <div className="aboutus-feature-item">
              <h4>Sản Phẩm Chất Lượng</h4>
              <p>
                Máy xúc và máy công trình đạt tiêu chuẩn quốc tế, bền bỏ, hiệu
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

      {/* Contact Section */}
      <section className="aboutus-section aboutus-section-contact">
        <div className="aboutus-container">
          <h2 className="aboutus-section-title">Liên Hệ Với Chúng Tôi</h2>
          <div className="aboutus-contact-info">
            <div className="aboutus-contact-item">
              <h4>📍 Địa Chỉ</h4>
              <p>Số 168 - Khu 4 - Xã Tề Lỗ - Tỉnh Phú Thọ</p>
            </div>
            <div className="aboutus-contact-item">
              <h4>📞 Điện Thoại</h4>
              <p>
                <a href="tel:0948299444">0948 299 444</a>
              </p>
            </div>
            <div className="aboutus-contact-item">
              <h4>✉️ Email</h4>
              <p>
                <a href="mailto:k9dinhthong@gmail.com">k9dinhthong@gmail.com</a>
              </p>
            </div>
            <div className="aboutus-contact-item">
              <h4>🌐 Website</h4>
              <p>
                <a
                  href="https://maycongtrinhthuanphat.com"
                  target="_blank"
                  rel="noreferrer"
                >
                  maycongtrinhthuanphat.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AboutUs;
