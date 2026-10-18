"use client";

import { Mouse, MouseOff } from "lucide-react";
import { useId } from "react";
import {
  setAnimationsEnabled,
  useAnimationsEnabled,
} from "@/lib/animation-preference";

export function AnimationToggle() {
  const enabled = useAnimationsEnabled();
  const label = enabled ? "Animasyonları kapat" : "Animasyonları aç";
  const id = useId();
  const Icon = enabled ? Mouse : MouseOff;
  return (
    <span className="animation-control">
      <button
        type="button"
        className="animation-toggle"
        aria-label={label}
        aria-pressed={enabled}
        aria-describedby={id}
        onClick={() => setAnimationsEnabled(!enabled)}
      >
        <Icon size={18} strokeWidth={1.6} aria-hidden="true" />
      </button>
      <span className="animation-tooltip" id={id} role="tooltip">
        {label}
      </span>
    </span>
  );
}
