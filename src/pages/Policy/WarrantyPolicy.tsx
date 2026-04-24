import "./PolicyPage.css";

function WarrantyPolicy() {
  return (
    <section className="policy-page">
      <h1 className="policy-title">Chính sách bảo hành</h1>
      <p className="policy-updated">Cập nhật: 24/04/2026</p>
      <ul className="policy-list">
        <li>
          Thời gian bảo hành cụ thể áp dụng theo từng dòng máy và hợp đồng.
        </li>
        <li>Sản phẩm cần có đủ hồ sơ mua bán để được tiếp nhận bảo hành.</li>
        <li>Hỗ trợ kỹ thuật từ xa và trực tiếp theo khu vực triển khai.</li>
      </ul>
    </section>
  );
}

export default WarrantyPolicy;
