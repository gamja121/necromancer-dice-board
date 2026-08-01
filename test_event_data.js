/**
 * test_event_data.js
 * event-data.js 모듈 동작 및 데이터 무결성 검증
 */

const { EVENTS, getEventsForStage, getRandomEvent } = require('./event-data.js');

console.log("=== [START] event-data.js Verification Test ===");

console.log(`Total Events: ${EVENTS.length}`);
if (EVENTS.length < 12) {
  console.error(`ERROR: Event count ${EVENTS.length} is less than required 12`);
  process.exit(1);
}

// Stage 1, 2, 3 pool test
for (let s = 1; s <= 3; s++) {
  const pool = getEventsForStage(s - 1);
  console.log(`Stage ${s} pool size: ${pool.length}`);
  if (pool.length === 0) {
    console.error(`ERROR: Stage ${s} pool is empty`);
    process.exit(1);
  }
}

// Verify schema for each event
EVENTS.forEach((evt, idx) => {
  if (!evt.id || !evt.title || !Array.isArray(evt.paragraphs) || !Array.isArray(evt.choices) || evt.choices.length === 0) {
    console.error(`ERROR: Event index ${idx} has missing required fields`, evt);
    process.exit(1);
  }
  evt.choices.forEach(c => {
    if (!c.id || !c.label || !c.resultText || !c.effect) {
      console.error(`ERROR: Choice in event ${evt.id} has invalid format`, c);
      process.exit(1);
    }
  });
});

console.log("SUCCESS: event-data.js passed all verification checks!");
process.exit(0);
