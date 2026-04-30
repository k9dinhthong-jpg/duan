import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FaFacebookF,
  FaInstagram,
  FaTelegramPlane,
  FaTiktok,
  FaWeixin,
} from "react-icons/fa";
import "./Contact.css";
import { useCompanyInfo } from "../../context/CompanyInfoContext";

type ContactFormValues = {
  fullName: string;
  email: string;
  phone: string;
  message: string;
};

type ContactFormErrors = Partial<Record<keyof ContactFormValues, string>>;

type SubmitState = {
  type: "idle" | "success" | "error";
  message: string;
};

function ensureHttp(url?: string) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

function sanitizeTel(phone?: string) {
  return (phone ?? "").replace(/\s+/g, "");
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhone(value: string) {
  return /^\+?[0-9\s().-]{8,20}$/.test(value);
}

function validateField(
  key: keyof ContactFormValues,
  value: string,
): string | undefined {
  const trimmed = value.trim();

  if (!trimmed) {
    if (key === "fullName") return "Vui lòng nhập họ và tên.";
    if (key === "email") return "Vui lòng nhập email.";
    if (key === "phone") return "Vui lòng nhập số điện thoại.";
    return "Vui lòng nhập nội dung liên hệ.";
  }

  if (key === "fullName" && trimmed.length < 2) {
    return "Họ và tên cần ít nhất 2 ký tự.";
  }

  if (key === "email" && !isValidEmail(trimmed)) {
    return "Email chưa đúng định dạng.";
  }

  if (key === "phone" && !isValidPhone(trimmed)) {
    return "Số điện thoại chưa đúng định dạng.";
  }

  if (key === "message" && trimmed.length < 10) {
    return "Nội dung cần ít nhất 10 ký tự.";
  }

  return undefined;
}

function validateForm(values: ContactFormValues): ContactFormErrors {
  const errors: ContactFormErrors = {};

  (Object.keys(values) as Array<keyof ContactFormValues>).forEach((key) => {
    const error = validateField(key, values[key]);
    if (error) {
      errors[key] = error;
    }
  });

  return errors;
}

function Contact() {
  const [searchParams] = useSearchParams();
  const { companyInfo: companyData } = useCompanyInfo();
  const [formValues, setFormValues] = useState<ContactFormValues>({
    fullName: "",
    email: "",
    phone: "",
    message: searchParams.get("product")
      ? `Tôi cần tư vấn sản phẩm: ${searchParams.get("product")}`
      : "",
  });
  const [formErrors, setFormErrors] = useState<ContactFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>({
    type: "idle",
    message: "",
  });
  const companyDisplayName = companyData.shortName || companyData.name;
  const phoneNumber = companyData.phone.trim();
  const emailAddress = companyData.email.trim();
  const officeAddress = companyData.address.trim();
  const mapAddress = companyData.mapAddress.trim();

  useEffect(() => {
    const requestedProduct = searchParams.get("product");
    if (!requestedProduct) return;

    setFormValues((prev) => ({
      ...prev,
      message: `Tôi cần tư vấn sản phẩm: ${requestedProduct}`,
    }));
  }, [searchParams]);

  const websiteUrl = useMemo(
    () => ensureHttp(companyData.website),
    [companyData.website],
  );

  const socialItems = useMemo(
    () =>
      [
        {
          key: "facebook",
          label: "Facebook",
          href: companyData.facebook,
          icon: <FaFacebookF aria-hidden="true" />,
        },
        {
          key: "zalo",
          label: "Zalo",
          href: companyData.zalo,
          icon: <span className="contact-social-zalo">Zalo</span>,
        },
        {
          key: "wechat",
          label: "WeChat",
          href: companyData.wechat,
          icon: <FaWeixin aria-hidden="true" />,
        },
        {
          key: "telegram",
          label: "Telegram",
          href: companyData.telegram,
          icon: <FaTelegramPlane aria-hidden="true" />,
        },
        {
          key: "tiktok",
          label: "TikTok",
          href: companyData.tiktok,
          icon: <FaTiktok aria-hidden="true" />,
        },
        {
          key: "instagram",
          label: "Instagram",
          href: companyData.instagram,
          icon: <FaInstagram aria-hidden="true" />,
        },
      ].filter((item) => item.href && item.href !== "#"),
    [companyData],
  );

  const handleFieldChange = (key: keyof ContactFormValues, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));

    setFormErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleFieldBlur = (key: keyof ContactFormValues) => {
    const error = validateField(key, formValues[key]);
    setFormErrors((prev) => ({ ...prev, [key]: error }));
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    const errors = validateForm(formValues);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      setSubmitState({
        type: "error",
        message: "Vui lòng kiểm tra lại thông tin trước khi gửi.",
      });
      return;
    }

    if (!emailAddress) {
      setSubmitState({
        type: "error",
        message: "Chưa cấu hình email nhận liên hệ.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitState({ type: "idle", message: "" });

      const response = await fetch(
        `https://formsubmit.co/ajax/${encodeURIComponent(emailAddress)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            _subject: companyDisplayName
              ? `Lien he moi tu website - ${companyDisplayName}`
              : "Lien he moi tu website",
            _template: "table",
            fullName: formValues.fullName,
            email: formValues.email,
            phone: formValues.phone,
            message: formValues.message,
            source: "contact-page",
          }),
        },
      );

      if (!response.ok) {
        throw new Error("submit-failed");
      }

      setSubmitState({
        type: "success",
        message:
          "Đã gửi liên hệ thành công. Chúng tôi sẽ phản hồi sớm nhất có thể.",
      });
      setFormValues({ fullName: "", email: "", phone: "", message: "" });
      setFormErrors({});
    } catch {
      setSubmitState({
        type: "error",
        message:
          "Không thể gửi liên hệ lúc này. Vui lòng gọi hotline để được hỗ trợ nhanh.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="contact-page">
      <div className="contact-map">
        {mapAddress ? (
          <iframe
            title="Bản đồ công ty"
            src={mapAddress}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        ) : null}
      </div>
      <div className="contact-info">
        {companyDisplayName ? <h2>{companyDisplayName}</h2> : null}
        <ul className="contact-list">
          {officeAddress ? (
            <li>
              <p>Địa chỉ: {officeAddress}</p>
            </li>
          ) : null}
          {phoneNumber ? (
            <li>
              <p>
                Điện thoại:{" "}
                <a href={`tel:${sanitizeTel(phoneNumber)}`}>{phoneNumber}</a>
              </p>
            </li>
          ) : null}
          {emailAddress ? (
            <li>
              <p>
                Email:<a href={`mailto:${emailAddress}`}>{emailAddress}</a>
              </p>
            </li>
          ) : null}
          {websiteUrl ? (
            <li>
              <p>
                Website:{" "}
                <a href={websiteUrl} target="_blank" rel="noreferrer">
                  {companyData.website}
                </a>
              </p>
            </li>
          ) : null}
          <li className="contact-meta-item">
            <p>
              Giờ làm việc: <strong>Thứ 2 - Thứ 7, 08:00 - 17:30</strong>
            </p>
          </li>
          <li className="contact-meta-item">
            <p>
              Thời gian phản hồi: <strong>Trong 30 phút giờ hành chính</strong>,
              tối đa 24h ngoài giờ.
            </p>
          </li>
        </ul>

        {socialItems.length > 0 && (
          <div className="contact-social-wrap">
            <p className="contact-social-title">Kênh liên hệ nhanh</p>
            <ul className="contact-social-list">
              {socialItems.map((item) => (
                <li key={item.key}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={item.label}
                    title={item.label}
                  >
                    {item.icon}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="contact-form-wrap">
        <h2>Liên hệ với chúng tôi</h2>
        <form className="contact-form" onSubmit={handleSubmit} noValidate>
          <div className="contact-form-field">
            <label htmlFor="contact-fullname">Họ và tên</label>
            <input
              id="contact-fullname"
              type="text"
              placeholder="Nhập họ và tên"
              value={formValues.fullName}
              onChange={(e) => handleFieldChange("fullName", e.target.value)}
              onBlur={() => handleFieldBlur("fullName")}
              required
              aria-invalid={Boolean(formErrors.fullName)}
            />
            {formErrors.fullName && (
              <p className="contact-form-error">{formErrors.fullName}</p>
            )}
          </div>

          <div className="contact-form-field">
            <label htmlFor="contact-email">Email</label>
            <input
              id="contact-email"
              type="email"
              placeholder="Nhập email"
              value={formValues.email}
              onChange={(e) => handleFieldChange("email", e.target.value)}
              onBlur={() => handleFieldBlur("email")}
              required
              aria-invalid={Boolean(formErrors.email)}
            />
            {formErrors.email && (
              <p className="contact-form-error">{formErrors.email}</p>
            )}
          </div>

          <div className="contact-form-field">
            <label htmlFor="contact-phone">Số điện thoại</label>
            <input
              id="contact-phone"
              type="tel"
              placeholder="Nhập số điện thoại"
              value={formValues.phone}
              onChange={(e) => handleFieldChange("phone", e.target.value)}
              onBlur={() => handleFieldBlur("phone")}
              required
              aria-invalid={Boolean(formErrors.phone)}
            />
            {formErrors.phone && (
              <p className="contact-form-error">{formErrors.phone}</p>
            )}
          </div>

          <div className="contact-form-field">
            <label htmlFor="contact-message">Nội dung liên hệ</label>
            <textarea
              id="contact-message"
              placeholder="Nhập nội dung liên hệ"
              value={formValues.message}
              onChange={(e) => handleFieldChange("message", e.target.value)}
              onBlur={() => handleFieldBlur("message")}
              required
              aria-invalid={Boolean(formErrors.message)}
            ></textarea>
            {formErrors.message && (
              <p className="contact-form-error">{formErrors.message}</p>
            )}
          </div>

          {submitState.type !== "idle" && (
            <p
              className={`contact-form-status ${
                submitState.type === "success" ? "is-success" : "is-error"
              }`}
              role="status"
            >
              {submitState.message}
            </p>
          )}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Đang gửi..." : "Gửi"}
          </button>
        </form>
      </div>
    </section>
  );
}

export default Contact;
