// =====================================================================
//  styles/riso/kit.js — a three-ink risograph print. Nothing is painted; everything is printed.
//  A frame is a sheet of cream paper run through three spot-ink plates (teal, fluorescent pink, yellow).
//  A plate only says how much ink goes where (a grey tone 0..1); its screen turns the tone into dots at
//  the plate's own angle; the inks multiply. No black ink: darks are all three inks overprinted.
//  Built on kit/core.js (RNG, clamp, lerp, dist, resample, wobble, pathLen, arcPts, ellipsePts, TAU, DEG,
//  ctx, W, H, B, TT, E0, DEFER, SPARK_AT, ev, popS). Needs from the piece head: PRINTF (font stack), CX.
//
//  The flow inside a scene (any ctx: renderEra swaps the global ctx to an offscreen layer):
//    beginSheet()                         paper into the sheet buffer (or beginSheet(box) = print over what ctx shows)
//    beginLayer(pitch, { T, box, full, auto })   three grey plates + a mask; T = { s, x, y } illustration transform
//      fill(path, tones, o) / line(P, tones, o) / type(str, x, y, size, tones, o) / rim(...) / risoHero(...)
//    printLayer()                         screen each plate, multiply the inks, blend into the sheet by the mask
//    endSheet()                           put the sheet into ctx (a box sheet puts only its box)
//  The current ctx transform (the renderer's camera) is composed into every layer, so the screen
//  belongs to the illustration: it pans and scales with it and never swims under it.
// =====================================================================
const PRINT = typeof PRINTF !== 'undefined' ? PRINTF : '"Arial Black", "Helvetica Neue", Impact, "DejaVu Sans", sans-serif';

// ---------------------------------------------------------------------
//  THE PAPER. Warm cream (241.5, 235.5, 226.5), std ~1.2: almost flat. There is no white anywhere;
//  "white" is paper showing through a knockout. Faint curly fibres and specks only. Static, so cached.
// ---------------------------------------------------------------------
const PAPER = [241.5, 235.5, 226.5];
let PAPER_PIX = null;
function paperPixels() {
  if (PAPER_PIX) return PAPER_PIX;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true }), R = RNG('paper'), k = (W * H) / (1080 * 1080);
  g.fillStyle = `rgb(${PAPER.map(Math.round).join(',')})`; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 70 * k; i++) {            // mottle: soft, about one level either way
    const x = R.r(0, W), y = R.r(0, H), r = R.r(60, 160), gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, R.f() < 0.5 ? 'rgba(252,248,240,0.012)' : 'rgba(205,195,180,0.012)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  g.lineCap = 'round';
  for (let i = 0; i < 240 * k; i++) {           // fibres: short curly hairs a shade darker than the sheet
    let x = R.r(0, W), y = R.r(0, H), a = R.r(0, TAU); const L = R.r(9, 24), bend = R.n(0.35);
    g.strokeStyle = `rgba(160,150,135,${R.r(0.1, 0.22)})`; g.lineWidth = R.r(0.7, 1.2);
    g.beginPath(); g.moveTo(x, y);
    for (let j = 0; j < 6; j++) { a += bend; x += Math.cos(a) * L / 6; y += Math.sin(a) * L / 6; g.lineTo(x, y); }
    g.stroke();
  }
  for (let i = 0; i < 300 * k; i++) { g.fillStyle = `rgba(130,120,110,${R.r(0.1, 0.25)})`; g.fillRect(R.r(0, W), R.r(0, H), R.r(0.8, 1.6), R.r(0.8, 1.6)); }
  return (PAPER_PIX = g.getImageData(0, 0, W, H).data);
}

