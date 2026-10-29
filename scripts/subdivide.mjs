// GLB -> GLB: har bir uchburchakni 4 taga bo'lib (levels marta), yangi nuqtalarni
// Phong tessellation bilan egri sirtga suradi. Natija: kontur yumaloq, burchaklar yo'q.
// Skin (JOINTS/WEIGHTS), UV va morph target'lar ham bo'linadi, shuning uchun animatsiya ishlaydi.
// Oxirida silliq normallar (qirra burchagi bilan) qayta hisoblanadi.
//
//   node subdivide.mjs in.glb out.glb [levels=2] [creaseDeg=50]
import fs from 'node:fs';

const [input, output, levelsArg = '2', creaseArg = '50'] = process.argv.slice(2);
const LEVELS = +levelsArg;
const COS_CREASE = Math.cos((+creaseArg * Math.PI) / 180);
const ALPHA = 0.75; // Phong tessellation kuchi

// ---------- GLB o'qish ----------
const glb = fs.readFileSync(input);
let off = 12, json, bin;
while (off < glb.length) {
  const len = glb.readUInt32LE(off), type = glb.readUInt32LE(off + 4);
  const data = glb.subarray(off + 8, off + 8 + len);
  if (type === 0x4e4f534a) json = JSON.parse(data.toString('utf8'));
  else if (type === 0x004e4942) bin = Buffer.from(data);
  off += 8 + len;
}
const dv = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
const NC = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
const CS = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 };
const MAXN = { 5120: 127, 5121: 255, 5122: 32767, 5123: 65535 };
const getters = {
  5120: (o) => dv.getInt8(o), 5121: (o) => dv.getUint8(o), 5122: (o) => dv.getInt16(o, true),
  5123: (o) => dv.getUint16(o, true), 5125: (o) => dv.getUint32(o, true), 5126: (o) => dv.getFloat32(o, true),
};

function read(i) {
  const a = json.accessors[i];
  if (a.sparse) throw new Error('sparse accessor qo\'llanmaydi');
  const n = NC[a.type], size = CS[a.componentType];
  const out = new Float64Array(a.count * n);
  const bv = json.bufferViews[a.bufferView];
  const stride = bv.byteStride || n * size;
  const base = (bv.byteOffset || 0) + (a.byteOffset || 0);
  const get = getters[a.componentType];
  for (let v = 0; v < a.count; v++)
    for (let k = 0; k < n; k++) {
      let x = get(base + v * stride + k * size);
      if (a.normalized) x = Math.max(x / MAXN[a.componentType], -1);
      out[v * n + k] = x;
    }
  return { data: out, n };
}

// ---------- yangi ma'lumotni buferga yozish ----------
const chunks = [];
let binLen = bin.length;
function write(data, n, type, componentType, target, minmax = false) {
  const Arr = { 5126: Float32Array, 5123: Uint16Array, 5125: Uint32Array }[componentType];
  const arr = Arr.from(data);
  let bytes = Buffer.from(arr.buffer);
  const pad = (4 - (bytes.length % 4)) % 4;
  if (pad) bytes = Buffer.concat([bytes, Buffer.alloc(pad)]);
  json.bufferViews.push({ buffer: 0, byteOffset: binLen, byteLength: arr.byteLength, ...(target ? { target } : {}) });
  chunks.push(bytes);
  binLen += bytes.length;
  const acc = { bufferView: json.bufferViews.length - 1, componentType, count: arr.length / n, type };
  if (minmax) {
    acc.min = Array(n).fill(Infinity);
    acc.max = Array(n).fill(-Infinity);
    for (let i = 0; i < arr.length; i++) {
      acc.min[i % n] = Math.min(acc.min[i % n], arr[i]);
      acc.max[i % n] = Math.max(acc.max[i % n], arr[i]);
    }
  }
  json.accessors.push(acc);
  return json.accessors.length - 1;
}

// ---------- geometriya yordamchilari ----------
const posKey = (P, v) => `${Math.round(P[v * 3] * 1e5)},${Math.round(P[v * 3 + 1] * 1e5)},${Math.round(P[v * 3 + 2] * 1e5)}`;
const norm = (x, y, z) => { const l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; };

function faceNormals(P, idx) {
  const F = new Float64Array(idx.length);
  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
    const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2];
    const vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
    F[t] = uy * vz - uz * vy; F[t + 1] = uz * vx - ux * vz; F[t + 2] = ux * vy - uy * vx;
  }
  return F;
}

