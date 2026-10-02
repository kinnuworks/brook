import type { Strings } from "./types";

type DeepPartial<T> = { [K in keyof T]?: T[K] extends (infer U)[] ? U[] : T[K] extends object ? DeepPartial<T[K]> : T[K] };

const strings: DeepPartial<Strings> = {};

export default strings;
