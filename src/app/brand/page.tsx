import { ArrowDownToLine } from "lucide-react";
import type { Metadata } from "next";
import { Logo } from "@/components/logo";
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
        <div className="brand-preview dark-brand">
          <Logo />
          <a href="/brand/kervan-dark.svg" download>
            <ArrowDownToLine size={16} />
            Download SVG · dark background
          </a>
        </div>
        <div className="brand-preview light-brand">
          <Logo />
          <a href="/brand/kervan-light.svg" download>
            <ArrowDownToLine size={16} />
            Download SVG · light background
          </a>
        </div>
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
        These SVG silhouettes are traced from the supplied raster logo; colors
        are sampled and normalized from that reference. The original artwork is
        available for comparison.
      </p>
      <div className="hero-actions">
        <a className="button secondary" href="/brand/kervan-mark.svg" download>
          <ArrowDownToLine size={16} />
          Download mark
        </a>
        <a className="text-link" href="/brand/kervan-original.png" download>
          Original artwork
          <ArrowDownToLine size={16} />
        </a>
      </div>
    </main>
  );
}