// creaseCos = -2 bo'lsa: to'liq silliq (geometriya uchun); aks holda qirralar saqlanadi (yorug'lik uchun)
function vertexNormals(P, idx, creaseCos) {
  const F = faceNormals(P, idx);
  const groups = new Map();
  for (let t = 0; t < idx.length; t++) {
    const k = posKey(P, idx[t]);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(t - (t % 3));
  }
  const N = new Float64Array(P.length);
  const done = new Uint8Array(P.length / 3);
  for (let t = 0; t < idx.length; t++) {
    const v = idx[t];
    if (done[v] && creaseCos < -1) continue;
    const own = t - (t % 3);
    const ou = norm(F[own], F[own + 1], F[own + 2]);
    let sx = 0, sy = 0, sz = 0;
    for (const f of new Set(groups.get(posKey(P, v)))) {
      const fu = norm(F[f], F[f + 1], F[f + 2]);
      if (fu[0] * ou[0] + fu[1] * ou[1] + fu[2] * ou[2] < creaseCos) continue;
      sx += F[f]; sy += F[f + 1]; sz += F[f + 2];
    }
    // Indekslangan uch bir nechta uchburchakka tegishli: yig'indini qo'shib boramiz
    const n = norm(sx, sy, sz);
    N[v * 3] += n[0]; N[v * 3 + 1] += n[1]; N[v * 3 + 2] += n[2];
    done[v] = 1;
  }
  for (let v = 0; v < P.length / 3; v++) N.set(norm(N[v * 3], N[v * 3 + 1], N[v * 3 + 2]), v * 3);
  return N;
}

// Ikki uchning skin ta'sirini birlashtirish: eng kuchli 4 tasi qoladi
function mergeSkin(J, W, a, b, out, o) {
  const m = new Map();
  for (const [v, s] of [[a, 0.5], [b, 0.5]])
    for (let k = 0; k < 4; k++) {
      const w = W[v * 4 + k] * s;
      if (w > 0) m.set(J[v * 4 + k], (m.get(J[v * 4 + k]) || 0) + w);
    }
  const top = [...m].sort((x, y) => y[1] - x[1]).slice(0, 4);
  const sum = top.reduce((s, x) => s + x[1], 0) || 1;
  for (let k = 0; k < 4; k++) {
    out.J[o * 4 + k] = top[k] ? top[k][0] : 0;
    out.W[o * 4 + k] = top[k] ? top[k][1] / sum : 0;
  }
}

function subdivideOnce(prim) {
  const { attrs, targets } = prim;
  let { idx } = prim;
  const P = attrs.POSITION.data;
  const G = vertexNormals(P, idx, -2); // geometriya normali: choklarda ham bir xil -> yoriq bo'lmaydi
  const count = P.length / 3;
  const edgeMap = new Map();
  const newVerts = []; // [a, b]
  const mid = (a, b) => {
    const k = a < b ? `${a}_${b}` : `${b}_${a}`;
    if (!edgeMap.has(k)) { edgeMap.set(k, count + newVerts.length); newVerts.push([a, b]); }
    return edgeMap.get(k);
  };
  const out = [];
  for (let t = 0; t < idx.length; t += 3) {
    const [a, b, c] = [idx[t], idx[t + 1], idx[t + 2]];
    const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a);
    out.push(a, ab, ca, ab, b, bc, ca, bc, c, ab, bc, ca);
  }
  const total = count + newVerts.length;
  const grow = (arr, n) => { const g = new Float64Array(total * n); g.set(arr); return g; };

  const next = {};
  for (const [name, { data, n }] of Object.entries(attrs)) next[name] = { data: grow(data, n), n };
  const tnext = targets.map((t) => Object.fromEntries(Object.entries(t).map(([k, { data, n }]) => [k, { data: grow(data, n), n }])));

  newVerts.forEach(([a, b], i) => {
    const v = count + i;
    for (const [name, { data, n }] of Object.entries(next)) {
      if (name === 'JOINTS_0' || name === 'WEIGHTS_0') continue;
      for (let k = 0; k < n; k++) data[v * n + k] = (data[a * n + k] + data[b * n + k]) / 2;
    }
    // Phong tessellation: o'rtadagi nuqtani ikki uchning urinma tekisliklariga proyeksiyalab, egamiz
    const p = [0, 1, 2].map((k) => (P[a * 3 + k] + P[b * 3 + k]) / 2);
    const proj = (u) => {
      const d = (p[0] - P[u * 3]) * G[u * 3] + (p[1] - P[u * 3 + 1]) * G[u * 3 + 1] + (p[2] - P[u * 3 + 2]) * G[u * 3 + 2];
      return [0, 1, 2].map((k) => p[k] - d * G[u * 3 + k]);
    };
    const qa = proj(a), qb = proj(b);
    for (let k = 0; k < 3; k++) next.POSITION.data[v * 3 + k] = (1 - ALPHA) * p[k] + (ALPHA * (qa[k] + qb[k])) / 2;
    if (next.JOINTS_0) mergeSkin(attrs.JOINTS_0.data, attrs.WEIGHTS_0.data, a, b, { J: next.JOINTS_0.data, W: next.WEIGHTS_0.data }, v);
    for (const t of tnext)
      for (const { data, n } of Object.values(t))
        for (let k = 0; k < n; k++) data[v * n + k] = (data[a * n + k] + data[b * n + k]) / 2;
  });
  return { attrs: next, targets: tnext, idx: Uint32Array.from(out) };
}

