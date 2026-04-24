import { useEffect, useRef, useState } from "react";
import "./IntroCompany.css";
import { toPublicPath } from "../../../utils/publicPath";

type CompanyData = {
  name?: string;
  shortName?: string;
};

function IntroCompany() {
  const [companyName, setCompanyName] = useState("CÔNG TY THUẬN PHÁT");
  const [isCentered, setIsCentered] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    async function fetchCompanyData() {
      try {
        const response = await fetch(
          toPublicPath("data/Company/DataCompany.json"),
        );
        if (!response.ok) return;

        const data = (await response.json()) as CompanyData;
        const nextCompanyName = data.shortName?.trim() || data.name?.trim();
        if (nextCompanyName) {
          setCompanyName(nextCompanyName);
        }
      } catch {
        // Keep fallback value when loading fails.
      }
    }

    fetchCompanyData();
  }, []);

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

          <button type="button" className="intro-company-btn">
            <span className="intro-company-btn-label">Tìm hiểu thêm</span>
            <span className="intro-company-btn-icon" aria-hidden="true">
              <i className="fa-solid fa-arrow-right"></i>
            </span>
          </button>
        </div>

        <div className="intro-company-right">
          <img
            src={toPublicPath("img/IntroCompany/Company.png")}
            alt="Máy xúc Hyundai"
          />
        </div>
      </div>
    </section>
  );
}

export default IntroCompany;
