# A Day at the Museum: brief

**Idea:** a day at the National Maritime Museum, Greenwich, printed one ink at a time.
**Device (one sentence):** the morning in the park prints in teal only, the museum adds pink (a roller pass in Ocean Court), Pacific Encounters adds yellow (the lights come up on the cabinet), and the walk home is the opening view again, now in all three inks.

- **Spec:** 16:9, 1920×1080, 24fps, 45.0s, 120 BPM; music only (composed in code); short printed captions.
- **Format:** morph chain (a day in order; 10 rooms, 9 shape morphs, 0 hard cuts). F2-style chronology across worlds, the proven card.
- **Style:** riso. The user's photos are colour-separated into the three plates (`printPhoto` in `styles/riso/kit.js`) and screened like every other mark.
- **Hero:** the riso bean, printed as a sticker with a paper edge so it reads on any photo. It's pinned to a screen spot in rooms where the camera moves.
- **Colour means one thing:** which inks have run = how far into the day we are.

## Photos (the user's own, `assets/`)
01 park, 02 Ocean Court, 03 blue strings, 06 red wall, 08 ship model, 09 deck close-up, 11 flintlock, 13 floor screen, 16 tapa costume, 18/19 the Māori cabinet lit/dark (17 copied, unused).
Left out on purpose: the bronze figure in a slave collar (05), *Jim Cook Mugshot* (14), the mural (12): serious or third-party content that doesn't fit a light diary. The porcelain jug (04) was cut at the storyboard (user's note).

## Beats
| # | time | beat | photo | bridge out | sound |
|---|---|---|---|---|---|
| 1 | 0–5 | morning, teal only; tilt from the oak to the towers; the bean on the hill | 01 | bean → bean | thin pad, birds, the bean's fifth |
| 2 | 5–10.5 | Ocean Court; the pink plate rolls across at 6.0; the bean walks | 02 | window → gilt frame | a pluck chord on the roller, 8ths |
| 3 | 10.5–16 | the ship model, a slow push along the hull | 08 | hull → deck | 16ths at half density |
| 4 | 16–20 | the bean on the model's deck among the cannons | 09 | grating → card | the busiest |
| 5 | 20–24.5 | the flintlock printed as a card on the red wall | 11 on 06 | card → gilt painting | busy |
| 6 | 24.5–27.5 | the bean steps through the blue strings | 03 | bean → bean | busy, a riser, stops dead at 28.5 |
| 7 | 27.5–30 | lights down on the cabinet (teal + pink, dark) | 19 | — | near silence 28.5–30 |
| 8 | 30–33.5 | the yellow plate prints: lights up. Tag "Pacific Encounters" | 18 | triangle → triangle | the loudest hit, then a flat warm chord |
| 9 | 33.5–37.5 | the tapa costume, a push to the fabric flower | 16 | flower → ripple | warm |
| 10 | 37.5–40.5 | the floor screen; the bean looks down at the fish | 13 | ripple → bean | quieter |
| 11 | 40.5–45 | home: the opening view in three inks, tilting back up to the oak | 01 | (loops to frame 0) | the morning pad, full |

## Claims on screen + sources
- "Greenwich Park": the user's photo (the view of Canary Wharf from the park).
- "Ocean Court": the museum's central glass-roofed space, formerly Neptune Court, reopened under the new name on 7 June 2025. Sources: allatsea.co.uk "National Maritime Museum reopens 'Ocean Court'"; visitgreenwich.org.uk "Ocean Court"; marine-society.org (the Neptune Court closure notice).
- "Pacific Encounters": a National Maritime Museum gallery, opened September 2018. Sources: londonist.com "The National Maritime Museum Just Got 40% Bigger"; en.wikipedia.org/wiki/National_Maritime_Museum. The gallery's sign is also in photo 02.
- No other facts are claimed.

## Credits still open
The tapa costume (16) and the cabinet panels (18/19) are contemporary artworks; the artists aren't known yet. Credit them in the end card if the user supplies the names.

## Rebuilding
`assets/` isn't committed (the photos already live in the skill's library). Copy them in, then build:
`for f in 01 02 03 06 08 09 11 13 16 17 18 19; do cp plugins/animate/skills/animate/assets/greenwich/$f-*.jpg pieces/museum-day/assets/; done`
