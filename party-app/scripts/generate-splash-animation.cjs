const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const assets = [];
const layers = [];

for (let index = 0; index < 4; index += 1) {
  const file = path.join(root, "assets", "images", `gather_frame_${index + 1}.png`);
  const image = fs.readFileSync(file);
  const width = image.readUInt32BE(16);
  const height = image.readUInt32BE(20);
  const id = `frame_${index + 1}`;
  const scale = 720 / width * 100;
  const start = index * 18;
  const opacity = [];
  if (index === 0) {
    opacity.push({ t: 0, s: [100], h: 1 });
  } else {
    opacity.push(
      { t: 0, s: [0], h: 1 },
      { t: start, s: [0], e: [100], i: { x: [0.42], y: [1] }, o: { x: [0.58], y: [0] } },
      { t: start + 6, s: [100], h: 1 },
    );
  }
  if (index < 3) {
    opacity.push(
      { t: start + 18, s: [100], e: [0], i: { x: [0.42], y: [1] }, o: { x: [0.58], y: [0] } },
      { t: start + 24, s: [0] },
    );
  }
  assets.push({ id, w: width, h: height, u: "", p: `data:image/png;base64,${image.toString("base64")}`, e: 1 });
  layers.unshift({
    ddd: 0, ind: index + 1, ty: 2, nm: id, refId: id,
    ks: {
      o: { a: 1, k: opacity },
      r: { a: 0, k: 0 },
      p: { a: 0, k: [360, 435, 0] },
      a: { a: 0, k: [width / 2, height / 2, 0] },
      s: { a: 0, k: [scale, scale, 100] },
    },
    ao: 0, ip: 0, op: 84, st: 0, bm: 0,
  });
}

const animation = { v: "5.7.4", fr: 30, ip: 0, op: 84, w: 720, h: 870, nm: "Gather splash", ddd: 0, assets, layers };
fs.writeFileSync(path.join(root, "assets", "gather-splash.json"), JSON.stringify(animation));
