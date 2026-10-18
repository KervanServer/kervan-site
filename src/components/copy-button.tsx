"use client";
import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
export function CopyButton({
  text,
  label = "Copy code",
}: {
  text: string;
  label?: string;
}) {
  const [status, setStatus] = useState("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
    } catch {
      setStatus("error");
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus("idle"), 3500);
  }
  return (
    <span className="copy-control">
      <button
        className="copy-button"
        type="button"
        aria-label={status === "copied" ? "Copied to clipboard" : label}
        onClick={copy}
      >
        {status === "copied" ? <Check size={16} /> : <Copy size={16} />}
        <span>{status === "copied" ? "Copied" : "Copy"}</span>
      </button>
      <span
        className={status === "error" ? "copy-error" : "sr-only"}
        role="status"
      >
        {status === "copied"
          ? "Copied to clipboard."
          : status === "error"
            ? "Clipboard unavailable. Select the code to copy it manually."
            : ""}
      </span>
    </span>
  );
}
