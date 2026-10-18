import type { MetadataRoute } from "next";
import { docs } from "@/lib/docs";
import { SITE } from "@/lib/site";
export const dynamic = "force-static";
export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/docs/", "/brand/", ...docs.map((d) => `/docs/${d.slug}/`)].map(
    (path) => ({
      url: `${SITE}${path}`,
      lastModified: "2026-10-18",
      changeFrequency: path === "/" ? "weekly" : "monthly",
      priority: path === "/" ? 1 : 0.7,
    }),
  );
}