// ---------- asosiy ----------
let before = 0, after = 0;
for (const mesh of json.meshes) {
  for (const p of mesh.primitives) {
    if ((p.mode ?? 4) !== 4) continue;
    const attrs = {};
    for (const [name, i] of Object.entries(p.attributes)) if (name !== 'TANGENT') attrs[name] = read(i);
    const count = attrs.POSITION.data.length / 3;
    const idx = p.indices != null ? Uint32Array.from(read(p.indices).data) : Uint32Array.from({ length: count }, (_, i) => i);
    const targets = (p.targets ?? []).map((t) => Object.fromEntries(Object.entries(t).filter(([k]) => k !== 'TANGENT').map(([k, i]) => [k, read(i)])));
    before += idx.length / 3;
    let prim = { attrs, targets, idx };
    for (let l = 0; l < LEVELS; l++) prim = subdivideOnce(prim);
    prim.attrs.NORMAL = { data: vertexNormals(prim.attrs.POSITION.data, prim.idx, COS_CREASE), n: 3 };
    after += prim.idx.length / 3;

    const T = { 1: 'SCALAR', 2: 'VEC2', 3: 'VEC3', 4: 'VEC4' };
    p.attributes = {};
    for (const [name, { data, n }] of Object.entries(prim.attrs)) {
      const ct = name.startsWith('JOINTS') ? 5123 : 5126;
      p.attributes[name] = write(data, n, T[n], ct, 34962, name === 'POSITION');
    }
    if (p.targets) p.targets = prim.targets.map((t) => Object.fromEntries(Object.entries(t).map(([k, { data, n }]) => [k, write(data, n, T[n], 5126, 34962, k === 'POSITION')])));
    p.indices = write(prim.idx, 1, 'SCALAR', 5125, 34963);
  }
}

// ---------- GLB yozish ----------
const allBin = Buffer.concat([bin, Buffer.alloc((4 - (bin.length % 4)) % 4), ...chunks]);
// bin padding'dan keyin offsetlar to'g'ri bo'lishi uchun: dastlabki bin uzunligi 4 ga karrali bo'lishi kerak
if (bin.length % 4) throw new Error('kirish BIN chunk 4 ga karrali emas');
json.buffers = [{ byteLength: allBin.length }];
let jsonBuf = Buffer.from(JSON.stringify(json));
jsonBuf = Buffer.concat([jsonBuf, Buffer.alloc((4 - (jsonBuf.length % 4)) % 4, 0x20)]);
const header = Buffer.alloc(12);
header.writeUInt32LE(0x46546c67, 0);
header.writeUInt32LE(2, 4);
header.writeUInt32LE(12 + 8 + jsonBuf.length + 8 + allBin.length, 8);
const ch = (len, type) => { const b = Buffer.alloc(8); b.writeUInt32LE(len, 0); b.writeUInt32LE(type, 4); return b; };
fs.writeFileSync(output, Buffer.concat([header, ch(jsonBuf.length, 0x4e4f534a), jsonBuf, ch(allBin.length, 0x004e4942), allBin]));
console.log(`triangles: ${before} -> ${after}`);