// ---------------------------------------------------------------------
//  THE INKS. Three spot inks; every other colour is an overprint (multiply):
//  coral = pink+yellow, green = teal+yellow, ink-blue = teal+pink, olive-black = all three.
// ---------------------------------------------------------------------
const INKS = { teal: [54, 137, 171], pink: [220, 68, 160], yellow: [238, 222, 30] };
const INK_NAMES = ['teal', 'pink', 'yellow'];
const ABSORB = INK_NAMES.map((n) => INKS[n].map((v, c) => 1 - v / PAPER[c]));   // paper * (1 - cov*absorb)
const MIX = {
  dark: { teal: 1, pink: 1, yellow: 1 }, coral: { pink: 1, yellow: 1 }, green: { teal: 1, yellow: 1 },
  blue: { teal: 1, pink: 1 }, teal: { teal: 1 }, pink: { pink: 1 }, yellow: { yellow: 1 }, paper: {},
  orange: { pink: 0.55, yellow: 1 }, peach: { pink: 0.3, yellow: 0.45 }, sky: { teal: 0.45, pink: 0.12 },
  lilac: { teal: 0.35, pink: 0.4 }, olive: { teal: 0.55, pink: 0.35, yellow: 1 }, rust: { teal: 0.3, pink: 0.9, yellow: 1 },
};
// the printed colour of a set of tones (what the screens average to), as [r, g, b]
function inkRGB(t) {
  const out = PAPER.slice();
  INK_NAMES.forEach((n, k) => { const v = typeof t[n] === 'number' ? t[n] : 0; for (let c = 0; c < 3; c++) out[c] *= 1 - v * ABSORB[k][c]; });
  return out;
}
// any CSS colour ('#rrggbb' or 'rgb(r,g,b)') -> the nearest plate tones on the 20-level grid (cached)
const TONES_OF = new Map();
function parseRGB(c) {
  if (Array.isArray(c)) return c;
  if (c[0] === '#') return [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const m = c.match(/[\d.]+/g); return m ? m.slice(0, 3).map(Number) : PAPER.slice();
}
function tonesOf(c) {
  const key = String(c); if (TONES_OF.has(key)) return TONES_OF.get(key);
  const want = parseRGB(c); let best = null, bd = 1e18;
  for (let a = 0; a <= 20; a++) for (let b = 0; b <= 20; b++) for (let y = 0; y <= 20; y++) {
    const t = { teal: a / 20, pink: b / 20, yellow: y / 20 }, rgb = inkRGB(t);
    const d = (rgb[0] - want[0]) ** 2 + (rgb[1] - want[1]) ** 2 + (rgb[2] - want[2]) ** 2;
    if (d < bd) { bd = d; best = t; }
  }
  TONES_OF.set(key, best); return best;
}
const rgbHex = (rgb) => '#' + rgb.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');

// ---------------------------------------------------------------------
//  THE SCREENS. Each plate is screened at its own angle (teal 15, pink 75, yellow 45) so overlaps
//  moire like real print. Tone is quantized to 20 levels: up to 50% a dot of radius cell*sqrt(tone/pi),
//  above 50% the solid with paper holes of the same law on the cell corners.
//  The pitch belongs to the illustration and scales with it: ~7px for a small vignette,
//  ~10-12px for a full-frame world, ~17px for a coarse far field. One layer = one pitch.
// ---------------------------------------------------------------------
const ANGLE = { teal: 15, pink: 75, yellow: 45 };
const LEVELS = 20;
const DOT_R = Array.from({ length: LEVELS + 1 }, (_, l) => (l * 2 <= LEVELS ? Math.sqrt(l / LEVELS / Math.PI) : Math.sqrt((1 - l / LEVELS) / Math.PI)));
const PITCH = { fine: 7, world: 10.8, field: 17.5 };

// ---------------------------------------------------------------------
//  THE PLATES. A layer = three grey plates + a mask. Fills knock every plate back to paper and set their
//  own tones; lines overprint (lighten). Each plate sits off register (pink +4,-3; yellow -3,+4 against
//  the teal key) with +-0.3px jitter per boil variant (B % 3): coral and yellow fringes along darks.
//  Wear: single-plate dropouts (~0.6% of pixels per variant) make darks sparkle with coloured specks.
// ---------------------------------------------------------------------
const REG = { teal: [0, 0], pink: [4, -3], yellow: [-3, 4] };
const PLATE = {};
let RL = null, OUT = null, SHEET_BOX = null;
const gray = (v) => { const u = Math.round(clamp(v) * 255); return `rgb(${u},${u},${u})`; };
function plates() {
  if (PLATE.mask) return PLATE;
  for (const n of [...INK_NAMES, 'mask']) { const c = document.createElement('canvas'); c.width = W; c.height = H; PLATE[n] = { c, g: c.getContext('2d', { willReadFrequently: true }) }; }
  return PLATE;
}
const clipBox = (b) => {   // [x0, y0, x1, y1] or a bbox() object -> integer device box inside the frame
  if (!Array.isArray(b)) b = [b.x0, b.y0, b.x1, b.y1];
  return [Math.max(0, Math.floor(b[0])), Math.max(0, Math.floor(b[1])), Math.min(W, Math.ceil(b[2])), Math.min(H, Math.ceil(b[3]))];
};
// a sheet: fresh paper, or (box) the pixels ctx already shows inside box, to print over them
function beginSheet(box) {
  if (!OUT) OUT = new ImageData(W, H);
  if (!box) { OUT.data.set(paperPixels()); SHEET_BOX = null; return; }
  const b = clipBox(box); SHEET_BOX = b; if (b[2] <= b[0] || b[3] <= b[1]) return;
  const m = ctx.getTransform(); ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  const src = ctx.getImageData(b[0], b[1], b[2] - b[0], b[3] - b[1]).data, w4 = (b[2] - b[0]) * 4;
  for (let y = b[1]; y < b[3]; y++) OUT.data.set(src.subarray((y - b[1]) * w4, (y - b[1] + 1) * w4), (y * W + b[0]) * 4);
  ctx.restore(); ctx.setTransform(m);
}
function endSheet() {
  const m = ctx.getTransform(); ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (!SHEET_BOX) ctx.putImageData(OUT, 0, 0);
  else { const b = SHEET_BOX; if (b[2] > b[0] && b[3] > b[1]) ctx.putImageData(OUT, 0, 0, b[0], b[1], b[2] - b[0], b[3] - b[1]); }
  ctx.restore(); ctx.setTransform(m); SHEET_BOX = null;
}
// a layer. pitch in illustration px. o.T = { s, x, y } (illustration -> world), composed with the ctx camera;
// o.box = [x0, y0, x1, y1] in illustration coords (default: the whole frame); o.full = mask the whole box;
// o.auto = the mask is "wherever any plate has ink" (line-only layers; paper knockouts do nothing there);
// o.shapes = every fill and line also adds itself to the mask (props, tags, a hero printed over anything); T.rot rotates
function beginLayer(pitch = PITCH.world, o = {}) {
  if (typeof RUN_AT === 'function') RUN_AT(TT);   // a piece's hook: which plates have run at this time
  const P = plates(), J = RNG('reg', B % 3), m = ctx.getTransform(), T0 = o.T || { s: 1, x: 0, y: 0 };
  const T = { s: m.a * T0.s, x: m.e + m.a * T0.x, y: m.f + m.a * T0.y };
  const cr = Math.cos(T0.rot || 0), sr = Math.sin(T0.rot || 0), dv = (x, y) => [T.x + T.s * (x * cr - y * sr), T.y + T.s * (x * sr + y * cr)];
  let b = [0, 0, W, H];
  if (o.box) { const bb = bbox([dv(o.box[0], o.box[1]), dv(o.box[2], o.box[1]), dv(o.box[2], o.box[3]), dv(o.box[0], o.box[3])], 8); b = [bb.x0, bb.y0, bb.x1, bb.y1]; }
  b = clipBox(b);
  if (SHEET_BOX) b = [Math.max(b[0], SHEET_BOX[0]), Math.max(b[1], SHEET_BOX[1]), Math.min(b[2], SHEET_BOX[2]), Math.min(b[3], SHEET_BOX[3])];
  for (const n of [...INK_NAMES, 'mask']) {
    const g = P[n].g; g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    g.fillStyle = '#000'; g.fillRect(b[0], b[1], Math.max(0, b[2] - b[0]), Math.max(0, b[3] - b[1]));
    const off = n === 'mask' ? [0, 0] : [REG[n][0] + J.n(0.3), REG[n][1] + J.n(0.3)];
    const ca = Math.cos(T0.rot || 0) * T.s, sa = Math.sin(T0.rot || 0) * T.s;
    g.setTransform(ca, sa, -sa, ca, T.x + off[0], T.y + off[1]);
  }
  RL = { T, pitch, box: b, auto: !!o.auto, shapes: !!o.shapes, clips: 0 };
  if (o.full) maskFill((g) => g.rect(-1e5, -1e5, 2e5, 2e5));
  return RL;
}
const tonePaint = (tone, g) => (typeof tone === 'function' ? tone(g) : gray(tone));
// fill(path, tones): a knockout fill (unlisted plates -> 0 = paper); o.over: only raise the listed plates
// (lighten); o.mask: also add the shape to the layer mask (shapes printed outside a full-frame layer)
function fill(path, tones = {}, o = {}) {
  for (const n of INK_NAMES) {
    if (o.over && tones[n] == null) continue;
    const g = PLATE[n].g;
    g.globalCompositeOperation = o.over ? 'lighten' : 'source-over';
    g.fillStyle = tonePaint(tones[n] ?? 0, g); g.beginPath(); path(g); g.fill(o.rule || 'nonzero');
    g.globalCompositeOperation = 'source-over';
  }
  if (o.mask || RL.shapes) maskFill(path, o.rule);
}
function maskFill(path, rule) { const g = PLATE.mask.g; g.fillStyle = '#fff'; g.beginPath(); path(g); g.fill(rule || 'nonzero'); }
// clip every plate (and the mask) to a path until unclip(); nests
function clipTo(path) { for (const n of [...INK_NAMES, 'mask']) { const g = PLATE[n].g; g.save(); g.beginPath(); path(g); g.clip(); } RL.clips++; }
function unclip() { if (!RL.clips) return; for (const n of [...INK_NAMES, 'mask']) PLATE[n].g.restore(); RL.clips--; }
// grey gradients for tones, in illustration coordinates: stops [[pos, tone], ...]
const lin = (x0, y0, x1, y1, stops) => (g) => { const gr = g.createLinearGradient(x0, y0, x1, y1); for (const [p, v] of stops) gr.addColorStop(p, gray(v)); return gr; };
const rad = (x, y, r0, r1, stops) => (g) => { const gr = g.createRadialGradient(x, y, r0, x, y, r1); for (const [p, v] of stops) gr.addColorStop(p, gray(v)); return gr; };
// path builders (each returns g => path)
const circ = (x, y, r) => (g) => g.arc(x, y, Math.max(0, r), 0, TAU);
const ell = (x, y, rx, ry, rot = 0) => (g) => g.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), rot, 0, TAU);
const poly = (P) => (g) => { g.moveTo(P[0][0], P[0][1]); for (let i = 1; i < P.length; i++) g.lineTo(P[i][0], P[i][1]); g.closePath(); };
const curvy = (P) => (g) => {   // closed quadratic smoothing through the midpoints
  const n = P.length; g.moveTo((P[n - 1][0] + P[0][0]) / 2, (P[n - 1][1] + P[0][1]) / 2);
  for (let i = 0; i < n; i++) { const p = P[i], q = P[(i + 1) % n]; g.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); }
  g.closePath();
};
const rect = (x, y, w, h) => (g) => g.rect(x, y, w, h);
const rrect = (x, y, w, h, r) => (g) => { r = Math.min(r, w / 2, h / 2); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
// a hand-cut outline: P wobbled on the boil (key), smoothed
const hand = (P, key, amt = 1.4, step = 6) => curvy(wobble(P, true, amt, key, step));
const boxPts = (x, y, w, h) => resample([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], true, 24);

// ---------------------------------------------------------------------
//  WEAR AND THE PRINT PASS
// ---------------------------------------------------------------------
const DROP = [];
function dropouts(V) {   // static per boil variant: ~0.6% of pixels lose one plate (1-2px specks)
  if (DROP[V]) return DROP[V];
  const a = new Uint8Array(W * H), R = RNG('drop', V), n = Math.round(W * H * 0.006);
  for (let i = 0; i < n; i++) {
    const x = R.i(0, W - 3), y = R.i(0, H - 3), bit = 1 << R.i(0, 2), s = R.f() < 0.25 ? 2 : 1;
    for (let dy = 0; dy < s; dy++) for (let dx = 0; dx < s; dx++) a[(y + dy) * W + x + dx] |= bit;
  }
  return (DROP[V] = a);
}
// which plates the press has run so far: RUN[ink] scales a plate's tones (0 = that ink isn't printed yet),
// RUN_EDGE[ink] = a screen x: the plate prints only left of it (a roller pass sweeping across the sheet).
// The defaults print everything; a piece sets them per frame (e.g. a day that gains one ink per act).
const RUN = { teal: 1, pink: 1, yellow: 1 }, RUN_EDGE = { teal: Infinity, pink: Infinity, yellow: Infinity };
const runLUT = (g) => Uint8Array.from({ length: 256 }, (_, v) => Math.round(v * clamp(g)));
// print the current layer into the sheet: screen each plate, multiply the inks, blend by the mask
function printLayer() {
  while (RL.clips) unclip();
  const { T, pitch, box: [x0, y0, x1, y1], auto } = RL, w = x1 - x0, h = y1 - y0;
  if (w <= 0 || h <= 0) return;
  let pl0 = PLATE.teal.g.getImageData(x0, y0, w, h).data, pl1 = PLATE.pink.g.getImageData(x0, y0, w, h).data, pl2 = PLATE.yellow.g.getImageData(x0, y0, w, h).data;
  let m = auto ? null : PLATE.mask.g.getImageData(x0, y0, w, h).data;
  if (INK_NAMES.some((n) => RUN[n] < 1 || RUN_EDGE[n] < x1)) {   // plates the press hasn't run (fully) yet
    if (auto) { m = new Uint8ClampedArray(pl0.length); for (let i4 = 0; i4 < m.length; i4 += 4) m[i4] = (pl0[i4] | pl1[i4] | pl2[i4]) > 6 ? 255 : 0; }
    [pl0, pl1, pl2] = [pl0, pl1, pl2].map((pl, k) => {
      const n = INK_NAMES[k], L = runLUT(RUN[n]), e = RUN_EDGE[n] - x0, q = new Uint8ClampedArray(pl.length);
      for (let y = 0, i4 = 0; y < h; y++) for (let x = 0; x < w; x++, i4 += 4) q[i4] = x < e ? L[pl[i4]] : 0;
      return q;
    });
  }
  const pp = paperPixels(), out = OUT.data, drop = dropouts(B % 3), p = pitch * T.s;
  const c0 = Math.cos(ANGLE.teal * DEG) / p, s0 = Math.sin(ANGLE.teal * DEG) / p;
  const c1 = Math.cos(ANGLE.pink * DEG) / p, s1 = Math.sin(ANGLE.pink * DEG) / p;
  const c2 = Math.cos(ANGLE.yellow * DEG) / p, s2 = Math.sin(ANGLE.yellow * DEG) / p;
  const [a00, a01, a02] = ABSORB[0], [a10, a11, a12] = ABSORB[1], [a20, a21, a22] = ABSORB[2];
  const LV = LEVEL_OF, DR = DOT_R;
  // coverage of one screen cell at level l, cell coords (u, v): a dot up to 50%, paper holes above
  const cov = (l, u, v) => {
    if (l >= LEVELS) return 1;
    const fu = u - Math.floor(u) - 0.5, fv = v - Math.floor(v) - 0.5;
    let c;
    if (l * 2 <= LEVELS) c = (DR[l] - Math.sqrt(fu * fu + fv * fv)) * p + 0.5;
    else { const gu = 0.5 - Math.abs(fu), gv = 0.5 - Math.abs(fv); c = (Math.sqrt(gu * gu + gv * gv) - DR[l]) * p + 0.5; }
    return c < 0 ? 0 : c > 1 ? 1 : c;
  };
  for (let y = 0; y < h; y++) {
    const Y = y0 + y, dy = Y - T.y, dx0 = x0 - T.x, row = Y * W;
    let u0 = dx0 * c0 + dy * s0, v0 = dy * c0 - dx0 * s0, u1 = dx0 * c1 + dy * s1, v1 = dy * c1 - dx0 * s1, u2 = dx0 * c2 + dy * s2, v2 = dy * c2 - dx0 * s2;
    for (let x = 0, i4 = y * w * 4; x < w; x++, i4 += 4, u0 += c0, v0 -= s0, u1 += c1, v1 -= s1, u2 += c2, v2 -= s2) {
      const t0 = pl0[i4], t1 = pl1[i4], t2 = pl2[i4];
      const mk = m ? m[i4] : (t0 | t1 | t2) > 6 ? 255 : 0;
      if (mk === 0) continue;
      const X = x0 + x, o = (row + X) * 4, dr = drop[row + X];
      let r = pp[o], gg = pp[o + 1], b = pp[o + 2];
      if (t0 >= 7 && !(dr & 1)) { const k = cov(LV[t0], u0, v0); r *= 1 - k * a00; gg *= 1 - k * a01; b *= 1 - k * a02; }
      if (t1 >= 7 && !(dr & 2)) { const k = cov(LV[t1], u1, v1); r *= 1 - k * a10; gg *= 1 - k * a11; b *= 1 - k * a12; }
      if (t2 >= 7 && !(dr & 4)) { const k = cov(LV[t2], u2, v2); r *= 1 - k * a20; gg *= 1 - k * a21; b *= 1 - k * a22; }
      if (mk === 255) { out[o] = r; out[o + 1] = gg; out[o + 2] = b; }
      else { const a = mk / 255; out[o] += (r - out[o]) * a; out[o + 1] += (gg - out[o + 1]) * a; out[o + 2] += (b - out[o + 2]) * a; }
    }
  }
}
const LEVEL_OF = Uint8Array.from({ length: 256 }, (_, v) => Math.round((v * LEVELS) / 255));
// sugar: one layer printed by fn
function printed(pitch, o, fn) { beginLayer(pitch, o); fn(); printLayer(); }
// ---------------------------------------------------------------------
//  PHOTOS. The user's own photos (assets/, see SKILL.md -> Assets) are colour-separated into the three
//  plates once, cached, then drawn into the current layer like any fill, so they get the same screens,
//  misregistration and wear as everything else. The separation inverts the overprint model in density:
//  -ln(rgb / paper) = sum over inks of tone * -ln(1 - absorb), least squares, clamped to 0..1.
//  inks: 'tpy' (all three), 'tp', 't' ... (a subset solves with only those inks: 't' is a teal monotone).
// ---------------------------------------------------------------------
const SEP = new Map();
function separation(name, inks = 'tpy', o = {}) {
  const key = name + ':' + inks + ':' + (o.lift ?? 0) + ':' + (o.gain ?? 1);
  if (SEP.has(key)) return SEP.get(key);
  const img = asset(name); if (!img) return null;
  const w = img.naturalWidth, h = img.naturalHeight, c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0);
  const px = g.getImageData(0, 0, w, h).data, use = INK_NAMES.filter((n) => inks.includes(n[0]));
  // auto levels: the 1st and 99th percentile of luminance stretched to the paper and the darkest overprint
  const hist = new Uint32Array(256);
  for (let i = 0; i < px.length; i += 4) hist[(px[i] * 77 + px[i + 1] * 150 + px[i + 2] * 29) >> 8]++;
  let lo = 0, hi = 255, acc = 0; const N = w * h;
  for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc < N * 0.01) lo = v; if (acc < N * 0.99) hi = v; }
  const span = Math.max(30, hi - lo), lift = o.lift ?? 0, gain = o.gain ?? 1;
  // densities of each ink at full coverage, per channel; the normal equations of the chosen inks
  const D = use.map((n) => ABSORB[INK_NAMES.indexOf(n)].map((a) => -Math.log(1 - a)));
  const k = use.length, A = Array.from({ length: k }, (_, i) => Array.from({ length: k }, (_, j) => D[i].reduce((s, v, ch) => s + v * D[j][ch], 0)));
  const inv = invert(A), dark = PAPER.map((p, ch) => -Math.log(Math.max(1e-3, inkRGB(MIX.dark)[ch] / p)));
  const out = use.map(() => new Uint8ClampedArray(w * h));
  const dens = new Float32Array(256 * 3);   // per channel value -> density after levels
  for (let ch = 0; ch < 3; ch++) for (let v = 0; v < 256; v++) {
    const u = clamp((v - lo) / span), r = PAPER[ch] * Math.exp(-dark[ch] * (1 - u));   // u = 1 -> paper, 0 -> the darkest overprint
    dens[ch * 256 + v] = Math.max(0, -Math.log(Math.max(1, r) / PAPER[ch])) * gain + lift;
  }
  for (let i = 0, p = 0; i < px.length; i += 4, p++) {
    const d0 = dens[px[i]], d1 = dens[256 + px[i + 1]], d2 = dens[512 + px[i + 2]];
    const b = D.map((Dk) => Dk[0] * d0 + Dk[1] * d1 + Dk[2] * d2);
    for (let a = 0; a < k; a++) { let t = 0; for (let j = 0; j < k; j++) t += inv[a][j] * b[j]; out[a][p] = Math.round(clamp(t) * 255); }
  }
  const plates = {};
  use.forEach((n, a) => {
    const pc = document.createElement('canvas'); pc.width = w; pc.height = h;
    const pg = pc.getContext('2d'), id = pg.createImageData(w, h);
    for (let p = 0, i = 0; p < w * h; p++, i += 4) { const v = out[a][p]; id.data[i] = v; id.data[i + 1] = v; id.data[i + 2] = v; id.data[i + 3] = 255; }
    pg.putImageData(id, 0, 0); plates[n] = pc;
  });
  const s = { w, h, plates }; SEP.set(key, s); return s;
}
function invert(A) {   // a small matrix inverse (Gauss-Jordan)
  const n = A.length, M = A.map((r, i) => [...r, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]]; const d = M[c][c] || 1e-9;
    for (let j = 0; j < 2 * n; j++) M[c][j] /= d;
    for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c]; for (let j = 0; j < 2 * n; j++) M[r][j] -= f * M[c][j]; }
  }
  return M.map((r) => r.slice(n));
}
// printPhoto(name, x, y, w, h, o): the photo's plates drawn into the current layer over the box (illustration
// coords), knocking out what is under it. o.inks ('tpy' | 'tp' | 't' ...), o.crop = [sx, sy, sw, sh] in source
// pixels (default: cover the box, centred; o.focus = [fx, fy] 0..1 moves the crop), o.alpha (0..1: crossfade
// over what the plates already hold), o.lift / o.gain (density), o.clip (a path the photo is clipped to).
function printPhoto(name, x, y, w, h, o = {}) {
  const s = separation(name, o.inks ?? 'tpy', o); if (!s) return;
  let crop = o.crop;
  if (!crop) {
    const k = Math.max(w / s.w, h / s.h), sw = w / k, sh = h / k, f = o.focus ?? [0.5, 0.5];
    crop = [(s.w - sw) * f[0], (s.h - sh) * f[1], sw, sh];
  }
  if (o.clip) clipTo(o.clip);
  for (const n of INK_NAMES) {
    const g = PLATE[n].g; g.save(); g.globalAlpha = o.alpha ?? 1; g.globalCompositeOperation = 'source-over';
    if (s.plates[n]) g.drawImage(s.plates[n], crop[0], crop[1], crop[2], crop[3], x, y, w, h);
    else { g.fillStyle = '#000'; g.fillRect(x, y, w, h); }
    g.restore();
  }
  if (RL.shapes || o.mask) maskFill(rect(x, y, w, h));
  if (o.clip) unclip();
}
// a few hundred tiny single-ink specks knocked into a large dark (wear you can see)
function specks(x0, y0, x1, y1, n, key) {
  const R = RNG('speck', key);
  for (let i = 0; i < n; i++) fill(circ(R.r(x0, x1), R.r(y0, y1), R.r(1, 2.4)), [{ pink: 1 }, { yellow: 1 }, { teal: 1 }][i % 3]);
}

