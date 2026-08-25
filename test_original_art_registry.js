const assert = require("assert");
const fs = require("fs");
const path = require("path");
const unitData = require("./unit-data.js");

const root = __dirname;
const originalDir = path.join(root, "art", "v2-style", "references", "cute-grotesque-master-collection", "uploaded-originals");
const processedDir = path.join(root, "art", "v2-style", "processed", "192");
const enemyTypes = Object.keys(unitData.UNIT_TYPES).filter((type) => type !== "summoner");

assert.strictEqual(enemyTypes.length, 44, "주인공을 제외한 유닛 원화는 44종이어야 함");
assert.strictEqual(fs.readdirSync(originalDir).filter((name) => /\.(jpg|jpeg|png)$/i.test(name)).length, 44, "통합 원화 폴더는 정확히 44장이어야 함");

for (const type of enemyTypes) {
  const definition = unitData.UNIT_TYPES[type];
  const filename = path.basename(definition.image);
  const basename = filename.replace(/\.[^.]+$/, "");
  const sourcePath = path.join(root, definition.image);
  const processedPath = path.join(processedDir, `${basename}.png`);
  assert.ok(fs.existsSync(sourcePath), `${type} 원본 파일 누락: ${definition.image}`);
  assert.ok(fs.existsSync(processedPath), `${type} 전투 PNG 누락: ${basename}.png`);
  const png = fs.readFileSync(processedPath);
  assert.strictEqual(png.readUInt32BE(16), 192, `${basename}.png 너비는 192여야 함`);
  assert.strictEqual(png.readUInt32BE(20), 192, `${basename}.png 높이는 192여야 함`);
  assert.strictEqual(png[25], 6, `${basename}.png는 알파 채널 RGBA 형식이어야 함`);
}

assert.strictEqual(unitData.UNIT_TYPES.worm.label, "역병 벌레");
assert.strictEqual(unitData.UNIT_TYPES.seaWolf.label, "바다 늑대");
assert.strictEqual(unitData.UNIT_TYPES.icePrincess.label, "얼음 공주");
assert.strictEqual(unitData.UNIT_TYPES.siren.label, "세이렌");
unitData.validateUnitRegistry();

console.log("SUCCESS: 주인공 별도 + 44종 원화/전투 PNG/신규 유닛 레지스트리 검증 완료.");
