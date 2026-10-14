// =====================================================================
//  SCENES — a day at the museum. 1920x1080, riso. Each room is one of the user's photos, colour-separated
//  and printed full-bleed (printPhoto), then the bean and the room's small life printed over it.
//  World coords: the photo scaled to cover the frame at z = 1 (portrait 1080x1440 -> x1.778; landscape
//  1440x1080 -> x1.333), so a source pixel (sx, sy) sits at world (sx * k, sy * k). Cameras (pieceCam) move
//  over the world, so the screen pans and zooms with the print.
// =====================================================================
const PH = {
  park: '01-greenwich-park-skyline.jpg', court: '02-museum-atrium-blue.jpg', strings: '03-blue-string-curtain-painting.jpg',
  red: '06-red-wall-texture.jpg', ship: '08-ship-model-hull-painting.jpg',
  deck: '09-ship-model-deck-closeup.jpg', pistol: '11-flintlock-pistol.jpg', floor: '13-floor-screen-water.jpg',
  tapa: '16-tapa-costume-flowers.jpg', lit: '18-maori-cabinet-lit.jpg', dark: '19-maori-cabinet-dark.jpg',
};
const KP = W / 1080, KL = W / 1440;          // cover scales: portrait, landscape
const PITCH_PHOTO = 8;                        // the photos' screen: between fine and world, so faces of objects still read
const S = (sx, sy, k = KP) => [sx * k, sy * k];   // source px -> world
const cu = TIMELINE.cues;

// ---- the press: which plates have run (the device). Teal from the start; pink rolls across Ocean Court;
// yellow snaps on (3 frames) when the lights come up on the cabinet.
function RUN_AT(t) {
  RUN.teal = 1;
  RUN.pink = t >= cu.pink ? 1 : 0;
  RUN_EDGE.pink = t < cu.pink + 0.5 ? lerp(-60, W + 60, EZ.io(seg(t, cu.pink, cu.pink + 0.5))) : Infinity;
  RUN.yellow = t >= cu.up ? 1 : 0;
  RUN_EDGE.yellow = t < cu.up + E16 ? lerp(-60, W + 60, seg(t, cu.up - 1 / FPS, cu.up + E16)) : Infinity;
}
// the separation that matches the plates on the press now (a teal-only print is a teal monotone, not the
// teal plate of a full separation)
const inksNow = () => (RUN.yellow ? 'tpy' : RUN.pink ? 'tp' : 't');

// a full-bleed photo layer in world coords; o passes to printPhoto (lift, gain, alpha)
function photoLayer(name, k, o = {}) {
  const img = asset(name); if (!img) return;
  printed(PITCH_PHOTO, { full: true }, () => {
    fill(rect(-4000, -4000, 12000, 12000), {});
    const w = img.naturalWidth * k, h = img.naturalHeight * k;
    if (o.wipe != null && o.wipe < W + 60) {   // the roller pass: the old separation, the new one left of the edge
      printPhoto(name, 0, 0, w, h, { ...o, inks: o.from });
      if (o.wipe > -60) printPhoto(name, 0, 0, w, h, { ...o, inks: o.to, clip: rect(-4000, -4000, 4000 + o.wipe, 12000) });
    } else printPhoto(name, 0, 0, w, h, { ...o, inks: o.inks ?? inksNow() });
    if (o.extra) o.extra();   // tints, light and glints raise the photo's own plates (a separate layer would knock it out)
  });
}
// the world x of a screen x under the current ctx camera (for the roller's edge)
const worldX = (sx) => { const m = ctx.getTransform(); return (sx - m.e) / m.a; };

// ---- printed tags and captions, placed for 16:9 (drawn after the camera, at screen size)
const tag16 = (str, t) => defer(() => printTag(str, 70 + (typeW(str, 62) + 56) / 2, 120, 62, { s: popS(t) }));
const cap16 = (str, t) => defer(() => printCard(str, CX, 925, 50, { s: popS(t), frac: ev(t + 0.15, 0.6) }));

