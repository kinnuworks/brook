# Devpost submission — copy/paste kit

## Project name
Brook — talk to your stream

## Elevator pitch (≤ 200 characters)
A talking guide for OneAquaHealth's citizen stream check: talk or tap in 7 languages, get every hard word explained, and send data scientists can use right away.

## Track
**Primary: Track 1 — Citizen Science UX.** Also delivers Track 3 (AI-Supported Assessment), Track 4 (Awareness & Storytelling) and Track 7 (Digital Health Standards).

## Video demo link
https://youtu.be/dLPSiwrsPDw

## Try it out (links)
- Live app: https://brook-oah.vercel.app
- Try it without a stream (real photos of OAH site O17, Oslo): https://brook-oah.vercel.app/check?demo=1
- Research hub: https://brook-oah.vercel.app/hub
- How it works: https://brook-oah.vercel.app/about
- Code: https://github.com/kinnuworks/brook

## About the project (paste into "Project story")

### In one minute
OneAquaHealth studies the health of small rivers in five European cities and asks ordinary people to help by answering about twenty questions at a stream. Many of those questions use hard words ("impervious areas covering more than one third of the left margin"), so people get confused or give up. **Brook is a friendly guide on your phone that turns the questions into a simple conversation** — talk or tap, in seven languages. It explains any word, suggests answers from your photos for you to confirm, asks you to look again when two answers don't fit, and shows you what scientists found at your stream. Your answers reach OneAquaHealth in the exact form they already use.

### Track alignment
**Track 1 — Citizen Science UX** is our primary track. Its brief names the problem — *“complex tools, confusing terminology, and low participation reduce usability and impact”* — and asks for *“guided workflows, simplified ecological terms, improved data accuracy, and repeat engagement features.”* Brook is that, end to end: a guided conversation, every ecological term explained in plain words, photo suggestions and gentle second looks for accuracy, and a personal story of your stream that gives people a reason to come back. It also delivers responsible AI with human-in-the-loop (Track 3), One Health storytelling (Track 4) and FHIR interoperability with the OneAquaHealth IG (Track 7).

### Inspiration
OneAquaHealth asks citizens to check their urban streams — and that's how you watch 106 sites in five cities between lab visits. But stand at the water's edge with the official form and you're asked whether “impervious areas cover more than one third of the left margin”, and left means *facing downstream*, which almost nobody knows. People guess or give up, and researchers get data they can't fully trust. We wanted the patience of an expert standing next to every volunteer.

### What it does
- **A conversation, not a form.** Brook asks each of OneAquaHealth's questions in plain words, by voice or text, in the seven languages of OAH's app (EN, PT, FR, IT, NL, NO, EL). “What does that mean?” always works, pictograms show the meaning, and OAH's official wording is one tap away. A “face downstream” diagram ends the left/right confusion.
- **Photos suggest, people decide.** From the upstream, downstream and surroundings photos, Brook suggests answers to the questions a photo can answer — with what it saw. Nothing is recorded until the person confirms or corrects it. In a test on 36 real stream photos Brook had never seen, 132 of its 134 suggestions on clearly visible things were right, and for pictures that weren't streams it suggested nothing.
- **A second look.** Seven published rules spot contradictions (a “good” rating next to a sewage discharge; clear water after 20 mm of rain, using live weather) and ask gently. They never change an answer.
- **Your stream's story.** After sending, people see what OneAquaHealth scientists measured at that exact site — macroinvertebrate, diatom and fish quality classes and Resilience Map health-risk scores from OAH's public API — next to what they saw, with precautionary One Health tips for people, pets and the stream.
- **Data that travels.** Every check is produced as the exact `CitizenSubmissionPutDTO` OAH's API accepts, and as an HL7 FHIR R4 transaction shaped by the OneAquaHealth Implementation Guide, posted to OAH's HL7 Europe sandbox.
- **A research hub.** All checks on a map of the 106 sites; **which questions confuse volunteers** (help requests, “not sure”, not understood — something no paper form can tell you), how often people accept AI suggestions per question, and how streams make people feel.

