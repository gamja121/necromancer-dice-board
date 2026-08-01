const MapGenerator = require('./map-generator.js');
const EventData = require('./event-data.js');

console.log("=== Testing MapGenerator ===");
for (let stage = 0; stage < 3; stage++) {
  const map = MapGenerator.generateStageMap(stage, 12345 + stage * 100);
  console.log(`Stage ${stage + 1} generated: ${map.nodes.length} total nodes.`);
  
  // Verify start and boss nodes
  console.log(`  Start node IDs: ${map.startNodeIds.join(', ')}`);
  console.log(`  Boss node ID: ${map.bossNodeId}`);
  
  // Create quick node lookup
  const nodeMap = new Map();
  map.nodes.forEach(n => nodeMap.set(n.id, n));
  
  // Verify connectivity: can we reach boss from start?
  let reachable = new Set(map.startNodeIds);
  let currentLayer = new Set(map.startNodeIds);
  
  while (currentLayer.size > 0) {
    const nextLayer = new Set();
    currentLayer.forEach(id => {
      const node = nodeMap.get(id);
      const targets = (node && node.next) ? node.next : ((node && node.children) ? node.children : []);
      targets.forEach(childId => {
        nextLayer.add(childId);
        reachable.add(childId);
      });
    });
    currentLayer = nextLayer;
  }
  
  const bossReachable = reachable.has(map.bossNodeId);
  console.log(`  Boss node reachable? ${bossReachable ? "YES ✅" : "NO ❌"}`);
  if (!bossReachable) {
    throw new Error(`Stage ${stage + 1} boss node is unreachable!`);
  }
}

console.log("\n=== Testing Event Data & Engine ===");
console.log(`Total events defined: ${EventData.EVENTS.length}`);
EventData.EVENTS.forEach((evt, idx) => {
  console.log(`  Event ${idx + 1}: [${evt.id}] ${evt.title} (Stages: ${evt.stages.join(',')}, Choices: ${evt.choices.length})`);
});

const sampleEvent = EventData.getRandomEvent(0);
console.log(`\nSample Stage 1 Event picked: ${sampleEvent.title} (${sampleEvent.id})`);

console.log("\nALL MAP & EVENT TESTS PASSED PERFECTLY! 🎉");