// ---- small printed life
function leaves(n, key, x0, x1, y0, y1, speed = 1) {   // leaves drifting down and across
  for (let i = 0; i < n; i++) {
    const R = RNG('leaf', key, i), age = mod(TT * 0.18 * speed + R.f(), 1);
    const x = lerp(x0, x1, R.f()) + age * R.r(80, 260) + Math.sin(TT * 2.2 + i) * 30, y = lerp(y0, y1, age);
    const a = TT * R.r(1.5, 3) + i, s = R.r(10, 18);
    fill(ell(x, y, s, s * 0.45, a), i % 3 ? { teal: 0.9, yellow: 0.7, pink: 0.1 } : { teal: 0.5, pink: 0.45, yellow: 0.9 });
  }
}
function birds(n, key, y0, span, speed = 160) {
  for (let i = 0; i < n; i++) {
    const R = RNG('bird', key, i), x = mod(TT * speed * R.r(0.8, 1.2) + R.r(0, W + 300), W + 300) - 150;
    const y = y0 + R.r(0, span) + Math.sin(TT * 3 + i) * 10, up = (B + i) % 2 ? 12 : -5;
    line([[x - 22, y - up], [x - 8, y - 2], [x, y + 3], [x + 8, y - 2], [x + 22, y - up]], MIX.dark, { w: 5, taper: 0.3, amt: 0.5, key: key + 'b' + i, knock: true });
  }
}


// a screen spot -> world coords under era e's camera now (the bean pinned to the screen while the photo moves)
const pinW = (e, sx, sy) => { const c = camAt(e, TT); return [(sx - c.tx) / c.z, (sy - c.ty) / c.z, c.z]; };
// the bean, printed as a sticker: a paper edge knocked out round it so it reads on any photo (even teal on teal)
function bean(x, y, r, o = {}) {
  const hop = o.hop ?? 0, yy = y - hop;
  fill(hand(ellipsePts(x, yy, r * 0.98, r * 1.2, 0, 40), (o.key ?? 'hero') + 'edge', 1.5), {});
  fill(hand(ellipsePts(x, yy + r * 1.05, r * 0.72, r * 0.42, 0, 30), (o.key ?? 'hero') + 'edge2', 1.5), {});
  fill(hand(ellipsePts(x + r * 0.2, yy - r * 1.25, r * 0.32, r * 0.22, 0, 20), (o.key ?? 'hero') + 'edge3', 1), {});
  return risoHero(x, y, r, o);
}
// =====================================================================
//  1 / 10  THE PARK — morning (teal only), and home (three inks)
//  Morning: hold on the oak, tilt down to the towers; the bean on the hill. Home: the reverse, back to the oak.
// =====================================================================
const PARK_TOP = 303 * KP, PARK_LOW = 700 * KP;              // camera centre y: the oak / the towers and the hill
const PARK_BEAN = S(250, 870);                             // the bean sits on the hill edge (world)
function parkCam(home, t) {
  const y = home ? lerp(PARK_LOW, PARK_TOP, EZ.io(seg(t, 42.5, 44.6)))
                 : lerp(PARK_TOP, PARK_LOW, EZ.io(seg(t, 1.5, 4.2)));
  return camOf({ z: 1, p: [960, y], to: [960, 540] });
}
function scenePark(home) {
  beginSheet();
  photoLayer(PH.park, KP, { ...(home ? { inks: 'tpy', lift: 0.02 } : {}), extra: home ? () => fill(rect(-100, -100, W + 200, 1500), { yellow: rad(1500, 750, 80, 950, [[0, 0.55], [1, 0]]), pink: rad(1500, 750, 80, 950, [[0, 0.18], [1, 0]]) }, { over: true }) : null });   // evening light
  printed(PITCH.world, { shapes: true }, () => {
    birds(3, home ? 'eve' : 'morn', 420, 240, home ? 120 : 170);
    leaves(9, home ? 'lh' : 'lm', 300, 1700, 300, 1700, home ? 0.8 : 1);
    const sat = home ? true : TT >= cu.leaves + 1.5;
    bean(PARK_BEAN[0], PARK_BEAN[1], 92, {
      key: 'hero', mood: home ? 'happy' : 'smile', look: home ? [0.9, -0.5] : [0.8, -0.7],
      arms: home ? [0.5, 0.5 + 0.15 * Math.sin(TT * 3)] : sat ? [0.4, 0.4] : [0.35, 0.35],
    });
  });
  endSheet();
  if (home) { tag16('evening', 41.0); cap16('a day at the museum', cu.sit); }
  else { tag16('morning', 0.5); cap16('Greenwich Park', 1.25); }
}

