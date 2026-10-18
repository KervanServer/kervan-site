import { ArrowDownToLine } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
export const metadata: Metadata = {
  title: "Brand assets",
  description:
    "Official Kervan mark, wordmark and brand colors, traced from the original supplied artwork.",
  alternates: { canonical: "/brand/" },
};
export default function BrandPage() {
  return (
    <main className="section container brand-page" id="main">
      <span className="eyebrow">A MARK OF CONNECTION</span>
      <h1>
        The Kervan identity<span className="gold-period">.</span>
      </h1>
      <p>
        The connected hexagons, central lock and original wordmark. One
        identity, wherever Kervan goes.
      </p>
      <div className="brand-previews">
        {(["horizontal", "stacked"] as const).flatMap((layout) =>
          (["dark", "light"] as const).map((theme) => {
            const path = `/brand/kervan-${layout === "horizontal" ? "horizontal-" : ""}${theme}.svg`;
            return (
              <div
                className={`brand-preview ${theme}-brand`}
                key={`${layout}-${theme}`}
              >
                <span className="brand-asset-label">
                  {layout === "horizontal"
                    ? "HORIZONTAL LOCKUP"
                    : "ORIGINAL STACKED LOCKUP"}
                </span>
                <Image
                  className={`brand-logo-${layout}`}
                  src={path}
                  width={layout === "horizontal" ? 800 : 280}
                  height={layout === "horizontal" ? 128 : 188}
                  alt={`Kervan ${layout} logo for ${theme} backgrounds`}
                />
                <a href={path} download>
                  <ArrowDownToLine size={16} />
                  Download {layout} SVG · {theme} background
                </a>
              </div>
            );
          }),
        )}
      </div>
      <div className="brand-colors">
        <div>
          <span style={{ background: "var(--brand-gold)" }} />
          <strong>Kervan gold</strong>
          <code>#D7AD4F</code>
        </div>
        <div>
          <span style={{ background: "var(--brand-navy)" }} />
          <strong>Midnight navy</strong>
          <code>#141522</code>
        </div>
        <div>
          <span style={{ background: "var(--brand-cream)" }} />
          <strong>Warm white</strong>
          <code>#F6F3E9</code>
        </div>
      </div>
      <h2>Keep the connection intact.</h2>
      <p>
        Preserve the artwork’s geometry, proportions, lettering and clear space.
        These SVG curves are fitted to the supplied raster logo; colors are
        sampled and normalized from that reference. The original artwork is
        available for comparison.
      </p>
      <div className="hero-actions">
        {(["mark", "wordmark"] as const).flatMap((asset) =>
          (["dark", "light"] as const).map((theme) => (
            <a
              className="button secondary"
              href={`/brand/kervan-${asset}-${theme}.svg`}
              download
              key={`${asset}-${theme}`}
            >
              <ArrowDownToLine size={16} />
              {asset === "mark" ? "Mark" : "Wordmark"} · {theme} background
            </a>
          )),
        )}
        <a className="text-link" href="/brand/kervan-original.png" download>
          Original artwork
          <ArrowDownToLine size={16} />
        </a>
      </div>
      <p className="brand-icon-downloads">
        Browser & mobile icons:{" "}
        <a href="/icon.svg" download>
          SVG
        </a>
        <a href="/favicon.ico" download>
          ICO
        </a>
        <a href="/apple-touch-icon.png" download>
          Apple 180px
        </a>
        <a href="/icon-192.png" download>
          PNG 192px
        </a>
        <a href="/icon-512.png" download>
          PNG 512px
        </a>
      </p>
    </main>
  );
}
