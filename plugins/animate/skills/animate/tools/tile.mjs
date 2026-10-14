// test tile: render chosen frames into a grid (the long side 480px, the frame's own shape) with the phone-UI safe zones drawn in red; print timings +
// determinism (every frame rendered twice, the second pass in reverse order; any difference is listed)
// usage: node tools/tile.mjs <piece dir> out.png f0 f1 f2 ... [--format 1:1]   (frame numbers at TIMELINE.fps)
//        (the older form PIECE=<piece dir> node tools/tile.mjs out.png f0 ... still works)
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = (() => { try { return require('playwright'); } catch { return require(path.join(execSync('npm root -g').toString().trim(), 'playwright')); } })();
const argv = process.argv.slice(2);
const fmtI = argv.indexOf('--format'), format = fmtI >= 0 ? argv.splice(fmtI, 2)[1] : null;
const isPiece = (a) => a && (a.endsWith('.html') || (fs.existsSync(a) && fs.statSync(a).isDirectory()));
const piece = isPiece(argv[0]) ? argv.shift() : process.env.PIECE;
const [out, ...fr] = argv;
if (!piece || !out || !fr.length) { console.error('usage: node tools/tile.mjs <piece dir> out.png f0 f1 ...'); process.exit(2); }
const frames = fr.map(Number);
const URL = pathToFileURL(path.resolve(piece.endsWith('.html') ? piece : path.join(piece, 'index.html'))).href + '?export=1' + (format ? `&format=${encodeURIComponent(format)}` : '');
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1920, height: 1920 } });
p.on('pageerror', (e) => console.error('PAGE ERROR:', e.message));
p.on('console', (m) => console.error('console:', m.type(), m.text()));
await p.goto(URL);
await p.waitForFunction(() => window.TIMELINE && window.renderFrame, null, { timeout: 30000 });
{ const fo = await p.evaluate(() => window.FONTS_OK); if (fo !== undefined) console.log('fonts ok:', fo); }
const res = await p.evaluate(async (frames) => {
  // each tile keeps the frame's own shape: 270x480 on 9:16, 480x270 on 16:9 (the long side 480)
  const src = document.getElementById('c'), FW = src.width, FH = src.height, s = 480 / Math.max(FW, FH), TW = Math.round(FW * s), TH = Math.round(FH * s);
  const cols = Math.min(FW > FH ? 4 : 6, frames.length), rows = Math.ceil(frames.length / cols), SF = window.TIMELINE.safe || { top: 0, bottom: 0, right: 0 };
  const g = document.createElement('canvas'); g.width = cols * TW; g.height = rows * TH; const x = g.getContext('2d');
  const ms = [], first = [];
  for (let i = 0; i < frames.length; i++) {
    const t0 = performance.now(); window.renderFrame(frames[i] / window.TIMELINE.fps); ms.push(performance.now() - t0);
    const cx = (i % cols) * TW, cy = Math.floor(i / cols) * TH;
    first.push(src.toDataURL()); x.drawImage(src, cx, cy, TW, TH);
    x.fillStyle = 'rgba(255,0,0,0.18)'; x.fillRect(cx, cy + TH - SF.bottom * s, TW, SF.bottom * s); x.fillRect(cx + TW - SF.right * s, cy, SF.right * s, TH); x.fillRect(cx, cy, TW, SF.top * s);
    x.fillStyle = '#000'; x.fillRect(cx, cy, 44, 16); x.fillStyle = '#fff'; x.font = '12px monospace'; x.fillText('f' + frames[i], cx + 3, cy + 12);
  }
  // determinism: every frame again, in reverse order (so each follows a different frame), compare pixels
  const bad = [];
  for (let i = frames.length - 1; i >= 0; i--) { window.renderFrame(frames[i] / window.TIMELINE.fps); if (src.toDataURL() !== first[i]) bad.push(frames[i]); }
  return { png: g.toDataURL('image/png').split(',')[1], ms, det: bad.length ? `false (frames ${bad.join(', ')} differ on a second render)` : true };
}, frames);
fs.writeFileSync(out, Buffer.from(res.png, 'base64'));
console.log('ms/frame', res.ms.map((v) => v.toFixed(0)).join(' '), '| deterministic:', res.det);
await b.close();
