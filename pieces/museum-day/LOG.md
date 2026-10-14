# LOG: museum-day

## Run 1 (2026-10-14)
- Intake: a museum day (light visual diary), 16:9, ~45s, music + captions, riso.
- Story check: approved first time (device: the day prints one ink at a time).
- Look check: approved after two fixes. Overlays (lattice light, glints, the evening glow) were knocking the photo out to paper because they were in their own layer; they now go into the photo's layer with `over: true`. The bean got a paper sticker edge so it reads teal-on-teal.
- Storyboard: panel 5 down (the porcelain jug), so the jug was removed. The red wall holds the flintlock alone, bridged grating → card → gilt painting. The bean is pinned to a screen spot in rooms where the camera travels (it fell off the frame on 5 panels).
- Kit: `styles/riso/kit.js` gained `printPhoto` / `separation` and the press (`RUN`, `RUN_EDGE`, `RUN_AT`). framehash: riso demo 7/7 frames identical. `tools/tile.mjs` now keeps the frame's shape (it was hardcoded to 9:16).
