// September combat contracts are exercised through the actual rules and controller.
require('./test_v2_rules');
require('./test_v2_rules_ui');


/* battlefield formation regression: fill from opponent-facing edge outward */
{
  const fs = require("fs");
  const path = require("path");
  const css = fs.readFileSync(path.join(__dirname, "v2-auto-battle-practice.css"), "utf8");
  const js = fs.readFileSync(path.join(__dirname, "v2-auto-battle-practice.js"), "utf8");
  const assert = (condition, message) => { if (!condition) throw new Error(message); };

  assert(css.includes('.team > .unit,') && css.includes('.team > .summon-slot { grid-row: 1; }'),
    "Battlefield units must stay on one visible formation row");
  assert(css.includes('.ally-team .unit[data-slot="3"] { grid-column: 4;'),
    "Ally front/near slot must be the rightmost regular ally position");
  assert(css.includes('.enemy-team .unit[data-slot="0"] { grid-column: 2;'),
    "Enemy front/near slot must be the leftmost regular enemy position");
  assert(js.includes('makeState(data, "ally", 3 - index)'),
    "Allies must fill from the right/near side outward");
  assert(js.includes('makeState(data, "enemy", index)'),
    "Enemies must fill from the left/near side outward");
  assert(js.includes('sort((a, b) => b.slot - a.slot)') &&
         js.includes('sort((a, b) => a.slot - b.slot)'),
    "Intro reveal order must follow the same mirrored fill direction");
}
