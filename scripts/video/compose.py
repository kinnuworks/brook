#!/usr/bin/env python3
"""Assembles the Brook demo video (1920×1080, 30 fps, H.264 + AAC) from the
recorded app clips, the rendered cards and the narration.

Run after record-phone.mjs, record-desktop.mjs, render-cards.mjs and render-motion.mjs:
    python3 scripts/video/compose.py

Every scene is as long as its narration (or its clip) plus a breath: the clips are
filmed with their actions timed to the narration, so nothing is left hanging.
"""
import json
import subprocess
from pathlib import Path

ROOT = Path("out/video")
CARDS, CLIPS, AUDIO, SCENES = ROOT / "cards", ROOT / "clips", ROOT / "audio", ROOT / "scenes"
SCENES.mkdir(parents=True, exist_ok=True)
FPS = 30
PHONE = dict(x=424, y=105, w=452, h=924)  # the app area, under the frame's status bar
BROWSER = dict(x=180, y=126, w=1560, h=919)


def dur(path: Path) -> float:
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)]))


def run(args):
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *args], check=True)


def audio_mix(cues, total):
    """cues: [(file, start_seconds)] → ffmpeg inputs and a filter that mixes them into [aout]."""
    inputs, parts, labels = [], [], []
    for i, (f, start) in enumerate(cues):
        inputs += ["-i", str(AUDIO / f)]
        parts.append(f"[{i + 1}:a]adelay={int(start * 1000)}|{int(start * 1000)},aresample=48000,aformat=channel_layouts=stereo[a{i}]")
        labels.append(f"[a{i}]")
    if labels:
        parts.append(f"{''.join(labels)}amix=inputs={len(labels)}:normalize=0,apad,atrim=0:{total}[aout]")
    else:
        parts.append(f"anullsrc=r=48000:cl=stereo,atrim=0:{total}[aout]")
    return inputs, parts


def encode(out, inputs, vfilter, afilter_parts, total):
    graph = ";".join([*vfilter, *afilter_parts])
    run([*inputs, "-filter_complex", graph, "-map", "[vout]", "-map", "[aout]", "-t", f"{total:.3f}",
         "-r", str(FPS), "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
         "-c:a", "aac", "-b:a", "192k", "-ar", "48000", str(out)])


def device_scene(name, bg, clip, frame, geo, cues, total, freeze_first=0.0, speed=1.0, crop_h=None):
    """A recorded clip inside a phone or browser frame on a caption background."""
    clip_path = CLIPS / clip
    a_inputs, a_parts = audio_mix(cues, total)
    inputs = ["-loop", "1", "-t", f"{total}", "-i", str(CARDS / bg)] + a_inputs
    clip_idx = 1 + len(cues)
    frame_idx = clip_idx + 1
    inputs += ["-i", str(clip_path), "-loop", "1", "-t", f"{total}", "-i", str(CARDS / frame)]
    scale = f"scale={geo['w']}:-2" if crop_h else f"scale={geo['w']}:{geo['h']}"
    crop = f",crop={geo['w']}:{geo['h']}:0:0" if crop_h else ""
    v = [
        f"[{clip_idx}:v]setpts={1 / speed}*PTS,{scale}{crop},fps={FPS},"
        f"tpad=start_mode=clone:start_duration={freeze_first}:stop_mode=clone:stop_duration={total + 5}[clip]",
        f"[0:v]fps={FPS},format=yuv420p[bg]",
        f"[bg][clip]overlay={geo['x']}:{geo['y']}:shortest=0[v1]",
        f"[v1][{frame_idx}:v]overlay=0:0,trim=0:{total},fade=t=in:st=0:d=0.35,fade=t=out:st={total - 0.35}:d=0.35[vout]",
    ]
    encode(SCENES / f"{name}.mp4", inputs, v, a_parts, total)


