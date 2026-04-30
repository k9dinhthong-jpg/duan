import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  extractRecord,
  getConfiguredApiPath,
  requestJson,
} from "../lib/apiClient";
import { warnMissingFields } from "../lib/schemaGuard";

export type IntroCompanyInfo = {
  introImage?: string;
};

type IntroCompanyContextValue = {
  introInfo: IntroCompanyInfo;
  isLoading: boolean;
  error: string | null;
};

const IntroCompanyContext = createContext<IntroCompanyContextValue | undefined>(
  undefined,
);

const introApiPath = getConfiguredApiPath(
  "VITE_API_COMPANY_INFO_PATH",
  "/api/company-info",
);

function normalizeText(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
}

export function IntroCompanyProvider({ children }: { children: ReactNode }) {
  const [introInfo, setIntroInfo] = useState<IntroCompanyInfo>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchIntroInfo() {
      try {
        const payload = await requestJson(introApiPath);
        const data = extractRecord(payload);

        if (!isMounted || !data) {
          if (isMounted) setIsLoading(false);
          return;
        }

        warnMissingFields(data, ["intro_image"], "IntroCompany");

        setIntroInfo({
          introImage: normalizeText(data.intro_image) ?? undefined,
        });
        setError(null);
      } catch (unknownError) {
        if (!isMounted) return;
        setError(
          unknownError instanceof Error
            ? unknownError.message
            : "Không thể tải dữ liệu intro từ backend.",
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchIntroInfo();
    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({ introInfo, isLoading, error }),
    [introInfo, isLoading, error],
  );

  return (
    <IntroCompanyContext.Provider value={value}>
      {children}
    </IntroCompanyContext.Provider>
  );
}

export function useIntroCompany() {
  const context = useContext(IntroCompanyContext);
  if (!context) {
    throw new Error("useIntroCompany must be used within IntroCompanyProvider");
  }
  return context;
}
