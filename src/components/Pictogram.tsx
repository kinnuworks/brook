import { useId } from "react";

// Small drawings that carry the meaning of an answer before the words do:
// the shape of the channel, what the banks are made of, the colour of the
// water. OneAquaHealth's own app uses lettered illustrations for the same
// reason. Drawn in OneAquaHealth's palette so they read as one family.

const C = { water: "#6bc7d4", deep: "#216b8c", earth: "#b9a37e", grass: "#8cc740", stone: "#9fb3bf", concrete: "#c7d2d8", ink: "#0d3245" };

const box = (children: React.ReactNode) => (
  <svg viewBox="0 0 48 32" width="48" height="32" aria-hidden className="shrink-0">
    {children}
  </svg>
);

const DRAWINGS: Record<string, () => React.ReactNode> = {
  // channel cross-sections
  "channelForm.FLAT": () => box(<><path d="M2 12 L8 20 H40 L46 12" fill="none" stroke={C.earth} strokeWidth="3" strokeLinejoin="round" /><path d="M8 20 H40" stroke={C.water} strokeWidth="3" /><path d="M6 17 H42" stroke={C.water} strokeWidth="2" opacity="0.5" /></>),
  "channelForm.U": () => box(<><path d="M6 4 V16 Q6 28 24 28 Q42 28 42 16 V4" fill="none" stroke={C.earth} strokeWidth="3" /><path d="M9 20 Q24 30 39 20" fill="none" stroke={C.water} strokeWidth="3" /></>),
  "channelForm.V": () => box(<><path d="M4 4 L24 29 L44 4" fill="none" stroke={C.earth} strokeWidth="3" strokeLinejoin="round" /><path d="M15 18 L24 27 L33 18" fill="none" stroke={C.water} strokeWidth="3" /></>),
  // stream bed
  "bottomChannelType.NAT": () => box(<><path d="M2 14 H46" stroke={C.water} strokeWidth="3" /><circle cx="10" cy="24" r="4" fill={C.stone} /><circle cx="21" cy="25" r="3" fill={C.earth} /><circle cx="31" cy="23" r="4.5" fill={C.stone} /><circle cx="41" cy="25" r="3" fill={C.earth} /></>),
  "bottomChannelType.ART": () => box(<><path d="M2 14 H46" stroke={C.water} strokeWidth="3" /><rect x="3" y="20" width="42" height="8" rx="1.5" fill={C.concrete} stroke={C.stone} /><path d="M17 20 V28 M31 20 V28" stroke={C.stone} /></>),
  // banks
  "banksChannelType.NAT": () => box(<><path d="M2 8 Q12 10 18 26 H30 Q36 10 46 8" fill="none" stroke={C.earth} strokeWidth="3" /><path d="M4 7 l2 -4 M8 8 l1 -4 M40 7 l2 -4 M44 8 l-1 -4" stroke={C.grass} strokeWidth="2" strokeLinecap="round" /><path d="M18 22 H30" stroke={C.water} strokeWidth="3" /></>),
  "banksChannelType.ART": () => box(<><rect x="6" y="4" width="7" height="24" fill={C.concrete} stroke={C.stone} /><rect x="35" y="4" width="7" height="24" fill={C.concrete} stroke={C.stone} /><path d="M13 22 H35" stroke={C.water} strokeWidth="3" /></>),
  "banksChannelType.LAS": () => box(<><circle cx="9" cy="10" r="3.5" fill={C.stone} /><circle cx="11" cy="17" r="4" fill={C.stone} /><circle cx="14" cy="24" r="3.5" fill={C.stone} /><circle cx="39" cy="10" r="3.5" fill={C.stone} /><circle cx="37" cy="17" r="4" fill={C.stone} /><circle cx="34" cy="24" r="3.5" fill={C.stone} /><path d="M17 23 H31" stroke={C.water} strokeWidth="3" /></>),
  // flow
  "waterFlow.FAS": () => box(<><path d="M2 12 q4 -5 8 0 t8 0 t8 0 t8 0 t8 0 t8 0" fill="none" stroke={C.deep} strokeWidth="2.6" /><path d="M2 22 q4 -5 8 0 t8 0 t8 0 t8 0 t8 0 t8 0" fill="none" stroke={C.water} strokeWidth="2.6" /><path d="M36 6 l8 0 l-3 -3 M44 6 l-3 3" stroke={C.deep} strokeWidth="2" fill="none" strokeLinecap="round" /></>),
  "waterFlow.NOR": () => box(<><path d="M2 14 q6 -3 12 0 t12 0 t12 0 t12 0" fill="none" stroke={C.water} strokeWidth="2.6" /><path d="M2 22 q6 -3 12 0 t12 0 t12 0 t12 0" fill="none" stroke={C.water} strokeWidth="2.6" opacity="0.6" /></>),
  "waterFlow.STA": () => box(<><ellipse cx="24" cy="18" rx="18" ry="7" fill={C.water} opacity="0.55" /><path d="M14 18 H34" stroke={C.deep} strokeWidth="1.5" opacity="0.5" /></>),
  "waterFlow.DRY": () => box(<><path d="M4 22 H44" stroke={C.earth} strokeWidth="3" /><path d="M12 22 l3 -5 l3 5 M28 22 l2 -4 l3 4 M20 26 l2 -3 l2 3" stroke={C.earth} strokeWidth="1.6" fill="none" /></>),
  // water look
  "waterColor.CL": () => box(<><rect x="8" y="5" width="32" height="22" rx="6" fill="#e3f5f8" stroke={C.water} strokeWidth="2" /><circle cx="18" cy="18" r="2" fill={C.stone} /><circle cx="28" cy="20" r="2.5" fill={C.stone} /></>),
  "waterColor.MU": () => box(<rect x="8" y="5" width="32" height="22" rx="6" fill="#a8875a" stroke="#8b6c43" strokeWidth="2" />),
  "waterColor.FO": () => box(<><rect x="8" y="5" width="32" height="22" rx="6" fill={C.water} opacity="0.6" /><circle cx="15" cy="10" r="3.5" fill="#fff" stroke={C.stone} /><circle cx="22" cy="9" r="4" fill="#fff" stroke={C.stone} /><circle cx="30" cy="11" r="3" fill="#fff" stroke={C.stone} /></>),
  "waterColor.CO": () => box(<><rect x="8" y="5" width="32" height="22" rx="6" fill="#7fb54a" /><path d="M12 14 q6 4 12 0 t12 0" stroke="#d8c3f0" strokeWidth="2.5" fill="none" /></>),
  // dominant vegetation
  "vegetation.H": () => box(<><path d="M4 28 H44" stroke={C.earth} strokeWidth="2.5" /><path d="M10 28 l-2 -8 M12 28 l1 -9 M14 28 l3 -7 M24 28 l-2 -8 M26 28 l1 -9 M28 28 l3 -7 M36 28 l-2 -8 M38 28 l1 -9" stroke={C.grass} strokeWidth="2" strokeLinecap="round" /></>),
  "vegetation.B": () => box(<><path d="M4 28 H44" stroke={C.earth} strokeWidth="2.5" /><circle cx="16" cy="20" r="7" fill={C.grass} /><circle cx="26" cy="18" r="8" fill="#7ab336" /><circle cx="35" cy="21" r="6" fill={C.grass} /></>),
  "vegetation.T": () => box(<><path d="M4 30 H44" stroke={C.earth} strokeWidth="2.5" /><path d="M24 30 V16" stroke="#8b6c43" strokeWidth="3" /><circle cx="24" cy="11" r="9" fill="#5e9d2a" /><circle cx="17" cy="15" r="6" fill={C.grass} /><circle cx="31" cy="15" r="6" fill={C.grass} /></>),
  // overall
  "overallAssessment.GOOD": () => box(<><circle cx="24" cy="16" r="12" fill="#ecf6df" stroke={C.grass} strokeWidth="2.5" /><path d="M18 18 q6 6 12 0" stroke="#4f7f1c" strokeWidth="2.4" fill="none" strokeLinecap="round" /><circle cx="19.5" cy="13" r="1.6" fill="#4f7f1c" /><circle cx="28.5" cy="13" r="1.6" fill="#4f7f1c" /></>),
  "overallAssessment.MODERATE": () => box(<><circle cx="24" cy="16" r="12" fill="#fdf3dc" stroke="#f2b33d" strokeWidth="2.5" /><path d="M18 20 H30" stroke="#8a5a00" strokeWidth="2.4" strokeLinecap="round" /><circle cx="19.5" cy="13" r="1.6" fill="#8a5a00" /><circle cx="28.5" cy="13" r="1.6" fill="#8a5a00" /></>),
  "overallAssessment.POOR": () => box(<><circle cx="24" cy="16" r="12" fill="#fbe9e2" stroke="#c9603d" strokeWidth="2.5" /><path d="M18 22 q6 -6 12 0" stroke="#c9603d" strokeWidth="2.4" fill="none" strokeLinecap="round" /><circle cx="19.5" cy="13" r="1.6" fill="#c9603d" /><circle cx="28.5" cy="13" r="1.6" fill="#c9603d" /></>),
};

