# LOG: museum-day

## Run 1 (2026-10-14)
- Intake: a museum day (light visual diary), 16:9, ~45s, music + captions, riso.
- Story check: approved first time (device: the day prints one ink at a time).
- Look check: approved after two fixes. Overlays (lattice light, glints, the evening glow) were knocking the photo out to paper because they were in their own layer; they now go into the photo's layer with `over: true`. The bean got a paper sticker edge so it reads teal-on-teal.
- Storyboard: panel 5 down (the porcelain jug), so the jug was removed. The red wall holds the flintlock alone, bridged grating → card → gilt painting. The bean is pinned to a screen spot in rooms where the camera travels (it fell off the frame on 5 panels).
- Kit: `styles/riso/kit.js` gained `printPhoto` / `separation` and the press (`RUN`, `RUN_EDGE`, `RUN_AT`). framehash: riso demo 7/7 frames identical. `tools/tile.mjs` now keeps the frame's shape (it was hardcoded to 9:16).
- Review 1: story arc 4/5 (the goodbye didn't decay) → ending pad, drone and plucks quieter → 5/5. Phone sheet: the ship pan showed paper past the photo's right edge (camera now clamped inside the photo); the walking bean passed under the "Ocean Court" caption (now a tag, top left).

## Final review (renders/share.mp4, 45.0s, 1920×1080)
| check | result |
|---|---|
| morphs on the 8th grid | PASS, 9/9 |
| hard cuts | 0 |
| story arc | PASS 5/5: payoff p90 −11.8 dBFS, peak −15.4, silence median −76.3, goodbye −22.4 |
| loudest moment | 30.0s (−9.9 dBFS), in the payoff act, after 1.5s at ≤ −40 dBFS |
| loudness | −14.9 LUFS, true peak −1.0 dBFS |
| text | PASS, 0 cut off / overlapping |
| dead beats | PASS, none over 3s |
| determinism | true on every tile |

| shot | verdict |
|---|---|
| 1 park (teal) | PASS |
| 2 Ocean Court (pink roller) | PASS |
| 3 ship | PASS (after the camera clamp) |
| 4 deck | PASS, the bean is small (r 58) by design |
| 5 flintlock card | PASS, sparse: one card and the bean |
| 6 strings | PASS, but the printed strings in front barely read over the photo's own strings |
| 7 cabinet dark → lit | PASS |
| 8 tapa | PASS |
| 9 floor | PASS |
| 10 home | PASS |

**Weakest shot:** 6, the strings. The "parting" isn't visible, so it reads as the bean walking past a photo. Fix: draw fewer, thicker printed strings in a contrasting ink.
