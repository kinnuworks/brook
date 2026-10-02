#!/usr/bin/env python3
"""Assembles the Brook demo video (1920×1080, 30 fps, H.264 + AAC) from the
recorded app clips, the rendered cards and the narration.

Run after record-phone.mjs, record-desktop.mjs and render-cards.mjs:
    python3 scripts/video/compose.py
"""
import json
import subprocess
from pathlib import Path

ROOT = Path("out/video")
CARDS, CLIPS, AUDIO, SCENES = ROOT / "cards", ROOT / "clips", ROOT / "audio", ROOT / "scenes"
SCENES.mkdir(parents=True, exist_ok=True)
FPS = 30
PHONE = dict(x=424, y=51, w=452, h=978)
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


def languages_scene(name, cues, total):
    """Three phones side by side: the same check in Portuguese, Italian and Greek."""
    inputs = ["-loop", "1", "-t", f"{total}", "-i", str(CARDS / "desk-langs.png")]
    for lang in ["pt", "it", "el"]:
        inputs += ["-loop", "1", "-t", f"{total}", "-i", str(CARDS / f"lang-{lang}.png")]
    inputs += ["-loop", "1", "-t", f"{total}", "-i", str(CARDS / "langs-frame.png")]
    for f, _ in cues:
        inputs += ["-i", str(AUDIO / f)]
    v = [f"[0:v]fps={FPS},format=yuv420p[bg]"]
    xs = [347, 779, 1211]
    cur = "bg"
    for i, x in enumerate(xs):
        v.append(f"[{i + 1}:v]scale=362:783,fps={FPS},format=yuva420p,fade=t=in:st={0.3 + i * 0.5}:d=0.5:alpha=1[ph{i}]")
        v.append(f"[{cur}][ph{i}]overlay={x}:200[s{i}]")
        cur = f"s{i}"
    v.append(f"[{cur}][4:v]overlay=0:0,trim=0:{total},fade=t=in:st=0:d=0.35,fade=t=out:st={total - 0.35}:d=0.35[vout]")
    a_parts = [f"[{5 + i}:a]adelay={int(s * 1000)}|{int(s * 1000)},aresample=48000,aformat=channel_layouts=stereo[a{i}]" for i, (f, s) in enumerate(cues)]
    a_parts.append(f"{''.join(f'[a{i}]' for i in range(len(cues)))}amix=inputs={len(cues)}:normalize=0,apad,atrim=0:{total}[aout]")
    encode(SCENES / f"{name}.mp4", inputs, v, a_parts, total)


D = {p.stem: dur(p) for p in AUDIO.glob("*.mp3")}
C = {p.stem: dur(p) for p in CLIPS.glob("*.mp4")}
plan = []

# 1 · the river
t = 0.6 + D["s01"] + 1.2
photo_scene("01-river", ["public/samples/upstream.jpg", "public/samples/downstream.jpg"], "s01-caption.png", [("s01.mp3", 0.6)], t)
plan.append("01-river")
# 2 · the problem
t = 0.4 + D["s02"] + 1.0
still_scene("02-problem", [("s02-a.png", 0, 0), ("s02-b.png", 15.2, 0.6)], [("s02.mp3", 0.4)], t)
plan.append("02-problem")
# 3 · title
t = 0.3 + D["s03"] + 1.0
still_scene("03-title", [("s03-title.png", 0, 0)], [("s03.mp3", 0.3)], t, zoom=True)
plan.append("03-title")
# 4 · start (Brook says hello over the first frame, then the clip plays under the narration)
hello = 0.3 + D["b01"] + 0.3
t = hello + max(C["p1-start"], D["s04"] + 0.4) + 0.3
device_scene("04-start", "phone-s04.png", "p1-start.mp4", "phone-frame.png", PHONE, [("b01.mp3", 0.3), ("s04.mp3", hello)], t, freeze_first=hello)
plan.append("04-start")
# 5 · photos
t = 0.3 + D["s05"] + 0.8
device_scene("05-photos", "phone-s05.png", "p2-suggested.mp4", "phone-frame.png", PHONE, [("s05.mp3", 0.3)], t)
plan.append("05-photos")
# 6 · talk, and ask what a word means (Brook answers in its own voice)
lead = 0.3 + D["s06"] + 0.3
t = lead + C["p3-voice-help"] + 0.4
device_scene("06-talk", "phone-s06.png", "p3-voice-help.mp4", "phone-frame.png", PHONE, [("s06.mp3", 0.3), ("b02.mp3", lead + 2.2)], t, freeze_first=lead)
plan.append("06-talk")
# 6b · seven languages
t = 0.4 + D["s06b"] + 1.2
languages_scene("06b-languages", [("s06b.mp3", 0.4)], t)
plan.append("06b-languages")
# 7 · you decide
lead = 3.4
t = max(lead + C["p4-confirm"], 0.3 + D["s07"]) + 0.6
device_scene("07-confirm", "phone-s07.png", "p4-confirm.mp4", "phone-frame.png", PHONE, [("s07.mp3", 0.3)], t, freeze_first=lead)
plan.append("07-confirm")
# 8 · face downstream
t = max(C["p5-downstream"], 0.3 + D["s08"]) + 0.6
device_scene("08-downstream", "phone-s08.png", "p5-downstream.mp4", "phone-frame.png", PHONE, [("s08.mp3", 0.3)], t)
plan.append("08-downstream")
# 9 · second look (Brook's own line once the second look is on screen)
t = C["p6-second-look"] + 0.5
device_scene("09-second-look", "phone-s09.png", "p6-second-look.mp4", "phone-frame.png", PHONE, [("s09.mp3", 0.3), ("b03.mp3", max(8.6, 0.3 + D["s09"] + 0.3))], max(t, 8.9 + D["b03"] + 0.5))
plan.append("09-second-look")
# 10 · the story
t = max(C["p7-story"], 0.4 + D["s10"]) + 0.5
device_scene("10-story", "phone-s10.png", "p7-story.mp4", "phone-frame.png", PHONE, [("s10.mp3", 0.4)], t)
plan.append("10-story")
# 11 · the data
t = max(C["p8-data"], 0.3 + D["s11"]) + 0.8
device_scene("11-data", "phone-s11.png", "p8-data.mp4", "phone-frame.png", PHONE, [("s11.mp3", 0.3)], t)
plan.append("11-data")
# 12 · research hub
t = max(C["d1-hub"], 0.4 + D["s12"]) + 0.5
device_scene("12-hub", "desk-s12.png", "d1-hub.mp4", "browser-frame.png", BROWSER, [("s12.mp3", 0.4)], t, crop_h=True)
plan.append("12-hub")
# 13 · trust and cost
t = max(C["d2-about"], 0.4 + D["s13"]) + 0.5
device_scene("13-about", "desk-s13.png", "d2-about.mp4", "browser-frame.png", BROWSER, [("s13.mp3", 0.4)], t, crop_h=True)
plan.append("13-about")
# 14 · close
t = 0.5 + D["s14"] + 4.0
still_scene("14-close", [("s14-close.png", 0, 0)], [("s14.mp3", 0.5)], t, zoom=True)
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
    str(ROOT / "brook-demo.mp4"),
])
print(json.dumps({"scenes": plan, "seconds": round(dur(ROOT / "brook-demo.mp4"), 1)}))
