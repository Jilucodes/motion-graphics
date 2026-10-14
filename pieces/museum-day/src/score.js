  // ================= A DAY AT THE MUSEUM: the arc =================
  // a thin teal morning (pad, birds) -> the pink roller lands and the plucks start -> a groove through the ship
  // -> busiest on the deck, the wall and the strings -> dead stop: lights down (near silence 1.5s) -> the lights come
  // up: the loudest hit, a flat warm chord -> warm and slower through Pacific Encounters -> the morning pad again, full
  const T = TIMELINE, cu = T.cues, R = RNG('score');
  const FIG = [['D4', 'A4', 'Fs4', 'A4', 'D5', 'A4', 'Fs4', 'A4'], ['D4', 'A4', 'B4', 'A4', 'E5', 'A4', 'B4', 'A4'],
    ['Fs4', 'A4', 'Cs5', 'A4', 'E5', 'A4', 'Cs5', 'A4'], ['B3', 'Fs4', 'A4', 'D5', 'Fs5', 'D5', 'A4', 'Fs4']];
  const BEAN = (t, vel, notes = [['D4', 0], ['A4', E8]]) => notes.forEach(([n, dt], i) => pluck(t + dt, nz(n), vel, -0.1 + i * 0.15, 0.6, 2600, 0.35));   // the bean: a rising fifth
  const each = (t0, t1, step, fn) => { for (let k = 0; t0 + k * step < t1 - 1e-6; k++) fn(t0 + k * step, k); };
  const ROOT = (k) => ['D2', 'B1', 'G2', 'A2'][Math.floor(k / 8) % 4];

  // ================= MUSIC =================
  to = 'm';
  // morning: a soft triangle pad, the bean's fifth, a few quarter notes
  pad(0.0, 5.1, ['D3', 'A3', 'Fs4'], 0.03, { type: 'triangle', cut: 800, att: 0.6, rel: 0.3 });
  BEAN(2.0, 0.16);
  each(3.0, 5.0, BEAT, (t, k) => pluck(t, nz(FIG[0][k * 2 % 8]), 0.04, Math.sin(k) * 0.3, 0.5, 2000, 0.35));
  // Ocean Court: the roller lands (a pluck chord), then 8ths and a bass on the beat
  ['D3', 'A3', 'D4', 'Fs4', 'A4'].forEach((n, i) => pluck(cu.pink + i * 0.008, nz(n), 0.14, (i - 2) * 0.15, 0.6, 3600, 0.35));
  pad(5.0, 16.1, ['D3', 'A3', 'E4'], 0.032, { cut: 950, att: 0.3, rel: 0.2, send: 0.3 });
  each(6.5, 10.5, E8, (t, k) => { pluck(t, nz(FIG[1][k % 8]), 0.055 * (k % 2 ? 0.75 : 1), Math.sin(k * 0.9) * 0.3, 0.32, 3000, 0.2); if (k % 2 === 0) bass(t, nz(ROOT(k)), 0.14); });
  BEAN(cu.walk, 0.12);
  // the ship: 16ths at half density, a sub on the bar
  each(10.5, 16.0, E16, (t, k) => {
    if (k % 2 === 0 || k % 8 === 3) pluck(t, nz(FIG[Math.floor(k / 16) % 2 ? 2 : 1][k % 8]), 0.05 * (k % 4 === 0 ? 1.2 : 0.85), Math.sin(k * 0.9) * 0.35, 0.3, 3400, 0.18);
    if (k % 4 === 0) bass(t, nz(ROOT(k / 2)), 0.15);
    if (k % 16 === 0) sub(t, 0.06);
  });
  BEAN(cu.wow, 0.13, [['D4', 0], ['A4', E8], ['D5', BEAT]]);
  // the deck, the wall, the strings: the busiest; stops dead at the lights-down cue (dry in the last beat)
  pad(16.0, cu.down, ['D3', 'A3', 'E4', 'A4'], 0.03, { cut: 1200, att: 0.2, rel: 0.02, send: 0.12 });
  each(16.0, cu.down, E16, (t, k) => {
    const fig = FIG[Math.floor(k / 8) % 4], acc = k % 4 === 0 ? 1.25 : k % 2 === 0 ? 1.0 : 0.75, dry = t >= cu.down - BEAT ? 0.02 : 0.14;
    pluck(t, nz(fig[k % 8]), 0.055 * acc, Math.sin(k * 0.9) * 0.4, t >= cu.down - E8 ? 0.15 : 0.28, 4400, dry);
    if (k % 2 === 0) bass(t, nz(ROOT(k / 2)), 0.15);
    if (k % 4 === 0) sub(t, 0.065);
    if (k % 4 === 2) noiseHit(t, 0.018, 'highpass', 8200, 0.7, 0.022, k % 8 ? 0.3 : -0.3);
  });
  riser(27.6, cu.down - 0.04, 0.014);
  // the lights come up: the stab and a sub on the hit, then a flat warm chord, nothing busy on top
  ['D3', 'A3', 'D4', 'Fs4', 'A4', 'D5'].forEach((n, i) => pluck(cu.up + i * 0.006, nz(n), 0.36, (i - 2.5) * 0.15, 0.7, 5200, 0.4));
  pad(cu.up, cu.up + 0.4, ['D3', 'A3', 'D4', 'Fs4', 'A4', 'D5'], 0.5, { cut: 3600, att: 0.008, rel: 0.35, send: 0.3 });
  pad(31.0, 37.6, ['D3', 'A3', 'D4', 'Fs4', 'A4'], 0.05, { cut: 1300, att: 0.25, rel: 0.4, send: 0.5 });
  drone(31.0, 37.6, nz('D2'), 0.06, { att: 0.15, rel: 0.4 });
  [[32.0, 'A4'], [32.5, 'D5'], [33.0, 'Fs5'], [34.0, 'E5'], [34.5, 'D5'], [35.0, 'A4'], [36.0, 'B4'], [36.5, 'A4']].forEach(([t, n], i) => pluck(t, nz(n), 0.04, (i - 3) * 0.12, 0.6, 3000, 0.4));
  // the floor screen: quieter, water-like plucks in 8ths
  pad(37.5, 40.6, ['D3', 'A3', 'Fs4'], 0.035, { cut: 900, att: 0.3, rel: 0.3, send: 0.5 });
  each(37.5, 40.5, E8, (t, k) => { if (k % 3 !== 2) pluck(t, nz(FIG[3][k % 8]) , 0.035, Math.sin(k) * 0.4, 0.45, 2400, 0.45); });
  // home: the morning pad again, now full, the bean's fifth, then the loop
  pad(40.5, 45.0, ['D3', 'A3', 'D4', 'Fs4'], 0.016, { type: 'triangle', cut: 1000, att: 0.3, rel: 0.3, send: 0.35 });
  drone(40.5, 45.0, nz('D2'), 0.015, { att: 0.3, rel: 0.3 });
  BEAN(cu.sit, 0.09, [['D4', 0], ['A4', E8], ['D5', BEAT]]);
  each(43.0, 44.6, BEAT, (t, k) => pluck(t, nz(['Fs4', 'E4', 'D4', 'A3'][k]), 0.02, 0.1, 0.6, 1800, 0.4));

  // ================= SFX =================
  to = 's';
  for (const [a, b] of [[0.4, 4.6], [41.0, 44.6]]) for (let t = a, i = 0; t < b; t += BEAT * 0.75, i++) blip(t, 2600 + (i % 3) * 420, 3300 + (i % 2) * 300, 0.05, 0.022, -0.4 + (i % 5) * 0.2);   // birds
  noiseHit(cu.pink, 0.5, 'bandpass', 700, 1.2, 0.05, -0.5, 0.2, 2400);                                    // the roller rolls across
  for (let i = 0; i < 10; i++) noiseHit(cu.walk + i * 0.25, 0.03, 'bandpass', 1800, 2, 0.02, -0.2 + i * 0.05);   // footsteps
  chime(11.5, [nz('A6'), nz('E7')], 0.012, 0.3);                                                             // glass
  for (let i = 0; i < 4; i++) noiseHit(cu.hop + i * 0.14, 0.04, 'bandpass', 1300, 2, 0.02, 0.1);              // hops on the deck
  noiseHit(cu.part, 0.9, 'bandpass', 4200, 0.8, 0.03, 0, 0.3, 1500);                                       // the strings part
  sweep(M.dark - 0.4, M.dark, 0.01, 300, 1800, 0);                                                         // into the dark
  noiseHit(cu.up, 0.5, 'lowpass', 400, 0.7, 0.05, 0, 0.2);                                                  // the lights: a thump with the stab
  for (let i = 0; i < 4; i++) blip(cu.ripple + i * BEAT, 900, 520, 0.18, 0.02, 0.2);                       // ripples
