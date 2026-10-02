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
      const lines = [];
      for (let i = 0; i < frames.length; i++) {
        const next = i + 1 < frames.length ? frames[i + 1].t : Math.max(endedAt, startedAt + minSeconds);
        const dur = Math.max(1 / fps, next - frames[i].t);
        lines.push(`file '${path.resolve(frames[i].file)}'`, `duration ${dur.toFixed(4)}`);
      }
      lines.push(`file '${path.resolve(frames.at(-1).file)}'`);
      const list = path.join(dir, "list.txt");
      await writeFile(list, lines.join("\n"));
      execFileSync("ffmpeg", [
        "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", list,
        "-vf", `fps=${fps},scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p`,
        "-c:v", "libx264", "-preset", "slow", "-crf", "16", out,
      ]);
      await rm(dir, { recursive: true, force: true });
      return { frames: frames.length, seconds: endedAt - startedAt };
    },
  };
}
