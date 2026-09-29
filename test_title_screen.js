"use strict";
const fs = require("node:fs");
const assert = require("node:assert/strict");

const index = fs.readFileSync("index.html", "utf8");
const css = fs.readFileSync("launch.css", "utf8");
const js = fs.readFileSync("launch.js", "utf8");

assert(index.includes('id="titleVideo"') && index.includes("assets/title/title-loop.mp4"),
  "Title page must reserve the cinematic video asset.");
assert(index.includes('id="titleBgm"') && index.includes("assets/title/title-theme.mp3"),
  "Title page must reserve the dedicated title BGM asset.");
assert(index.includes("assets/title/title-logo.webp") &&
  index.includes("assets/title/new-game.webp") &&
  index.includes("assets/title/continue.webp") &&
  index.includes("assets/title/options.webp") &&
  index.includes("assets/title/exit.webp"),
  "Generated title/logo/menu art must be wired into the title page.");
assert(index.includes("launch.css?v=2") && index.includes("launch.js?v=2"),
  "Title page must load the refreshed launch assets.");
assert(js.includes("video.currentTime = 0") && js.includes("bgm.currentTime = 0"),
  "First unlock must restart video ambience and BGM together.");
assert(js.includes("video.muted = !soundEnabled") && js.includes("bgm.muted = !soundEnabled"),
  "Sound toggles must control both video ambience and title BGM.");
assert(js.includes("FADE_MS = 650") && js.includes("necromancer-v2-music-handoff"),
  "Starting the expedition must fade title audio and hand off to map music.");
assert(js.includes('video.addEventListener("error"') && css.includes(".title-video.is-unavailable"),
  "Missing cinematic media must fall back without breaking title UI.");
assert(css.includes("default-map.jpg") && index.includes('poster="art/v2-style/map-test/maps/default-map.jpg"'),
  "Title must keep a repository-backed fallback visual.");

console.log("PASS: title menu, generated art wiring, audio unlock, fallback and offline shell");
