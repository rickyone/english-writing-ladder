// 纯 Node 生成 PWA 图标（无外部依赖）：橙底 + 打开的书 + 星星
// 用法：node tools/make-icons.js
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

/* ---------- PNG 编码 ---------- */
function crc32(buf) {
  let c = ~0;
  for (const b of buf) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1));
  }
  return (~c) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}
function encodePNG(w, h, px) {
  const row = w * 4;
  const raw = Buffer.alloc((row + 1) * h);
  for (let y = 0; y < h; y++) px.copy(raw, y * (row + 1) + 1, y * row, (y + 1) * row);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ---------- 绘图原语 ---------- */
function set(px, S, x, y, c, a = 1) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || y < 0 || x >= S || y >= S || a <= 0) return;
  const i = (y * S + x) * 4;
  if (a >= 1) {
    px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2]; px[i + 3] = 255;
  } else {
    const oa = px[i + 3] / 255, na = a, noa = na + oa * (1 - na);
    px[i]     = Math.round((c[0] * na + px[i] * oa * (1 - na)) / noa);
    px[i + 1] = Math.round((c[1] * na + px[i + 1] * oa * (1 - na)) / noa);
    px[i + 2] = Math.round((c[2] * na + px[i + 2] * oa * (1 - na)) / noa);
    px[i + 3] = Math.round(noa * 255);
  }
}
function roundRect(px, S, x0, y0, x1, y1, r, colorAt) {
  for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
    for (let x = Math.floor(x0); x <= Math.ceil(x1); x++) {
      const dx = Math.max(x0 + r - x, 0, x - (x1 - r));
      const dy = Math.max(y0 + r - y, 0, y - (y1 - r));
      if (dx * dx + dy * dy <= r * r) set(px, S, x, y, colorAt(x, y));
    }
  }
}
function polygon(px, S, pts, color, alpha = 1) {
  const ys = pts.map(p => p[1]);
  const y0 = Math.max(0, Math.floor(Math.min(...ys))), y1 = Math.min(S - 1, Math.ceil(Math.max(...ys)));
  for (let y = y0; y <= y1; y++) {
    const xs = [];
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > y) !== (yj > y)) xs.push(xi + (y - yi) * (xj - xi) / (yj - yi));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2)
      for (let x = Math.ceil(xs[k]); x <= Math.floor(xs[k + 1]); x++) set(px, S, x, y, color, alpha);
  }
}
function star(px, S, cx, cy, ro, ri, color, points = 5, rot = -Math.PI / 2) {
  const pts = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 ? ri : ro, a = rot + i * Math.PI / points;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  polygon(px, S, pts, color);
}

/* ---------- 图标 ---------- */
function makeIcon(S, maskable) {
  const px = Buffer.alloc(S * S * 4);
  const bgTop = [255, 175, 105], bgBot = [255, 107, 53];
  if (maskable) {
    // maskable：整块铺满，自动裁圆时不会露白边
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const t = y / S; set(px, S, x, y, [
        Math.round(bgTop[0] + (bgBot[0] - bgTop[0]) * t),
        Math.round(bgTop[1] + (bgBot[1] - bgTop[1]) * t),
        Math.round(bgTop[2] + (bgBot[2] - bgTop[2]) * t),
      ]);
    }
  } else {
    roundRect(px, S, 0, 0, S - 1, S - 1, S * 0.22, (x, y) => {
      const t = y / S;
      return [
        Math.round(bgTop[0] + (bgBot[0] - bgTop[0]) * t),
        Math.round(bgTop[1] + (bgBot[1] - bgTop[1]) * t),
        Math.round(bgTop[2] + (bgBot[2] - bgTop[2]) * t),
      ];
    });
  }

  // 主体缩放：maskable 收进中心安全区
  const k = maskable ? 0.78 : 1;
  const P = (nx, ny) => [S * (0.5 + (nx - 0.5) * k), S * (0.5 + (ny - 0.5) * k)];
  const poly = pts => pts.map(([x, y]) => P(x, y));
  const white = [255, 255, 255], gold = [255, 209, 102], soft = [255, 236, 214];

  // 打开的书：左右两页
  polygon(px, S, poly([[0.50, 0.60], [0.17, 0.47], [0.17, 0.75], [0.50, 0.85]]), white);
  polygon(px, S, poly([[0.50, 0.60], [0.83, 0.47], [0.83, 0.75], [0.50, 0.85]]), [255, 250, 242]);
  // 书页上的"文字"线
  for (const yy of [0.60, 0.68, 0.76]) {
    const a = P(0.24, yy), b = P(0.45, yy + 0.03);
    const [ax, ay] = a, [bx, by] = b;
    const n = Math.ceil(Math.hypot(bx - ax, by - ay));
    for (let i = 0; i <= n; i++) set(px, S, ax + (bx - ax) * i / n, ay + (by - ay) * i / n, soft);
    const c = P(0.55, yy + 0.03), d = P(0.76, yy);
    for (let i = 0; i <= n; i++) set(px, S, c[0] + (d[0] - c[0]) * i / n, c[1] + (d[1] - c[1]) * i / n, soft);
  }
  // 书脊
  const [sx, sy0] = P(0.5, 0.60), [, sy1] = P(0.5, 0.85);
  for (let y = sy0; y <= sy1; y++) for (let dx = -1; dx <= 1; dx++) set(px, S, sx + dx, y, [230, 160, 110]);

  // 上方星星
  const [cx, cy] = P(0.5, 0.29);
  star(px, S, cx, cy, S * 0.135 * k, S * 0.058 * k, gold);
  // 两侧小星光
  const [x1, y1] = P(0.20, 0.26), [x2, y2] = P(0.80, 0.30);
  star(px, S, x1, y1, S * 0.035 * k, S * 0.012 * k, [255, 230, 170], 4);
  star(px, S, x2, y2, S * 0.028 * k, S * 0.010 * k, [255, 230, 170], 4);

  return encodePNG(S, S, px);
}

const out = path.join(__dirname, '..');
fs.writeFileSync(path.join(out, 'icon-192.png'), makeIcon(192, false));
fs.writeFileSync(path.join(out, 'icon-512.png'), makeIcon(512, false));
fs.writeFileSync(path.join(out, 'icon-maskable-512.png'), makeIcon(512, true));
console.log('icons written: icon-192.png, icon-512.png, icon-maskable-512.png');
