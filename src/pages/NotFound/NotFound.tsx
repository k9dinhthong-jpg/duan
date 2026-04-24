import { Link } from "react-router-dom";

function NotFound() {
  return (
    <section className="container" style={{ padding: "32px 0" }}>
      <h1>Không tìm thấy trang</h1>
      <p>Đường dẫn bạn mở không tồn tại hoặc đã thay đổi.</p>
      <Link to="/home">Quay về trang chủ</Link>
    </section>
  );
}

export default NotFound;