def still_scene(name, layers, cues, total, zoom=False):
    """layers: [(png, start, fade_in_seconds)] stacked over each other in order."""
    a_inputs, a_parts = audio_mix(cues, total)
    inputs = []
    for png, _, _ in layers:
        inputs += ["-loop", "1", "-t", f"{total}", "-i", str(CARDS / png)]
    # audio inputs come after the images: shift their indices
    a_inputs_fixed, a_parts_fixed = [], []
    for i, (f, start) in enumerate(cues):
        a_inputs_fixed += ["-i", str(AUDIO / f)]
    n = len(layers)
    for i, (f, start) in enumerate(cues):
        a_parts_fixed.append(f"[{n + i}:a]adelay={int(start * 1000)}|{int(start * 1000)},aresample=48000,aformat=channel_layouts=stereo[a{i}]")
    if cues:
        a_parts_fixed.append(f"{''.join(f'[a{i}]' for i in range(len(cues)))}amix=inputs={len(cues)}:normalize=0,apad,atrim=0:{total}[aout]")
    else:
        a_parts_fixed.append(f"anullsrc=r=48000:cl=stereo,atrim=0:{total}[aout]")
    v = [f"[0:v]fps={FPS},format=yuva420p[l0]"]
    cur = "l0"
    for i, (png, start, fade) in enumerate(layers[1:], start=1):
        v.append(f"[{i}:v]fps={FPS},format=yuva420p,fade=t=in:st={start}:d={fade}:alpha=1[o{i}]")
        v.append(f"[{cur}][o{i}]overlay=0:0[m{i}]")
        cur = f"m{i}"
    tail = f"zoompan=z='min(1+0.0006*on,1.08)':d=1:s=1920x1080:fps={FPS}," if zoom else ""
    v.append(f"[{cur}]{tail}format=yuv420p,trim=0:{total},fade=t=in:st=0:d=0.4,fade=t=out:st={total - 0.4}:d=0.4[vout]")
    encode(SCENES / f"{name}.mp4", inputs + a_inputs_fixed, v, a_parts_fixed, total)


def clip_scene(name, clip, cues, total):
    """A full-screen animated clip (the title, the close) with its narration."""
    a_inputs, a_parts = audio_mix(cues, total)
    inputs = ["-i", str(CLIPS / clip)] + a_inputs
    # audio_mix numbers its inputs from 1, which is right here: the clip is input 0.
    v = [f"[0:v]fps={FPS},format=yuv420p,tpad=stop_mode=clone:stop_duration=5,trim=0:{total},fade=t=in:st=0:d=0.3,fade=t=out:st={total - 0.4}:d=0.4[vout]"]
    encode(SCENES / f"{name}.mp4", inputs, v, a_parts, total)


def photo_scene(name, photos, caption, cues, total):
    """Ken Burns over the river photos, caption on top."""
    a_inputs, _ = audio_mix([], total)
    each = total / len(photos)
    inputs, v = [], []
    for i, p in enumerate(photos):
        inputs += ["-loop", "1", "-t", f"{each + 1}", "-i", str(p)]
        v.append(
            f"[{i}:v]scale=2400:-2,crop=2400:1350,zoompan=z='1.04+0.0009*on':x='iw/2-(iw/zoom/2)+on*0.6':y='ih/2-(ih/zoom/2)':d={int((each + 1) * FPS)}:s=1920x1080:fps={FPS},trim=0:{each + 1},setpts=PTS-STARTPTS[p{i}]"
        )
    chain = "p0"
    for i in range(1, len(photos)):
        v.append(f"[{chain}][p{i}]xfade=transition=fade:duration=1:offset={each * i - 0.5 * i:.2f}[x{i}]")
        chain = f"x{i}"
    cap_idx = len(photos)
    inputs += ["-loop", "1", "-t", f"{total}", "-i", str(CARDS / caption)]
    n_img = len(photos) + 1
    for f, _ in cues:
        inputs += ["-i", str(AUDIO / f)]
    a_parts = [f"[{n_img + i}:a]adelay={int(s * 1000)}|{int(s * 1000)},aresample=48000,aformat=channel_layouts=stereo[a{i}]" for i, (f, s) in enumerate(cues)]
    a_parts.append(f"{''.join(f'[a{i}]' for i in range(len(cues)))}amix=inputs={len(cues)}:normalize=0,apad,atrim=0:{total}[aout]")
    v.append(f"[{cap_idx}:v]format=yuva420p,fade=t=in:st=1.2:d=1:alpha=1[cap]")
    v.append(f"[{chain}][cap]overlay=0:0,format=yuv420p,trim=0:{total},fade=t=in:st=0:d=0.8,fade=t=out:st={total - 0.5}:d=0.5[vout]")
    encode(SCENES / f"{name}.mp4", inputs, v, a_parts, total)


