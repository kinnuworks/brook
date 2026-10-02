// Brook's "second look": a handful of plain, published rules that notice when
// answers contradict each other or the recent weather. A rule never changes
// an answer. It explains what it noticed, shows the data behind it, and the
// citizen decides. Every decision is kept with the record.

import type { AnswerValues, QuestionId } from "./protocol";
import type { RecentWeather } from "./weather";

export type SecondLookId =
  | "goodWithPollution"
  | "poorButNatural"
  | "clearAfterRain"
  | "muddyNoRain"
  | "foamDischarge"
  | "riffleStagnant"
  | "dryWithWater";

export interface SecondLook {
  id: SecondLookId;
  /** check: worth another look · info: a note for researchers · safety: protect yourself */
  severity: "check" | "info" | "safety";
  /** The questions a "change it" takes the citizen back to. */
  revisit: QuestionId[];
  params: Record<string, string | number>;
  /** What the rule was based on, shown under the message. */
  basis: string[];
}

const RAIN_HEAVY_MM = 20;
const DRY_SPELL_MM = 1;

export function secondLooks(a: AnswerValues, weather: RecentWeather | null): SecondLook[] {
  const out: SecondLook[] = [];
  const habitats = Array.isArray(a.habitats) ? a.habitats : [];

  if (a.overallAssessment === "GOOD") {
    const issues: string[] = [];
    if (a.pipes === true) issues.push("pipes");
    if (a.waterDischarge === true) issues.push("waterDischarge");
    if (a.bottomChannelType === "ART" && a.banksChannelType === "ART") issues.push("artificial");
    if (a.imperviousAreasLeft === true && a.imperviousAreasRight === true) issues.push("impervious");
    if (issues.length) {
      out.push({
        id: "goodWithPollution",
        severity: "check",
        revisit: ["overallAssessment"],
        params: { issue: issues[0] },
        basis: issues,
      });
    }
  }

  if (
    a.overallAssessment === "POOR" &&
    a.bottomChannelType === "NAT" &&
    a.banksChannelType !== "ART" &&
    a.isVegetationCoveredLeft === true &&
    a.isVegetationCoveredRight === true &&
    a.waterColor === "CL" &&
    a.pipes !== true &&
    a.waterDischarge !== true
  ) {
    out.push({ id: "poorButNatural", severity: "check", revisit: ["overallAssessment"], params: {}, basis: ["bottomChannelType", "banksChannelType", "isVegetationCoveredLeft", "isVegetationCoveredRight", "waterColor"] });
  }

  if (weather && a.waterColor === "CL" && weather.rain48hMm >= RAIN_HEAVY_MM) {
    out.push({ id: "clearAfterRain", severity: "check", revisit: ["waterColor"], params: { mm: weather.rain48hMm }, basis: ["waterColor", "weather"] });
  }

  if (weather && a.waterColor === "MU" && weather.rain72hMm < DRY_SPELL_MM && a.construction !== true) {
    out.push({ id: "muddyNoRain", severity: "info", revisit: ["construction", "waterDischarge"], params: { mm: weather.rain72hMm }, basis: ["waterColor", "construction", "weather"] });
  }

  if (a.waterColor === "FO" && (a.waterDischarge === true || a.pipes === true)) {
    out.push({ id: "foamDischarge", severity: "safety", revisit: [], params: {}, basis: ["waterColor", a.waterDischarge === true ? "waterDischarge" : "pipes"] });
  }

  if (habitats.includes("RF") && a.waterFlow === "STA") {
    out.push({ id: "riffleStagnant", severity: "check", revisit: ["habitats", "waterFlow"], params: {}, basis: ["habitats", "waterFlow"] });
  }

  if (a.waterFlow === "DRY" && ((typeof a.waterHeight === "number" && a.waterHeight > 0) || a.waterColor === "FO" || a.waterColor === "MU")) {
    out.push({ id: "dryWithWater", severity: "check", revisit: ["waterFlow", "waterHeight"], params: {}, basis: ["waterFlow", "waterHeight", "waterColor"] });
  }

  return out;
}
