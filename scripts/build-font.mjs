// One-time conversion: Anton TTF → Three.js typeface.json
// Run: node scripts/build-font.mjs
//
// Downloads Anton-Regular from Google Fonts' GitHub mirror, then converts it
// using opentype.js into the JSON format Three.js's FontLoader expects.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';

const TTF_URL = 'https://github.com/google/fonts/raw/main/ofl/anton/Anton-Regular.ttf';
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const TTF_PATH = path.join(ROOT, 'Anton-Regular.ttf');
const OUT_PATH = path.join(ROOT, '..', 'public', 'fonts', 'Anton.typeface.json');

async function ensureTtf() {
  if (fs.existsSync(TTF_PATH)) return;
  console.log(`Downloading Anton from ${TTF_URL}...`);
  const res = await fetch(TTF_URL);
  if (!res.ok) throw new Error(`Failed to download Anton: ${res.status} ${res.statusText}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(TTF_PATH, buf);
  console.log(`Saved ${buf.length} bytes to ${TTF_PATH}`);
}

// Split a flat command list into subpaths (each starts with 'M', possibly ends with 'Z').
function splitSubpaths(cmds) {
  const subs = [];
  let cur = null;
  for (const c of cmds) {
    if (c.type === 'M') {
      if (cur) subs.push(cur);
      cur = [c];
    } else if (cur) {
      cur.push(c);
    }
  }
  if (cur) subs.push(cur);
  return subs;
}

// Compute the signed area of a subpath using the shoelace formula.
// Bezier curves are approximated by sampling a few points — good enough for sign detection.
function signedArea(sub) {
  const pts = [];
  let lastX = 0, lastY = 0;
  for (const c of sub) {
    if (c.type === 'M' || c.type === 'L') {
      pts.push([c.x, c.y]);
      lastX = c.x; lastY = c.y;
    } else if (c.type === 'Q') {
      // Sample a couple of points along the curve
      for (let t = 0.25; t < 1; t += 0.25) {
        const u = 1 - t;
        const x = u * u * lastX + 2 * u * t * c.x1 + t * t * c.x;
        const y = u * u * lastY + 2 * u * t * c.y1 + t * t * c.y;
        pts.push([x, y]);
      }
      pts.push([c.x, c.y]);
      lastX = c.x; lastY = c.y;
    } else if (c.type === 'C') {
      for (let t = 0.25; t < 1; t += 0.25) {
        const u = 1 - t;
        const x = u*u*u*lastX + 3*u*u*t*c.x1 + 3*u*t*t*c.x2 + t*t*t*c.x;
        const y = u*u*u*lastY + 3*u*u*t*c.y1 + 3*u*t*t*c.y2 + t*t*t*c.y;
        pts.push([x, y]);
      }
      pts.push([c.x, c.y]);
      lastX = c.x; lastY = c.y;
    }
  }
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
}

// Reverse a subpath in place (so its winding flips).
// For each curve, swap endpoints and re-order control points appropriately.
function reverseSubpath(sub) {
  if (sub.length === 0) return sub;
  // Strip trailing Z (we'll re-add)
  const closed = sub[sub.length - 1].type === 'Z';
  const body = closed ? sub.slice(0, -1) : sub.slice();
  if (body.length === 0) return sub;

  // Extract sequence of "drawing" commands after the initial M.
  // body[0] is M(x0, y0). body[i] (i>0) describes how to draw FROM body[i-1].end TO body[i].end.
  const startX = body[0].x, startY = body[0].y;

  // Build a list of segments with their starting points.
  const segs = []; // each: { type, sx, sy, ex, ey, c1x?, c1y?, c2x?, c2y? }
  let prevX = startX, prevY = startY;
  for (let i = 1; i < body.length; i++) {
    const c = body[i];
    if (c.type === 'L') {
      segs.push({ type: 'L', sx: prevX, sy: prevY, ex: c.x, ey: c.y });
    } else if (c.type === 'Q') {
      segs.push({ type: 'Q', sx: prevX, sy: prevY, ex: c.x, ey: c.y, c1x: c.x1, c1y: c.y1 });
    } else if (c.type === 'C') {
      segs.push({ type: 'C', sx: prevX, sy: prevY, ex: c.x, ey: c.y, c1x: c.x1, c1y: c.y1, c2x: c.x2, c2y: c.y2 });
    } else if (c.type === 'M') {
      // mid-path M (shouldn't happen if we split properly) — bail
      return sub;
    }
    prevX = c.x; prevY = c.y;
  }

  // Reverse: walk segments backwards; each segment's old end becomes new start.
  const out = [];
  if (segs.length === 0) {
    // No segments; just M (degenerate)
    return sub;
  }
  // New initial M = last segment's end point
  out.push({ type: 'M', x: segs[segs.length - 1].ex, y: segs[segs.length - 1].ey });
  for (let i = segs.length - 1; i >= 0; i--) {
    const s = segs[i];
    if (s.type === 'L') {
      out.push({ type: 'L', x: s.sx, y: s.sy });
    } else if (s.type === 'Q') {
      // Reversed quad: same control point, endpoints swapped
      out.push({ type: 'Q', x1: s.c1x, y1: s.c1y, x: s.sx, y: s.sy });
    } else if (s.type === 'C') {
      // Reversed cubic: control points swap, endpoints swap
      out.push({ type: 'C', x1: s.c2x, y1: s.c2y, x2: s.c1x, y2: s.c1y, x: s.sx, y: s.sy });
    }
  }
  if (closed) out.push({ type: 'Z' });
  return out;
}

// Normalize winding so the largest subpath is CCW (positive area), and all other
// subpaths have opposite winding (so Three.js correctly treats them as holes).
function normalizeWinding(cmds) {
  const subs = splitSubpaths(cmds);
  if (subs.length === 0) return cmds;
  const meta = subs.map((sub) => ({ sub, area: signedArea(sub) }));
  // Largest by absolute area = the outer contour
  meta.sort((a, b) => Math.abs(b.area) - Math.abs(a.area));
  // Three.js's ShapePath.toShapes() (default mode) treats CW subpaths as solids
  // and CCW subpaths as holes. So make the outer CW (negative area) and holes
  // CCW (positive area).
  const flipped = meta.map((m, i) => {
    if (i === 0) {
      // Outer: ensure negative area (CW)
      if (m.area > 0) return { ...m, sub: reverseSubpath(m.sub), area: -m.area };
      return m;
    }
    // Holes: must have positive area (CCW)
    if (m.area < 0) return { ...m, sub: reverseSubpath(m.sub), area: -m.area };
    return m;
  });
  // Re-flatten — order doesn't matter for Three.js ShapePath, but keep outer first
  const out = [];
  for (const m of flipped) out.push(...m.sub);
  return out;
}

function pathToTypefaceCmds(cmds) {
  // Three.js typeface format (FontLoader.js parses):
  //   m X Y
  //   l X Y
  //   q X Y CX CY              ← endpoint FIRST, then control
  //   b X Y C1X C1Y C2X C2Y    ← endpoint FIRST, then controls
  //
  // We deliberately DROP `z` closures: bundled Three.js fonts (helvetiker etc.)
  // never emit them, and an explicit close causes ShapePath to add an extra
  // segment which can confuse hole detection.
  // Also drop zero-length segments that opentype sometimes emits.
  const out = [];
  let curX = 0, curY = 0;
  const eq = (a, b) => Math.abs(a - b) < 1e-3;
  for (const c of cmds) {
    if (c.type === 'M') {
      out.push('m', c.x, c.y);
      curX = c.x; curY = c.y;
    } else if (c.type === 'L') {
      if (eq(c.x, curX) && eq(c.y, curY)) continue;
      out.push('l', c.x, c.y);
      curX = c.x; curY = c.y;
    } else if (c.type === 'Q') {
      if (eq(c.x, curX) && eq(c.y, curY) && eq(c.x1, curX) && eq(c.y1, curY)) continue;
      out.push('q', c.x, c.y, c.x1, c.y1);
      curX = c.x; curY = c.y;
    } else if (c.type === 'C') {
      if (eq(c.x, curX) && eq(c.y, curY) && eq(c.x1, curX) && eq(c.y1, curY) && eq(c.x2, curX) && eq(c.y2, curY)) continue;
      out.push('b', c.x, c.y, c.x1, c.y1, c.x2, c.y2);
      curX = c.x; curY = c.y;
    }
  }
  return out.join(' ');
}

async function main() {
  await ensureTtf();
  const font = opentype.parse(fs.readFileSync(TTF_PATH).buffer);

  const head = font.tables.head;
  const post = font.tables.post;
  const result = {
    glyphs: {},
    familyName: font.names.fontFamily?.en ?? 'Anton',
    ascender: font.ascender,
    descender: font.descender,
    underlinePosition: post?.underlinePosition ?? -100,
    underlineThickness: post?.underlineThickness ?? 50,
    boundingBox: { xMin: head.xMin, xMax: head.xMax, yMin: head.yMin, yMax: head.yMax },
    resolution: font.unitsPerEm,
    original_font_information: { manufacturer_name: 'Google', font_family_name: 'Anton' },
    cssFontWeight: 'normal',
    cssFontStyle: 'normal',
  };

  let glyphCount = 0;
  const glyphs = font.glyphs.glyphs;
  for (const idx in glyphs) {
    const g = glyphs[idx];
    if (!g.unicode) continue;
    const ch = String.fromCharCode(g.unicode);
    // opentype.js's glyph.path.commands are already in font-em coordinates
    // with Y pointing UP — same as Three.js's typeface JSON expects.
    // No flip needed; flipping reverses winding and inverts the extrude faces.
    const cmds = (g.path?.commands ?? []).map((c) => {
      const f = { type: c.type };
      if ('x' in c) f.x = c.x;
      if ('y' in c) f.y = c.y;
      if ('x1' in c) f.x1 = c.x1;
      if ('y1' in c) f.y1 = c.y1;
      if ('x2' in c) f.x2 = c.x2;
      if ('y2' in c) f.y2 = c.y2;
      return f;
    });
    const normalized = normalizeWinding(cmds);
    result.glyphs[ch] = {
      ha: g.advanceWidth,
      x_min: g.xMin ?? 0,
      x_max: g.xMax ?? 0,
      o: pathToTypefaceCmds(normalized),
    };
    glyphCount++;
  }

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(result));
  console.log(`Wrote ${glyphCount} glyphs → ${OUT_PATH} (${fs.statSync(OUT_PATH).size} bytes)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