def languages_scene(name, cues, total, focus_at):
    """Three phones: the same check in Portuguese, Italian and Greek; then Brook speaks Portuguese."""
    inputs = ["-loop", "1", "-t", f"{total}", "-i", str(CARDS / "desk-langs.png")]
    for lang in ["pt", "it", "el"]:
        inputs += ["-loop", "1", "-t", f"{total}", "-i", str(CARDS / f"lang-{lang}.png")]
    inputs += ["-loop", "1", "-t", f"{total}", "-i", str(CARDS / "langs-frame.png")]
    inputs += ["-loop", "1", "-t", f"{total}", "-i", str(CARDS / "langs-focus.png")]
    for f, _ in cues:
        inputs += ["-i", str(AUDIO / f)]
    v = [f"[0:v]fps={FPS},format=yuv420p[bg]"]
    xs = [347, 779, 1211]
    cur = "bg"
    for i, x in enumerate(xs):
        v.append(f"[{i + 1}:v]scale=362:739,fps={FPS},format=yuva420p,fade=t=in:st={0.3 + i * 0.45}:d=0.5:alpha=1[ph{i}]")
        v.append(f"[{cur}][ph{i}]overlay={x}:244[s{i}]")
        cur = f"s{i}"
    v.append(f"[{cur}][4:v]overlay=0:0[fr]")
    v.append(f"[5:v]fps={FPS},format=yuva420p,fade=t=in:st={focus_at}:d=0.5:alpha=1[fo]")
    v.append(f"[fr][fo]overlay=0:0,trim=0:{total},fade=t=in:st=0:d=0.35,fade=t=out:st={total - 0.35}:d=0.35[vout]")
    a_parts = [f"[{6 + i}:a]adelay={int(s * 1000)}|{int(s * 1000)},aresample=48000,aformat=channel_layouts=stereo[a{i}]" for i, (f, s) in enumerate(cues)]
    a_parts.append(f"{''.join(f'[a{i}]' for i in range(len(cues)))}amix=inputs={len(cues)}:normalize=0,apad,atrim=0:{total}[aout]")
    encode(SCENES / f"{name}.mp4", inputs, v, a_parts, total)


D = {p.stem: dur(p) for p in AUDIO.glob("*.mp3")}
C = {p.stem: dur(p) for p in CLIPS.glob("*.mp4")}
plan = []