// =====================================================================
//  2  OCEAN COURT — the pink plate rolls across; the bean walks the balcony
// =====================================================================
const COURT_WIN = [S(828, 470), S(925, 470), S(925, 815), S(828, 815)];   // the tall window (the bridge out)
function courtCam(t) {
  const z = lerp(1, 1.12, EZ.io(seg(t, M.court, M.ship - 0.6)));
  return camOf({ z, p: [lerp(960, 1060, EZ.io(seg(t, M.court, M.ship - 0.6))), 760 * KP], to: [960, 540] });
}
const courtBean = () => { const u = EZ.io(seg(TT, cu.walk, cu.walk + 2.5)); return [lerp(560, 1240, u), 935 * KP]; };
function sceneCourt() {
  beginSheet();
  const wipe = TT < cu.pink + 0.5 ? (TT < cu.pink ? -1e4 : worldX(RUN_EDGE.pink)) : null;
  const lattice = () => {   // roof-lattice shadows drifting over the facade (life): the teal plate rises in slanted bands
    for (let i = 0; i < 4; i++) {
      const x = 500 + i * 380 + TT * 18, P = [[x, 300], [x + 60, 300], [x - 190, 1900], [x - 250, 1900]];
      fill(poly(P), { teal: 0.85 }, { over: true });
    }
  };
  photoLayer(PH.court, KP, wipe == null ? { extra: lattice } : { wipe, from: 't', to: 'tp', extra: lattice });
  printed(PITCH.world, { shapes: true }, () => {
    // the roller: a pink ink drum riding the edge of the new plate
    if (TT >= cu.pink && TT < cu.pink + 0.5) {
      const x = worldX(RUN_EDGE.pink) - 26;
      fill(rrect(x - 22, 250, 44, 1900, 22), { pink: 1, teal: 0.2 }); line([[x - 8, 260], [x - 8, 2140]], {}, { w: 6, knock: true, key: 'roll' });
    }
    const [bx, by] = courtBean(), walking = TT >= cu.walk && TT < cu.walk + 2.5;
    bean(bx, by, 88, {
      key: 'hero', mood: TT < cu.pink + 0.5 ? 'wow' : 'smile', look: walking ? [1, 0] : [0.3, -1],
      arms: walking ? [0.35 + 0.3 * Math.sin(TT * 9), 0.35 - 0.3 * Math.sin(TT * 9)] : [0.4, 0.4], hop: walking ? Math.abs(Math.sin(TT * 9)) * 10 : 0,
    });
  });
  endSheet();
  tag16('Ocean Court', 6.75);
}

