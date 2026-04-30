import "./Home.css";

type StatCard = {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down";
};

type Order = {
  id: string;
  customer: string;
  item: string;
  total: number;
  status: "Paid" | "Pending" | "Failed";
};

const statCards: StatCard[] = [
  { label: "Doanh thu", value: "$48,260", delta: "+12.4%", trend: "up" },
  { label: "Đơn hàng", value: "1,284", delta: "+8.1%", trend: "up" },
  { label: "Hoàn tiền", value: "41", delta: "-3.2%", trend: "down" },
  { label: "Tỷ lệ chuyển đổi", value: "5.8%", delta: "+1.1%", trend: "up" },
];

const recentOrders: Order[] = [
  {
    id: "#A-2301",
    customer: "Trần Quang",
    item: "Gói Khởi động",
    total: 29,
    status: "Paid",
  },
  {
    id: "#A-2302",
    customer: "Lê Huyền",
    item: "Gói Nhóm",
    total: 129,
    status: "Pending",
  },
  {
    id: "#A-2303",
    customer: "Nguyễn Vũ",
    item: "Gói Nâng cao",
    total: 399,
    status: "Paid",
  },
  {
    id: "#A-2304",
    customer: "Minh Châu",
    item: "Gói Khởi động",
    total: 29,
    status: "Failed",
  },
];

function Home() {
  return (
    <section className="home">
      <header className="topbar">
        <div>
          <p className="eyebrow">Tổng hợp</p>
          <h1>Tổng quan</h1>
        </div>
        <button className="primary-btn" type="button">
          Tạo báo cáo
        </button>
      </header>

      <section className="stats-grid" aria-label="Chỉ số chính">
        {statCards.map((card) => (
          <article key={card.label} className="stat-card">
            <p className="stat-label">{card.label}</p>
            <p className="stat-value">{card.value}</p>
            <p
              className={`stat-delta ${card.trend === "up" ? "is-up" : "is-down"}`}
            >
              {card.delta} so với tuần trước
            </p>
          </article>
        ))}
      </section>

      <section className="content-grid">
        <article className="panel">
          <div className="panel-head">
            <h2>Đơn hàng gần đây</h2>
            <button className="ghost-btn" type="button">
              Xem tất cả
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Khách hàng</th>
                  <th>Gói</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.customer}</td>
                    <td>{order.item}</td>
                    <td>${order.total.toFixed(2)}</td>
                    <td>
                      <span
                        className={`badge badge-${order.status.toLowerCase()}`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel panel-feed">
          <div className="panel-head">
            <h2>Nhật ký hoạt động</h2>
          </div>
          <ul className="timeline">
            <li>
              <strong>09:15</strong>
              <span>Phát sinh đơn hàng mới từ gói Nhóm.</span>
            </li>
            <li>
              <strong>10:02</strong>
              <span>Voucher SUMMER20 được áp dụng bởi 3 khách hàng.</span>
            </li>
            <li>
              <strong>11:36</strong>
              <span>Đồng bộ tồn kho hoàn tất cho 42 sản phẩm.</span>
            </li>
            <li>
              <strong>13:08</strong>
              <span>Thu lại thanh toán thành công cho đơn #A-2302.</span>
            </li>
          </ul>
        </article>
      </section>
    </section>
  );
}

export default Home;
