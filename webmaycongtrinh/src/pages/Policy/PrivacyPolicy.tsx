import "./PolicyPage.css";

function PrivacyPolicy() {
  return (
    <section className="policy-page">
      <h1 className="policy-title">Chính sách bảo mật</h1>
      <p className="policy-updated">Cập nhật: 24/04/2026</p>
      <ul className="policy-list">
        <li>
          Chúng tôi chỉ thu thập thông tin cần thiết để tư vấn sản phẩm và dịch
          vụ.
        </li>
        <li>
          Thông tin liên hệ của khách hàng không được bán hoặc chia sẻ trái
          phép.
        </li>
        <li>
          Khách hàng có thể yêu cầu chỉnh sửa hoặc xóa dữ liệu đã cung cấp.
        </li>
      </ul>
    </section>
  );
}

export default PrivacyPolicy;