// =====================================================================
//  3  THE SHIP MODEL — a slow push along the hull; glints slide across the case glass
// =====================================================================
const SHIP_FRAME = [S(522, 2, KL), S(1049, 2, KL), S(1049, 338, KL), S(522, 338, KL)];   // the gilt frame (the bridge in)
const SHIP_HULL = () => ellipsePts(...S(745, 660, KL), 640 * KL, 185 * KL, -0.02, 96);  // the hull (the bridge out)
function shipCam(t) {
  const u = EZ.io(seg(t, M.ship, M.deck - 0.6));
  const z = lerp(1, 1.12, u);   // keep the frame inside the photo: centre x within [960 / z, 1920 - 960 / z]
  return camOf({ z, p: [clamp(lerp(600 * KL, 900 * KL, u), 960 / z, W - 960 / z), lerp(405, 640, u) * KL], to: [960, 540] });
}
function sceneShip() {
  beginSheet();
  photoLayer(PH.ship, KL, { extra: () => {
    for (let i = 0; i < 2; i++) {   // the case glass: paper glints sliding left to right (knocked out of every plate)
      const x = mod(TT * 260 + i * 900, 2600) - 400, P = [[x, -100], [x + 5 + i * 4, -100], [x - 300, 1500], [x - 305 - i * 4, 1500]];
      fill(poly(P), {});
    }
  } });
  printed(PITCH.world, { shapes: true }, () => {
    const wow = TT >= cu.wow;
    const [sx, sy, sz] = pinW(2, 1560, 860);
    bean(sx, sy, 92 / sz, { key: 'hero', mood: wow ? 'wow' : 'smile', look: [-0.8, -0.8], arms: wow ? [2.4, 2.5] : [0.4, 0.4], hop: wow ? Math.max(0, Math.sin((TT - cu.wow) * 6)) * 14 * (TT < cu.wow + 1 ? 1 : 0) : 0 });
  });
  endSheet();
}

// =====================================================================
//  4  THE DECK — extreme close-up: the bean on the model's deck among the cannons
// =====================================================================
const DECK_GRATE = () => ellipsePts(...S(520, 745), 95 * KP, 80 * KP, 0.5, 64);   // a hatch grating (the bridge out)
function deckCam(t) {
  const u = EZ.io(seg(t, M.deck, M.wall - 0.6));
  return camOf({ z: lerp(1.05, 1.25, u), p: [lerp(880, 1000, u), lerp(860, 900, u) * KP], to: [960, 540] });
}
function sceneDeck() {
  beginSheet();
  photoLayer(PH.deck, KP);
  printed(PITCH.fine, { shapes: true }, () => {
    const hop = TT >= cu.hop ? Math.abs(Math.sin((TT - cu.hop) * 7)) * 26 * (TT < cu.hop + 1.4 ? 1 : 0) : 0;
    bean(...S(640, 1010), 58, { key: 'hero', mood: TT >= cu.hop ? 'happy' : 'wow', look: [-0.6, -0.4], arms: TT >= cu.hop ? [2.5, 2.6] : [0.5, 1.2], hop });
  });
  endSheet();
}

// =====================================================================
//  5  THE RED WALL — the flintlock printed as a card, taped to the wall; the bean beside it
// =====================================================================
const PISTOL = { x: 860, y: 520, w: 600, rot: 0.03 };
const PISTOL_CARD = () => resample(xform([[-318, -418], [318, -418], [318, 418], [-318, 418]], PISTOL.x, PISTOL.y, PISTOL.rot), true, 20);
function card(name, c, key) {   // a photo card: a paper border, the photo, two strips of tape
  const w = c.w, h = w * 4 / 3;
  printed(PITCH_PHOTO, { T: { s: 1, x: c.x, y: c.y, rot: c.rot }, shapes: true, box: [-w / 2 - 60, -h / 2 - 60, w / 2 + 60, h / 2 + 60] }, () => {
    fill(rect(-w / 2 + 16, -h / 2 + 20, w + 8, h + 8), { teal: 0.55, pink: 0.6, yellow: 0.5 });     // its shadow on the wall
    fill(hand(boxPts(-w / 2 - 18, -h / 2 - 18, w + 36, h + 36), key + 'b', 1), {});                  // paper border
    printPhoto(name, -w / 2, -h / 2, w, h, { inks: inksNow() });
    for (const s of [-1, 1]) fill(hand(boxPts(s * w * 0.32 - 60, -h / 2 - 40, 120, 46), key + 't' + s, 1), { yellow: 0.55, pink: 0.12 }, { over: false });
  });
}
function wallCam(t) { const u = EZ.io(seg(t, M.wall, M.strings - 0.6)); return camOf({ z: lerp(1, 1.05, u), p: [lerp(900, 760, u), 540], to: [960, 540] }); }
function sceneWall() {
  beginSheet();
  printed(PITCH.field, { full: true }, () => printPhoto(PH.red, -200, -1200, 2400, 3200, { inks: inksNow(), gain: 0.85 }));
  card(PH.pistol, PISTOL, 'pis');
  printed(PITCH.world, { shapes: true }, () => {
    const look = TT < cu.tick ? [-0.9, -0.6] : TT < cu.tick + 1.5 ? [0.9, -0.2] : [-0.9, -0.6];
    bean(1400, 860, 88, { key: 'hero', mood: TT < cu.tick ? 'wow' : 'smile', look, arms: TT < cu.tick ? [0.4, 0.4] : [2.2, 0.4] });
  });
  endSheet();
}

