import "./PolicyPage.css";

function PaymentPolicy() {
  return (
    <section className="policy-page">
      <h1 className="policy-title">Chính sách thanh toán</h1>
      <p className="policy-updated">Cập nhật: 24/04/2026</p>
      <ul className="policy-list">
        <li>
          Hình thức thanh toán gồm chuyển khoản và các phương án theo hợp đồng.
        </li>
        <li>Tiến độ thanh toán được xác nhận rõ trong báo giá và đơn hàng.</li>
        <li>Khách hàng nhận đầy đủ chứng từ sau khi hoàn tất thanh toán.</li>
      </ul>
    </section>
  );
}

export default PaymentPolicy;
