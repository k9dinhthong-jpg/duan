export type TabKey = "basic" | "legal" | "social" | "media" | "seo" | "system";

export type CustomField = {
  id: string;
  key: string;
  label: string;
  value: string;
};

export type CompanyInfo = {
  id: number;
  short_name: string;
  full_name: string;
  slogan: string;
  about: string;
  tax_code: string;
  business_license: string;
  legal_representative: string;
  established_year: number;
  phone: string;
  hotline: string;
  email: string;
  contact_email: string;
  website: string;
  address: string;
  map_address: string;
  google_map_embed: string;
  facebook: string;
  zalo: string;
  whatsapp: string;
  telegram: string;
  tiktok: string;
  instagram: string;
  youtube: string;
  wechat: string;
  logo_url: string;
  intro_image: string;
  og_image: string;
  favicon_url: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  copyright_text: string;
  working_hours: string;
  is_active: 0 | 1;
  created_at: string;
  updated_at: string;
  custom_fields: CustomField[];
};

export type UpdateCompanyField = <K extends keyof CompanyInfo>(
  field: K,
  value: CompanyInfo[K],
) => void;

export type UpdateCustomField = (
  id: string,
  field: keyof Omit<CustomField, "id">,
  value: string,
) => void;

export const COMPANY_STORAGE_KEY = "adminmct:company-info";
const COMPANY_API_ENDPOINT = "/api/company-info";

export const defaultCompanyInfo: CompanyInfo = {
  id: 1,
  short_name: "MÁY CÔNG TRÌNH NHẬP KHẨU",
  full_name: "Công Ty Xuất Nhập Khẩu Máy Công Trình",
  slogan: "Máy Công Trình Chất Lượng Cao",
  about:
    "Chuyên cung cấp máy công trình nhập khẩu chính hãng, bao gồm máy xúc, máy đào, máy ủi các thương hiệu KOBELCO, KOMATSU, HITACHI. Cam kết chất lượng và dịch vụ hậu mãi tận tâm.",
  tax_code: "Đang cập nhật",
  business_license: "",
  legal_representative: "",
  established_year: 2020,
  phone: "0966121686",
  hotline: "0966121686",
  email: "k9dinhthong@gmail.com",
  contact_email: "k9dinhthong@gmail.com",
  website: "https://maycongtrinhnhapkhau.com.vn",
  address: "Số 168 - Khu 4 - Xã Tế Lỗ",
  map_address: "https://www.google.com/maps",
  google_map_embed: "",
  facebook: "https://www.facebook.com/",
  zalo: "https://zalo.me/0966121686",
  whatsapp: "",
  telegram: "https://t.me/sugar88_vr",
  tiktok: "https://www.tiktok.com/",
  instagram: "#",
  youtube: "#",
  wechat: "https://ehsccjufbaehvfo",
  logo_url: "/img/Logo/Logo.png",
  intro_image: "/img/IntroCompany/Company.png",
  og_image: "/img/Logo/Logo.png",
  favicon_url: "/img/Logo/Favicon.png",
  meta_title: "KOBELCO - KOMATSU - HITACHI",
  meta_description:
    "Chuyên mua bán máy công trình nhập khẩu, máy xúc, máy đào, máy ủi, phụ tùng và dịch vụ liên quan.",
  meta_keywords:
    "máy công trình, máy xúc, máy đào, kobelco, komatsu, hitachi, máy công trình nhập khẩu",
  copyright_text:
    "© 2026 Công Ty Xuất Nhập Khẩu Máy Công Trình. All rights reserved.",
  working_hours: "Thứ 2 - Chủ nhật: 08:00 - 18:00",
  is_active: 1,
  created_at: "2026-04-27 14:37:16",
  updated_at: "2026-04-28 10:58:03",
  custom_fields: [],
};

export function loadCompanyFromDatabase(): CompanyInfo {
  const raw = localStorage.getItem(COMPANY_STORAGE_KEY);
  if (!raw) {
    return defaultCompanyInfo;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<CompanyInfo>;
    return {
      ...defaultCompanyInfo,
      ...parsed,
      custom_fields: Array.isArray(parsed.custom_fields)
        ? parsed.custom_fields
        : defaultCompanyInfo.custom_fields,
    };
  } catch {
    return defaultCompanyInfo;
  }
}

export function saveCompanyToDatabase(company: CompanyInfo): void {
  localStorage.setItem(COMPANY_STORAGE_KEY, JSON.stringify(company));
}

function getAuthToken(): string {
  return localStorage.getItem("adminmct:token") ?? "";
}

function normalizeCompanyFromApi(data: Partial<CompanyInfo>): CompanyInfo {
  return {
    ...defaultCompanyInfo,
    ...data,
    custom_fields: Array.isArray(data.custom_fields)
      ? data.custom_fields
      : defaultCompanyInfo.custom_fields,
  };
}

export async function loadCompanyFromApi(): Promise<CompanyInfo | null> {
  const token = getAuthToken();
  if (!token) {
    return null;
  }

  try {
    const res = await fetch(COMPANY_API_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as Partial<CompanyInfo>;
    return normalizeCompanyFromApi(data);
  } catch {
    return null;
  }
}

type SaveCompanyApiResult = {
  ok: boolean;
  message?: string;
};

export async function saveCompanyToApi(
  company: CompanyInfo,
): Promise<SaveCompanyApiResult> {
  const token = getAuthToken();
  if (!token) {
    return { ok: false, message: "Thiếu token đăng nhập." };
  }

  try {
    const res = await fetch(COMPANY_API_ENDPOINT, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(company),
    });

    if (!res.ok) {
      let message = "Đồng bộ API thất bại.";
      try {
        const data = (await res.json()) as { message?: string };
        message = data.message ?? message;
      } catch {
        // Keep fallback message when response is not JSON.
      }
      return { ok: false, message };
    }

    return { ok: true };
  } catch {
    return { ok: false, message: "Không kết nối được API company-info." };
  }
}

export function createCustomField(): CustomField {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    key: "",
    label: "",
    value: "",
  };
}