// =====================================================================
//  6  THE BLUE STRINGS — the bean steps through; printed strings part around it
// =====================================================================
const STR_PAINT = [S(410, 392), S(600, 392), S(600, 662), S(410, 662)];   // the gilt painting (the bridge in)
const strBean = () => pinW(5, lerp(-120, 1060, EZ.io(seg(TT, cu.part - 0.75, cu.part + 1.0))), 880);
function stringsCam(t) { return camOf({ z: lerp(1.0, 1.08, EZ.io(seg(t, M.strings, M.dark))), p: [960, 600 * KP], to: [960, 540] }); }
function sceneStrings() {
  beginSheet();
  photoLayer(PH.strings, KP);
  printed(PITCH.world, { shapes: true }, () => {
    const [bx, by, bz] = strBean(), walking = TT < cu.part + 1.0;
    bean(bx, by, 88 / bz, { key: 'hero', mood: walking ? 'smile' : 'wow', look: walking ? [1, 0] : [0, -1], arms: walking ? [0.35 + 0.3 * Math.sin(TT * 9), 0.35 - 0.3 * Math.sin(TT * 9)] : [0.5, 0.5], hop: walking ? Math.abs(Math.sin(TT * 9)) * 10 : 0 });
    // printed strings in front: they bend away from the bean as it passes, then sway back
    for (let i = 0; i < 14; i++) {
      const x0 = 120 + i * 130 + (i % 3) * 17, P = [];
      for (let j = 0; j <= 12; j++) {
        const y = 520 + j * 120, d = x0 - bx, near = Math.exp(-(d * d) / (150 * 150)) * Math.exp(-((y - by) ** 2) / (420 * 420));
        P.push([x0 + Math.sign(d || 1) * near * 140 + Math.sin(TT * 2 + i + j * 0.3) * 6 * j / 12, y]);
      }
      line(P, MIX.blue, { w: 5, amt: 0.6, key: 'str' + i, knock: true });
    }
  });
  endSheet();
}

// =====================================================================
//  7  THE CABINET — lights down (teal + pink, dark), then the yellow plate: lights up
// =====================================================================
const CAB_TRI = [S(410, 250), S(522, 818), S(300, 818)];   // a copper triangle (the bridge out)
function cabCam(t) { return camOf({ z: lerp(1, 1.06, EZ.io(seg(t, M.dark, cu.up))), p: [960, (t >= cu.up ? 600 : 575) * KP], to: [960, 540] }); }
function sceneCabinet() {
  const up = TT >= cu.up;
  beginSheet();
  if (!up) photoLayer(PH.dark, KP, { gain: 1.25, lift: 0.05 });
  else photoLayer(PH.lit, KP, { extra: () => fill(rect(-100, 200, W + 200, 1700), { yellow: rad(960, 1000, 100, 1000, [[0, 0.5 * (1 - 0.6 * ev(cu.up, 1.5))], [1, 0]]) }, { over: true }) });
  printed(PITCH.world, { shapes: true }, () => {
    const hop = up ? Math.abs(Math.sin((TT - cu.up) * 7)) * 30 * (TT < cu.up + 0.9 ? 1 : 0) : 0;
    const [cx, cy, cz] = pinW(6, 960, 880);
    bean(cx, cy, 80 / cz, { key: 'hero', mood: up ? 'wow' : 'smile', look: [0, -1], arms: up ? [2.6, 2.6] : [0.35, 0.35], hop });
  });
  endSheet();
  if (up) tag16('Pacific Encounters', cu.up + 0.25);
}

