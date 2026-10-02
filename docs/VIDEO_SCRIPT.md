# Brook — demo video script (target 3:50–4:20)

Format: 1920×1080. Left: a phone showing the real app (screen recording). Right: one short caption per beat, in the app's own type. Narrator voice over everything; Brook's own voice when Brook speaks in the app. Every screen is the live app at brook-oah.vercel.app — nothing mocked.

| # | Time | Picture | Narration (≈150 wpm) | On-screen caption |
|---|---|---|---|---|
| 1 | 0:00–0:16 | Slow pan across the Alna river at Bryn (sample photos), OAH site O17 | Every city has streams most people walk past without a second look. OneAquaHealth asks citizens to look closer, and to check the health of their urban streams. | *106 urban streams. Five cities. One question: how healthy are they?* |
| 2 | 0:16–0:38 | The official question, typed out, key words highlighted | But at the water's edge, the questions are hard. Is more than one third of the left margin covered by impervious areas? Left, facing which way? OneAquaHealth's own brief names the problem: complex tools, confusing terminology, and low participation. | *“Complex tools, confusing terminology, and low participation.” — Track 1 brief* |
| 3 | 0:38–0:46 | Title card: Brook avatar + “Brook — talk to your stream” | So we built Brook: a talking field coach for OneAquaHealth's stream check. | **Brook** — talk to your stream |
| 4 | 0:46–1:02 | Phone: hello + safety, site list, choose “Alna – Bryn stasjon” | Brook starts with safety, then finds the nearest of OneAquaHealth's 106 research sites, or any stream at all. | *Safety first · nearest research site* |
| 5 | 1:02–1:18 | Phone: three photos → “From your photos I can suggest N answers” | Three photos: upstream, downstream, and the surroundings. Brook looks, and suggests answers to the questions a photo can answer. | *Photos suggest. People decide.* |
| 6 | 1:18–1:44 | Phone: channel shape, user asks “What does U shape mean?”, Brook explains, user says “It's a U” | You talk, or tap. Ask what anything means and Brook explains it in plain words, in seven languages. | *Voice or tap · every term explained · 7 languages* |
| 7 | 1:44–2:02 | Phone: banks suggestion “laid stones”, user: “Yes, that's right” → receipt with camera icon | Nothing is recorded until you confirm it, and Brook remembers where every answer came from. | *Every answer: tapped, said, or a suggestion you confirmed* |
| 8 | 2:02–2:16 | Phone: margins with the face-downstream diagram | And left and right finally make sense. | *Facing downstream, left is left.* |
| 9 | 2:16–2:36 | Phone: rating “Good” → second look about the polluting pipe → user changes to “Moderate” | When answers don't agree, Brook takes a gentle second look. It never changes an answer. You decide. | *A second look, never an override* |
| 10 | 2:36–3:00 | Story page: you vs the lab, health risk, One Health tips | Then, your stream's story: what OneAquaHealth scientists measured at this exact site, next to what you saw, with tips for people, for pets, and for the stream itself. | *Your stream's story — with OneAquaHealth's own lab data* |
| 11 | 3:00–3:14 | Story → data panel: CitizenSubmissionPutDTO JSON, “sent to OneAquaHealth's FHIR sandbox ✓” | Behind it, your answers go to OneAquaHealth in the exact form they already use, and in the standard health systems use to share data. | *OAH's own format + HL7 FHIR (OAH IG)* |
| 12 | 3:14–3:36 | Research hub: map, “Which questions confuse volunteers?”, AI agreement | For researchers, something no paper form can tell you: which questions confuse volunteers, and how often they agree with the AI. | *Which questions confuse volunteers?* |
| 13 | 3:36–3:56 | About page: architecture + responsible AI | The AI never decides: it can only choose OneAquaHealth's own answers, and a person confirms every one. It works offline, works without AI, keeps data in Europe, and costs about a tenth of a cent per check. | *AI suggests · people decide · works without AI* |
| 14 | 3:56–4:10 | Closing card with links | Brook doesn't replace OneAquaHealth's app. It gives it a voice. | **brook-oah.vercel.app** · github.com/kinnuworks/brook |

## Brook's spoken lines (Brook's voice, from the app)
- “Hi, I'm Brook. I'll walk you through OneAquaHealth's stream check. It takes about five minutes.”
- “Look across the stream bed. Is its shape flat and wide, a U with steep sides, or a narrow V?”
- “Imagine slicing across the stream. U shape: a rounded trough with steep banks…”
- “From your photo, it looks like laid stones. Is that right?”
- “You rated the stream as good, but you also noted polluting pipes. Is ‘good’ still how you see it?”

## Production notes
- Narration: the team's own voice is best; an AI voice (ElevenLabs) is the fallback and is credited in the closing card.
- Captions burned in (accessibility) and also uploaded as an .srt.
- Hub screens show the “Simulated” label on purpose.
