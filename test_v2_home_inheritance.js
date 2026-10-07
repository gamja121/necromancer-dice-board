(async () => {
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
for (const file of [board, "v2-home-inheritance.css?v=9", "v2-home-inheritance.js?v=17", "v2-brand-cards.js?v=6", "art/v2-style/ui/brand-card.png?v=4"]) {
  if (!worker.includes(file)) throw Error(`Inheritance resource is not cached: ${file}`);
}
if (!html.includes('class="home-inheritance-material"') && !html.includes('home-inheritance-material"')) throw Error("Material panel is missing");
if (!html.includes('home-inheritance-result"') || !html.includes('id="homeInheritanceBrandList"') || !html.includes('<h3>낙인</h3>') || html.includes('id="homeInheritanceParts"') || !html.includes('id="homeInheritanceConfirm"') || !css.includes("legion-info-window-hd-clean.webp") || !css.includes("height: 91%") || !html.includes('v2-home-inheritance.js?v=17')) throw Error("Tall, compact brand information frame or automatic inheritance controls are missing");
if (!css.includes("home-inheritance-cards-rise") || !css.includes("home-inheritance-brand-cards") || !css.includes("is-inheritance-source")) throw Error("Owned monsters and left-pile brand fan animations must exist");
if (!source.includes('mapCardDeckButton.hidden = true') || !source.includes('diceControlOverlay.hidden = true')) throw Error("Dice-control cards must be hidden while inheritance is open");

function classList() {
  const values = new Set();
  return {
    add: (name) => values.add(name), remove: (name) => values.delete(name),
    contains: (name) => values.has(name), toggle: (name, force) => { if (force) values.add(name); else values.delete(name); return force; }
  };
}
function node() {
  return {
    children: [], classList: classList(), attributes: {}, dataset: {}, style: { setProperty() {} },
    get childElementCount() { return this.children.length; },
    append(...items) { this.children.push(...items); },
    replaceChildren(...items) { this.children = items; },
    removeAttribute(name) { delete this.attributes[name]; },
    setAttribute(name, value) { this.attributes[name] = value; },
    addEventListener(name, fn) { this[`on_${name}`] = fn; },
    querySelectorAll(selector) { return selector === "button" ? this.children : selector === "button.is-selected" ? this.children.filter((item) => item.classList.contains("is-selected")) : []; },
    focus() { this.focused = true; }
  };
}
const backdrop = node();
const overlay = Object.assign(node(), { hidden: true, offsetWidth: 100, querySelector: () => backdrop });
const cards = node();
const brandCards = node();
const closeButton = node();
const materialCard = Object.assign(node(), { hidden: true });
const materialHint = node();
const resultCard = Object.assign(node(), { hidden: true });
const resultHint = node();
const brandHint = node();
const brandList = Object.assign(node(), { hidden: true });
const confirm = Object.assign(node(), { disabled: true });
const V2Rules = require("./v2-rules.js");
const slugs = ["death-knight", "skeleton-spear", "ghoul", "ancient-treant", "goblin-rider", "minotaur", "plague-doctor", "spider-knight", "hydra", "siren"];
const saved = slugs.map((slug, index) => ({ ...V2Rules.individual(slug), instanceId: `test-owned-${index}` }));
saved.push({ ...V2Rules.individual("stone-golem"), instanceId: "test-owned-newly-acquired" });
// A second card of the donor species must survive instance-scoped consumption.
saved[9] = { ...V2Rules.individual("death-knight"), instanceId: "test-owned-9" };
saved[0].brands = [
  { type: "critical", bless: [2], curse: [6] },
  { type: "poison", bless: [3], curse: [] },
  { type: "guard", bless: [4], curse: [] }
];
saved[1].brands = [{ type: "freeze", bless: [2], curse: [6] }];
saved[2].brands = [
  { type: "critical", bless: [2], curse: [6] },
  { type: "poison", bless: [3], curse: [] },
  { type: "guard", bless: [4], curse: [] }
];
const donorBrands = JSON.stringify(V2Rules.normalizeUnitBrands(saved[0]));
const recipientBrands = JSON.stringify(V2Rules.normalizeUnitBrands(saved[1]));
let stored = JSON.stringify(saved);
let brandInventory = [{ id: "brand-card-test", brand: { type: "critical", bless: [3], curse: [] } }];
const V2BrandCards = {
  load: () => JSON.parse(JSON.stringify(brandInventory)),
  imagePath: () => "art/v2-style/ui/brand-card.png?v=4",
  label: (card) => `치명타 · 축복 ${card.brand.bless.join(", ")}${card.brand.curse.length ? ` · 저주 ${card.brand.curse.join(", ")}` : ""}`,
  remove: (id) => {
    const next = brandInventory.filter((card) => card.id !== id);
    if (next.length === brandInventory.length) return false;
    brandInventory = next;
    return true;
  }
};
let rosterEvent;
const randomValues = [.4, .2];
const globals = {
  document: {
    getElementById: (id) => ({ homeInheritanceOverlay: overlay, homeInheritanceCards: cards, homeInheritanceBrandCards: brandCards, homeInheritanceClose: closeButton,
      homeInheritanceMaterialCard: materialCard, homeInheritanceMaterialHint: materialHint,
      homeInheritanceResultCard: resultCard, homeInheritanceResultHint: resultHint,
      homeInheritanceBrandHint: brandHint, homeInheritanceBrandList: brandList,
      homeInheritanceConfirm: confirm })[id],
    createElement: () => node(), addEventListener() {}
  },
  V2DesignData: require("./v2-design-data.js"), V2Rules, V2BrandCards,
  Math: Object.assign(Object.create(Math), { random: () => randomValues.shift() ?? .1 }),
  sessionStorage: { getItem: () => stored, setItem: (_, value) => { stored = value; } },
  CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
  window: { dispatchEvent: (event) => { rosterEvent = event; } }
};
vm.runInNewContext(source, globals);
await globals.window.V2HomeInheritance.open();
if (overlay.hidden || !overlay.classList.contains("is-open") || cards.children.length !== saved.length || brandCards.children.length !== 1 || !closeButton.focused) throw Error("Opening inheritance must reveal owned monsters and fan owned brand cards from the left pile");
const donorInstanceId = cards.children[0].dataset.instanceId;
const recipientInstanceId = cards.children[1].dataset.instanceId;
if (!donorInstanceId || !recipientInstanceId || donorInstanceId === recipientInstanceId) throw Error("Inheritance cards must keep distinct instance ids");
cards.children[0].on_click();
if (materialCard.hidden || !materialCard.src.includes("death-knight") || brandList.hidden || brandList.children.length !== 3 || !brandList.children[0].children[1].textContent.includes("✦")) throw Error("Selecting material must show all three brands without scrolling or choice buttons");
cards.children[0].on_click();
if (!materialCard.hidden || cards.children[0].classList.contains("is-selected") || !confirm.disabled) throw Error("Tapping the material again must cancel it and lower the card");
cards.children[0].on_click();
cards.children[2].on_click();
if (!resultCard.hidden || !confirm.disabled || !brandHint.textContent.includes("3칸")) throw Error("A three-brand unit may be material but cannot be selected as recipient");
cards.children[1].on_click();
if (resultCard.hidden || !resultCard.src.includes("skeleton-spear") || confirm.disabled || brandList.children.length !== 4) throw Error("Second choice must show recipient and all donor brands without requiring effect selection");
cards.children[1].on_click();
if (!resultCard.hidden || !confirm.disabled || cards.children[1].classList.contains("is-selected")) throw Error("Tapping the recipient again must lower it and cancel the recipient choice");
cards.children[1].on_click();
await confirm.on_click();
const after = JSON.parse(stored);
if (after.length !== 10 || after.some((unit) => unit.instanceId === donorInstanceId) ||
    !after.some((unit) => unit.instanceId === "test-owned-9" && unit.slug === "death-knight") ||
    JSON.stringify(after.find((unit) => unit.slug === "skeleton-spear").brands) !==
      JSON.stringify([...JSON.parse(recipientBrands), V2Rules.inheritedBlessing({ ...saved[1], brands: JSON.parse(recipientBrands) }, JSON.parse(donorBrands)[1])]) ||
    cards.children.length !== 10 || !materialCard.hidden || resultCard.hidden ||
    rosterEvent?.detail.donorInstanceId !== donorInstanceId ||
    rosterEvent?.detail.recipient?.instanceId !== recipientInstanceId ||
    rosterEvent?.detail.recipient?.slug !== "skeleton-spear")
  throw Error("Inheritance must consume only the donor instance, preserve the recipient instance, and append exact brand face numbers");
globals.window.V2HomeInheritance.close();
if (!overlay.hidden || overlay.classList.contains("is-open") || !materialCard.hidden || brandList.children.length) throw Error("Closing inheritance must clear the material and hide the board");
await globals.window.V2HomeInheritance.open();
if (cards.children.length !== 10 || brandCards.children.length !== 1) throw Error("Consumed material must stay gone and stored brand cards must remain when inheritance is reopened");
brandCards.children[0].on_click();
if (materialCard.hidden || !materialCard.src.includes("brand-card.png") || !materialHint.textContent.includes("축복 3")) throw Error("Selecting a stored brand card must place the supplied card art and exact face description in the material panel");
const brandRecipientId = cards.children[0].dataset.instanceId;
const beforeBrandApply = JSON.parse(stored).find((unit) => unit.instanceId === brandRecipientId).brands.length;
cards.children[0].on_click();
if (confirm.disabled) throw Error("A selected brand card plus eligible monster must enable apply");
await confirm.on_click();
const afterBrandApply = JSON.parse(stored);
const brandRecipient = afterBrandApply.find((unit) => unit.instanceId === brandRecipientId);
if (afterBrandApply.length !== 10 || brandInventory.length !== 0 ||
    brandRecipient.brands.length !== beforeBrandApply + 1 ||
    JSON.stringify(brandRecipient.brands.at(-1)) !== JSON.stringify({ type: "critical", bless: [3], curse: [] }) ||
    rosterEvent?.detail.donorInstanceId !== null || rosterEvent?.detail.source !== "brand-card")
  throw Error("Brand card apply must preserve monster count, append the exact stored brand, consume one card, and dispatch a non-sacrifice roster update");
console.log("PASS: monster inheritance plus independent consumable brand-card application");

})().catch((error) => { console.error(error); process.exitCode = 1; });
