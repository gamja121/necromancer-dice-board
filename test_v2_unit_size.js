const assert = require('assert');
const { RATIOS, layout } = require('./v2-unit-size');
assert.equal(Object.keys(RATIOS).length, 19);
assert.equal(RATIOS['bone-golem'], 1.5);
assert.equal(RATIOS.hydra, 2);
assert.equal(RATIOS['goblin-rider'], 1);
assert.equal(RATIOS['abyss-claw-hunter'], 1);
assert.equal(RATIOS['corpse-slime'], 1);
assert.equal(RATIOS['guardian-seed'], .5);
const m = { width: 320, height: 270, top: 40, bottom: 249 };
for (const ratio of Object.values(RATIOS)) {
  const result = layout(m, 320, 540, ratio);
  assert.equal(result.scale, ratio);
  assert.equal(result.foot, 385);
  const mobile = layout(m, 160, 270, ratio);
  assert.equal(mobile.scale, ratio);
  assert.equal(mobile.foot, 192.5);
}
console.log('Unit size ratios and responsive foot anchors passed');
