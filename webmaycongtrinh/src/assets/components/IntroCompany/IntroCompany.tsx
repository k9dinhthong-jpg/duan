import { useEffect, useRef, useState } from "react";
import { FaArrowRight } from "react-icons/fa";
import { Link } from "react-router-dom";
import "./IntroCompany.css";
import { useCompanyInfo } from "../../context/CompanyInfoContext";

function IntroCompany() {
  const { companyInfo } = useCompanyInfo();
  const companyName = companyInfo.shortName || companyInfo.name;
  const [isCentered, setIsCentered] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const sectionEl = sectionRef.current;
    if (!sectionEl) return;

    const handleRevealOnScroll = () => {
      if (window.scrollY <= 40) return;

      const rect = sectionEl.getBoundingClientRect();
      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight;
      const isVisible =
        rect.top <= viewportHeight * 0.85 &&
        rect.bottom >= viewportHeight * 0.15;

      if (isVisible) {
        setIsCentered(true);
        window.removeEventListener("scroll", handleRevealOnScroll);
        window.removeEventListener("resize", handleRevealOnScroll);
      }
    };

    window.addEventListener("scroll", handleRevealOnScroll, { passive: true });
    window.addEventListener("resize", handleRevealOnScroll);

    return () => {
      window.removeEventListener("scroll", handleRevealOnScroll);
      window.removeEventListener("resize", handleRevealOnScroll);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`intro-company ${isCentered ? "is-centered" : ""}`}
    >
      <div className="intro-company-inner">
        <div className="intro-company-left">
          <h2 className="intro-company-title">
            GIỚI THIỆU VỀ <span>{companyName}</span>
          </h2>
          <p className="intro-company-desc">
            Công ty xuất nhập khẩu Thuận Phát là tổng đại lý phân phối máy công
            trình tại Việt Nam. Chúng tôi tự hào vì mang đến những sản phẩm chất
            lượng, giá tốt để phục vụ mục đích sử dụng của khách hàng.
          </p>
          <p className="intro-company-desc">
            Chúng tôi là công ty độc quyền cung cấp các sản phẩm máy công trình
            bao gồm máy xúc đào bánh xích, máy xúc đào bánh lốp, máy xúc đào
            mini, máy xúc đào tổng hợp, máy xúc lật. Rất hân hạnh được hỗ trợ
            các khách hàng khi ghé xem.
          </p>

          <Link to="/about-us" className="intro-company-btn">
            <span className="intro-company-btn-label">Tìm hiểu thêm</span>
            <span className="intro-company-btn-icon" aria-hidden="true">
              <FaArrowRight />
            </span>
          </Link>
        </div>

        <div className="intro-company-right">
          <img
            src="https://ehsccjufbaehvfovguvm.supabase.co/storage/v1/object/public/Company/Company.png"
            alt="Máy công trình Thuận Phát"
          />
        </div>
      </div>
    </section>
  );
}

export default IntroCompany;
