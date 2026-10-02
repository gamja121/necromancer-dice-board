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
  assert(css.includes('.ally-team .unit[data-slot="0"] { grid-column: 4;') &&
         css.includes('.ally-team .unit[data-slot="3"] { grid-column: 1;'),
    "Ally battlefield visual order must match the deck-selection screen order");
  assert(css.includes('.enemy-team .unit[data-slot="3"] { grid-column: 5;'),
    "Enemy first occupied slot must be the far/right edge position");
  assert(js.includes('makeState(data, "ally", 3 - index)'),
    "Allies must fill from the right/near side outward");
  assert(js.includes('makeState(data, "enemy", 3 - index)'),
    "Enemies must fill from the far/right edge inward");
  assert(js.includes('const allies = units.filter(unitState => unitState.team === "ally").sort((a, b) => b.slot - a.slot);'),
    "Ally intro must reveal from the right/near side outward");
  assert(js.includes('element.className = unitState.team === "ally" ? "unit is-pending" : "unit";'),
    "Enemies must already be visible before the ally summon intro");
}
