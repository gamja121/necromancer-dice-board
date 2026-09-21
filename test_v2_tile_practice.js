const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = __dirname;
const html = fs.readFileSync(path.join(root, "v2-tile-practice.html"), "utf8");
const css = fs.readFileSync(path.join(root, "v2-tile-practice.css"), "utf8");
const script = fs.readFileSync(path.join(root, "v2-tile-practice.js"), "utf8");
const worker = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");
const art = "art/v2-style/map-test/events/home-interior.jpg";
const enterArt = "art/v2-style/map-test/events/enter-parchment.png";
if (!fs.existsSync(path.join(root, art))) throw Error("Home interior image is missing");
if (!fs.existsSync(path.join(root, enterArt))) throw Error("Enter parchment cutout is missing");
if (fs.readFileSync(path.join(root, enterArt)).equals(fs.readFileSync(path.join(root, "art/v2-style/map-test/events/exit-parchment.png")))) throw Error("Enter and exit must use different parchment shapes");
for (const file of ["v2-tile-practice.html", "v2-tile-practice.css?v=1", "v2-tile-practice.js?v=1", art, enterArt]) {
  if (!worker.includes(file)) throw Error(`Tile test is not cached: ${file}`);
}
if (!html.includes('id="tileTestEnter"') || !html.includes('id="tileTestExit"') || !html.includes('id="tileTestImage"')) throw Error("Home tile controls are missing");
if (!css.includes("aspect-ratio: 1280 / 714") || !html.includes("v2-map-practice.css?v=18")) throw Error("Home scene must use the current map styling and keep its aspect ratio");

const handlers = {};
const image = { src: "art/v2-style/map-test/events/home.jpg", alt: "" };
const enter = { hidden: false, addEventListener: (name, fn) => { handlers.enter = fn; } };
const exit = { focus() { handlers.focused = true; }, addEventListener: (name, fn) => { handlers.exit = fn; } };
const navigation = [];
vm.runInNewContext(script, {
  document: { getElementById: (id) => ({ tileTestImage: image, tileTestEnter: enter, tileTestExit: exit })[id] },
  window: { location: { assign: (url) => navigation.push(url) } }
});
handlers.enter();
if (!image.src.endsWith(art) || !enter.hidden || !handlers.focused) throw Error("Enter must swap to interior, hide itself and focus exit");
handlers.exit();
if (navigation[0] !== "v2-map-practice.html") throw Error("Exit must return to the map");
console.log("PASS: separate home tile test and interior transition");