// ---------------------------------------------------------------------
//  THE LINE. resample -> wobble (on the boil) -> a tapered ribbon with pressure -> printed through plates.
//  Lines overprint (lighten the listed plates) unless o.knock (the other plates go to paper along the stroke).
//  rough ~0.15 = a brush line; 0.55 = the dry-brush rim of every circle.
// ---------------------------------------------------------------------
function ribbon(P, o = {}) {
  const closed = !!o.closed, key = o.key ?? 'rib';
  const Q = o.amt === 0 ? resample(P, closed, o.step ?? 5) : wobble(P, closed, o.amt ?? 1.4, key, o.step ?? 5);
  const n = Q.length, total = pathLen(closed ? [...Q, Q[0]] : Q) || 1, R = RNG('press', key, B % 3);
  const f1 = R.r(0.02, 0.05), f2 = R.r(0.12, 0.3), p1 = R.r(0, TAU), p2 = R.r(0, TAU), rough = o.rough ?? 0.15, w = o.w ?? 4;
  const L = [], Rt = []; let s = 0;
  for (let i = 0; i < n; i++) {
    const a = Q[closed ? (i - 1 + n) % n : Math.max(0, i - 1)], c = Q[closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
    let nx = a[1] - c[1], ny = c[0] - a[0]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
    if (i) s += dist(Q[i - 1], Q[i]);
    const t = s / total, tp = o.taper ? Math.max(0, Math.min(1, t / o.taper, (1 - t) / o.taper)) ** 0.7 : 1;
    const hw = Math.max(0, (w / 2) * tp * (1 + rough * (0.6 * Math.sin(s * f1 + p1) + 0.4 * Math.sin(s * f2 + p2))));
    L.push([Q[i][0] + nx * hw, Q[i][1] + ny * hw]); Rt.push([Q[i][0] - nx * hw, Q[i][1] - ny * hw]);
  }
  return closed ? { outer: L, inner: Rt } : [...L, ...Rt.reverse()];
}
function line(P, tones, o = {}) {
  if (o.frac != null && o.frac < 1) {   // write-on
    if (o.frac <= 0) return;
    P = subPath(o.closed ? [...P, P[0]] : P, o.frac); o = { ...o, closed: false };
  }
  const rb = ribbon(P, o), path = o.closed ? (g) => { poly(rb.outer)(g); poly(rb.inner)(g); } : poly(rb);
  fill(path, tones, { over: !o.knock, mask: o.mask, rule: o.closed ? 'evenodd' : 'nonzero' });
}
function ringPts(cx, cy, r, n = 0) { const k = n || Math.max(24, Math.round(r / 5)); return Array.from({ length: k }, (_, i) => [cx + Math.cos((i / k) * TAU) * r, cy + Math.sin((i / k) * TAU) * r]); }
// the dry-brush rim round any closed outline: a rough ribbon plus a thinner pass that does not agree with it
function rimLine(P, key, o = {}) {
  const tones = o.tones || { teal: 1 }, w = o.w ?? 9;
  line(P, tones, { closed: true, w, rough: o.rough ?? 0.55, amt: o.amt ?? 2.2, key, mask: o.mask, knock: o.knock });
  if (o.double === false) return;
  const Q = resample(P, true, 8), R = RNG('rim2', key, B % 3), n = Q.length, i0 = R.i(0, n - 1), span = Math.floor(n * R.r(0.2, 0.4));
  const S = Array.from({ length: span }, (_, i) => Q[(i0 + i) % n]).map(([x, y]) => [x + R.n(1) + 3, y + 3]);
  if (S.length > 2) line(S, tones, { w: w * 0.35, taper: 0.3, amt: 1.2, key: key + '2', mask: o.mask });
}
function rim(cx, cy, r, key, o = {}) { rimLine(ringPts(cx, cy, r), key, o); }

// ---------------------------------------------------------------------
//  TYPE. Letters are printed too: solid ink (no screen at tone 1), so misregistration shows as fringes.
//  type(str, x, y, size, tones, o): o.knock (default true: the letters knock out what is under them),
//  o.frac (write-on, left to right), o.align ('left' | 'center'), o.weight, o.key
// ---------------------------------------------------------------------
function typeW(str, size, weight = 900) { ctx.save(); ctx.font = `${weight} ${size}px ${PRINT}`; const w = ctx.measureText(str).width; ctx.restore(); return w; }
function type(str, x, y, size, tones, o = {}) {
  const frac = clamp(o.frac ?? 1); if (frac <= 0) return;
  const R = RNG('type', o.key ?? str, B % 3), font = `${o.weight ?? 900} ${size}px ${PRINT}`;
  const w = typeW(str, size, o.weight ?? 900), x0 = o.align === 'center' ? x - w / 2 : x;
  const knock = o.knock !== false, jx = R.n(0.7), jy = R.n(0.7), rot = R.n(0.004);
  const each = (g, paint) => {
    g.save(); g.translate(x0 + jx, y + jy); g.rotate(rot);
    if (frac < 1) { g.beginPath(); g.rect(-4, -size * 1.2, w * frac + 4, size * 1.7); g.clip(); }
    g.font = font; g.textBaseline = 'alphabetic'; g.textAlign = 'left'; paint(g); g.restore();
  };
  for (const n of INK_NAMES) {
    if (!knock && tones[n] == null) continue;
    const g = PLATE[n].g; g.globalCompositeOperation = knock ? 'source-over' : 'lighten';
    each(g, (gg) => { gg.fillStyle = gray(tones[n] ?? 0); gg.fillText(str, 0, 0); });
    g.globalCompositeOperation = 'source-over';
  }
  if (RL.shapes || o.mask) each(PLATE.mask.g, (gg) => { gg.fillStyle = '#fff'; gg.fillText(str, 0, 0); });
}

// ---------------------------------------------------------------------
//  THE HERO: a printed bean in ink-blue (teal + pink, so it carries its own pink/teal fringes), paper eyes
//  with olive-black pupils, pink cheeks, a green sprout on top. Draws inside the current layer.
//  o: key, mood ('smile' | 'happy' | 'wow'), arms [left, right] angles (0 = down, PI = straight up),
//  look [dx, dy] (-1..1), hop (px up), shadow (false to skip), hold (fn(hx, hy) drawn between the raised hands)
// ---------------------------------------------------------------------
const HERO_TONES = MIX.blue;
function risoHero(x, y, r, o = {}) {
  const key = o.key ?? 'hero', hop = o.hop ?? 0;
  if (o.shadow !== false) fill(ell(x, y + r * 1.32, r * 0.8 * (1 - hop / (r * 6)), r * 0.16), { teal: 0.35, pink: 0.3 });
  y += -hop + Math.sin(TT * TAU * 0.9 + key.length) * r * 0.035;      // idle bob
  if (RL) SPARK_AT = [RL.T.x + RL.T.s * x, RL.T.y + RL.T.s * y];
  const legY = y + r * 0.85;
  for (const s of [-1, 1]) {
    line([[x + s * r * 0.3, legY - r * 0.1], [x + s * r * 0.34, y + r * 1.28]], HERO_TONES, { w: r * 0.14, amt: 0.6, key: key + 'leg' + s, knock: true });
    fill(ell(x + s * r * 0.42, y + r * 1.3, r * 0.17, r * 0.08), HERO_TONES);
  }
  const arms = o.arms ?? [0.35, 0.35], hands = [];
  for (const [i, s] of [[0, -1], [1, 1]]) {
    const a = arms[i], sx = x + s * r * 0.62, sy = y + r * 0.1, L = r * 0.75;
    const hx = sx + s * Math.sin(a) * L, hy = sy + Math.cos(a) * L;
    line([[sx, sy], [lerp(sx, hx, 0.5) + s * r * 0.06, lerp(sy, hy, 0.5)], [hx, hy]], HERO_TONES, { w: r * 0.13, amt: 0.5, key: key + 'arm' + s, knock: true });
    fill(circ(hx, hy, r * 0.11), HERO_TONES); hands.push([hx, hy]);
  }
  // sprout
  line([[x, y - r * 0.95], [x + r * 0.04, y - r * 1.2], [x + r * 0.12, y - r * 1.34]], MIX.green, { w: r * 0.06, amt: 0.4, key: key + 'stem', knock: true });
  fill(ell(x + r * 0.26, y - r * 1.36, r * 0.17, r * 0.08, -0.4), MIX.green);
  // body
  const P = wobble(ellipsePts(x, y, r * 0.78, r, 0, 40), true, Math.max(0.6, r * 0.012), key, 6);
  fill(curvy(P), HERO_TONES);
  fill(ell(x, y + r * 0.42, r * 0.44, r * 0.36), { teal: 0.55, pink: 0.35 });              // belly: a lighter tint knocked in
  // face
  const lk = o.look ?? [0, 0], ey = y - r * 0.25, blink = (B + key.length * 7) % 41 < 2;
  for (const s of [-1, 1]) {
    const ex = x + s * r * 0.3;
    if (blink) { line([[ex - r * 0.14, ey], [ex + r * 0.14, ey]], MIX.dark, { w: r * 0.05, amt: 0.3, key: key + 'bl' + s, knock: true }); continue; }
    fill(ell(ex, ey, r * 0.17, r * (o.mood === 'wow' ? 0.25 : 0.22)), {});
    fill(circ(ex + lk[0] * r * 0.06, ey + lk[1] * r * 0.08, r * 0.085), MIX.dark);
    fill(circ(ex + lk[0] * r * 0.06 - r * 0.03, ey + lk[1] * r * 0.08 - r * 0.035, r * 0.025), {});
    fill(circ(x + s * r * 0.5, y + r * 0.02, r * 0.09), { pink: 1 });
  }
  const my = y + r * 0.08;
  if (o.mood === 'wow') { fill(ell(x, my + r * 0.04, r * 0.08, r * 0.1), {}); fill(ell(x, my + r * 0.07, r * 0.05, r * 0.05), { pink: 1 }); }
  else line(arcPts(x, my - r * (o.mood === 'happy' ? 0.1 : 0.04), r * (o.mood === 'happy' ? 0.16 : 0.1), Math.PI * 0.15, Math.PI * 0.85, 10), {}, { w: r * 0.05, amt: 0.3, key: key + 'm', knock: true });
  if (o.hold) o.hold((hands[0][0] + hands[1][0]) / 2, Math.min(hands[0][1], hands[1][1]));
  return P;
}
const heroOutline = (x, y, r) => ellipsePts(x, y, r * 0.78, r, 0, 96);

// ---------------------------------------------------------------------
//  CAPTIONS: printed tags, drawn after the camera (DEFER) as a small sheet over what the frame shows.
//  printTag: a yellow slip on a screened pink block, ink-blue letters. printCard: a paper card with a teal rim.
// ---------------------------------------------------------------------
function printTag(str, x, y, size, o = {}) {
  const s = o.s ?? 1; if (s <= 0.01) return;
  const w = typeW(str, size) + size * 0.9, h = size * 1.5, rot = o.rot ?? -0.04, reach = (w / 2 + 40) * s;
  beginSheet([x - reach, y - reach, x + reach, y + reach]);
  printed(PITCH.fine, { T: { s, x, y, rot }, shapes: true }, () => {
    fill(hand(boxPts(-w / 2 + 12, -h / 2 + 14, w, h), 'tagsh' + str, 1.2), { pink: 0.75 });
    fill(hand(boxPts(-w / 2, -h / 2, w, h), 'tag' + str, 1.2), o.tones ?? { yellow: 1 });
    type(str, -w / 2 + size * 0.45, size * 0.36, size, MIX.blue, { key: 'tagt' + str, frac: o.frac });
  });
  endSheet();
}
function printCard(str, x, y, size, o = {}) {
  const s = o.s ?? 1; if (s <= 0.01) return;
  const w = typeW(str, size) + size * 1.0, h = size * 1.6, rot = o.rot ?? 0.012, reach = (w / 2 + 40) * s;
  beginSheet([x - reach, y - reach, x + reach, y + reach]);
  printed(PITCH.fine, { T: { s, x, y, rot }, shapes: true }, () => {
    const P = boxPts(-w / 2, -h / 2, w, h);
    fill(hand(P, 'card' + str, 1.2), {});
    rimLine(P, 'cardr' + str, { w: 6, amt: 1.2, rough: 0.45 });
    type(str, -w / 2 + size * 0.5, size * 0.36, size, o.tones ?? MIX.blue, { key: 'cardt' + str, frac: o.frac });
  });
  endSheet();
}
const defer = (f) => { if (DEFER) DEFER.push(f); else f(); };
const risoTag = (str) => defer(() => printTag(str, 70 + (typeW(str, 72) + 65) / 2, 330, 72, { s: popS(E0 + 0.2) }));
const risoCaption = (str) => defer(() => printCard(str, CX, 1440, 50, { s: popS(E0 + 0.3), frac: ev(E0 + 0.45, 0.6) }));

// =====================================================================
//  STYLE — the renderer's hooks (kit/morph.js). Each one prints a small sheet over what ctx shows.
// =====================================================================
const STYLE = {
  name: 'riso',
  paper: rgbHex(PAPER),
  backdrop(c) {   // the frame as one flat plate tone (the nearest the three inks can print to c)
    const t = tonesOf(c);
    beginSheet();
    if (t.teal + t.pink + t.yellow > 0) printed(PITCH.world, { full: true }, () => fill(rect(-10, -10, W + 20, H + 20), t));
    endSheet();
  },
  window(P, key, src) {   // the world printed inside outline P, with a rough teal printed rim
    const Q = wobble(P, true, 2, key, 9);
    ctx.save(); trace(Q, true); ctx.clip(); ctx.drawImage(src, 0, 0); ctx.restore();
    if (!Q.some(([x, y]) => x > -20 && x < W + 20 && y > -20 && y < H + 20)) return;
    beginSheet(bbox(Q, 24));
    printed(PITCH.world, { auto: true }, () => rimLine(Q, key + 'rim', { w: 11, amt: 1.6 }));
    endSheet();
  },
  blob(P, c, key) {   // the morphing shape: a flat screened fill and a dry-brush rim a step darker
    const t = tonesOf(c), d = { teal: Math.min(1, t.teal * 1.6), pink: Math.min(1, t.pink + 0.4), yellow: Math.min(1, t.yellow + 0.3) };
    beginSheet(bbox(P, 30));
    printed(PITCH.world, { shapes: true }, () => { fill(hand(P, key, 1.2), t); rimLine(P, key + 'r', { tones: d, w: 10 }); });
    endSheet();
  },
  hero(x, y, r, o = {}) {
    const rr = r * 0.6; beginSheet([x - rr * 1.6, y - rr * 1.8, x + rr * 1.6, y + rr * 1.8]);
    printed(PITCH.fine, { shapes: true }, () => risoHero(x, y, rr, { ...o, shadow: false, mood: o.mood ?? 'wow' }));
    endSheet();
  },
  heroColor: rgbHex(inkRGB(HERO_TONES)),
  heroPts: (x, y, r) => heroOutline(x, y, r * 0.6),
};
