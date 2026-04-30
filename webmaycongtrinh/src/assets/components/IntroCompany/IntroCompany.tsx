import { useEffect, useMemo, useRef, useState } from "react";
import { FaArrowRight } from "react-icons/fa";
import { Link } from "react-router-dom";
import "./IntroCompany.css";
import { toPublicPath } from "../../../utils/publicPath";
import { useCompanyInfo } from "../../../context/CompanyInfoContext";
import { useIntroCompany } from "../../../context/IntroCompany";

function getImageSrc(image?: string) {
  if (!image) return undefined;

  const normalized = image.trim().replace(/\\/g, "/").replace(/^\.\//, "");
  if (!normalized) return undefined;

  if (/^https?:\/\//i.test(normalized)) return normalized;
  if (/^data:/i.test(normalized)) return normalized;

  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/|$)/i.test(normalized)) {
    return `https://${normalized}`;
  }

  const withoutPublicPrefix = normalized.replace(/^public\//i, "");

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  if (
    apiBaseUrl &&
    !withoutPublicPrefix.startsWith("img/") &&
    !withoutPublicPrefix.startsWith("/img/")
  ) {
    return new URL(
      withoutPublicPrefix.startsWith("/")
        ? withoutPublicPrefix
        : `/${withoutPublicPrefix}`,
      apiBaseUrl,
    ).toString();
  }

  return toPublicPath(withoutPublicPrefix);
}

function getIntroImageAlt(companyName?: string) {
  const normalizedName = companyName?.trim();
  if (!normalizedName) {
    return "Giới thiệu máy công trình nhập khẩu chất lượng cao";
  }

  return `Giới thiệu ${normalizedName} - máy công trình nhập khẩu chất lượng cao`;
}

function IntroCompany() {
  const { companyInfo } = useCompanyInfo();
  const { introInfo } = useIntroCompany();
  const companyName = companyInfo.shortName || companyInfo.name;
  const introImageCandidates = useMemo(() => {
    const resolved = getImageSrc(introInfo.introImage);
    if (!resolved) return [];
    return [resolved];
  }, [introInfo.introImage]);
  const [failedImageSrcs, setFailedImageSrcs] = useState<Set<string>>(
    () => new Set(),
  );
  const introImageSrc = useMemo(
    () => introImageCandidates.find((src) => !failedImageSrcs.has(src)),
    [introImageCandidates, failedImageSrcs],
  );
  const [isCentered, setIsCentered] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const sectionEl = sectionRef.current;
    if (!sectionEl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsCentered(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 },
    );

    observer.observe(sectionEl);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`intro-company ${isCentered ? "is-centered" : ""}`}
    >
      <div className="intro-company-inner">
        <div className="intro-company-left">
          <h2 className="intro-company-title">
            GIỚI THIỆU VỀ {companyName ? <span>{companyName}</span> : null}
          </h2>
          <p className="intro-company-desc">
            Chúng tôi chuyên cung cấp máy công trình nhập khẩu với chất lượng
            tốt, vận hành ổn định và phù hợp cho nhiều nhu cầu thi công thực tế.
            Mỗi sản phẩm đều được kiểm tra kỹ trước khi bàn giao để khách hàng
            yên tâm sử dụng.
          </p>
          <p className="intro-company-desc">
            Khách hàng được hỗ trợ chế độ bảo hành rõ ràng, đầy đủ giấy tờ theo
            xe và xuất hóa đơn thuế đầy đủ. Chúng tôi cam kết minh bạch thông
            tin, đồng hành trong suốt quá trình sử dụng và hậu mãi.
          </p>

          <Link to="/about-us" className="intro-company-btn">
            <span className="intro-company-btn-label">Tìm hiểu thêm</span>
            <span className="intro-company-btn-icon" aria-hidden="true">
              <FaArrowRight />
            </span>
          </Link>
        </div>

        {introImageSrc ? (
          <div className="intro-company-right">
            <img
              src={introImageSrc}
              alt={getIntroImageAlt(companyName)}
              onError={() => {
                setFailedImageSrcs((prev) => {
                  const next = new Set(prev);
                  next.add(introImageSrc);
                  return next;
                });
                console.warn(
                  "[IntroCompany] Cannot load image:",
                  introImageSrc,
                );
              }}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default IntroCompany;
