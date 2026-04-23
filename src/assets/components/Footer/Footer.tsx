import {
  FaAngleRight,
  FaEnvelope,
  FaFacebookF,
  FaGlobe,
  FaInstagram,
  FaMapMarkerAlt,
  FaPhoneAlt,
} from "react-icons/fa";
import { FaTiktok } from "react-icons/fa6";
import "./Footer.css";

function Footer() {
  return (
    <div className="site-footer">
      <section className="footer-top">
        <div className="footer-col footer-company">
          <h3 className="footer-heading">Thuận Phát Máy Công Trình</h3>
          <p className="footer-text">
            Công ty TNHH sản xuất kinh doanh xuất nhập khẩu <br /> máy công
            trình Thuận Phát.
          </p>
          <ul className="footer-contact-list">
            <li>
              <FaMapMarkerAlt />
              <span>Số 168 - Khu 4 - Xã Tề Lỗ - Tỉnh Phú Thọ</span>
            </li>
            <li>
              <FaPhoneAlt />
              <a href="tel:0948299444">0948 299 444</a>
            </li>
            <li>
              <FaEnvelope />
              <a href="mailto:k9dinhthong@gmail.com">k9dinhthong@gmail.com</a>
            </li>
            <li>
              <FaGlobe />
              <a
                href="https://maycongtrinhthuanphat.com"
                target="_blank"
                rel="noreferrer"
              >
                maycongtrinhthuanphat.com
              </a>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h3 className="footer-heading">Chính Sách</h3>
          <nav aria-label="Chinh sach">
            <ul className="footer-link-list">
              <li>
                <FaAngleRight />
                <a href="#">Chính sách bảo mật</a>
              </li>
              <li>
                <FaAngleRight />
                <a href="#">Điều khoản sử dụng</a>
              </li>
              <li>
                <FaAngleRight />
                <a href="#">Chính sách bảo hành</a>
              </li>
              <li>
                <FaAngleRight />
                <a href="#">Chính sách thanh toán</a>
              </li>
              <li>
                <FaAngleRight />
                <a href="#">Chính sách vận chuyển</a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="footer-col">
          <h3 className="footer-heading">Danh Mục Sản Phẩm</h3>
          <nav aria-label="Danh muc san pham">
            <ul className="footer-link-list">
              <li>
                <FaAngleRight />
                <a href="#">Máy xúc bánh lốp</a>
              </li>
              <li>
                <FaAngleRight />
                <a href="#">Máy xúc bánh xích</a>
              </li>
              <li>
                <FaAngleRight />
                <a href="#">Máy xúc lật</a>
              </li>
              <li>
                <FaAngleRight />
                <a href="#">Máy ủi</a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="footer-col">
          <h3 className="footer-heading">Kết Nối Với Chúng Tôi</h3>
          <p className="footer-text">
            Theo dõi để cập nhật sản phẩm và ưu đãi mới.
          </p>
          <nav aria-label="Mang xa hoi">
            <ul className="footer-social-list">
              <li>
                <a href="#" aria-label="Facebook">
                  <FaFacebookF />
                </a>
              </li>
              <li>
                <a href="#" aria-label="Instagram">
                  <FaInstagram />
                </a>
              </li>
              <li>
                <a href="#" aria-label="TikTok">
                  <FaTiktok />
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </section>

      <section className="footer-bottom">
        <div>
          Copyright © Thuận Phát Máy Công Trình 2026. All rights reserved.
        </div>
      </section>
    </div>
  );
}

export default Footer;
