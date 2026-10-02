![Brook on four phones: a question with a photo suggestion, the face-downstream diagram, your stream's story, the review](https://raw.githubusercontent.com/kinnuworks/brook/main/docs/img/hero.png)

**Try it in one minute, no stream needed:** [brook-oah.vercel.app/check?demo=1](https://brook-oah.vercel.app/check?demo=1) runs a full check with real photos of OneAquaHealth site O17 in Oslo.

## In one minute
OneAquaHealth studies the health of small rivers in five European cities and asks ordinary people to help by answering about twenty questions at a stream. Many of those questions use hard words (*“impervious areas covering more than one third of the left margin”*), so people get confused or give up. **Brook is a friendly guide on your phone that turns the questions into a simple conversation**: talk or tap, in seven languages. It explains any word, suggests answers from your photos for you to confirm, asks you to look again when two answers don't fit, and shows you what scientists found at your stream. Your answers reach OneAquaHealth in the exact form they already use.

## Track alignment
**Track 1, Citizen Science UX, is our primary track.** Its brief names the problem, *“complex tools, confusing terminology, and low participation reduce usability and impact”*, and asks for *“guided workflows, simplified ecological terms, improved data accuracy, and repeat engagement features.”* Brook is that, end to end: a guided conversation, every ecological term explained in plain words, photo suggestions and gentle second looks for accuracy, and a personal story of your stream that gives people a reason to come back. It also delivers responsible AI with a human always deciding (Track 3), One Health storytelling (Track 4) and health-data standards with the OneAquaHealth FHIR guide (Track 7).

## Inspiration
OneAquaHealth asks citizens to check their city streams: that's how you watch 106 sites in five cities between lab visits. But stand at the water's edge with the official form and you're asked whether *“impervious areas cover more than one third of the left margin”*, where left means *facing downstream*, which almost nobody knows. People guess or give up, and researchers get data they can't fully trust. We wanted the patience of an expert standing next to every volunteer.

## What it does
- **A conversation, not a form.** Brook asks each of OneAquaHealth's questions in plain words, by voice or text, in the seven languages of OneAquaHealth's app (English, Portuguese, French, Italian, Dutch, Norwegian, Greek). “What does that mean?” always works, small drawings show the meaning, and the official wording is one tap away. A “face downstream” diagram ends the left/right confusion.
- **Photos suggest, people decide.** From photos looking upstream, downstream and around, Brook suggests answers to the questions a photo can answer, and says what it saw. Nothing is recorded until the person confirms or corrects it. In a test on 36 real stream photos Brook had never seen, 132 of its 134 suggestions on clearly visible things were right, and for pictures that weren't streams it suggested nothing.
- **A second look.** Seven published rules spot answers that don't fit together (a “good” rating next to a sewage pipe; clear water after 20 mm of rain, from live weather) and ask gently. They never change an answer.
- **Your stream's story.** After sending, people see what OneAquaHealth's scientists measured at that exact site (small creatures, algae and fish quality, and Resilience Map health-risk scores, from OneAquaHealth's public data) next to what they saw, with careful One Health tips for people, pets and the stream.
- **Data that travels.** Every check is produced in the exact format OneAquaHealth's app sends (`CitizenSubmissionPutDTO`), and as HL7 FHIR R4 health data shaped by the OneAquaHealth Implementation Guide, sent to OneAquaHealth's HL7 Europe sandbox server.
- **A research hub.** Every check on a map of the 106 sites; **which questions confuse volunteers** (help requests, “not sure”, not understood: something no paper form can show), how often people accept each photo suggestion, and how streams make people feel.
- **Phone first, laptop too.** On a laptop the conversation sits beside your progress, your photos and every answer so far.

![Brook on a laptop: the conversation, with progress and every answer beside it](https://raw.githubusercontent.com/kinnuworks/brook/main/docs/img/desktop-check.png)

## How we built it
- **On OneAquaHealth's own tools.** The questions, answer codes and submission format come from OneAquaHealth's Citizen Science App data service (`api.enora-oah.eu`); the 106 sites, lab results and health-risk scores from the same public service; the method from their published field protocols; and the health-data model from their FHIR Implementation Guide (HL7 Europe). Tests check our answer codes against their published lists.
- **Written conversation first.** The conversation follows OneAquaHealth's protocol step by step, and every line Brook says was written for it, in seven languages. Replies are first understood on the phone by word lists (no internet needed); only what they can't understand goes to the AI.
- **AI with guard rails.** OpenAI `gpt-6-luna` on the server, allowed to choose only the current question's own answer codes (enforced by a strict schema and checked again), with citizen text treated as data, never instructions, and spending limits that fail safe. About 0.1 cent per check, measured. Without AI, everything still works.
- **Health-data standards.** A FHIR R4 transaction with the site (OneAquaHealth's `location-oah` profile), the answers, one Observation per OneAquaHealth indicator group, and Provenance. Every answer records how it was given; AI-touched records carry the HL7 `AIAST` label. Checked with the official HL7 validator against the OneAquaHealth guide: 0 errors.
- **Privacy.** Photos are shrunk and their location data removed on the phone, and shared only if the person agrees; no accounts; data stored in the EU (Frankfurt) behind row-level security.
- **Stack:** React 19, TypeScript, Vite, Tailwind CSS, MapLibre, Recharts, Dexie (offline queue), Supabase, Vercel, OpenAI, Web Speech API, Open-Meteo, Vitest, Playwright.

## Challenges we ran into
- **Citizen data vs the FHIR guide.** OneAquaHealth's indicator profile expects final, signed-off results, so an unverified citizen report can't match it. We keep citizen checks “preliminary” and switch them to the official profile only when a researcher verifies them, and documented the gap.
- **Voice outdoors, in seven languages.** Speech recognition mishears (“U shape” → “you shape”). Brook tries every alternative the recogniser offers, accepts the official illustration letters (“option B”), handles European decimal commas (“0,8 m”), and asks you to tap when unsure rather than guessing.
- **Being honest about what isn't tested yet.** Brook hasn't been tried by volunteers at a real stream yet. The hub's made-up example checks are labelled “Simulated” everywhere and never sent to OneAquaHealth; checks made with sample photos are marked “Trial”; only checks with people's own photos count as “Field”.

## Accomplishments that we're proud of
- A check that someone with no training can finish in about five minutes, by voice, without knowing a single ecological term, producing data OneAquaHealth can use unchanged.
- AI that measurably helps without ever deciding, and data that records exactly where every answer came from.
- A hub that turns conversations into design insight: which questions OneAquaHealth should reword first.
- Tested on things Brook had never seen: 93% of 238 realistic replies in seven languages understood without AI; 132 of 134 photo suggestions right on 36 stream photos; 0 errors from the official HL7 validator; 0 accessibility problems on every screen.

## What we learned
Most data-quality problems in citizen science are language problems. A volunteer who understands the question gives a better answer than any AI can guess, so the best use of AI here is to explain, suggest and double-check, never to decide.

## What's next for Brook
- A pilot with OneAquaHealth's citizen-science teams in one city: a walk along a stream with volunteers.
- Native speakers reviewing the seven languages; speech recognition on the phone itself.
- Sending checks straight to OneAquaHealth's own submission service once there is an account for it, and offering Brook as a “talk me through it” button inside their app.
- A proposal to HL7 Europe for citizen observations in the FHIR guide (preliminary, then verified).
