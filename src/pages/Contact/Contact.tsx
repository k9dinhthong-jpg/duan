import "./Contact.css";

function Contact() {
  return (
    <section className="contact-page">
      <div className="contact-map">
        <iframe
          title="Bản đồ công ty"
          src="https://www.google.com/maps?q=X%C3%A3%20T%E1%BB%81%20L%E1%BB%97%2C%20Ph%C3%BA%20Th%E1%BB%8D%2C%20Vi%E1%BB%87t%20Nam&output=embed"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
      <div className="contact-info">
        <h2>Máy Công Trình Thuận Phát</h2>
        <ul className="contact-list">
          <li>
            <p>Địa chỉ: Số 168 - Khu 4 - Xã Tề Lỗ - Tỉnh Phú Thọ</p>
          </li>
          <li>
            <p>
              Điện thoại: <a href="tel:0948299444">0948 299 444</a>
            </p>
          </li>
          <li>
            <p>
              Email:
              <a href="mailto:k9dinhthong@gmail.com">k9dinhthong@gmail.com</a>
            </p>
          </li>
          <li>
            <p>
              Website:{" "}
              <a
                href="https://maycongtrinhthuanphat.com"
                target="_blank"
                rel="noreferrer"
              >
                maycongtrinhthuanphat.com
              </a>
            </p>
          </li>
        </ul>
      </div>
      <div className="contact-form-wrap">
        <h2>Liên hệ với chúng tôi</h2>
        <form className="contact-form">
          <input type="text" placeholder="Họ và tên" required />
          <input type="email" placeholder="Email" required />
          <input type="text" placeholder="Số điện thoại" required />
          <textarea placeholder="Nội dung liên hệ" required></textarea>
          <button type="submit">Gửi</button>
        </form>
      </div>
    </section>
  );
}

export default Contact;
