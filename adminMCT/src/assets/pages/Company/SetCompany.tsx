import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import "./SetCompany.css";
import BasicInfomation from "./BasicInfomation/BasicInfomation";
import LegalandContact from "./LegalandContact/LegalandContact";
import SocialNetWork from "./SocialNetWork/SocialNetWork";
import ImageandMedia from "./ImageandMedia/ImageandMedia";
import Seo from "./Seo/Seo";
import System from "./System/System";
import {
  createCustomField,
  defaultCompanyInfo,
  loadCompanyFromApi,
  loadCompanyFromDatabase,
  saveCompanyToApi,
  saveCompanyToDatabase,
  type CompanyInfo,
  type TabKey,
} from "./companyModel";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "basic", label: "Thông tin cơ bản" },
  { key: "legal", label: "Pháp lý & Liên hệ" },
  { key: "social", label: "Mạng xã hội" },
  { key: "media", label: "Hình ảnh & Media" },
  { key: "seo", label: "SEO" },
  { key: "system", label: "Hệ thống" },
];

function SetCompany() {
  const [form, setForm] = useState<CompanyInfo>(defaultCompanyInfo);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [activeTab, setActiveTab] = useState<TabKey>("basic");

  useEffect(() => {
    let cancelled = false;

    async function bootstrapCompany() {
      const localData = loadCompanyFromDatabase();
      if (!cancelled) {
        setForm(localData);
      }

      const apiData = await loadCompanyFromApi();
      if (apiData && !cancelled) {
        setForm(apiData);
        saveCompanyToDatabase(apiData);
      }
    }

    void bootstrapCompany();

    return () => {
      cancelled = true;
    };
  }, []);

  const canSubmit = useMemo(() => {
    return (
      form.short_name.trim() &&
      form.full_name.trim() &&
      form.email.trim() &&
      form.phone.trim()
    );
  }, [form]);

  function updateField<K extends keyof CompanyInfo>(
    field: K,
    value: CompanyInfo[K],
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function addCustomField() {
    setForm((prev) => ({
      ...prev,
      custom_fields: [...prev.custom_fields, createCustomField()],
    }));
  }

  function updateCustomField(
    id: string,
    field: "key" | "label" | "value",
    value: string,
  ) {
    setForm((prev) => ({
      ...prev,
      custom_fields: prev.custom_fields.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    }));
  }

  function removeCustomField(id: string) {
    setForm((prev) => ({
      ...prev,
      custom_fields: prev.custom_fields.filter((item) => item.id !== id),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      setMessage(
        "Vui lòng nhập đủ tên ngắn, tên đầy đủ, email và số điện thoại.",
      );
      return;
    }

    setIsSaving(true);
    setMessage("");

    const payload: CompanyInfo = {
      ...form,
      id: defaultCompanyInfo.id,
      updated_at: new Date().toISOString().slice(0, 19).replace("T", " "),
    };

    saveCompanyToDatabase(payload);
    setForm(payload);

    const apiResult = await saveCompanyToApi(payload);
    if (apiResult.ok) {
      setMessage(
        "Đã cập nhật thông tin công ty và đồng bộ database thành công.",
      );
    } else {
      setMessage(
        `Đã lưu local. Chưa đồng bộ API: ${apiResult.message ?? "Không rõ lỗi."}`,
      );
    }

    setIsSaving(false);
  }

  return (
    <section className="company-page">
      <header className="topbar">
        <div>
          <p className="eyebrow">Thiết lập</p>
          <h1>Thông tin công ty</h1>
        </div>
      </header>

      <form className="company-form" onSubmit={handleSubmit}>
        <nav className="co-tabs" aria-label="Nhóm cài đặt công ty">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`co-tab-btn${activeTab === tab.key ? " co-tab-btn--active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === "basic" && (
          <BasicInfomation form={form} updateField={updateField} />
        )}

        {activeTab === "legal" && (
          <LegalandContact form={form} updateField={updateField} />
        )}

        {activeTab === "social" && (
          <SocialNetWork
            facebook={form.facebook}
            zalo={form.zalo}
            whatsapp={form.whatsapp}
            telegram={form.telegram}
            tiktok={form.tiktok}
            instagram={form.instagram}
            youtube={form.youtube}
            wechat={form.wechat}
            updateField={updateField}
          />
        )}

        {activeTab === "media" && (
          <ImageandMedia form={form} updateField={updateField} />
        )}

        {activeTab === "seo" && <Seo form={form} updateField={updateField} />}

        {activeTab === "system" && (
          <System
            form={form}
            updateField={updateField}
            addCustomField={addCustomField}
            updateCustomField={updateCustomField}
            removeCustomField={removeCustomField}
          />
        )}

        <div className="co-save-bar">
          {message ? (
            <p
              className={`co-save-msg${message.includes("Vui lòng") ? " co-save-msg--error" : ""}`}
            >
              {message}
            </p>
          ) : (
            <span />
          )}
          <button className="primary-btn" type="submit" disabled={isSaving}>
            {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default SetCompany;
