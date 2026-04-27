import "./PolicyPage.css";

function ShippingPolicy() {
  return (
    <section className="policy-page">
      <h1 className="policy-title">Chính sách vận chuyển</h1>
      <p className="policy-updated">Cập nhật: 24/04/2026</p>
      <ul className="policy-list">
        <li>
          Phạm vi vận chuyển toàn quốc theo thỏa thuận về chi phí và thời gian.
        </li>
        <li>Thời gian giao hàng phụ thuộc tuyến đường và điều kiện thực tế.</li>
        <li>Biên bản bàn giao được lập tại thời điểm nhận máy.</li>
      </ul>
    </section>
  );
}

export default ShippingPolicy;
