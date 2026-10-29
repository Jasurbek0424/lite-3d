// GLB -> bitta faylli .gltf (bufer data: URI sifatida ichida)
import fs from 'node:fs';

const [input, output] = process.argv.slice(2);
const buf = fs.readFileSync(input);
if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error('GLB emas');
let off = 12;
let json = null;
let bin = null;
while (off < buf.length) {
  const len = buf.readUInt32LE(off);
  const type = buf.readUInt32LE(off + 4);
  const data = buf.subarray(off + 8, off + 8 + len);
  if (type === 0x4e4f534a) json = JSON.parse(data.toString('utf8'));
  else if (type === 0x004e4942) bin = data;
  off += 8 + len;
}
if (!json) throw new Error('JSON chunk yo\'q');
if (bin) json.buffers[0].uri = 'data:application/octet-stream;base64,' + bin.toString('base64');
fs.writeFileSync(output, JSON.stringify(json));
console.log('animations:', (json.animations ?? []).map((a) => a.name).join(', '), '| bytes:', fs.statSync(output).size);
