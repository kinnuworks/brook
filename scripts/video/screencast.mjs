// Crisp screen recording through Chrome's screencast API (device pixels, so a
// phone at deviceScaleFactor 2 records at 2×), saved as an H.264 MP4.
// Playwright's own recordVideo captures at 1× only, which looks soft in a 1080p film.

import { mkdir, writeFile, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";

export async function startScreencast(page, { width, height, quality = 92 } = {}) {
  const session = await page.context().newCDPSession(page);
  const dir = path.join("out", "frames", String(Date.now()));
  await mkdir(dir, { recursive: true });
  const frames = [];
  let n = 0;
  session.on("Page.screencastFrame", async ({ data, metadata, sessionId }) => {
    const file = path.join(dir, `${String(n++).padStart(6, "0")}.jpg`);
    frames.push({ file, t: metadata.timestamp });
    void writeFile(file, Buffer.from(data, "base64"));
    try {
      await session.send("Page.screencastFrameAck", { sessionId });
    } catch {
      /* session closed */
    }
  });
  await session.send("Page.startScreencast", { format: "jpeg", quality, maxWidth: width, maxHeight: height, everyNthFrame: 1 });
  const startedAt = Date.now() / 1000;

  return {
    /** Stops recording and writes an MP4 at `out`, padding the last frame to `minSeconds` if given. */
    async stop(out, { fps = 30, minSeconds = 0 } = {}) {
      await session.send("Page.stopScreencast").catch(() => {});
      await new Promise((r) => setTimeout(r, 300));
      const endedAt = Date.now() / 1000;
      if (!frames.length) throw new Error("no frames captured");
      // Chrome only sends a frame when something changes: hold each frame until the next one.
      // The first frame carries the time the page last changed, which can be seconds before
      // recording began; counting from there would freeze the start and push every action late.
      const at = (i) => Math.max(frames[i].t, startedAt);
      const lines = [];
      let total = 0;
      for (let i = 0; i < frames.length; i++) {
        const next = i + 1 < frames.length ? at(i + 1) : Math.max(endedAt, startedAt + minSeconds);
        // True timing, even for frames closer than 1/fps apart: the fps filter below drops extras.
        const dur = Math.max(0.001, next - at(i));
        total += dur;
        lines.push(`file '${path.resolve(frames[i].file)}'`, `duration ${dur.toFixed(4)}`);
      }
      // The concat format needs the last file listed twice, and ffmpeg then shows it twice as
      // long: cut the clip at its real length, or every clip ends on a frozen frame.
      lines.push(`file '${path.resolve(frames.at(-1).file)}'`);
      const list = path.join(dir, "list.txt");
      await writeFile(list, lines.join("\n"));
      execFileSync("ffmpeg", [
        "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", list,
        "-vf", `fps=${fps},scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p`,
        "-t", total.toFixed(3),
        "-c:v", "libx264", "-preset", "slow", "-crf", "16", out,
      ]);
      await rm(dir, { recursive: true, force: true });
      return { frames: frames.length, seconds: endedAt - startedAt };
    },
  };
}
