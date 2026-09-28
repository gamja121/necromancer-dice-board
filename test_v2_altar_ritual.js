"use strict";
const fs = require("node:fs");
const path = require("node:path");
const root = __dirname;
const html = fs.readFileSync(path.join(root, "v2-map-practice.html"), "utf8");
const js = fs.readFileSync(path.join(root, "v2-altar-ritual.js"), "utf8");
const css = fs.readFileSync(path.join(root, "v2-altar-ritual.css"), "utf8");
const worker = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");
const assets = [
  "art/v2-style/map-test/events/altar-ritual-slots.jpg",
  "art/v2-style/map-test/events/altar-ritual-info.jpg"
];
for (const file of assets) {
  if (!fs.existsSync(path.join(root, file))) throw Error("Missing altar ritual asset: " + file);
  if (!worker.includes(file)) throw Error("Altar ritual asset is not cached: " + file);
}
if (!html.includes("v2-altar-ritual.css?v=1")) throw Error("Altar ritual CSS is not linked");
if (!html.includes("v2-altar-ritual.js?v=2")) throw Error("Altar ritual JS is not linked");
if (!js.includes('OWNED_ROSTER_KEY = "necromancer-map-roster-v2"')) throw Error("Ritual must use current roster storage");
if (!js.includes('document.getElementById("mapBoard")?.append(overlay)')) throw Error("Ritual overlay must mount inside mapBoard");
if (!js.includes("roster.delete(donorInstanceId)")) throw Error("Sacrifice must permanently remove donor");
if (!js.includes("target.attack") || !js.includes("ATTACK_BONUS = 1")) throw Error("Attack enhancement is missing");
if (!js.includes("target.maxHp") || !js.includes("MAX_HP_BONUS = 2")) throw Error("HP enhancement is missing");
if (!js.includes("MAX_ENHANCEMENTS = 3")) throw Error("Enhancement cap is missing");
if (!css.includes("altar-ritual-slots.jpg") || !css.includes("altar-ritual-info.jpg")) throw Error("Uploaded altar art is not wired into UI");
console.log("altar ritual checks passed");