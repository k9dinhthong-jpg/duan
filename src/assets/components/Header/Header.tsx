import { FaCaretDown, FaSearch } from "react-icons/fa";
import { productItem, serviceItem, introductionItem } from "./DataHeader";
import "./Header.css";
import useHeader from "./UseHeader";

function Header() {
  const { isSticky, navTop } = useHeader();
  return (
    <>
      {/* Thanh Banner */}
      <div className="header-banner">
        <h1 className="banner-left">THUẬN PHÁT MÁY CÔNG TRÌNH</h1>
        <h1 className="banner-right">HOTLINE: 0948 299 444</h1>
      </div>
      {/* Thanh Điều hướng  */}
      <nav
        className={`site-nav ${isSticky ? "sticky" : ""}`}
        style={{ top: `${navTop}px` }}
      >
        <ul className="nav-menu">
          <li>
            <a href="#">TRANG CHỦ</a>
          </li>
          <li className="product-menu">
            <a href="#">
              SẢN PHẨM <FaCaretDown />
            </a>
            <ul className="product-menu-item">
              {productItem.map((item) => (
                <li key={item.id}>
                  <a href="#">{item.name}</a>
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
                  <a href="#">{item.name}</a>
                </li>
              ))}
            </ul>
          </li>
          <li>
            <a href="#">TIN TỨC</a>
          </li>
          <li>
            <a href="#">LIÊN HỆ</a>
          </li>
          <li className="search-item">
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
          </li>
        </ul>
      </nav>
    </>
  );
}

export default Header;