### How we built it
- **Built on OneAquaHealth's own tools.** We took the questions, answer codes and submission schema from OAH's Citizen Science App API (`api.enora-oah.eu`), the 106 sites, lab classes and health-risk scores from the same public API, the protocol from OAH's field protocols (Zenodo), and the FHIR model from the OAH IG (HL7 Europe). Unit tests check our answer codes against OAH's published lists.
- **Script-first dialogue.** The conversation is a deterministic state machine over the OAH protocol; Brook's lines are authored, in seven languages. Replies are first understood on the phone by a word-list matcher (no network); only what it can't understand goes to an AI interpreter.
- **AI with guard rails.** OpenAI `gpt-6-luna` through serverless functions, with strict JSON schemas whose only allowed values are the current question's OAH codes, server-side re-validation, prompts that treat citizen text as data, and spending caps that fail closed. about 0.1 cent per check (measured).
- **Standards.** FHIR R4 transaction: Location (OAH `location-oah` profile), QuestionnaireResponse, one Observation per OAH indicator group (`morophology`, `hydrology`, `foam`, `LandUse`, `riparianVegetation`, `invasiveOrganisms`), Provenance, Devices. Every component carries an answer-source extension; AI-touched resources carry the HL7 `AIAST` security label. Validated with the official HL7 validator against the OAH IG (see docs/FHIR.md).
- **Privacy & security.** Photos are shrunk and stripped of EXIF/GPS on the phone and shared only with consent; no accounts; hashed device ids; EU database (Supabase, Frankfurt) with row-level security and secret-checked functions; strict CSP.
- **Stack:** React 19, TypeScript, Vite 8, Tailwind 4, MapLibre + OpenFreeMap, Recharts, Dexie (offline queue), Supabase, Vercel, OpenAI, Web Speech API, Open-Meteo, Vitest, Playwright.

### Challenges we ran into
- **Citizen data vs the FHIR IG.** The OAH indicator profile fixes `status = final` and requires a performer, so an unverified citizen report can't conform. We keep citizen checks `preliminary` and promote them to the OAH profile only when a researcher verifies them — and documented the gap.
- **Voice outdoors, in seven languages.** Speech recognition mishears (“U shape” → “you shape”). The matcher tries every alternative the recogniser offers, accepts OAH's illustration letters (“option B”), handles European decimal commas (“0,8 m”), and asks to tap when unsure rather than guessing.
- **Honesty with no volunteers yet.** The hub's simulated data is labelled everywhere and never sent to OAH; checks made with sample photos are marked “Trial”, and only checks with people's own photos count as “Field”.

### Accomplishments we're proud of
- A check a non-expert can finish in about five minutes, by voice, without knowing a single ecological term — producing data OAH can ingest unchanged.
- AI that measurably helps without ever deciding, and data that records exactly where every answer came from.
- A hub that turns conversations into protocol design insight: which questions OAH's form designers should reword first.
- Tested, not just demoed, on things Brook had never seen: 93% of 238 real-style replies in 7 languages understood without AI; 132 of 134 photo suggestions right on 36 stream photos; 0 errors from the official HL7 validator against the OAH IG; 0 accessibility violations.

### What we learned
Most data-quality problems in citizen science are language problems. A volunteer who understands the question gives a better answer than any model can infer — so the best use of AI here is to explain, suggest and double-check, not to decide.

### What's next
- A pilot with OAH's Citizen Science teams in one city (co-design walk along a stream, as OAH's citizen-science team already does).
- Native-speaker review of the seven languages; offline speech recognition on device.
- Submit straight to OAH's `/api/citizens/submit` once a service account exists; embed Brook in the existing app as a web component.
- A FHIR IG proposal for citizen observations (preliminary → verified) with HL7 Europe.

## Built with (tags)
react, typescript, vite, tailwindcss, maplibre, recharts, dexie, supabase, postgresql, vercel, openai, web-speech-api, hl7-fhir, playwright, vitest, open-meteo

## Thumbnail
docs/img/devpost-thumbnail.png (1500×1000)

## Image gallery (upload in this order)
1. docs/img/hero.png — Brook on four phones: a question with a photo suggestion, the face-downstream diagram, your stream's story, the review
2. docs/img/desktop-check.png — the conversation on a laptop, with progress and answers beside it
3. docs/img/desktop-story.png — your stream's story next to OneAquaHealth's lab results
4. docs/img/desktop-hub.png — the research hub: map, questions people find hard, AI agreement
5. docs/img/desktop-home.png — the home page
