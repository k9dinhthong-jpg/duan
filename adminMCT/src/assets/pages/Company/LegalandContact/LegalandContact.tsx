import type { CompanyInfo, UpdateCompanyField } from "../companyModel";

type LegalandContactProps = {
  form: CompanyInfo;
  updateField: UpdateCompanyField;
};

function LegalandContact({ form, updateField }: LegalandContactProps) {
  return (
    <div className="co-card">
      <div className="co-card-head">
        <h2>Pháp lý và Liên hệ</h2>
        <p>Thông tin pháp lý, liên lạc và địa chỉ kinh doanh.</p>
      </div>
      <div className="co-grid">
        <div className="co-field">
          <label htmlFor="tax_code">Mã số thuế</label>
          <input
            id="tax_code"
            type="text"
            value={form.tax_code}
            onChange={(e) => updateField("tax_code", e.target.value)}
          />
        </div>
        <div className="co-field">
          <label htmlFor="business_license">Số đăng ký kinh doanh</label>
          <input
            id="business_license"
            type="text"
            value={form.business_license}
            onChange={(e) => updateField("business_license", e.target.value)}
            placeholder="VD: 0123456789"
          />
        </div>
        <div className="co-field">
          <label htmlFor="legal_representative">Người đại diện pháp luật</label>
          <input
            id="legal_representative"
            type="text"
            value={form.legal_representative}
            onChange={(e) =>
              updateField("legal_representative", e.target.value)
            }
            placeholder="Họ và tên người đại diện"
          />
        </div>
        <div className="co-field">
          <label htmlFor="established_year">Năm thành lập</label>
          <input
            id="established_year"
            type="number"
            value={form.established_year}
            onChange={(e) =>
              updateField("established_year", Number(e.target.value) || 0)
            }
          />
        </div>
        <div className="co-field">
          <label htmlFor="phone">Số điện thoại</label>
          <input
            id="phone"
            type="text"
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
          />
        </div>
        <div className="co-field">
          <label htmlFor="hotline">Đường dây nóng</label>
          <input
            id="hotline"
            type="text"
            value={form.hotline}
            onChange={(e) => updateField("hotline", e.target.value)}
          />
        </div>
        <div className="co-field">
          <label htmlFor="email">Email doanh nghiệp</label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
          />
        </div>
        <div className="co-field">
          <label htmlFor="contact_email">Email nhận liên hệ khách</label>
          <input
            id="contact_email"
            type="email"
            value={form.contact_email}
            onChange={(e) => updateField("contact_email", e.target.value)}
          />
        </div>
        <div className="co-field co-field--wide">
          <label htmlFor="website">Website</label>
          <input
            id="website"
            type="url"
            value={form.website}
            onChange={(e) => updateField("website", e.target.value)}
          />
        </div>
        <div className="co-field co-field--wide">
          <label htmlFor="address">Địa chỉ</label>
          <input
            id="address"
            type="text"
            value={form.address}
            onChange={(e) => updateField("address", e.target.value)}
          />
        </div>
        <div className="co-field co-field--wide">
          <label htmlFor="map_address">Link Google Maps</label>
          <input
            id="map_address"
            type="url"
            value={form.map_address}
            onChange={(e) => updateField("map_address", e.target.value)}
          />
        </div>
        <div className="co-field co-field--wide">
          <label htmlFor="google_map_embed">Mã nhúng Google Map</label>
          <textarea
            id="google_map_embed"
            rows={3}
            value={form.google_map_embed}
            onChange={(e) => updateField("google_map_embed", e.target.value)}
          />
        </div>
        <div className="co-field co-field--wide">
          <label htmlFor="working_hours">Giờ làm việc</label>
          <input
            id="working_hours"
            type="text"
            value={form.working_hours}
            onChange={(e) => updateField("working_hours", e.target.value)}
          />
        </div>
        <div className="co-field co-field--wide">
          <label htmlFor="copyright_text">Nội dung bản quyền</label>
          <input
            id="copyright_text"
            type="text"
            value={form.copyright_text}
            onChange={(e) => updateField("copyright_text", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

export default LegalandContact;
