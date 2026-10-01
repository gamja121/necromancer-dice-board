// September combat contracts are exercised through the actual rules and controller.
require('./test_v2_rules');
require('./test_v2_rules_ui');


/* battlefield slot order regression: deck slot 1..4 must equal visible battle slot 1..4 */
{
  const fs = require("fs");
  const path = require("path");
  const css = fs.readFileSync(path.join(__dirname, "v2-auto-battle-practice.css"), "utf8");
  const assert = (condition, message) => { if (!condition) throw new Error(message); };

  assert(css.includes('.team > .unit,') && css.includes('.team > .summon-slot { grid-row: 1; }'),
    "Battlefield units must stay on one visible formation row");

  [
    ['ally', 0, 1], ['ally', 1, 2], ['ally', 2, 3], ['ally', 3, 4],
    ['enemy', 0, 2], ['enemy', 1, 3], ['enemy', 2, 4], ['enemy', 3, 5]
  ].forEach(([team, slot, column]) => {
    assert(css.includes(`.${team}-team .unit[data-slot="${slot}"] { grid-column: ${column};`),
      `${team} slot ${slot + 1} must match the deck-selection left-to-right order`);
  });
}
