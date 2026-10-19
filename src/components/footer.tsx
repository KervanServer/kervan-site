import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { REPO, SOURCE, VERSION } from "@/lib/site";
import { Logo } from "./logo";
import { Studio } from "./studio";
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <div className="footer-brand">
          <Link href="/" aria-label="Kervan home">
            <Logo />
          </Link>
          <p>
            Different protocols.
            <br />
            One way forward.
          </p>
          <span className="built-go">
            <span className="live-dot" />
            Pure Go. Open by design.
          </span>
        </div>
        <div className="footer-column">
          <h3>Product</h3>
          <Link href="/#features">Why Kervan</Link>
          <Link href="/#protocols">Protocols</Link>
          <Link href="/#architecture">Architecture</Link>
          <a href={`${REPO}/releases`}>
            Releases
            <ArrowUpRight size={12} />
          </a>
        </div>
        <div className="footer-column">
          <h3>Developers</h3>
          <Link href="/docs/getting-started/">Quick start</Link>
          <Link href="/docs/storage/">Storage & VFS</Link>
          <Link href="/docs/security/">Security</Link>
          <Link href="/docs/operations/">Operations</Link>
          <Link href="/docs/api/">API & integrations</Link>
        </div>
        <div className="footer-column">
          <h3>Open source</h3>
          <a href={REPO}>
            GitHub
            <ArrowUpRight size={12} />
          </a>
          <a href={`${SOURCE}/CONTRIBUTING.md`}>Contributing</a>
          <a href={`${REPO}/issues`}>Issues & feedback</a>
          <Link href="/brand/">Brand assets</Link>
          <a href={`${SOURCE}/LICENSE`}>MIT license</a>
        </div>
      </div>
      <Studio />
      <div className="container footer-bottom">
        <span>© 2026 Kervan contributors.</span>
        <span>MIT · Made to be yours.</span>
        <a href={`${REPO}/releases/tag/${VERSION}`}>
          {VERSION} <ArrowUpRight size={12} />
        </a>
      </div>
    </footer>
  );
}
