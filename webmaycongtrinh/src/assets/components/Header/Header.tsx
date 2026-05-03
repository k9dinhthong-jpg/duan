import {
  type MouseEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { FaBars, FaCaretDown, FaTimes } from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Header.css";
import { toPublicPath } from "../../../utils/publicPath";
import { useCompanyInfo } from "../../../context/CompanyInfoContext";
import { useMenuBrand } from "../../../context/MenuBrandContext";
import { useMenuServices } from "../../../context/MenuServices";
import { useMenuIntroduction } from "../../../context/MenuIntroduction";

const text = {
  kicker: "MÁY CÔNG TRÌNH NHẬP KHẨU",
  hotlineLabel: "TƯ VẤN NHANH 24/7",
  mainNavAria: "Điều hướng chính",
  closeMenu: "Đóng menu",
  openMenu: "Mở menu",
  homeAria: "Trang chủ",
  home: "TRANG CHỦ",
  product: "SẢN PHẨM",
  services: "DỊCH VỤ",
  intro: "GIỚI THIỆU",
  news: "TIN TỨC",
  contact: "LIÊN HỆ",
  login: "ĐĂNG NHẬP",
  search: "TÌM KIẾM",
  searchLabel: "Tìm kiếm sản phẩm",
  searchPlaceholder: "Nhập mã sản phẩm cần tìm...",
  searchInstruction: "Vui lòng nhập mã sản phẩm cần tìm",
  searchBtn: "Tìm kiếm",
  searchClose: "Đóng",
  searchAria: "Tìm kiếm",
};

function Header() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const isHomeActive = pathname === "/" || pathname === "/home";
  const isProductActive =
    pathname === "/product" || pathname.startsWith("/product/");
  const isServiceActive = pathname.startsWith("/services/");
  const isIntroActive = pathname.startsWith("/about-us");
  const isNewsActive = pathname === "/news" || pathname.startsWith("/news/");
  const isContactActive = pathname.startsWith("/contact");
  const isLoginActive = pathname.startsWith("/login");
  const { companyInfo: companyData } = useCompanyInfo();
  const phoneNumber = companyData.phone.trim();
  const { productItems } = useMenuBrand();
  const { serviceItems } = useMenuServices();
  const { introItems } = useMenuIntroduction();

  const [navTop, setNavTop] = useState(0);
  const bannerRef = useRef<HTMLElement | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCompactNav, setIsCompactNav] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 991 : false,
  );
  const [openSubmenus, setOpenSubmenus] = useState({
    product: false,
    services: false,
    intro: false,
  });

  useLayoutEffect(() => {
    const banner = document.querySelector<HTMLElement>(".header-banner");
    bannerRef.current = banner;
    if (!banner) return;

    const updateTop = () => {
      const nextTop = Math.max(banner.offsetHeight - window.scrollY, 0);
      setNavTop((prevTop) => (prevTop === nextTop ? prevTop : nextTop));
    };

    const ro = new ResizeObserver(() => {
      updateTop();
    });
    ro.observe(banner);

    requestAnimationFrame(updateTop);

    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let rafId: number | null = null;

    function updateNavTop() {
      const banner = bannerRef.current;
      if (!banner) {
        setNavTop(0);
        rafId = null;
        return;
      }

      const nextTop = Math.max(banner.offsetHeight - window.scrollY, 0);
      setNavTop((prevTop) => (prevTop === nextTop ? prevTop : nextTop));
      rafId = null;
    }

    function scheduleUpdate() {
      if (rafId !== null) {
        return;
      }

      rafId = window.requestAnimationFrame(updateNavTop);
    }

    scheduleUpdate();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);

      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []);

  useEffect(() => {
    function handleResize() {
      const compact = window.innerWidth <= 991;
      setIsCompactNav(compact);

      if (window.innerWidth > 991) {
        setIsMenuOpen(false);
        setOpenSubmenus({ product: false, services: false, intro: false });
      }
    }

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  function toggleSubmenu(key: "product" | "services" | "intro") {
    setOpenSubmenus((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  function handleMenuToggle() {
    setIsMenuOpen((prev) => {
      const next = !prev;

      if (next && isCompactNav) {
        setOpenSubmenus({
          product: isProductActive,
          services: isServiceActive,
          intro: isIntroActive,
        });
      }

      if (!next) {
        setOpenSubmenus({ product: false, services: false, intro: false });
      }

      return next;
    });
  }

  function closeMenuPanel() {
    setIsMenuOpen(false);
  }

  function openSearch() {
    setIsSearchOpen(true);
    setSearchQuery("");
  }

  function closeSearch() {
    setIsSearchOpen(false);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: xử lý tìm kiếm với searchQuery
    closeSearch();
  }

  function handleMobileLogoClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!isCompactNav) {
      return;
    }

    event.preventDefault();
    closeMenuPanel();
    navigate("/home");
  }

  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    function handleEscClose(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscClose);
    return () => {
      window.removeEventListener("keydown", handleEscClose);
    };
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;

    function handleClickOutside(event: globalThis.MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <>
      <div className="header-banner">
        <div className="banner-left">
          <p className="banner-kicker">{text.kicker}</p>
          {companyData.slogan ? (
            <h1 className="banner-title">{companyData.slogan}</h1>
          ) : null}
        </div>
        {phoneNumber ? (
          <div className="banner-right">
            <p className="banner-hotline-label">{text.hotlineLabel}</p>
            <a
              className="banner-hotline-value"
              href={`tel:${phoneNumber.replace(/\s+/g, "")}`}
            >
              {phoneNumber}
            </a>
          </div>
        ) : null}
      </div>
      <nav
        ref={navRef}
        className="site-nav"
        style={{ top: `${navTop}px` }}
        aria-label={text.mainNavAria}
      >
        <div className="nav-container">
          <button
            className="nav-toggle"
            type="button"
            aria-label={isMenuOpen ? text.closeMenu : text.openMenu}
            aria-expanded={isMenuOpen}
            aria-controls="site-nav-menu"
            onClick={handleMenuToggle}
          >
            {isMenuOpen ? <FaTimes /> : <FaBars />}
          </button>

          <Link
            className="nav-mobile-logo"
            to="/home"
            aria-label={text.homeAria}
            onClick={handleMobileLogoClick}
          >
            <img
              src={toPublicPath("img/Logo/Logo.png")}
              alt="Logo Máy Công Trình Nhập Khẩu"
            />
          </Link>

          <div className="nav-right-actions">
            <button
              type="button"
              className="nav-search-btn nav-search-compact"
              onClick={openSearch}
              aria-label={text.searchLabel}
            >
              {text.search}
            </button>
          </div>
        </div>

        <ul
          className={`nav-menu ${isMenuOpen ? "is-open" : ""}`}
          id="site-nav-menu"
        >
          <li className={`nav-login-item ${isLoginActive ? "is-active" : ""}`}>
            <Link
              className="nav-login-link"
              to="/login"
              onClick={closeMenuPanel}
            >
              {text.login}
            </Link>
          </li>
          <li className={isHomeActive ? "is-active" : ""}>
            <Link to="/home" onClick={closeMenuPanel}>
              {text.home}
            </Link>
          </li>
          <li
            className={`product-menu ${isProductActive ? "is-active" : ""} ${
              openSubmenus.product ? "is-submenu-open" : ""
            }`}
          >
            <div className="product-menu-row">
              <Link
                className="product-menu-link"
                to="/product"
                onClick={(e) => {
                  if (isCompactNav) {
                    e.preventDefault();
                    toggleSubmenu("product");
                  } else {
                    closeMenuPanel();
                  }
                }}
              >
                {text.product} <FaCaretDown />
              </Link>
              <button
                type="button"
                className="product-menu-toggle"
                aria-label="Mở danh mục sản phẩm"
                aria-expanded={openSubmenus.product}
                onClick={() => toggleSubmenu("product")}
              >
                <FaCaretDown aria-hidden="true" />
              </button>
            </div>
            <ul className="product-menu-item">
              <li className={pathname === "/product" ? "is-active" : ""}>
                <Link to="/product" onClick={closeMenuPanel}>
                  TẤT CẢ SẢN PHẨM
                </Link>
              </li>
              {productItems.map((item) => (
                <li
                  key={item.id}
                  className={pathname.startsWith(item.link) ? "is-active" : ""}
                >
                  <Link to={item.link} onClick={closeMenuPanel}>
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
          <li
            className={`product-menu ${isServiceActive ? "is-active" : ""} ${
              openSubmenus.services ? "is-submenu-open" : ""
            }`}
          >
            <div className="product-menu-row">
              <Link
                className="product-menu-link"
                to="/services/warranty"
                onClick={(e) => {
                  if (isCompactNav) {
                    e.preventDefault();
                    toggleSubmenu("services");
                  } else {
                    closeMenuPanel();
                  }
                }}
              >
                {text.services} <FaCaretDown />
              </Link>
              <button
                type="button"
                className="product-menu-toggle"
                aria-label="Mở danh mục dịch vụ"
                aria-expanded={openSubmenus.services}
                onClick={() => toggleSubmenu("services")}
              >
                <FaCaretDown aria-hidden="true" />
              </button>
            </div>
            <ul className="product-menu-item">
              {serviceItems.map((item) => (
                <li
                  key={item.id}
                  className={pathname.startsWith(item.link) ? "is-active" : ""}
                >
                  <Link to={item.link} onClick={closeMenuPanel}>
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
          <li
            className={`product-menu ${isIntroActive ? "is-active" : ""} ${
              openSubmenus.intro ? "is-submenu-open" : ""
            }`}
          >
            <div className="product-menu-row">
              <Link
                className="product-menu-link"
                to="/about-us"
                onClick={(e) => {
                  if (isCompactNav) {
                    e.preventDefault();
                    toggleSubmenu("intro");
                  } else {
                    closeMenuPanel();
                  }
                }}
              >
                {text.intro} <FaCaretDown />
              </Link>
              <button
                type="button"
                className="product-menu-toggle"
                aria-label="Mở danh mục giới thiệu"
                aria-expanded={openSubmenus.intro}
                onClick={() => toggleSubmenu("intro")}
              >
                <FaCaretDown aria-hidden="true" />
              </button>
            </div>
            <ul className="product-menu-item">
              {introItems.map((item) => (
                <li
                  key={item.id}
                  className={pathname.startsWith(item.link) ? "is-active" : ""}
                >
                  <Link to={item.link} onClick={closeMenuPanel}>
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
          <li className={isNewsActive ? "is-active" : ""}>
            <Link to="/news" onClick={closeMenuPanel}>
              {text.news}
            </Link>
          </li>
          <li className={isContactActive ? "is-active" : ""}>
            <Link to="/contact" onClick={closeMenuPanel}>
              {text.contact}
            </Link>
          </li>
          <li className="nav-search-item">
            <button
              type="button"
              className="nav-search-btn"
              onClick={openSearch}
              aria-label={text.searchLabel}
            >
              {text.search}
            </button>
          </li>
        </ul>
      </nav>
      {isSearchOpen && (
        <div
          className="search-modal-overlay"
          onClick={closeSearch}
          role="dialog"
          aria-modal="true"
          aria-label={text.searchLabel}
        >
          <div className="search-modal" onClick={(e) => e.stopPropagation()}>
            <p className="search-modal__instruction">
              {text.searchInstruction}
            </p>
            <form className="search-modal__form" onSubmit={handleSearchSubmit}>
              <input
                className="search-modal__input"
                type="text"
                placeholder={text.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                aria-label={text.searchLabel}
              />
              <div className="search-modal__actions">
                <button type="submit" className="search-modal__submit">
                  {text.searchBtn}
                </button>
                <button
                  type="button"
                  className="search-modal__close"
                  onClick={closeSearch}
                >
                  {text.searchClose}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default Header;
