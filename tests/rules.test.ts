import { describe, expect, it } from "vitest";
import { oneHealthTips } from "../src/core/onehealth";
import { secondLooks } from "../src/core/rules";
import { SITE_BY_CODE } from "../src/core/sites";

const rainy = { rain48hMm: 32, rain72hMm: 40, maxTempC: 18, hotDays: 0, source: "open-meteo" as const, fetchedAt: "" };
const dry = { ...rainy, rain48hMm: 0, rain72hMm: 0 };

describe("second look", () => {
  it("questions a 'good' rating next to a sewage discharge", () => {
    const looks = secondLooks({ overallAssessment: "GOOD", waterDischarge: true }, null);
    expect(looks.map((l) => l.id)).toContain("goodWithPollution");
  });
  it("notices clear water after heavy rain", () => {
    expect(secondLooks({ waterColor: "CL" }, rainy).map((l) => l.id)).toEqual(["clearAfterRain"]);
    expect(secondLooks({ waterColor: "CL" }, dry)).toEqual([]);
  });
  it("adds a safety note for foam next to a discharge", () => {
    const look = secondLooks({ waterColor: "FO", pipes: true }, null).find((l) => l.id === "foamDischarge");
    expect(look?.severity).toBe("safety");
  });
  it("stays quiet when answers agree", () => {
    expect(secondLooks({ overallAssessment: "GOOD", bottomChannelType: "NAT", waterColor: "CL" }, dry)).toEqual([]);
  });
});

describe("One Health tips", () => {
  it("warns dog owners where OneAquaHealth measured faecal risk", () => {
    const site = SITE_BY_CODE.get("O17")!; // fecal risk 0.43 in the OneAquaHealth Resilience Map
    const tips = oneHealthTips({ overallAssessment: "POOR" }, site, null);
    expect(tips.animals.tip).toBe("dogs");
    expect(tips.people.tip).toBe("faecal");
  });
  it("puts a discharge first for people", () => {
    expect(oneHealthTips({ waterDischarge: true }, null, null).people.tip).toBe("discharge");
  });
  it("never shows the same tip twice", () => {
    const t = oneHealthTips({ pipes: true }, SITE_BY_CODE.get("O17"), null);
    expect(t.people.tip).not.toBe(t.animals.tip);
  });
});
