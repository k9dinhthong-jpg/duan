import type { CompanyInfo, UpdateCompanyField } from "../companyModel";

type SeoProps = {
  form: CompanyInfo;
  updateField: UpdateCompanyField;
};

function Seo({ form, updateField }: SeoProps) {
  return (
    <div className="co-card">
      <div className="co-card-head">
        <h2>SEO</h2>
        <p>Thông tin tối ưu tìm kiếm cho trang chủ và trang mặc định.</p>
      </div>
      <div className="co-grid">
        <div className="co-field co-field--wide">
          <label htmlFor="meta_title">Tiêu đề SEO</label>
          <input
            id="meta_title"
            type="text"
            value={form.meta_title}
            onChange={(e) => updateField("meta_title", e.target.value)}
          />
          <span className="co-hint">
            Nên từ 50-60 ký tự. Hiện tại:{" "}
            <strong>{form.meta_title.length}</strong> ký tự.
          </span>
        </div>
        <div className="co-field co-field--wide">
          <label htmlFor="meta_description">Mô tả SEO</label>
          <textarea
            id="meta_description"
            rows={3}
            value={form.meta_description}
            onChange={(e) => updateField("meta_description", e.target.value)}
          />
          <span className="co-hint">
            Nên từ 120-160 ký tự. Hiện tại:{" "}
            <strong>{form.meta_description.length}</strong> ký tự.
          </span>
        </div>
        <div className="co-field co-field--wide">
          <label htmlFor="meta_keywords">Từ khóa SEO</label>
          <textarea
            id="meta_keywords"
            rows={3}
            value={form.meta_keywords}
            onChange={(e) => updateField("meta_keywords", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

export default Seo;
