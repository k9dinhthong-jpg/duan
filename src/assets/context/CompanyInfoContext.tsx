import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "../../lib/supabaseClient";

export type CompanyInfo = {
  name: string;
  shortName: string;
  shortname: string;
  taxCode: string;
  establishedYear: string;
  phone: string;
  address: string;
  mapAddress: string;
  email: string;
  website: string;
  facebook: string;
  zalo: string;
  wechat: string;
  telegram: string;
  tiktok: string;
  instagram: string;
};

type CompanyInfoContextValue = {
  companyInfo: CompanyInfo;
  isLoading: boolean;
  error: string | null;
};

const defaultCompanyInfo: CompanyInfo = {
  name: "Công Ty Xuất Nhập Khẩu Máy Công Trình Thuận Phát",
  shortName: "MÁY CÔNG TRÌNH THUẬN PHÁT",
  shortname: "MÁY CÔNG TRÌNH THUẬN PHÁT",
  taxCode: "Đang cập nhật",
  establishedYear: "2020",
  phone: "0966 121 686",
  address: "Số 168 - Khu 4 - Xã Tề Lỗ - Tỉnh Phú Thọ",
  mapAddress:
    "https://www.google.com/maps?q=X%C3%A3%20T%E1%BB%81%20L%E1%BB%97%2C%20Ph%C3%BA%20Th%E1%BB%8D%2C%20Vi%E1%BB%87t%20Nam&output=embed",
  email: "k9dinhthong@gmail.com",
  website: "maycongtrinhthuanphat.com",
  facebook: "#",
  zalo: "https://zalo.me/0966121686",
  wechat: "#",
  telegram: "https://t.me/sugar88_vn",
  tiktok: "https://www.tiktok.com/@sugar88_vn",
  instagram: "#",
};

const CompanyInfoContext = createContext<CompanyInfoContextValue | undefined>(
  undefined,
);

function normalizeText(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (typeof value === "number") {
    return `${value}`;
  }

  return undefined;
}

export function CompanyInfoProvider({ children }: { children: ReactNode }) {
  const [companyInfo, setCompanyInfo] =
    useState<CompanyInfo>(defaultCompanyInfo);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchCompanyInfo() {
      try {
        const { data, error: fetchError } = await supabase
          .from("info_company")
          .select("*")
          .limit(1)
          .maybeSingle();

        if (fetchError) {
          if (!isMounted) return;
          setError(fetchError.message);
          setIsLoading(false);
          return;
        }

        if (!isMounted || !data) {
          if (isMounted) {
            setIsLoading(false);
          }
          return;
        }

        setCompanyInfo((prev) => ({
          ...prev,
          name: normalizeText(data.name) ?? prev.name,
          shortName:
            normalizeText(data.shortName) ??
            normalizeText(data.shortname) ??
            normalizeText(data.name) ??
            prev.shortName,
          shortname:
            normalizeText(data.shortname) ??
            normalizeText(data.shortName) ??
            normalizeText(data.name) ??
            prev.shortname,
          taxCode: normalizeText(data.taxCode) ?? prev.taxCode,
          establishedYear:
            normalizeText(data.establishedYear) ?? prev.establishedYear,
          phone: normalizeText(data.phone) ?? prev.phone,
          address: normalizeText(data.address) ?? prev.address,
          mapAddress: normalizeText(data.mapAddress) ?? prev.mapAddress,
          email: normalizeText(data.email) ?? prev.email,
          website: normalizeText(data.website) ?? prev.website,
          facebook: normalizeText(data.facebook) ?? prev.facebook,
          zalo: normalizeText(data.zalo) ?? prev.zalo,
          wechat: normalizeText(data.wechat) ?? prev.wechat,
          telegram: normalizeText(data.telegram) ?? prev.telegram,
          tiktok: normalizeText(data.tiktok) ?? prev.tiktok,
          instagram: normalizeText(data.instagram) ?? prev.instagram,
        }));
      } catch (unknownError) {
        if (!isMounted) return;
        setError(
          unknownError instanceof Error
            ? unknownError.message
            : "Không thể tải dữ liệu công ty từ Supabase.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchCompanyInfo();

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({ companyInfo, isLoading, error }),
    [companyInfo, isLoading, error],
  );

  return (
    <CompanyInfoContext.Provider value={value}>
      {children}
    </CompanyInfoContext.Provider>
  );
}

export function useCompanyInfo() {
  const context = useContext(CompanyInfoContext);
  if (!context) {
    throw new Error("useCompanyInfo must be used within CompanyInfoProvider");
  }

  return context;
}
