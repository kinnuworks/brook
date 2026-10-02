// Brook's face: OneAquaHealth's waves inside a drop of their aqua, with the
// leaf from their logo. It ripples while Brook speaks and glows leaf-green
// while it listens, so a glance tells you whose turn it is.

import { useId } from "react";

export type AvatarState = "idle" | "speaking" | "listening" | "thinking";

export function BrookAvatar({ size = 44, state = "idle", className = "" }: { size?: number; state?: AvatarState; className?: string }) {
  const ring = state === "listening" ? "bg-leaf" : "bg-aqua";
  const active = state === "speaking" || state === "listening";
  // Each avatar defines its own gradient: a shared id breaks every avatar when the first one is hidden.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <span className={`relative inline-grid shrink-0 place-items-center ${className}`} style={{ width: size, height: size }} aria-hidden>
      {active && (
        <>
          <span className={`absolute inset-0 rounded-full ${ring} animate-ripple`} />
          <span className={`absolute inset-0 rounded-full ${ring} animate-ripple [animation-delay:0.8s]`} />
        </>
      )}
      <svg viewBox="0 0 64 64" width={size} height={size} className={`relative ${state === "thinking" ? "animate-pulse" : ""}`}>
        <defs>
          <linearGradient id={`brook-g-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#7fd3de" />
            <stop offset="0.55" stopColor="#3fa9b9" />
            <stop offset="1" stopColor="#216b8c" />
          </linearGradient>
          <clipPath id={`brook-c-${uid}`}>
            <circle cx="32" cy="32" r="30" />
          </clipPath>
        </defs>
        <circle cx="32" cy="32" r="30" fill={`url(#brook-g-${uid})`} />
        <g clipPath={`url(#brook-c-${uid})`} fill="none" stroke="#fff" strokeLinecap="round" strokeWidth="3.4">
          <g className={active ? "animate-wave" : ""} style={{ animationDuration: state === "speaking" ? "2.2s" : "6s" }}>
            <path d="M-32 25 q8 -6 16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0" opacity="0.95" />
            <path d="M-36 34 q8 -6 16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0" opacity="0.8" />
            <path d="M-32 43 q8 -6 16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0" opacity="0.6" />
          </g>
        </g>
        <path d="M47 6 c7 0 11 4 11 10 c-6 1 -11 -2 -11 -10z" fill="#8cc740" />
      </svg>
    </span>
  );
}
