// =====================================================================
//  SCENES — cut-paper / collage look test. Screen coords 1920x1080, no camera.
//  The photos are the user's own: torn prints with a paper border, tape and a shadow, or shapes cut straight
//  out of a photo (the ship's hull, the skyline) and pasted onto paper worlds. Orange is the spark's alone.
// =====================================================================
const PH = { park: '01-greenwich-park-skyline.jpg', court: '02-museum-atrium-blue.jpg', ship: '08-ship-model-hull-painting.jpg', cab: '18-maori-cabinet-lit.jpg' };
// draw a photo into the current clip, covering bbox bb, crop centred on focus [fx, fy] (0..1) and zoomed by z
function photoIn(name, bb, focus = [0.5, 0.5], z = 1) {
  const img = asset(name); if (!img) return;
  const w = bb.x1 - bb.x0, h = bb.y1 - bb.y0, k = Math.max(w / img.naturalWidth, h / img.naturalHeight) * z;
  const sw = w / k, sh = h / k, sx = clamp(focus[0] * img.naturalWidth - sw / 2, 0, img.naturalWidth - sw), sy = clamp(focus[1] * img.naturalHeight - sh / 2, 0, img.naturalHeight - sh);
  ctx.drawImage(img, sx, sy, sw, sh, bb.x0, bb.y0, w, h);
}
const shrink = (P, d) => { const c = P.reduce((a, p) => [a[0] + p[0] / P.length, a[1] + p[1] / P.length], [0, 0]); return P.map(([x, y]) => { const l = Math.hypot(x - c[0], y - c[1]) || 1; return [x - (x - c[0]) / l * d, y - (y - c[1]) / l * d]; }); };
// a torn print: a paper border torn round the outline, the photo inside a second torn edge, a grain pass, tape
function print(name, P, key, o = {}) {
  cut(P, PAL.paper, { key: key + 'b', tear: 1.8, sb: 16, sy: 9 });
  const Q = torn(wobble(shrink(P, o.border ?? 16), true, 1.2, key + 'i', 6), key + 'i', 1.6), bb = bbox(Q);
  ctx.save(); trace(Q, true); ctx.clip(); photoIn(name, bb, o.focus, o.z); grainIn(bb, key, 0.35); ctx.restore();
  for (const [x, y, a] of o.tape ?? []) cut(rot(rect(x - 55, y - 18, 110, 36, 2), x, y, a), 'rgba(240,230,190,0.78)', { key: key + 't' + x, shadow: false, grain: 0.3, shade: false });
}
// a shape cut out of a photo: the photo clipped to a torn outline, a soft shadow under it
function cutout(name, P, key, bbPhoto, focus = [0.5, 0.5], z = 1) {
  const Q = torn(wobble(P, true, 1, key, 5), key, 1.2);
  ctx.save(); ctx.shadowColor = 'rgba(35,20,10,0.35)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 8; trace(Q, true); ctx.fillStyle = PAL.paper; ctx.fill(); ctx.restore();
  ctx.save(); trace(Q, true); ctx.clip(); photoIn(name, bbPhoto, focus, z); ctx.restore();
  ctx.save(); trace(Q, true); ctx.strokeStyle = PAL.paper; ctx.lineWidth = 4; ctx.stroke(); ctx.restore();
}
const wall = (c, key, o = {}) => cut(rect(-30, -30, W + 60, H + 60, 0), c, { key, shadow: false, tear: 0, grain: 0.8, ...o });
function bunting(x0, y0, x1, y1, sag, key, colours) {
  const N = 11, at = (u) => [lerp(x0, x1, u), lerp(y0, y1, u) + Math.sin(u * Math.PI) * sag];
  ctx.strokeStyle = PAL.ink; ctx.lineWidth = 3; ctx.beginPath(); for (let i = 0; i <= 40; i++) { const [x, y] = at(i / 40); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
  for (let i = 0; i < N; i++) {
    const u = (i + 0.5) / N, [x, y] = at(u), sw = Math.sin(TT * 4 + i) * 0.08;
    cut(rot([[x - 26, y], [x + 26, y], [x, y + 58]], x, y, sw), colours[i % colours.length], { key: key + i, sb: 6, sy: 4, pat: i % 3 === 0 ? pat.dots('rgba(255,255,255,0.6)', 3, 12) : null });
  }
}
function leafFall(n, key) {
  for (let i = 0; i < n; i++) {
    const R = RNG('lf', key, i), age = mod(TT * 0.2 + R.f(), 1), x = R.r(100, 1800) + Math.sin(TT * 2 + i) * 30, y = lerp(-40, 1100, age);
    cut(rot(ellipsePts(x, y, 20, 9, 0, 14), x, y, TT * 2 + i), [PAL.green, PAL.mustard, PAL.greenD][i % 3], { key: key + i, sb: 4, sy: 3, tear: 0.6, grain: 0.4 });
  }
}

// ---- 1  THE PARK: a sky wall, the skyline cut out of the photo, a paper hill, the spark looking out
function cpPark() {
  wall(PAL.sky, 'parkwall', { pat: pat.dots('rgba(255,255,255,0.35)', 4, 34) });
  for (const [x, y, s] of [[260, 170, 1], [1500, 120, 1.3], [980, 230, 0.8]]) cut(ellipsePts(x, y, 120 * s, 46 * s, 0, 24), '#fbfdfe', { key: 'cl' + x, sb: 10, sy: 5 });
  cut(ellipsePts(1700, 300, 70, 70, 0, 30), PAL.yellow, { key: 'sun', crayon: PAL.mustard, crAl: 0.4 });
  // the towers, cut straight out of the user's photo along the skyline
  cutout(PH.park, rot(rect(330, 250, 1100, 390, 0), 880, 445, 0.02), 'skyline', { x0: -389, y0: -692, x1: 1895, y1: 2354 });   // towers: source x 340-860, y 450-635
  print(PH.park, rot(rect(80, 470, 430, 330), 295, 635, -0.06), 'oak', { focus: [0.5, 0.12], tape: [[200, 478, -0.1], [400, 470, 0.08]] });
  cut([[-40, 760], [400, 650], [900, 700], [1400, 640], [1960, 720], [1960, 1120], [-40, 1120]], PAL.green, { key: 'hill', pat: pat.stripes('rgba(61,124,70,0.35)', 6, 26, 0.9), crayon: PAL.greenD, crAl: 0.25 });
  cut([[-40, 900], [700, 840], [1300, 900], [1960, 860], [1960, 1120], [-40, 1120]], PAL.greenD, { key: 'hill2', crayon: '#2f5f36', crAl: 0.3 });
  // birds on a wire (life), falling leaves
  ctx.strokeStyle = PAL.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(1180, 520); ctx.quadraticCurveTo(1500, 590, 1960, 540); ctx.stroke();
  for (const [x, y] of [[1380, 548], [1460, 556], [1640, 558]]) { cut(ellipsePts(x, y - 18, 20, 16, 0, 16), PAL.navy, { key: 'bd' + x, sb: 4, sy: 3 }); dot(x + 10, y - 22, 2.5, '#fff'); }
  leafFall(8, 'pk');
  spark(560, 800, 78, { rays: 3, mood: 'smile', key: 'spark' });
  yearTag('morning');
  capStrip('Greenwich Park');
}

// ---- 2  OCEAN COURT: a teal striped wall, the atrium as a big torn print, bunting, the spark on the rail
function cpCourt() {
  wall(PAL.teal, 'courtwall', { pat: pat.stripes('rgba(255,255,255,0.12)', 30, 60) });
  print(PH.court, rot(rect(330, 110, 1260, 720), 960, 470, 0.02), 'atrium', { focus: [0.5, 0.42], z: 1, tape: [[480, 112, -0.08], [1440, 128, 0.06]] });
  bunting(-20, 70, 1940, 90, 70, 'bunt', [PAL.pink, PAL.yellow, PAL.blue, PAL.mint, PAL.purple]);
  cut(rect(-40, 860, W + 80, 260, 0), PAL.navy, { key: 'rail', pat: pat.stripes('rgba(255,255,255,0.18)', 10, 90), crayon: '#1b2347', crAl: 0.3 });
  cut(rect(-40, 840, W + 80, 30, 0), PAL.woodL, { key: 'railtop', pat: pat.grainWood('rgba(151,88,43,0.35)') });
  const x = 520 + (TT - 2) * 160;
  spark(x, 800, 74, { rays: 4, mood: 'happy', key: 'spark' });
  yearTag('Ocean Court');
}

// ---- 3  THE SHIP: a night-blue wall, the battle painting as a small print, the hull cut out of the photo and
//          pasted on layered paper waves; the spark rides a paper boat
function cpShip() {
  wall(PAL.navy, 'shipwall', { pat: pat.dots('rgba(255,255,255,0.10)', 3, 40) });
  print(PH.ship, rot(rect(1180, 90, 520, 300), 1440, 240, 0.04), 'painting', { focus: [0.54, 0.12], z: 2.4, tape: [[1300, 96, -0.05], [1580, 104, 0.05]] });
  const hull = []; for (let i = 0; i <= 40; i++) { const u = i / 40; hull.push([lerp(150, 1350, u), 480 - Math.sin(u * Math.PI) * 20 - (u < 0.15 ? (0.15 - u) * 500 : 0)]); }
  for (let i = 40; i >= 0; i--) { const u = i / 40; hull.push([lerp(230, 1330, u), 760 + Math.sin(u * Math.PI) * 70]); }   // the hull: source y 470-890 at x0.857
  const rock = Math.sin(TT * 2.4) * 0.015;
  ctx.save(); ctx.translate(760, 640); ctx.rotate(rock); ctx.translate(-760, -640);
  cutout(PH.ship, hull, 'hull', { x0: 124, y0: 67, x1: 1358, y1: 993 });
  ctx.restore();
  for (let k = 0; k < 3; k++) {
    const y = 760 + k * 95, P = [[-40, H + 40]];
    for (let x = -40; x <= W + 40; x += 40) P.push([x, y + Math.sin(x * 0.012 + TT * 2 + k * 1.3) * 18]);
    P.push([W + 40, H + 40]);
    cut(P, [PAL.blue, PAL.teal, '#2b4f8f'][k], { key: 'wave' + k, pat: k === 1 ? pat.lines('rgba(255,255,255,0.18)', 22, 10) : null, crayon: k === 2 ? PAL.navy : null, crAl: 0.3 });
  }
  const bx = 1560, by = 840 + Math.sin(TT * 2.4) * 10;
  cut([[bx - 120, by], [bx + 120, by], [bx + 80, by + 60], [bx - 80, by + 60]], PAL.paper, { key: 'boat', pat: pat.lines('rgba(42,29,24,0.15)', 14) });
  spark(bx, by - 60, 64, { rays: 5, mood: 'wow', key: 'spark' });
  capStrip('ships in glass');
}

// ---- 4  PACIFIC ENCOUNTERS: a mustard wall of cut triangles, the cabinet as the hero print, the spark hops
function cpPacific() {
  wall(PAL.mustard, 'pacwall');
  const R = RNG('tri');
  for (let i = 0; i < 26; i++) {
    const x = (i % 13) * 160 - 40 + (Math.floor(i / 13) % 2) * 80, y = Math.floor(i / 13) * 560 - 60, up = i % 2 === 0;
    const P = up ? [[x, y + 520], [x + 80, y], [x + 160, y + 520]] : [[x, y], [x + 160, y], [x + 80, y + 520]];
    cut(P, [PAL.teal, PAL.pink, PAL.navy, PAL.yellow, PAL.mint][R.i(0, 4)], { key: 'tri' + i, sb: 8, sy: 5, pat: i % 4 === 0 ? pat.dots('rgba(255,255,255,0.35)', 4, 18) : null });
  }
  print(PH.cab, rot(rect(400, 100, 1120, 740), 960, 470, -0.015), 'cabinet', { focus: [0.5, 0.36], tape: [[520, 104, -0.07], [1400, 100, 0.07]] });
  for (const [x, y, s] of [[260, 900, 1], [1690, 880, 1.2]]) {   // koru: a cut-paper spiral
    const P = []; for (let i = 0; i < 70; i++) { const a = i * 0.16, r = 8 + i * 1.3 * s; P.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); }
    ctx.save(); ctx.shadowColor = 'rgba(35,20,10,0.3)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 5; ctx.strokeStyle = PAL.paper; ctx.lineWidth = 16 * s; ctx.lineCap = 'round';
    ctx.beginPath(); P.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.stroke(); ctx.restore();
  }
  const hop = Math.abs(Math.sin((TT - 6) * 5)) * 40;
  spark(960, 930 - hop, 80, { rays: 7, mood: 'happy', key: 'spark' });
  for (const [x, y] of [[860, 820], [1070, 800], [900, 760]]) sparkle(x, y - hop, 14 + 4 * ((B + x) % 2), '#fff8dc');
  yearTag('Pacific Encounters');
}
