import { useEffect, useState } from "react";
import {
  FaBars,
  FaCaretDown,
  FaGlobe,
  FaSearch,
  FaTimes,
} from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import "./Header.css";
import { toPublicPath } from "../../../utils/publicPath";

type LanguageCode = "vi" | "en" | "zh";

type CompanyData = {
  shortName?: string;
  shortname?: string;
  name?: string;
  phone?: string;
};

const LANGUAGE_STORAGE_KEY = "site-language";

const languageDisplayMap: Record<LanguageCode, string> = {
  vi: "VI",
  en: "EN",
  zh: "中文",
};

const labels = {
  vi: {
    kicker: "CÔNG TY XUẤT NHẬP KHẨU",
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
    searchPlaceholder: "Tìm kiếm...",
    searchAria: "Tìm kiếm",
    languageAria: "Chọn ngôn ngữ",
    productItems: [
      { id: 1, name: "MÁY CÔNG TRÌNH HITACHI", link: "/product/hitachi" },
      { id: 2, name: "MÁY CÔNG TRÌNH KOBELCO", link: "/product/kobelco" },
      { id: 3, name: "MÁY CÔNG TRÌNH KOMATSU", link: "/product/komatsu" },
    ],
    serviceItems: [
      { id: 1, name: "KIỂM TRA BẢO HÀNH", link: "/services/warranty" },
      { id: 2, name: "DỊCH VỤ SỬA CHỮA", link: "/services/repair" },
      { id: 3, name: "THUÊ MÁY CÔNG TRÌNH", link: "/services/rent" },
    ],
    introItems: [{ id: 1, name: "VỀ CHÚNG TÔI", link: "/about-us" }],
  },
  en: {
    kicker: "IMPORT EXPORT COMPANY",
    hotlineLabel: "FAST CONSULTING 24/7",
    mainNavAria: "Main navigation",
    closeMenu: "Close menu",
    openMenu: "Open menu",
    homeAria: "Home",
    home: "HOME",
    product: "PRODUCTS",
    services: "SERVICES",
    intro: "ABOUT",
    news: "NEWS",
    contact: "CONTACT",
    searchPlaceholder: "Search...",
    searchAria: "Search",
    languageAria: "Select language",
    productItems: [
      { id: 1, name: "HITACHI MACHINERY", link: "/product/hitachi" },
      { id: 2, name: "KOBELCO MACHINERY", link: "/product/kobelco" },
      { id: 3, name: "KOMATSU MACHINERY", link: "/product/komatsu" },
    ],
    serviceItems: [
      { id: 1, name: "WARRANTY CHECK", link: "/services/warranty" },
      { id: 2, name: "REPAIR SERVICE", link: "/services/repair" },
      { id: 3, name: "MACHINE RENTAL", link: "/services/rent" },
    ],
    introItems: [{ id: 1, name: "ABOUT US", link: "/about-us" }],
  },
  zh: {
    kicker: "工程机械进出口公司",
    hotlineLabel: "24/7 快速咨询",
    mainNavAria: "主导航",
    closeMenu: "关闭菜单",
    openMenu: "打开菜单",
    homeAria: "首页",
    home: "首页",
    product: "产品",
    services: "服务",
    intro: "关于我们",
    news: "新闻",
    contact: "联系",
    searchPlaceholder: "搜索...",
    searchAria: "搜索",
    languageAria: "选择语言",
    productItems: [
      { id: 1, name: "日立工程机械", link: "/product/hitachi" },
      { id: 2, name: "神钢工程机械", link: "/product/kobelco" },
      { id: 3, name: "小松工程机械", link: "/product/komatsu" },
    ],
    serviceItems: [
      { id: 1, name: "保修查询", link: "/services/warranty" },
      { id: 2, name: "维修服务", link: "/services/repair" },
      { id: 3, name: "设备租赁", link: "/services/rent" },
    ],
    introItems: [{ id: 1, name: "关于我们", link: "/about-us" }],
  },
};

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
    shortName: "MÁY CÔNG TRÌNH THUẬN PHÁT",
    name: "MÁY CÔNG TRÌNH THUẬN PHÁT",
    phone: "0948 299 444",
  });
  const [bannerHeight, setBannerHeight] = useState(0);
  const [navGap, setNavGap] = useState(0);
  const [navTop, setNavTop] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [language, setLanguage] = useState<LanguageCode>(() => {
    if (typeof window === "undefined") return "vi";
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved === "vi" || saved === "en" || saved === "zh") {
      return saved;
    }
    return "vi";
  });

  const text = labels[language];

  useEffect(() => {
    async function fetchCompanyData() {
      try {
        const response = await fetch(
          toPublicPath("data/Company/DataCompany.json"),
        );
        if (!response.ok) return;
        const data = (await response.json()) as CompanyData;
        setCompanyData((prev) => ({
          shortName:
            data.shortName?.trim() || data.shortname?.trim() || prev.shortName,
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
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.documentElement.lang =
      language === "vi" ? "vi" : language === "zh" ? "zh-CN" : "en";
  }, [language]);

  return (
    <>
      <div className="header-banner">
        <div className="banner-left">
          <p className="banner-kicker">{text.kicker}</p>
          <h1 className="banner-title">
            {companyData.shortName || companyData.shortname || companyData.name}
          </h1>
        </div>
        <div
          className="banner-language"
          role="group"
          aria-label={text.languageAria}
        >
          <FaGlobe aria-hidden="true" />
          {(["vi", "en", "zh"] as LanguageCode[]).map((code) => (
            <button
              key={code}
              type="button"
              className={`lang-btn ${language === code ? "is-active" : ""}`}
              onClick={() => setLanguage(code)}
              aria-pressed={language === code}
              aria-label={languageDisplayMap[code]}
            >
              {languageDisplayMap[code]}
            </button>
          ))}
        </div>
        <div className="banner-right">
          <p className="banner-hotline-label">{text.hotlineLabel}</p>
          <a
            className="banner-hotline-value"
            href={`tel:${(companyData.phone ?? "").replace(/\s+/g, "")}`}
          >
            {companyData.phone}
          </a>
        </div>
      </div>
      <nav
        className="site-nav"
        style={{ top: `${navTop}px` }}
        aria-label={text.mainNavAria}
      >
        <button
          className="nav-toggle"
          type="button"
          aria-label={isMenuOpen ? text.closeMenu : text.openMenu}
          aria-expanded={isMenuOpen}
          aria-controls="site-nav-menu"
          onClick={() => setIsMenuOpen((prev) => !prev)}
        >
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </button>

        <Link className="nav-mobile-logo" to="/home" aria-label={text.homeAria}>
          <img src={toPublicPath("img/Logo/Logo.png")} alt="Thuận Phát" />
        </Link>

        <ul
          className={`nav-menu ${isMenuOpen ? "is-open" : ""}`}
          id="site-nav-menu"
        >
          <li className={isHomeActive ? "is-active" : ""}>
            <Link to="/home" onClick={() => setIsMenuOpen(false)}>
              {text.home}
            </Link>
          </li>
          <li className={`product-menu ${isProductActive ? "is-active" : ""}`}>
            <Link to="/product" onClick={() => setIsMenuOpen(false)}>
              {text.product} <FaCaretDown />
            </Link>
            <ul className="product-menu-item">
              {text.productItems.map((item) => (
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
              {text.services} <FaCaretDown />
            </Link>
            <ul className="product-menu-item">
              {text.serviceItems.map((item) => (
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
              {text.intro} <FaCaretDown />
            </Link>
            <ul className="product-menu-item">
              {text.introItems.map((item) => (
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
              {text.news}
            </Link>
          </li>
          <li className={isContactActive ? "is-active" : ""}>
            <Link to="/contact" onClick={() => setIsMenuOpen(false)}>
              {text.contact}
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
              placeholder={text.searchPlaceholder}
              aria-label={text.searchAria}
            />
            <button
              className="search-btn"
              type="submit"
              aria-label={text.searchAria}
            >
              <FaSearch aria-hidden="true" />
            </button>
          </form>
        </div>
      </nav>
    </>
  );
}

export default Header;
