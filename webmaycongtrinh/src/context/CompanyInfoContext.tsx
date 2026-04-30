import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  extractRecord,
  getConfiguredApiPath,
  requestJson,
} from "../lib/apiClient";
import { warnMissingFields } from "../lib/schemaGuard";

export type CompanyInfo = {
  name: string;
  about?: string;
  shortName: string;
  shortname: string;
  metaTitle?: string;
  slogan?: string;
  taxCode: string;
  establishedYear: string;
  phone: string;
  hotline?: string;
  address: string;
  mapAddress: string;
  mapEmbed?: string;
  email: string;
  website: string;
  facebook: string;
  zalo: string;
  wechat: string;
  telegram: string;
  tiktok: string;
  instagram: string;
  youtube?: string;
  logoUrl?: string;
  faviconUrl?: string;
  introImage?: string;
};

type CompanyInfoContextValue = {
  companyInfo: CompanyInfo;
  isLoading: boolean;
  error: string | null;
};

const companyInfoApiPath = getConfiguredApiPath(
  "VITE_API_COMPANY_INFO_PATH",
  "/api/company-info",
);

const emptyCompanyInfo: CompanyInfo = {
  name: "",
  about: "",
  shortName: "",
  shortname: "",
  metaTitle: "",
  slogan: "",
  taxCode: "",
  establishedYear: "",
  phone: "",
  hotline: "",
  address: "",
  mapAddress: "",
  mapEmbed: "",
  email: "",
  website: "",
  facebook: "",
  zalo: "",
  wechat: "",
  telegram: "",
  tiktok: "",
  instagram: "",
  youtube: "",
  logoUrl: "",
  faviconUrl: "",
  introImage: "",
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
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(emptyCompanyInfo);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchCompanyInfo() {
      try {
        const payload = await requestJson(companyInfoApiPath);
        const data = extractRecord(payload);

        if (!isMounted || !data) {
          if (isMounted) {
            setIsLoading(false);
          }
          return;
        }

        warnMissingFields(
          data,
          [
            "full_name",
            "short_name",
            "phone",
            "email",
            "address",
            "logo_url",
            "slogan",
            "about",
            "tax_code",
            "map_address",
            "google_map_embed",
            "favicon_url",
            "intro_image",
          ],
          "CompanyInfo",
        );

        setCompanyInfo({
          metaTitle: normalizeText(data.meta_title) ?? "",
          name: normalizeText(data.full_name) ?? "",
          about: normalizeText(data.about) ?? "",
          shortName: normalizeText(data.short_name) ?? "",
          shortname: normalizeText(data.short_name) ?? "",
          slogan: normalizeText(data.slogan) ?? "",
          taxCode: normalizeText(data.tax_code) ?? "",
          establishedYear: normalizeText(data.established_year) ?? "",
          phone: normalizeText(data.phone) ?? "",
          hotline: normalizeText(data.hotline) ?? "",
          address: normalizeText(data.address) ?? "",
          mapAddress: normalizeText(data.map_address) ?? "",
          mapEmbed: normalizeText(data.google_map_embed) ?? "",
          email: normalizeText(data.email) ?? "",
          website: normalizeText(data.website) ?? "",
          facebook: normalizeText(data.facebook) ?? "",
          zalo: normalizeText(data.zalo) ?? "",
          wechat: normalizeText(data.wechat) ?? "",
          telegram: normalizeText(data.telegram) ?? "",
          tiktok: normalizeText(data.tiktok) ?? "",
          instagram: normalizeText(data.instagram) ?? "",
          youtube: normalizeText(data.youtube) ?? "",
          logoUrl: normalizeText(data.logo_url) ?? "",
          faviconUrl: normalizeText(data.favicon_url) ?? "",
          introImage: normalizeText(data.intro_image) ?? "",
        });
        setError(null);
      } catch (unknownError) {
        if (!isMounted) return;
        setError(
          unknownError instanceof Error
            ? unknownError.message
            : "Không thể tải dữ liệu công ty từ backend.",
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
