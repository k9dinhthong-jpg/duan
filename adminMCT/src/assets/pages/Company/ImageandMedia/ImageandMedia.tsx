import type { CompanyInfo, UpdateCompanyField } from "../companyModel";

type ImageandMediaProps = {
  form: CompanyInfo;
  updateField: UpdateCompanyField;
};

function ImageandMedia({ form, updateField }: ImageandMediaProps) {
  return (
    <div className="co-card">
      <div className="co-card-head">
        <h2>Hình ảnh và Media</h2>
        <p>Logo, favicon và ảnh dùng trên trang web.</p>
      </div>
      <div className="co-grid">
        <div className="co-field">
          <label htmlFor="logo_url">Logo</label>
          <input
            id="logo_url"
            type="text"
            value={form.logo_url}
            onChange={(e) => updateField("logo_url", e.target.value)}
            placeholder="/img/Logo/Logo.png"
          />
        </div>
        <div className="co-field">
          <label htmlFor="favicon_url">Favicon</label>
          <input
            id="favicon_url"
            type="text"
            value={form.favicon_url}
            onChange={(e) => updateField("favicon_url", e.target.value)}
            placeholder="/img/Logo/Favicon.png"
          />
        </div>
        <div className="co-field">
          <label htmlFor="intro_image">Ảnh giới thiệu</label>
          <input
            id="intro_image"
            type="text"
            value={form.intro_image}
            onChange={(e) => updateField("intro_image", e.target.value)}
            placeholder="/img/IntroCompany/Company.png"
          />
        </div>
        <div className="co-field">
          <label htmlFor="og_image">Ảnh chia sẻ (OG Image)</label>
          <input
            id="og_image"
            type="text"
            value={form.og_image}
            onChange={(e) => updateField("og_image", e.target.value)}
            placeholder="/img/Logo/Logo.png"
          />
        </div>
      </div>
    </div>
  );
}

export default ImageandMedia;
