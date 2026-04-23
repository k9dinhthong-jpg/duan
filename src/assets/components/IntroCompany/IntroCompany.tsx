import "./IntroCompany.css";

function IntroCompany() {
  return (
    <section className="intro-company">
      <div className="intro-company-inner">
        <div className="intro-company-left">
          <h2 className="intro-company-title">
            GIỚI THIỆU VỀ <span> CÔNG TY THUẬN PHÁT</span>
          </h2>
          <p className="intro-company-desc">
            Công ty TNHH Sản xuất và Kinh doanh Thuận Phát là tổng đại lý phân
            phối độc quyền máy xúc Hyundai tại Việt Nam. Chúng tôi tự hào vì
            mang đến những sản phẩm chất lượng, giá tốt để phục vụ mục đích sử
            dụng của khách hàng.
          </p>
          <p className="intro-company-desc">
            Chúng tôi là công ty độc quyền cung cấp các sản phẩm máy công trình
            bao gồm máy xúc đào bánh xích, máy xúc đào bánh lốp, máy xúc đào
            mini, máy xúc đào tổng hợp, máy xúc lật. Rất hân hạnh được hỗ trợ
            các khách hàng khi ghé xem.
          </p>

          <button type="button" className="intro-company-btn">
            <span className="intro-company-btn-label">Tìm hiểu thêm</span>
            <span className="intro-company-btn-icon" aria-hidden="true">
              <i className="fa-solid fa-arrow-right"></i>
            </span>
          </button>
        </div>

        <div className="intro-company-right">
          <img src="/img/IntroCompany/Company.png" alt="Máy xúc Hyundai" />
        </div>
      </div>
    </section>
  );
}

export default IntroCompany;
