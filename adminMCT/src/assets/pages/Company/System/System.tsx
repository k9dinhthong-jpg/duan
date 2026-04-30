import type {
  CompanyInfo,
  UpdateCompanyField,
  UpdateCustomField,
} from "../companyModel";

type SystemProps = {
  form: CompanyInfo;
  updateField: UpdateCompanyField;
  addCustomField: () => void;
  updateCustomField: UpdateCustomField;
  removeCustomField: (id: string) => void;
};

function System({
  form,
  updateField,
  addCustomField,
  updateCustomField,
  removeCustomField,
}: SystemProps) {
  return (
    <div className="co-card">
      <div className="co-card-head">
        <h2>Hệ thống</h2>
        <p>Trạng thái hoạt động, thông tin lưu trữ và trường tùy chỉnh.</p>
      </div>
      <div className="co-grid">
        <div className="co-field">
          <label htmlFor="is_active">Trạng thái website</label>
          <select
            id="is_active"
            value={String(form.is_active)}
            onChange={(e) =>
              updateField("is_active", Number(e.target.value) as 0 | 1)
            }
          >
            <option value="1">Hoạt động (Online)</option>
            <option value="0">Tạm dừng (Maintenance)</option>
          </select>
        </div>
        <div className="co-field">
          <label>Ngày tạo</label>
          <input type="text" value={form.created_at} readOnly />
        </div>
        <div className="co-field">
          <label>Cập nhật lần cuối</label>
          <input type="text" value={form.updated_at} readOnly />
        </div>
      </div>

      <div className="co-divider">
        <span>Trường mở rộng tùy chỉnh</span>
      </div>

      <div className="co-custom-fields">
        {form.custom_fields.length === 0 ? (
          <p className="co-empty">
            Chưa có trường nào. Nhấn "+ Thêm trường" để bắt đầu.
          </p>
        ) : null}
        {form.custom_fields.map((customField) => (
          <div className="co-custom-row" key={customField.id}>
            <div className="co-field">
              <label>Tên hiển thị</label>
              <input
                type="text"
                value={customField.label}
                onChange={(e) =>
                  updateCustomField(customField.id, "label", e.target.value)
                }
              />
            </div>
            <div className="co-field">
              <label>Khóa (key)</label>
              <input
                type="text"
                value={customField.key}
                onChange={(e) =>
                  updateCustomField(customField.id, "key", e.target.value)
                }
              />
            </div>
            <div className="co-field">
              <label>Giá trị</label>
              <input
                type="text"
                value={customField.value}
                onChange={(e) =>
                  updateCustomField(customField.id, "value", e.target.value)
                }
              />
            </div>
            <button
              type="button"
              className="co-delete-btn"
              onClick={() => removeCustomField(customField.id)}
              title="Xóa trường"
            >
              X
            </button>
          </div>
        ))}
        <button
          type="button"
          className="ghost-btn co-add-btn"
          onClick={addCustomField}
        >
          + Thêm trường
        </button>
      </div>
    </div>
  );
}

export default System;
