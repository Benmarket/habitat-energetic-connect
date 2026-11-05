import { describe, it, expect, vi } from "vitest";
import { JSDOM } from "jsdom";
import { resolveHomepageSeo, readHomepageSeoSnapshot } from "./homepage-seo";
import { injectHomepageSeo, homepageSeoPlugin } from "../../scripts/homepage-seo-plugin";
import { readFileSync } from "node:fs";

describe("general settings publication snapshot", () => {
  it("fetches settings once per publication and keeps that version throughout the build", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => [
      { key: "site_title", value: "Publication title" },
      { key: "meta_description", value: "Publication description" },
    ] });
    vi.stubGlobal("fetch", fetcher);
    const plugin = homepageSeoPlugin({ VITE_SUPABASE_URL: "https://example.invalid", VITE_SUPABASE_PUBLISHABLE_KEY: "public-test-key" });
    const configHook = plugin.configResolved;
    const transform = plugin.transformIndexHtml;
    if (typeof configHook !== "function" || !transform || typeof transform === "function" || !("handler" in transform)) throw new Error("Expected plugin hooks");
    try {
      (configHook as (config: { command: string }) => void)({ command: "build" });
      const run = transform.handler as (html: string) => Promise<string>;
      const initial = await run("<head></head>");
      expect(await run("<head></head>")).toBe(initial);
      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(new JSDOM(initial).window.document.title).toBe("Publication title");
    } finally { vi.unstubAllGlobals(); }
  });

  it("uses saved title and SEO description, not the commercial slogan", () => {
    expect(resolveHomepageSeo([
      { key: "site_title", value: "Updated title" },
      { key: "site_description", value: "Commercial slogan" },
      { key: "meta_description", value: "Updated description" },
    ])).toEqual({ title: "Updated title", siteName: "Updated title", description: "Updated description" });
  });

  it("shares one immutable snapshot between the initial HTML and React", () => {
    const seo = resolveHomepageSeo([{ key: "site_title", value: "Changed & verified" }, { key: "meta_description", value: "Saved <project> description" }]);
    const html = injectHomepageSeo(readFileSync("index.html", "utf8"), seo);
    const dom = new JSDOM(html);
    vi.stubGlobal("document", dom.window.document);
    try {
      expect(readHomepageSeoSnapshot()).toEqual(seo);
      expect(dom.window.document.title).toBe(seo.title);
      expect(dom.window.document.querySelectorAll('meta[name="description"]')).toHaveLength(1);
      expect(dom.window.document.querySelector('meta[name="description"]')?.getAttribute("content")).toBe(seo.description);
      expect(dom.window.document.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
      expect(dom.window.document.querySelectorAll('meta[property="og:description"]')).toHaveLength(1);
      expect(injectHomepageSeo(html, seo)).not.toContain("Commercial slogan");
    } finally { vi.unstubAllGlobals(); }
  });

  it("escapes settings so they cannot inject scripts into the initial page", () => {
    const html = injectHomepageSeo("<head></head>", { title: '</title><script>alert(1)</script>', siteName: "Site", description: '</script><script>alert(2)</script>' });
    expect(new JSDOM(html).window.document.querySelectorAll("script")).toHaveLength(1);
  });

  it("refuses publication when the saved settings cannot be read", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    const plugin = homepageSeoPlugin({ VITE_SUPABASE_URL: "https://example.invalid", VITE_SUPABASE_PUBLISHABLE_KEY: "public-test-key" });
    const transform = plugin.transformIndexHtml;
    if (!transform || typeof transform === "function" || !("handler" in transform)) throw new Error("Expected HTML handler");
    try {
      await expect((transform.handler as (html: string) => Promise<string>)("<head></head>")).rejects.toThrow("503");
    } finally { vi.unstubAllGlobals(); }
  });
});