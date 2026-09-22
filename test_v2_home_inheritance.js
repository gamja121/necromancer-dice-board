const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = __dirname;
const html = fs.readFileSync(path.join(root, "v2-tile-practice.html"), "utf8");
const css = fs.readFileSync(path.join(root, "v2-home-inheritance.css"), "utf8");
const source = fs.readFileSync(path.join(root, "v2-home-inheritance.js"), "utf8");
const worker = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");
const board = "art/v2-style/map-test/events/inheritance-board.png";
if (!fs.existsSync(path.join(root, board))) throw Error("Two-panel inheritance image is missing");
for (const file of [board, "v2-home-inheritance.css?v=2", "v2-home-inheritance.js?v=2"]) {
  if (!worker.includes(file)) throw Error(`Inheritance resource is not cached: ${file}`);
}
if (!html.includes('class="home-inheritance-material"') && !html.includes('home-inheritance-material"')) throw Error("Material panel is missing");
if (!html.includes('home-inheritance-result"') || !html.includes('id="homeInheritanceBrandList"') || !css.includes("grid-template-columns") || !css.includes("aspect-ratio: 1") || !html.includes('v2-home-inheritance.js?v=2')) throw Error("Smaller material and result panels or square brand box are missing");
if (!css.includes("home-inheritance-cards-rise")) throw Error("Owned cards must still rise from below");

function classList() {
  const values = new Set();
  return {
    add: (name) => values.add(name), remove: (name) => values.delete(name),
    contains: (name) => values.has(name)
  };
}
function node() {
  return {
    children: [], classList: classList(), attributes: {},
    get childElementCount() { return this.children.length; },
    append(...items) { this.children.push(...items); },
    replaceChildren(...items) { this.children = items; },
    removeAttribute(name) { delete this.attributes[name]; },
    setAttribute(name, value) { this.attributes[name] = value; },
    addEventListener(name, fn) { this[`on_${name}`] = fn; },
    querySelectorAll(selector) { return selector === "button.is-selected" ? this.children.filter((item) => item.classList.contains("is-selected")) : []; },
    focus() { this.focused = true; }
  };
}
const backdrop = node();
const overlay = Object.assign(node(), { hidden: true, offsetWidth: 100, querySelector: () => backdrop });
const cards = node();
const closeButton = node();
const materialCard = Object.assign(node(), { hidden: true });
const materialHint = node();
const brandHint = node();
const brandList = Object.assign(node(), { hidden: true });
const globals = {
  document: {
    getElementById: (id) => ({ homeInheritanceOverlay: overlay, homeInheritanceCards: cards, homeInheritanceClose: closeButton,
      homeInheritanceMaterialCard: materialCard, homeInheritanceMaterialHint: materialHint,
      homeInheritanceBrandHint: brandHint, homeInheritanceBrandList: brandList })[id],
    createElement: () => node(), addEventListener() {}
  },
  V2DesignData: require("./v2-design-data.js"), V2Rules: require("./v2-rules.js"), window: {}
};
vm.runInNewContext(source, globals);
globals.window.V2HomeInheritance.open();
if (overlay.hidden || !overlay.classList.contains("is-open") || cards.children.length !== 10 || !closeButton.focused) throw Error("Opening inheritance must reveal the board and ten owned cards");
cards.children[0].on_click();
if (materialCard.hidden || !materialCard.src.includes("death-knight") || brandList.hidden || !brandList.children.length || !brandList.children[0].children[1].textContent.includes("축복")) throw Error("Selecting material must reveal that unit and its brands in the square box");
globals.window.V2HomeInheritance.close();
if (!overlay.hidden || overlay.classList.contains("is-open") || !materialCard.hidden || brandList.children.length) throw Error("Closing inheritance must clear the material and hide the board");
console.log("PASS: two-panel inheritance board and ten rising owned cards");
