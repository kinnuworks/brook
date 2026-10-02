// Strings added after the main translations (pt, it, el; fr/nl/no carry their own): the "face downstream" labels,
// the trial badge, the split hygiene/dog tips and the System Usability Scale.
// Merged over each language at load time (see compose.ts).

import type { Strings } from "./types";

type DeepPartial<T> = { [K in keyof T]?: T[K] extends (infer U)[] ? U[] : T[K] extends object ? DeepPartial<T[K]> : T[K] };

export const EXTRA: Record<string, DeepPartial<Strings>> = {
  // All seven languages now carry every key in their own file. Put strings
  // added later here (per language) until their translators catch up.
};
