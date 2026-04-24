import iconZalo from "./img/Zalo.svg.png";
import qrWeChat from "./img/IDWECHAT.jpg";
import "./ButtonContact.css";

function ButtonContact() {
  return (
    <div>
      <section>
        <div className="contact-fixed">
          <a
            href="https://zalo.me/0966121686"
            className="contact-btn zalo"
            target="_blank"
            rel="noreferrer"
          >
            <img src={iconZalo} alt="Zalo" />
          </a>

          <a
            href={qrWeChat}
            className="contact-btn wechat"
            target="_blank"
            rel="noreferrer"
            aria-label="WeChat QR"
          >
            <i className="fa-brands fa-weixin"></i>
          </a>

          <a
            href="https://t.me/sugar88_vn"
            className="contact-btn telegram"
            target="_blank"
            rel="noreferrer"
            aria-label="Telegram"
          >
            <i className="fa-brands fa-telegram"></i>
          </a>

          <a
            href="https://www.tiktok.com/@sugar88_vn"
            className="contact-btn tiktok"
            target="_blank"
            rel="noreferrer"
            aria-label="TikTok"
          >
            <i className="fa-brands fa-tiktok"></i>
          </a>

          <a href="tel:0948299444" className="contact-btn phone">
            <span className="phone-ripple phone-ripple--1"></span>
            <span className="phone-ripple phone-ripple--2"></span>
            <i className="fa-solid fa-phone"></i>
          </a>
        </div>
      </section>
    </div>
  );
}
export default ButtonContact;
