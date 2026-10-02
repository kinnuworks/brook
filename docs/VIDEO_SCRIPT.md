# Brook — demo video (3:07)

Format: 1920×1080, 30 fps. Phone scenes show the real app in a phone frame with a caption beside it; laptop scenes show it in a browser window. A narrator speaks over everything, and Brook speaks in its own voice when Brook speaks in the app. Every screen is the live app: nothing is mocked, and every action on screen is timed to the narration, so there is no dead air.

| # | Time | Picture | Narration | On-screen caption |
|---|---|---|---|---|
| 1 | 0:00–0:18 | The Alna at Bryn (OAH site O17), slow pan | This is the Alna, a small river running through Oslo. OneAquaHealth, a European science project, studies streams like this one in five cities, to learn how healthy they are: for the wildlife living in them, and for the people living beside them. | *106 city streams. Five cities. How healthy are they?* |
| 2 | 0:18–0:42 | The official question; “left margin” and “impervious areas” highlighted | Scientists can't visit every stream every week, so they ask ordinary people to help… But some of the questions are hard… When questions are confusing, people guess, or give up. | *Left of what? What does “impervious” mean?* |
| 3 | 0:42–0:48 | Animated title: Brook's logo blooms in with ripples, the name rises letter by letter, a wave underline draws, the tagline fades up | So we built Brook: a friendly guide for OneAquaHealth's stream check. | **Brook** — a friendly guide for OneAquaHealth's stream check |
| 4 | 0:48–1:01 | Phone: hello and safety, the nearest research sites, the demo site | *(Brook)* Hi, I'm Brook… · Brook starts with a quick safety reminder, then finds the nearest of OneAquaHealth's 106 research streams. | *Safety first, then the nearest stream* |
| 5 | 1:01–1:08 | Phone: “From your photos I can suggest N answers” | You take three photos. Brook looks at them, and suggests answers to the questions a photo can answer. | *Brook looks at your photos* |
| 6 | 1:08–1:24 | Phone: the question card; the user asks by voice “what does U shape mean?”; Brook explains; the user answers “it's a U shape” | Then Brook asks each question in everyday words. You can talk, or tap. And if a word is unclear, just ask. · *(Brook)* Imagine slicing across the stream… | *Ask what any word means* |
| 6b | 1:24–1:39 | Three phones: the check in Portuguese, Italian and Greek; then the Portuguese phone is highlighted while Brook asks the question in Portuguese | And Brook speaks Portuguese, French, Italian, Dutch, Norwegian and Greek, too… · *(Brook, in Portuguese)* Olhe para o leito da ribeira… | *The languages of OneAquaHealth's cities* · *Brook, in Portuguese* |
| 7 | 1:39–1:49 | Phone: the photo suggestion; the user says “yes, that's right” | Brook's photo suggestions are only suggestions. Nothing is saved until you say it's right, and Brook remembers how every answer was given. | *Nothing is saved until you say it's right* |
| 8 | 1:49–1:55 | Phone: the face-downstream diagram | Even the trickiest question becomes simple. Face the way the water flows, and left is left. | *Face the way the water flows* |
| 9 | 1:55–2:12 | Phone: rating “good” and feelings by voice → the second look → “Change it” → “moderate” | If two answers don't fit together, Brook asks you to take another look… · *(Brook)* You rated the stream as good, but you also noted polluting pipes… | *Brook asks. You decide.* |
| 10 | 2:12–2:22 | Phone: the story — you vs the lab, One Health tips | At the end, you see your stream's story… | *What scientists found, next to what you saw* |
| 11 | 2:22–2:31 | Phone: “shared with OneAquaHealth ✓”, then the technical data | And your answers go to OneAquaHealth in exactly the form they already use… | *Sent in the form OneAquaHealth already uses* |
| 11b | 2:31–2:39 | Laptop: answers filling the side panel as they are given | On a laptop, Brook keeps your progress, your photos, and every answer right beside the conversation. | *On a laptop: your progress, your photos and every answer beside the conversation* |
| 12 | 2:39–2:49 | Laptop: research hub — map, which questions are hard, AI agreement | For scientists, Brook shows something a paper form never could… | *For scientists: which questions do people find hard?* |
| 13 | 2:49–3:00 | Laptop: About — AI safety, your data, cost | Brook speaks seven languages. It works without AI, and without signal. It keeps data in Europe. And it costs about a tenth of a cent per check. | *Seven languages · works without AI or signal · data stays in Europe · ≈ 0.1 ¢ per check* |
| 14 | 3:00–3:07 | Animated close: logo, the line rising in, links | Brook doesn't replace OneAquaHealth's app. It gives it a voice. | **brook-oah.vercel.app** · github.com/kinnuworks/brook |

## How it is made

```
node scripts/video/render-cards.mjs     # backgrounds, captions, phone and browser frames
node scripts/video/render-motion.mjs    # the animated title and close, frame by frame
node scripts/video/record-phone.mjs     # phone clips (dev server running, AI key set)
node scripts/video/record-desktop.mjs   # laptop clips
python3 scripts/video/compose.py        # assembles out/video/brook-demo.mp4 at -16 LUFS
```

Narration: ElevenLabs (narrator “Alice”, Brook “River”), text in `out/video/narration.json`; credited on the closing card.
