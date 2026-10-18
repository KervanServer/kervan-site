import { BRIDGE_PATH, GOLD_PATH, WORD_PATH } from "./brand-paths";

export function Mark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 280 116"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path d={GOLD_PATH} fill="var(--brand-gold)" fillRule="evenodd" />
      <path d={BRIDGE_PATH} fill="currentColor" fillRule="evenodd" />
    </svg>
  );
}
export function Logo() {
  return (
    <span className="logo">
      <Mark />
      <svg viewBox="0 0 280 72" aria-hidden="true">
        <path d={WORD_PATH} fill="currentColor" fillRule="evenodd" />
      </svg>
    </span>
  );
}
