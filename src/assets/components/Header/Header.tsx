import { useEffect, useState } from "react";
import { FaBars, FaCaretDown, FaSearch, FaTimes } from "react-icons/fa";
import { Link } from "react-router-dom";
import "./Header.css";
import { toPublicPath } from "../../../utils/publicPath";

const productItem = [
  { id: 1, name: "MÁY CÔNG TRÌNH HITACHI", link: "/product/hitachi" },
  { id: 2, name: "MÁY CÔNG TRÌNH KOBELCO", link: "/product/kobelco" },
  { id: 3, name: "MÁY CÔNG TRÌNH KOMATSU", link: "/product/komatsu" },
];

const serviceItem = [
  { id: 1, name: "KIỂM TRA BẢO HÀNH" },
  { id: 2, name: "DỊCH VỤ SỬA CHỮA" },
  { id: 3, name: "THUÊ MÁY CÔNG TRÌNH" },
];

const introductionItem = [
  { id: 1, name: "VỀ CHÚNG TÔI", link: "/about-us" },
  // { id: 2, name: "GIÁ TRỊ CỐT LÕI", link: "/core-values" },
  // { id: 3, name: "TẦM NHÌN - SỨ MỆNH", link: "/vision-mission" },
];

function Header() {
  const [bannerHeight, setBannerHeight] = useState(0);
  const [navGap, setNavGap] = useState(0);
  const [navTop, setNavTop] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
          <h1 className="banner-title">MÁY CÔNG TRÌNH THUẬN PHÁT</h1>
        </div>
        <div className="banner-right">
          <p className="banner-hotline-label">TƯ VẤN NHANH 24/7</p>
          <a className="banner-hotline-value" href="tel:0948299444">
            0948 299 444
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
          <li>
            <Link to="/home" onClick={() => setIsMenuOpen(false)}>
              TRANG CHỦ
            </Link>
          </li>
          <li className="product-menu">
            <Link to="/product" onClick={() => setIsMenuOpen(false)}>
              SẢN PHẨM <FaCaretDown />
            </Link>
            <ul className="product-menu-item">
              {productItem.map((item) => (
                <li key={item.id}>
                  <Link to={item.link} onClick={() => setIsMenuOpen(false)}>
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
          <li className="product-menu">
            <a href="#">
              DỊCH VỤ <FaCaretDown />
            </a>
            <ul className="product-menu-item">
              {serviceItem.map((item) => (
                <li key={item.id}>
                  <a href="#">{item.name}</a>
                </li>
              ))}
            </ul>
          </li>
          <li className="product-menu">
            <a href="#">
              GIỚI THIỆU <FaCaretDown />
            </a>
            <ul className="product-menu-item">
              {introductionItem.map((item) => (
                <li key={item.id}>
                  <Link to={item.link} onClick={() => setIsMenuOpen(false)}>
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
          <li>
            <Link to="/news" onClick={() => setIsMenuOpen(false)}>
              TIN TỨC
            </Link>
          </li>
          <li>
            <Link to="/contact" onClick={() => setIsMenuOpen(false)}>
              LIÊN HỆ
            </Link>
          </li>
        </ul>

        <div className="nav-search-mobile">
          <div className="search-box">
            <FaSearch className="search-icon" aria-hidden="true" />
            <input
              className="find-text"
              type="text"
              name="find-text"
              id="find-text"
              placeholder="Tìm kiếm sản phẩm..."
              aria-label="Tìm kiếm"
            />
          </div>
        </div>
      </nav>
    </>
  );
}

export default Header;
