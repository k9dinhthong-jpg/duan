type SeoOptions = {
  title: string;
  description: string;
  image?: string;
  noIndex?: boolean;
};

const SITE_NAME = "Máy Công Trình Nhập Khẩu";

function ensureMeta(name: string, attribute: "name" | "property") {
  let tag = document.head.querySelector<HTMLMetaElement>(
    `meta[${attribute}="${name}"]`,
  );

  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attribute, name);
    document.head.appendChild(tag);
  }

  return tag;
}

function ensureCanonical() {
  let link = document.head.querySelector<HTMLLinkElement>("link[rel='canonical']");

  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }

  return link;
}

export function applySeo(options: SeoOptions) {
  const pageTitle = `${options.title} | ${SITE_NAME}`;
  const absoluteUrl = window.location.href;

  document.title = pageTitle;
  ensureMeta("description", "name").content = options.description;
  ensureMeta("robots", "name").content = options.noIndex
    ? "noindex,nofollow"
    : "index,follow";

  ensureMeta("og:type", "property").content = "website";
  ensureMeta("og:site_name", "property").content = SITE_NAME;
  ensureMeta("og:title", "property").content = pageTitle;
  ensureMeta("og:description", "property").content = options.description;
  ensureMeta("og:url", "property").content = absoluteUrl;

  ensureMeta("twitter:card", "name").content = "summary_large_image";
  ensureMeta("twitter:title", "name").content = pageTitle;
  ensureMeta("twitter:description", "name").content = options.description;

  if (options.image) {
    ensureMeta("og:image", "property").content = options.image;
    ensureMeta("twitter:image", "name").content = options.image;
  }

  ensureCanonical().href = absoluteUrl;
}
