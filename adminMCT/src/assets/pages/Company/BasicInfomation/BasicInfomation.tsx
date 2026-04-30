import type { CompanyInfo, UpdateCompanyField } from "../companyModel";

type BasicInfomationProps = {
  form: CompanyInfo;
  updateField: UpdateCompanyField;
};

function BasicInfomation({ form, updateField }: BasicInfomationProps) {
  return (
    <div className="co-card">
      <div className="co-card-head">
        <h2>Thông tin cơ bản</h2>
        <p>Tên, khẩu hiệu và giới thiệu hiển thị trên trang chủ.</p>
      </div>
      <div className="co-grid">
        <div className="co-field co-field--wide">
          <label htmlFor="short_name">Tên ngắn</label>
          <input
            id="short_name"
            type="text"
            value={form.short_name}
            onChange={(e) => updateField("short_name", e.target.value)}
          />
        </div>
        <div className="co-field co-field--wide">
          <label htmlFor="full_name">Tên đầy đủ</label>
          <input
            id="full_name"
            type="text"
            value={form.full_name}
            onChange={(e) => updateField("full_name", e.target.value)}
          />
        </div>
        <div className="co-field co-field--wide">
          <label htmlFor="slogan">Khẩu hiệu</label>
          <input
            id="slogan"
            type="text"
            value={form.slogan}
            onChange={(e) => updateField("slogan", e.target.value)}
            placeholder="Slogan hiển thị trên banner trang chủ"
          />
        </div>
        <div className="co-field co-field--wide">
          <label htmlFor="about">Giới thiệu công ty</label>
          <textarea
            id="about"
            rows={5}
            value={form.about}
            onChange={(e) => updateField("about", e.target.value)}
            placeholder="Đoạn mô tả ngắn về công ty, hiển thị trên trang Giới thiệu."
          />
          <span className="co-hint">
            Nên viết từ 50-150 từ, tập trung vào điểm mạnh của công ty.
          </span>
        </div>
      </div>
    </div>
  );
}

export default BasicInfomation;
