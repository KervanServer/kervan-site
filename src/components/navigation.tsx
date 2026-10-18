"use client";
import { ArrowUpRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { REPO } from "@/lib/site";
import { Github } from "./github-icon";
import { Logo } from "./logo";
import { ThemePicker } from "./theme-picker";

const links = [
  { href: "/#features", label: "Why Kervan" },
  { href: "/#architecture", label: "Architecture" },
  { href: "/docs/getting-started/", label: "Documentation" },
];
export function Navigation() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  useEffect(() => {
    if (!open) return;
    function close(e: PointerEvent | FocusEvent) {
      if (e.target instanceof Node && !ref.current?.contains(e.target))
        setOpen(false);
    }
    function dismissOnEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    }
    document.addEventListener("pointerdown", close);
    document.addEventListener("focusin", close);
    document.addEventListener("keydown", dismissOnEscape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("focusin", close);
      document.removeEventListener("keydown", dismissOnEscape);
    };
  }, [open]);
  return (
    <header className="site-header" ref={ref}>
      <div className="container header-inner">
        <div className="header-brand">
          <Link
            className="brand-link"
            href="/"
            aria-label="Kervan home"
            onClick={() => setOpen(false)}
          >
            <Logo />
          </Link>
          <span className="brand-divider" />
          <span className="brand-caption" aria-hidden="true">
            FILE TRANSFER,
            <br />
            UNIFIED.
          </span>
        </div>
        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={
                pathname.startsWith("/docs") && link.label === "Documentation"
                  ? "page"
                  : undefined
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <ThemePicker />
          <a className="github-link" href={REPO}>
            <Github />
            <span>GitHub</span>
            <ArrowUpRight size={13} />
          </a>
          <button
            ref={trigger}
            className="mobile-menu-button"
            type="button"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <nav
          className="mobile-nav container"
          id="mobile-navigation"
          aria-label="Mobile navigation"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
            >
              {link.label}
              <ArrowUpRight size={17} />
            </Link>
          ))}
          <a href={REPO}>
            <Github /> View on GitHub <ArrowUpRight size={17} />
          </a>
        </nav>
      )}
    </header>
  );
}
