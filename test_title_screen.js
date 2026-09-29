"use strict";
const fs = require("node:fs");
const assert = require("node:assert/strict");

const index = fs.readFileSync("index.html", "utf8");
const css = fs.readFileSync("launch.css", "utf8");
const js = fs.readFileSync("launch.js", "utf8");
const worker = fs.readFileSync("service-worker.js", "utf8");

assert(index.includes('id="titleVideo"') && index.includes("assets/title/title-loop.mp4"),
  "Title page must reserve the cinematic video asset.");
assert(index.includes('id="titleBgm"') && index.includes("assets/title/title-theme.mp3"),
  "Title page must reserve the dedicated title BGM asset.");
assert(index.includes('id="titleUnlock"') && index.includes('id="titlePlay"') && index.includes('id="titleSoundToggle"'),
  "Title interaction controls must exist.");
assert(index.includes("launch.css?v=2") && index.includes("launch.js?v=2"),
  "Title page must load the refreshed launch assets.");
assert(js.includes("video.currentTime = 0") && js.includes("bgm.currentTime = 0"),
  "First unlock must restart video ambience and BGM together.");
assert(js.includes("video.muted = !soundEnabled") && js.includes("bgm.muted = !soundEnabled"),
  "Sound toggle must control both video ambience and title BGM.");
assert(js.includes("FADE_MS = 650") && js.includes("necromancer-v2-music-handoff"),
  "Starting the expedition must fade title audio and hand off to map music.");
assert(js.includes('video.addEventListener("error"') && css.includes(".title-video.is-unavailable"),
  "Missing title media must fall back without breaking the title screen.");
assert(worker.includes("./launch.css?v=2") && worker.includes("./launch.js?v=2"),
  "Offline shell must cache the current title CSS and JS.");
assert(css.includes("default-map.jpg"),
  "Until cinematic media is present, the title must have a visible repository-backed fallback background.");

console.log("PASS: cinematic title shell, audio unlock, fallback and offline cache");
