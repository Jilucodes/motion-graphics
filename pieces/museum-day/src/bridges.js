// =====================================================================
//  ERAS, BRIDGES — a day at the museum (read by kit/morph.js). Colours are printed colours of plate tones.
// =====================================================================
const hexOf = (t) => rgbHex(inkRGB(t));
const ERA_BG = [
  hexOf({ teal: 0.45, pink: 0.1, yellow: 0.1 }), hexOf({ teal: 0.8, pink: 0.15 }), hexOf({ pink: 0.45, yellow: 0.55, teal: 0.2 }),
  hexOf({ pink: 0.5, yellow: 0.7, teal: 0.45 }), hexOf({ pink: 0.8, yellow: 0.75, teal: 0.15 }), hexOf({ teal: 0.85, pink: 0.6, yellow: 0.3 }),
  hexOf({ teal: 0.75, pink: 0.6, yellow: 0.6 }), hexOf({ pink: 0.35, yellow: 0.6, teal: 0.25 }), hexOf({ teal: 0.6, pink: 0.05 }),
  hexOf({ teal: 0.45, pink: 0.15, yellow: 0.35 }),
];
const HR = (r) => r / 0.6;   // SP radius for a printed bean of radius r (STYLE.heroPts prints r * 0.6)
const ringPath = (x, y, r) => ellipsePts(x, y, r, r * 0.6, 0, 64);
const BRIDGES = [
  { tc: M.court,   // the bean on the hill -> the bean in Ocean Court
    A: () => SP(PARK_BEAN[0], PARK_BEAN[1], HR(92), 0), B: () => SP(...courtBean(), HR(88), 0) },
  { tc: M.ship,    // the tall window -> the gilt frame of the battle painting
    A: () => ({ P: resample(COURT_WIN, true, 20), c: hexOf({ teal: 0.7, pink: 0.2 }) }),
    B: () => ({ P: resample(SHIP_FRAME, true, 20), c: hexOf({ yellow: 0.8, pink: 0.35, teal: 0.2 }) }) },
  { tc: M.deck,    // the whole hull -> the same ship's deck, close
    A: () => ({ P: SHIP_HULL(), c: hexOf({ yellow: 0.7, pink: 0.4, teal: 0.15 }) }),
    B: () => ({ P: ellipsePts(...S(600, 880), 520 * KP, 190 * KP, 0.75, 96), c: hexOf({ pink: 0.5, yellow: 0.7, teal: 0.4 }) }) },
  { tc: M.wall,    // a hatch grating -> the flintlock's card
    A: () => ({ P: DECK_GRATE(), c: hexOf({ pink: 0.5, yellow: 0.7, teal: 0.45 }) }),
    B: () => ({ P: PISTOL_CARD(), c: hexOf({ teal: 0.06, pink: 0.04, yellow: 0.06 }) }) },
  { tc: M.strings, // the flintlock's card -> the gilt painting behind the strings
    A: () => ({ P: PISTOL_CARD(), c: hexOf({ teal: 0.06, pink: 0.04, yellow: 0.06 }) }),
    B: () => ({ P: resample(STR_PAINT, true, 20), c: hexOf({ yellow: 0.8, pink: 0.4, teal: 0.2 }) }) },
  { tc: M.dark, d: 0.4,   // the bean through the strings -> the bean before the dark cabinet
    A: () => SP(strBean()[0], strBean()[1], HR(88 / strBean()[2]), 0), B: () => SP(...pinW(6, 960, 880).slice(0, 2), HR(80 / pinW(6, 960, 880)[2]), 0) },
  { tc: M.tapa,    // a copper triangle -> a tapa triangle
    A: () => ({ P: resample(CAB_TRI, true, 20), c: hexOf({ pink: 0.55, yellow: 0.85, teal: 0.15 }) }),
    B: () => ({ P: resample(TAPA_TRI, true, 20), c: hexOf({ teal: 0.7, pink: 0.6, yellow: 0.6 }) }) },
  { tc: M.floor,   // the fabric flower -> a ripple ring on the floor screen
    A: () => ({ P: TAPA_FLOWER(), c: hexOf({ teal: 0.85, pink: 0.25, yellow: 0.35 }) }),
    B: () => ({ P: ringPath(floorBean()[0], floorBean()[1] + 110, 200), c: hexOf({ teal: 0.6, pink: 0.05 }) }) },
  { tc: M.home,    // a ripple ring -> the bean, home on the hill
    A: () => ({ P: ringPath(floorBean()[0], floorBean()[1] + 110, 200), c: hexOf({ teal: 0.6, pink: 0.05 }) }),
    B: () => SP(PARK_BEAN[0], PARK_BEAN[1], HR(92), 0) },
];
