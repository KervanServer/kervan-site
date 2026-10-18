"use client";

import { useSyncExternalStore } from "react";
import { ANIMATION_EVENT, ANIMATION_KEY } from "./animation-settings";

function apply(value: string | null) {
  const preference = value === "on" || value === "off" ? value : "system";
  const root = document.documentElement;
  root.dataset.animationPreference = preference;
  root.dataset.backgroundAnimations =
    preference === "on" ||
    (preference === "system" &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches)
      ? "on"
      : "off";
}

function subscribe(callback: () => void) {
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const system = () => {
    if (document.documentElement.dataset.animationPreference === "system")
      apply(null);
    callback();
  };
  const storage = (event: StorageEvent) => {
    if (event.key !== ANIMATION_KEY && event.key !== null) return;
    apply(event.key === null ? null : event.newValue);
    callback();
  };
  window.addEventListener(ANIMATION_EVENT, callback);
  window.addEventListener("storage", storage);
  motion.addEventListener("change", system);
  return () => {
    window.removeEventListener(ANIMATION_EVENT, callback);
    window.removeEventListener("storage", storage);
    motion.removeEventListener("change", system);
  };
}

function snapshot() {
  return document.documentElement.dataset.backgroundAnimations === "on";
}

export function setAnimationsEnabled(enabled: boolean) {
  const value = enabled ? "on" : "off";
  apply(value);
  try {
    localStorage.setItem(ANIMATION_KEY, value);
  } catch {
    // The in-page preference still works when storage is blocked.
  }
  window.dispatchEvent(new Event(ANIMATION_EVENT));
}

export function useAnimationsEnabled() {
  return useSyncExternalStore(subscribe, snapshot, () => false);
}
