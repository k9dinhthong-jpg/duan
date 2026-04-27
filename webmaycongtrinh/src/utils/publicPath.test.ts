import { describe, expect, it } from "vitest";
import { resolvePublicPath } from "./publicPath";

describe("resolvePublicPath", () => {
  it("joins base and relative path", () => {
    expect(resolvePublicPath("img/logo.png", "/duan/")).toBe(
      "/duan/img/logo.png",
    );
  });

  it("normalizes leading slash in path", () => {
    expect(resolvePublicPath("/data/news.json", "/duan")).toBe(
      "/duan/data/news.json",
    );
  });
});
