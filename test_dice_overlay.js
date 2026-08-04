/**
 * test_dice_overlay.js
 * Unit test for DiceOverlay module
 */

const DiceOverlay = require('./dice-overlay.js');

async function runTest() {
  console.log('=== [START] DiceOverlay Unit Test ===');

  const res = await DiceOverlay.requestRoll({
    context: '전투 운명 판정',
    faceValues: [1, 2, 3, 4, 5, 6],
    resultIndex: 5,
    resultValue: 6,
    tapToRoll: false,
    battleToken: 'bt-1234',
    mapToken: 'mt-5678'
  });

  console.log('Roll Result:', res);

  if (res.resultIndex !== 5 || res.resultValue !== 6) {
    throw new Error('Invalid roll result returned!');
  }
  if (res.battleToken !== 'bt-1234' || res.mapToken !== 'mt-5678') {
    throw new Error('Battle or Map Token mismatch!');
  }

  const corrected = await DiceOverlay.requestRoll({
    context: 'attack die synchronization',
    faceValues: [0, 0, 1, 1, 2, 3],
    resultIndex: 0,
    resultValue: 3,
    tapToRoll: false,
    autoRoll: true
  });
  if (corrected.resultIndex !== 5 || corrected.resultValue !== 3) {
    throw new Error('Visible landed face was not corrected to the actual result!');
  }

  console.log('=== [SUCCESS] DiceOverlay Unit Test Passed! ===');
}

runTest().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