export function Pictogram({ qid, code }: { qid: string; code: string }) {
  const key = qid.startsWith("vegetationType") ? `vegetation.${code}` : `${qid}.${code}`;
  const draw = DRAWINGS[key];
  return draw ? <>{draw()}</> : null;
}

export const hasPictogram = (qid: string, code: string) =>
  Boolean(DRAWINGS[qid.startsWith("vegetationType") ? `vegetation.${code}` : `${qid}.${code}`]);

/**
 * Facing downstream, left is left: the one idea the margin questions depend on.
 * Drawn from behind a person standing at the water: the stream runs away from
 * them, so their left hand is the left margin.
 */
export function DownstreamDiagram({ side, leftLabel, rightLabel }: { side?: "left" | "right"; leftLabel: string; rightLabel: string }) {
  const gid = `dd-water-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const bank = (on: boolean) => (on ? "#8cc740" : "#e2ebe6");
  const label = {
    fontSize: 12.5,
    fontWeight: 700,
    fill: "#0d3245",
    fontFamily: "DM Sans, sans-serif",
    textAnchor: "middle" as const,
  };
  return (
    <svg viewBox="0 0 200 104" className="h-[92px] w-auto shrink-0" role="img" aria-label={`${leftLabel} / ${rightLabel}`}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#216b8c" />
          <stop offset="1" stopColor="#6bc7d4" />
        </linearGradient>
      </defs>
      {/* the stream narrows into the distance: you look downstream along it */}
      <path d="M76 4 H124 L150 78 H50 Z" fill={`url(#${gid})`} />
      <path d="M4 4 H72 L46 78 H4 Z" fill={bank(side === "left")} />
      <path d="M128 4 H196 V78 H154 Z" fill={bank(side === "right")} />
      <path d="M100 62 V22" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M91 31 L100 20 L109 31" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M68 66 q6 -4 12 0 M118 66 q6 -4 12 0" stroke="#fff" strokeOpacity="0.55" strokeWidth="2" fill="none" strokeLinecap="round" />
      <text x="30" y="46" {...label}>
        {leftLabel}
      </text>
      <text x="170" y="46" {...label}>
        {rightLabel}
      </text>
      {/* you, seen from behind */}
      <circle cx="100" cy="84" r="6.5" fill="#0d3245" />
      <path d="M86 104 Q86 92 100 92 Q114 92 114 104 Z" fill="#0d3245" />
    </svg>
  );
}
