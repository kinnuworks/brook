// Validates Brook's sample bundles and its own definitions with the official
// HL7 FHIR validator, against FHIR R4 (4.0.1), the OneAquaHealth IG built
// from source, and Brook's definitions in public/fhir.
//
//   FHIR_VALIDATOR_JAR=/path/validator_cli.jar \
//   OAH_IG_DIR=/path/oah/fsh-generated/resources \
//   node scripts/fhir-validate.mjs
//
// Optional: JAVA (default "java"), FHIR_TX (default https://tx.fhir.org; "n/a" for none).
// Writes docs/evidence/validation/: one OperationOutcome per file, summary.json
// and summary.md. Exits non-zero when any file does not do what
// docs/evidence/bundles/manifest.json expects of it.

import { spawn } from "node:child_process";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BUNDLES = join(ROOT, "docs", "evidence", "bundles");
const DEFINITIONS = join(ROOT, "public", "fhir");
const OUT = join(ROOT, "docs", "evidence", "validation");

const jar = process.env.FHIR_VALIDATOR_JAR;
const oah = process.env.OAH_IG_DIR;
const java = process.env.JAVA || "java";
const tx = process.env.FHIR_TX || "https://tx.fhir.org";
if (!jar || !oah) {
  console.error("Set FHIR_VALIDATOR_JAR and OAH_IG_DIR (see docs/FHIR.md, 'Reproduce the validation').");
  process.exit(2);
}

const manifest = JSON.parse(await readFile(join(BUNDLES, "manifest.json"), "utf8"));
const definitions = (await readdir(DEFINITIONS)).filter((f) => f.endsWith(".json") && f !== "index.json").sort();
const targets = [
  ...manifest.map((m) => ({ path: join(BUNDLES, m.file), name: `bundles/${m.file}`, expect: m.expect, about: m.about })),
  ...definitions.map((f) => ({ path: join(DEFINITIONS, f), name: `public/fhir/${f}`, expect: "valid", about: "Brook definition" })),
];

await mkdir(OUT, { recursive: true });
const raw = join(tmpdir(), `brook-fhir-validation-${process.pid}.json`);
const args = [
  "-jar", jar,
  ...targets.map((t) => t.path),
  "-version", "4.0.1",
  "-ig", oah,
  "-ig", DEFINITIONS,
  "-tx", tx,
  "-check-display", "Check",
  "-show-message-ids",
  "-output", raw,
];
console.log(`${java} ${args.map((a) => (a.includes(" ") ? JSON.stringify(a) : a)).join(" ")}\n`);
const log = await new Promise((resolve, reject) => {
  const child = spawn(java, args, { stdio: ["ignore", "pipe", "pipe"] });
  let text = "";
  child.stdout.on("data", (d) => ((text += d), process.stdout.write(d)));
  child.stderr.on("data", (d) => ((text += d), process.stderr.write(d)));
  child.on("error", reject);
  child.on("close", () => resolve(text));
});

const tidy = (s) => s.split(ROOT).join(".").split(oah).join("<OAH_IG_DIR>").split(dirname(jar)).join("<validator dir>");
const version = (log.match(/FHIR Validation tool Version (\S+)/) ?? [])[1] ?? "unknown";
const packages = (log.match(/Package Summary: \[(.*)\]/) ?? [])[1] ?? "";
const result = JSON.parse(await readFile(raw, "utf8"));
await rm(raw, { force: true });
const outcomes = result.resourceType === "Bundle" ? result.entry.map((e) => e.resource) : [result];
const fileOf = (oo) => (oo.extension ?? []).find((x) => x.url.endsWith("operationoutcome-file"))?.valueString ?? "";

const rows = [];
for (const t of targets) {
  const oo = outcomes.find((o) => fileOf(o) === t.path);
  if (!oo) throw new Error(`No outcome for ${t.name}`);
  const issues = (oo.issue ?? []).filter((i) => i.severity !== "information");
  const errors = issues.filter((i) => i.severity === "error" || i.severity === "fatal");
  const warnings = issues.filter((i) => i.severity === "warning");
  const messages = (list) =>
    list.map((i) => ({
      severity: i.severity,
      id: (i.extension ?? []).find((x) => x.url.endsWith("operationoutcome-message-id"))?.valueCode ?? null,
      where: (i.expression ?? i.location ?? [])[0] ?? null,
      text: tidy(i.details?.text ?? i.diagnostics ?? ""),
    }));
  const notes = {};
  for (const i of oo.issue ?? []) {
    const text = tidy(i.details?.text ?? "");
    // One line per kind of note: the per-code suffix "(codes = …)" is dropped.
    const key = text.replace(/ \(codes = [^)]*\)$/, "");
    if (i.severity === "information" && !key.startsWith("Validate resource against profile")) notes[key] = (notes[key] ?? 0) + 1;
  }
  const verdict = errors.length ? "invalid" : "valid";
  const ok = t.expect === "probe" ? null : verdict === t.expect;
  rows.push({ file: t.name, about: t.about, expect: t.expect, verdict, ok, errors: errors.length, warnings: warnings.length, issues: messages(issues), information: notes });
  const copy = JSON.parse(tidy(JSON.stringify(oo)));
  await writeFile(join(OUT, `${t.name.replace(/\//g, "__").replace(/\.json$/, "")}.outcome.json`), `${JSON.stringify(copy, null, 2)}\n`);
}

const summary = {
  validator: `HL7 FHIR Validator ${version}`,
  fhirVersion: "4.0.1",
  ran: new Date().toISOString(),
  terminology: tx,
  loaded: ["OneAquaHealth IG (hl7.eu.fhir.oah) built from source with SUSHI", "Brook definitions (public/fhir)", ...packages.split(", ").filter(Boolean)],
  options: ["-check-display Check", "-show-message-ids"],
  files: rows,
};
await writeFile(join(OUT, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);

const cell = (s) => String(s).replace(/\|/g, "\\|");
const md = [
  `Validator: ${summary.validator} · FHIR ${summary.fhirVersion} · terminology ${tx} · ${summary.ran.slice(0, 10)}`,
  "",
  "| File | Expected | Errors | Warnings | Result |",
  "|---|---|---:|---:|---|",
  ...rows.map((r) => `| \`${r.file}\` | ${r.expect} | ${r.errors} | ${r.warnings} | ${r.ok === null ? `probe: ${r.verdict}` : r.ok ? `✅ ${r.verdict} as expected` : `❌ ${r.verdict}, expected ${r.expect}`} |`),
  "",
  ...rows
    .filter((r) => r.issues.length)
    .flatMap((r) => [`**${r.file}**`, "", ...r.issues.map((i) => `- ${i.severity}${i.id ? ` \`${i.id}\`` : ""} at \`${cell(i.where ?? "")}\`: ${cell(i.text)}`), ""]),
  ...rows
    .filter((r) => Object.keys(r.information).length)
    .flatMap((r) => [`Information, ${r.file}:`, "", ...Object.entries(r.information).map(([t, n]) => `- ${n}× ${cell(t)}`), ""]),
].join("\n");
await writeFile(join(OUT, "summary.md"), `${md}\n`);
console.log(`\n${md}`);
console.log(`\nWrote ${relative(ROOT, OUT)}/`);
process.exit(rows.every((r) => r.ok !== false) ? 0 : 1);
