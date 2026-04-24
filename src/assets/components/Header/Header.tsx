import { useEffect, useState } from "react";
import { FaBars, FaCaretDown, FaSearch, FaTimes } from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import "./Header.css";
import { toPublicPath } from "../../../utils/publicPath";

type CompanyData = {
  name?: string;
  phone?: string;
};

const productItem = [
  { id: 1, name: "MÁY CÔNG TRÌNH HITACHI", link: "/product/hitachi" },
  { id: 2, name: "MÁY CÔNG TRÌNH KOBELCO", link: "/product/kobelco" },
  { id: 3, name: "MÁY CÔNG TRÌNH KOMATSU", link: "/product/komatsu" },
];

const serviceItem = [
  { id: 1, name: "KIỂM TRA BẢO HÀNH", link: "/services/warranty" },
  { id: 2, name: "DỊCH VỤ SỬA CHỮA", link: "/services/repair" },
  { id: 3, name: "THUÊ MÁY CÔNG TRÌNH", link: "/services/rent" },
];

const introductionItem = [
  { id: 1, name: "VỀ CHÚNG TÔI", link: "/about-us" },
  // { id: 2, name: "GIÁ TRỊ CỐT LÕI", link: "/core-values" },
  // { id: 3, name: "TẦM NHÌN - SỨ MỆNH", link: "/vision-mission" },
];

function Header() {
  const { pathname } = useLocation();

  const isHomeActive = pathname === "/" || pathname === "/home";
  const isProductActive =
    pathname === "/product" || pathname.startsWith("/product/");
  const isServiceActive = pathname.startsWith("/services/");
  const isIntroActive = pathname.startsWith("/about-us");
  const isNewsActive = pathname === "/news" || pathname.startsWith("/news/");
  const isContactActive = pathname.startsWith("/contact");

  const [companyData, setCompanyData] = useState<CompanyData>({
    name: "MÁY CÔNG TRÌNH THUẬN PHÁT",
    phone: "0948 299 444",
  });
  const [bannerHeight, setBannerHeight] = useState(0);
  const [navGap, setNavGap] = useState(0);
  const [navTop, setNavTop] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
          phone: data.phone?.trim() || prev.phone,
        }));
      } catch {
        // Keep fallback values when loading fails.
      }
    }

    fetchCompanyData();
  }, []);

  useEffect(() => {
    function updateMeasurements() {
      const banner = document.querySelector<HTMLElement>(".header-banner");
      setBannerHeight(banner?.offsetHeight ?? 0);

      const gapRaw = getComputedStyle(document.documentElement)
        .getPropertyValue("--site-nav-gap")
        .trim();
      const gapValue = Number.parseFloat(gapRaw);
      setNavGap(Number.isNaN(gapValue) ? 0 : gapValue);
    }

    updateMeasurements();
    window.addEventListener("resize", updateMeasurements);

    return () => {
      window.removeEventListener("resize", updateMeasurements);
    };
  }, []);

  useEffect(() => {
    function handleScroll() {
      const nextTop = Math.max(bannerHeight + navGap - window.scrollY, 0);
      setNavTop(nextTop);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [bannerHeight, navGap]);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth > 1024) {
        setIsMenuOpen(false);
      }
    }

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <>
      <div className="header-banner">
        <div className="banner-left">
          <p className="banner-kicker">CÔNG TY XUẤT NHẬP KHẨU</p>
          <h1 className="banner-title">{companyData.name}</h1>
        </div>
        <div className="banner-right">
          <p className="banner-hotline-label">TƯ VẤN NHANH 24/7</p>
          <a
            className="banner-hotline-value"
            href={`tel:${(companyData.phone ?? "").replace(/\s+/g, "")}`}
          >
            {companyData.phone}
          </a>
        </div>
      </div>
      <nav className="site-nav" style={{ top: `${navTop}px` }}>
        <button
          className="nav-toggle"
          type="button"
          aria-label={isMenuOpen ? "Đóng menu" : "Mở menu"}
          aria-expanded={isMenuOpen}
          aria-controls="site-nav-menu"
          onClick={() => setIsMenuOpen((prev) => !prev)}
        >
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </button>

        <Link className="nav-mobile-logo" to="/home" aria-label="Trang chủ">
          <img src={toPublicPath("img/Logo/Logo.png")} alt="Thuận Phát" />
        </Link>

        <ul
          className={`nav-menu ${isMenuOpen ? "is-open" : ""}`}
          id="site-nav-menu"
        >
          <li className={isHomeActive ? "is-active" : ""}>
            <Link to="/home" onClick={() => setIsMenuOpen(false)}>
              TRANG CHỦ
            </Link>
          </li>
          <li className={`product-menu ${isProductActive ? "is-active" : ""}`}>
            <Link to="/product" onClick={() => setIsMenuOpen(false)}>
              SẢN PHẨM <FaCaretDown />
            </Link>
            <ul className="product-menu-item">
              {productItem.map((item) => (
                <li
                  key={item.id}
                  className={pathname.startsWith(item.link) ? "is-active" : ""}
                >
                  <Link to={item.link} onClick={() => setIsMenuOpen(false)}>
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
          <li className={`product-menu ${isServiceActive ? "is-active" : ""}`}>
            <Link to="/services/warranty" onClick={() => setIsMenuOpen(false)}>
              DỊCH VỤ <FaCaretDown />
            </Link>
            <ul className="product-menu-item">
              {serviceItem.map((item) => (
                <li
                  key={item.id}
                  className={pathname.startsWith(item.link) ? "is-active" : ""}
                >
                  <Link to={item.link} onClick={() => setIsMenuOpen(false)}>
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
          <li className={`product-menu ${isIntroActive ? "is-active" : ""}`}>
            <Link to="/about-us" onClick={() => setIsMenuOpen(false)}>
              GIỚI THIỆU <FaCaretDown />
            </Link>
            <ul className="product-menu-item">
              {introductionItem.map((item) => (
                <li
                  key={item.id}
                  className={pathname.startsWith(item.link) ? "is-active" : ""}
                >
                  <Link to={item.link} onClick={() => setIsMenuOpen(false)}>
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
          <li className={isNewsActive ? "is-active" : ""}>
            <Link to="/news" onClick={() => setIsMenuOpen(false)}>
              TIN TỨC
            </Link>
          </li>
          <li className={isContactActive ? "is-active" : ""}>
            <Link to="/contact" onClick={() => setIsMenuOpen(false)}>
              LIÊN HỆ
            </Link>
          </li>
        </ul>

        <div className="nav-search-mobile">
          <form
            className="search-box"
            role="search"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              className="find-text"
              type="search"
              name="find-text"
              id="find-text"
              placeholder="Tìm kiếm..."
              aria-label="Tìm kiếm"
            />
            <button className="search-btn" type="submit" aria-label="Tìm kiếm">
              <FaSearch aria-hidden="true" />
            </button>
          </form>
        </div>
      </nav>
    </>
  );
}

export default Header;
