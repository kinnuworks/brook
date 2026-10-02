# Credits and licences

## Data
- **OneAquaHealth research sites, lab results, health-risk scores and urban parameters** — OneAquaHealth project (Horizon Europe grant 101086521), public API at `api.enora-oah.eu` (ENORA Innovation). Snapshot in `src/data/oah/`, refreshed with `npm run data`.
- **Citizen stream check questions and answer codes** — OneAquaHealth Citizen Science App and its public API (`/api/citizens/*`), and the OneAquaHealth field protocols (Zenodo 10.5281/zenodo.20344421, CC BY 4.0). Brook rephrases the questions in plain language; the official wording is shown beside every question.
- **OneAquaHealth FHIR Implementation Guide** — HL7 Europe, `github.com/hl7-eu/oah`.
- **Weather** — Open-Meteo (open-meteo.com), CC BY 4.0, non-commercial use.

## Sample photos (Alna at Bryn, Oslo — OneAquaHealth site O17)
Used only for "Try it with sample photos". Resized; not otherwise modified.
| File | Original | Author | Licence |
|---|---|---|---|
| `public/samples/upstream.jpg` | [Brynfoss.JPG](https://commons.wikimedia.org/wiki/File:Brynfoss.JPG) | PaulVIF | CC BY-SA 3.0 |
| `public/samples/downstream.jpg` | [T-banebruBryn2.JPG](https://commons.wikimedia.org/wiki/File:T-banebruBryn2.JPG) | PaulVIF | CC BY-SA 3.0 |
| `public/samples/surroundings.jpg` | [Turvei på Bryn langs Alna.jpg](https://commons.wikimedia.org/wiki/File:Turvei_p%C3%A5_Bryn_langs_Alna.jpg) | Helge Høifødt | CC BY-SA 4.0 |

These photos remain under their own CC BY-SA licences. The source code is MIT-licensed.

## Photo test set (`tests/eval/photos/`)
Real stream photos from Wikimedia Commons, used only to measure how often Brook's photo suggestions are right (`npm run eval:vision`). None of them were used while building Brook. Resized; not otherwise modified. Each photo remains under its own licence.

| File | Original | Author | Licence |
|---|---|---|---|
| `akerselva-island.jpg` | [Akerselva - Oslo, Norway 2020-08-03 (01).jpg](https://commons.wikimedia.org/wiki/File:Akerselva_-_Oslo,_Norway_2020-08-03_(01).jpg) | Ryan Hodnett | CC BY-SA 4.0 |
| `akerselva-high-water.jpg` | [Akerselva - Oslo, Norway 2020-08-03 (02).jpg](https://commons.wikimedia.org/wiki/File:Akerselva_-_Oslo,_Norway_2020-08-03_(02).jpg) | Ryan Hodnett | CC BY-SA 4.0 |
| `akerselva-wooded.jpg` | [Akerselva - Oslo, Norway 2020-08-03 (03).jpg](https://commons.wikimedia.org/wiki/File:Akerselva_-_Oslo,_Norway_2020-08-03_(03).jpg) | Ryan Hodnett | CC BY-SA 4.0 |
| `akerselva-park.jpg` | [Akerselva - Oslo, Norway 2020-08-03 (04).jpg](https://commons.wikimedia.org/wiki/File:Akerselva_-_Oslo,_Norway_2020-08-03_(04).jpg) | Ryan Hodnett | CC BY-SA 4.0 |
| `akerselva-path.jpg` | [Akerselva - Oslo, Norway 2020-08-03 (07).jpg](https://commons.wikimedia.org/wiki/File:Akerselva_-_Oslo,_Norway_2020-08-03_(07).jpg) | Ryan Hodnett | CC BY-SA 4.0 |
| `akerselva-meadow.jpg` | [Akerselva - Oslo, Norway 2020-08-03 (09).jpg](https://commons.wikimedia.org/wiki/File:Akerselva_-_Oslo,_Norway_2020-08-03_(09).jpg) | Ryan Hodnett | CC BY-SA 4.0 |
| `alna-alnaparken-snow.jpg` | [2011-04-03 Alnaelva i Alnaparken.jpg](https://commons.wikimedia.org/wiki/File:2011-04-03_Alnaelva_i_Alnaparken.jpg) | Chell Hill | CC BY-SA 3.0 |
| `alna-middelalderparken.jpg` | [Alna i Middelalderparken.jpg](https://commons.wikimedia.org/wiki/File:Alna_i_Middelalderparken.jpg) | Helge Høifødt | CC BY-SA 4.0 |
| `alna-svartdalen.jpg` | [Alna i Svartdalen.JPG](https://commons.wikimedia.org/wiki/File:Alna_i_Svartdalen.JPG) | Helge Høifødt | Public domain |
| `alna-rapids.jpg` | [Alna.jpg](https://commons.wikimedia.org/wiki/File:Alna.jpg) | Ida Tolgensbakk | CC BY-SA 3.0 |
| `alna-alnabru.jpg` | [Alnaelva Alnabru.jpg](https://commons.wikimedia.org/wiki/File:Alnaelva_Alnabru.jpg) | Torstein Frogner | CC BY 3.0 |
| `hovinbekken-bjerkedalen-bridge.jpg` | [Bjerkedalen med bro.JPG](https://commons.wikimedia.org/wiki/File:Bjerkedalen_med_bro.JPG) | Helge Høifødt | CC BY-SA 3.0 |
| `hovinbekken-ensjo-plaza.jpg` | [Ensjø juni 2020.jpg](https://commons.wikimedia.org/wiki/File:Ensj%C3%B8_juni_2020.jpg) | Kimsaka | CC BY-SA 4.0 |
| `hovinbekken-street.jpg` | [Gladengveien ved OBOS.jpg](https://commons.wikimedia.org/wiki/File:Gladengveien_ved_OBOS.jpg) | Helge Høifødt | CC BY-SA 4.0 |
| `hovinbekken-reconstructed.jpg` | [Hovinbekken rekonstruert.jpg](https://commons.wikimedia.org/wiki/File:Hovinbekken_rekonstruert.jpg) | Kimsaka | CC BY-SA 3.0 |
| `hovinbekken-boulders.jpg` | [Hovinbekken w Bjerkedalen, głazy.JPG](https://commons.wikimedia.org/wiki/File:Hovinbekken_w_Bjerkedalen,_g%C5%82azy.JPG) | Panek | CC BY-SA 3.0 pl |
| `hovinbekken-reeds.jpg` | [Hovinbekken w Bjerkedalen.JPG](https://commons.wikimedia.org/wiki/File:Hovinbekken_w_Bjerkedalen.JPG) | Panek | CC BY-SA 3.0 pl |
| `hovinbekken-concrete-wall.jpg` | [Hovinbekken, 2025.jpg](https://commons.wikimedia.org/wiki/File:Hovinbekken,_2025.jpg) | Ssu | CC BY-SA 4.0 |
| `hovinbekken-urban-channel.jpg` | [Hovinebekken restoration.jpg](https://commons.wikimedia.org/wiki/File:Hovinebekken_restoration.jpg) | Panek | CC BY-SA 4.0 |
| `ljanselva-woodland.jpg` | [Ljanselva - 2014-04-28 at 19-07-23.jpg](https://commons.wikimedia.org/wiki/File:Ljanselva_-_2014-04-28_at_19-07-23.jpg) | Kjetil Ree | CC BY-SA 3.0 |
| `ljanselva-stone-bridge.jpg` | [Ljanselva - 2014-05-29 at 13-46-29.jpg](https://commons.wikimedia.org/wiki/File:Ljanselva_-_2014-05-29_at_13-46-29.jpg) | Kjetil Ree | CC BY-SA 3.0 |
| `lysakerelva-grini-weir.jpg` | [Baerum grini mölle IMG 2473.JPG](https://commons.wikimedia.org/wiki/File:Baerum_grini_m%C3%B6lle_IMG_2473.JPG) | Bjoertvedt | CC BY-SA 3.0 |
| `lysakerelva-fish-ladder.jpg` | [Elveveien 81, 1366 Lysaker, Norway - panoramio.jpg](https://commons.wikimedia.org/wiki/File:Elveveien_81,_1366_Lysaker,_Norway_-_panoramio.jpg) | -Any- | CC BY 3.0 |
| `lysakerelva-waterfall.jpg` | [Foss, Lysakerelven - panoramio.jpg](https://commons.wikimedia.org/wiki/File:Foss,_Lysakerelven_-_panoramio.jpg) | Audun Dragland | CC BY 3.0 |
| `frognerbekken.jpg` | [Frognerbekken.jpg](https://commons.wikimedia.org/wiki/File:Frognerbekken.jpg) | Kjetil Ree | CC BY-SA 3.0 |
| `frognerelva-laid-stones.jpg` | [Frognerelva 1.jpg](https://commons.wikimedia.org/wiki/File:Frognerelva_1.jpg) | Jan-Tore Egge | CC BY-SA 4.0 |
| `hoffselva-clear.jpg` | [Hoffselva ved Nedre Skøyen vei 8.jpg](https://commons.wikimedia.org/wiki/File:Hoffselva_ved_Nedre_Sk%C3%B8yen_vei_8.jpg) | Helge Høifødt | CC BY-SA 4.0 |
| `touch-channel.jpg` | [Plaisance-du-Touch (Haute-Garonne, Fr) le Touch.JPG](https://commons.wikimedia.org/wiki/File:Plaisance-du-Touch_(Haute-Garonne,_Fr)_le_Touch.JPG) | Havang(nl) | CC0 |
| `zwalm-footbridge.jpg` | [Brug over Zwalm nabij Schuisplanklos - Zwalm.jpg](https://commons.wikimedia.org/wiki/File:Brug_over_Zwalm_nabij_Schuisplanklos_-_Zwalm.jpg) | Spotter2 | CC BY-SA 4.0 |
| `zwalm-poplars.jpg` | [C2 0003 zwalm zwalm01 - 367100 - onroerenderfgoed.jpg](https://commons.wikimedia.org/wiki/File:C2_0003_zwalm_zwalm01_-_367100_-_onroerenderfgoed.jpg) | Vandevorst, Kris | CC BY 4.0 |
| `zwalm-meander.jpg` | [C2 0003 zwalm zwalm08 - 367157 - onroerenderfgoed.jpg](https://commons.wikimedia.org/wiki/File:C2_0003_zwalm_zwalm08_-_367157_-_onroerenderfgoed.jpg) | Vandevorst, Kris | CC BY 4.0 |
| `zwalm-fields.jpg` | [C2 0003 zwalm zwalm10 - 367116 - onroerenderfgoed.jpg](https://commons.wikimedia.org/wiki/File:C2_0003_zwalm_zwalm10_-_367116_-_onroerenderfgoed.jpg) | Vandevorst, Kris | CC BY 4.0 |
| `zwalm-mill-sluice.jpg` | [C2 0003 zwalm zwalm13 - 367159 - onroerenderfgoed.jpg](https://commons.wikimedia.org/wiki/File:C2_0003_zwalm_zwalm13_-_367159_-_onroerenderfgoed.jpg) | Vandevorst, Kris | CC BY 4.0 |
| `not-a-stream-old-map.jpg` | [..Loen Elv og Hovie Bæk. - no-nb krt 00858.jpg](https://commons.wikimedia.org/wiki/File:..Loen_Elv_og_Hovie_B%C3%A6k._-_no-nb_krt_00858.jpg) | Unknown author | Public domain |
| `not-a-stream-basin-map.jpg` | [Drainage basin map of Touch.jpg](https://commons.wikimedia.org/wiki/File:Drainage_basin_map_of_Touch.jpg) | SIAH du Touch | CC BY-SA 3.0 |
| `not-a-stream-plant.jpg` | [Males herbes toulousaines 2.jpg](https://commons.wikimedia.org/wiki/File:Males_herbes_toulousaines_2.jpg) | Olybrius | Public domain |

## Fonts and icons
- DM Sans and DM Serif Display — Google Fonts, SIL Open Font License 1.1.
- Lucide icons — ISC licence.