# 1 · the river
photo_scene("01-river", ["public/samples/upstream.jpg", "public/samples/downstream.jpg"], "s01-caption.png", [("s01.mp3", 0.5)], 0.5 + D["s01"] + 0.7)
plan.append("01-river")
# 2 · the problem ("Left of what?" brings the second card)
still_scene("02-problem", [("s02-a.png", 0, 0), ("s02-b.png", 15.2, 0.6)], [("s02.mp3", 0.4)], 0.4 + D["s02"] + 0.6)
plan.append("02-problem")
# 3 · title: the animated card, no zoom
clip_scene("03-title", "title.mp4", [("s03.mp3", 0.3)], min(C["title"], 0.3 + D["s03"] + 0.8))
plan.append("03-title")
# 4 · start: Brook says hello over the first frame, then the clip plays under the narration
hello = 0.3 + D["b01"] + 0.25
device_scene("04-start", "phone-s04.png", "p1-start.mp4", "phone-frame.png", PHONE, [("b01.mp3", 0.3), ("s04.mp3", hello)], hello + C["p1-start"] + 0.2, freeze_first=hello)
plan.append("04-start")
# 5 · photos
device_scene("05-photos", "phone-s05.png", "p2-suggested.mp4", "phone-frame.png", PHONE, [("s05.mp3", 0.3)], max(C["p2-suggested"], 0.3 + D["s05"] + 0.4))
plan.append("05-photos")
# 6 · talk, and ask what a word means: the question starts as the narrator says "just ask",
#     and Brook answers in its own voice 2.2 s into the clip
lead = 0.3 + D["s06"] - 2.0
device_scene("06-talk", "phone-s06.png", "p3-voice-help.mp4", "phone-frame.png", PHONE, [("s06.mp3", 0.3), ("b02.mp3", lead + 2.2)], lead + C["p3-voice-help"] - 0.4, freeze_first=lead)
plan.append("06-talk")
# 6b · seven languages, then Brook asks the same question in Portuguese
focus = 0.4 + D["s06b"] + 0.15
languages_scene("06b-languages", [("s06b.mp3", 0.4), ("b04.mp3", focus + 0.25)], focus + 0.25 + D["b04"] + 0.5, focus)
plan.append("06b-languages")
# 7 · you decide (the clip says "yes, that's right" as the narrator reaches it)
device_scene("07-confirm", "phone-s07.png", "p4-confirm.mp4", "phone-frame.png", PHONE, [("s07.mp3", 0.3)], max(C["p4-confirm"], 0.3 + D["s07"] + 0.3) + 0.1)
plan.append("07-confirm")
# 8 · face downstream
device_scene("08-downstream", "phone-s08.png", "p5-downstream.mp4", "phone-frame.png", PHONE, [("s08.mp3", 0.3)], max(C["p5-downstream"], 0.3 + D["s08"] + 0.3) + 0.1)
plan.append("08-downstream")
# 9 · second look: Brook's own line once it is on screen, then the change (the clip's last
#     second is the review screen, which the next scene does not need)
device_scene("09-second-look", "phone-s09.png", "p6-second-look.mp4", "phone-frame.png", PHONE, [("s09.mp3", 0.3), ("b03.mp3", max(8.6, 0.3 + D["s09"] + 0.3))], C["p6-second-look"] - 1.4)
plan.append("09-second-look")
# 10 · the story
device_scene("10-story", "phone-s10.png", "p7-story.mp4", "phone-frame.png", PHONE, [("s10.mp3", 0.4)], max(C["p7-story"], 0.4 + D["s10"] + 0.3) + 0.1)
plan.append("10-story")
# 11 · the data
device_scene("11-data", "phone-s11.png", "p8-data.mp4", "phone-frame.png", PHONE, [("s11.mp3", 0.3)], max(C["p8-data"], 0.3 + D["s11"] + 0.4))
plan.append("11-data")
# 11b · on a laptop
device_scene("11b-laptop", "desk-s11b.png", "d0-check.mp4", "browser-frame.png", BROWSER, [("s11b.mp3", 0.3)], max(C["d0-check"], 0.3 + D["s11b"] + 0.4), crop_h=True)
plan.append("11b-laptop")
# 12 · research hub
device_scene("12-hub", "desk-s12.png", "d1-hub.mp4", "browser-frame.png", BROWSER, [("s12.mp3", 0.4)], max(C["d1-hub"], 0.4 + D["s12"] + 0.3), crop_h=True)
plan.append("12-hub")
# 13 · trust and cost
device_scene("13-about", "desk-s13.png", "d2-about.mp4", "browser-frame.png", BROWSER, [("s13.mp3", 0.4)], max(C["d2-about"], 0.4 + D["s13"] + 0.3), crop_h=True)
plan.append("13-about")
# 14 · close: the animated card, held long enough to read the links
clip_scene("14-close", "close.mp4", [("s14.mp3", 0.5)], min(C["close"], 0.5 + D["s14"] + 2.6))
plan.append("14-close")

# Join, then lay a quiet stream ambience under everything.
lst = SCENES / "list.txt"
lst.write_text("".join(f"file '{(SCENES / f'{p}.mp4').resolve()}'\n" for p in plan))
run(["-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(ROOT / "joined.mp4")])
total = dur(ROOT / "joined.mp4")
run([
    "-i", str(ROOT / "joined.mp4"), "-stream_loop", "-1", "-i", str(AUDIO / "ambience.mp3"),
    "-filter_complex", f"[1:a]volume=0.07,afade=t=in:st=0:d=2,afade=t=out:st={total - 3}:d=3,atrim=0:{total}[amb];[0:a][amb]amix=inputs=2:normalize=0[a]",
    "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart",
    str(ROOT / "mixed.mp4"),
])

# Loudness to -16 LUFS (two passes): YouTube turns loud videos down but never quiet ones up.
probe = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(ROOT / "mixed.mp4"), "-af", "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"],
                       capture_output=True, text=True).stderr
m = json.loads(probe[probe.rindex("{"):probe.rindex("}") + 1])
norm = (f"loudnorm=I=-16:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
        f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
run(["-i", str(ROOT / "mixed.mp4"), "-af", norm, "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", str(ROOT / "brook-demo.mp4")])
print(json.dumps({"scenes": plan, "seconds": round(dur(ROOT / "brook-demo.mp4"), 1)}))