// =====================================================================
//  8  THE TAPA COSTUME — a push from the pattern down to the fabric flower
// =====================================================================
const TAPA_TRI = [S(420, 125), S(600, 125), S(510, 300)];
const TAPA_FLOWER = () => ellipsePts(...S(250, 930), 120 * KP, 115 * KP, 0, 64);
function tapaCam(t) { const u = EZ.io(seg(t, M.tapa + 0.4, M.floor - 0.6)); return camOf({ z: lerp(1, 1.3, u), p: [lerp(960, 250 * KP + 300, u), lerp(400, 930, u) * KP], to: [960, 540] }); }
function sceneTapa() {
  beginSheet();
  photoLayer(PH.tapa, KP);
  printed(PITCH.world, { shapes: true }, () => {
    for (let i = 0; i < 6; i++) {   // loose threads drifting up in the case light (life)
      const R = RNG('fib', i), age = mod(TT * 0.25 + R.f(), 1), x = R.r(200, 1700) + Math.sin(TT * 2 + i) * 20, y = lerp(2300, 300, age);
      line([[x, y], [x + 14, y - 20], [x + 6, y - 40]], { yellow: 0.9, pink: 0.3 }, { w: 3, amt: 0.4, key: 'fib' + i, knock: true });
    }
    const [tx, ty, tz] = pinW(7, 1480, 870);
    bean(tx, ty, 84 / tz, { key: 'hero', mood: TT >= cu.look ? 'happy' : 'wow', look: [-0.7, -0.9], arms: TT >= cu.look ? [0.4, 2.3] : [0.4, 0.4] });
  });
  endSheet();
}

// =====================================================================
//  9  THE FLOOR SCREEN — the bean stands on the glass and looks down at the fish; rings spread
// =====================================================================
const floorBean = () => pinW(8, 1060, 850);
const ringR = (k) => 60 + mod(TT - cu.ripple - k * BEAT, 2 * BEAT) * 220;
function floorCam(t) { return camOf({ z: lerp(1.0, 1.08, EZ.io(seg(t, M.floor, M.home))), p: [960, 470 * KP], to: [960, 540] }); }
function sceneFloor() {
  beginSheet();
  photoLayer(PH.floor, KP);
  printed(PITCH.world, { shapes: true }, () => {
    const FLOOR_BEAN = floorBean();
    if (TT >= cu.ripple) for (let k = 0; k < 2; k++) {
      const r = ringR(k), a = 1 - r / 500;
      if (a > 0) line(ringPts(FLOOR_BEAN[0], FLOOR_BEAN[1] + 110, r).map(([x, y]) => [x, FLOOR_BEAN[1] + 110 + (y - FLOOR_BEAN[1] - 110) * 0.45]), {}, { closed: true, w: 8 * a + 2, amt: 1, key: 'ring' + k, knock: true });
    }
    bean(FLOOR_BEAN[0], FLOOR_BEAN[1], 84 / FLOOR_BEAN[2], { key: 'hero', mood: TT >= cu.ripple ? 'wow' : 'smile', look: [-0.3, 1], arms: [0.5, 0.5], shadow: false });
  });
  endSheet();
}

// ---- cameras for the renderer
function pieceCam(era, t) {
  return [() => parkCam(false, t), () => courtCam(t), () => shipCam(t), () => deckCam(t), () => wallCam(t), () => stringsCam(t), () => cabCam(t), () => tapaCam(t), () => floorCam(t), () => parkCam(true, t)][era]();
}
