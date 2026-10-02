"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

(async () => {
  const handlers = {}, entries = new Map();
  let offline = false, requests = 0;
  const key = request => typeof request === "string" ? new URL(request, "https://game.test/").href : request.url;
  const cache = {
    async put(request, response) { entries.set(key(request), response.clone()); }
  };
  const context = vm.createContext({
    URL, Request, Response, console,
    self: { location: new URL("https://game.test/service-worker.js"),
      addEventListener(type, handler) { handlers[type] = handler; } },
    caches: {
      async open() { return cache; },
      async match(request) { return entries.get(key(request))?.clone(); }
    },
    async fetch(request) {
      requests++;
      if (offline) throw new Error("offline");
      return new Response("network:" + key(request));
    }
  });
  vm.runInContext(fs.readFileSync("service-worker.js", "utf8"), context);
  function dispatch(url, destination = "", method = "GET") {
    let response;
    handlers.fetch({ request: { url: new URL(url, "https://game.test/").href, destination, method },
      respondWith(promise) { response = promise; } });
    return response;
  }
  for (const destination of ["image", "audio", "video", "font"]) {
    offline = false;
    const url = "/on-demand-" + destination;
    const original = await (await dispatch(url + "?v=1", destination)).text();
    assert(entries.has("https://game.test" + url), "Media cache strips query versions");
    offline = true;
    assert.equal(await (await dispatch(url + "?v=2", destination)).text(), original,
      "Previously used media remains available offline");
  }
  offline = false;
  const script = await (await dispatch("/app.js?v=2")).text();
  offline = true;
  assert.equal(await (await dispatch("/app.js?v=2")).text(), script);
  await assert.rejects(dispatch("/app.js?v=3"), /offline/, "Different JS versions must not silently alias");
  await assert.rejects(dispatch("/never-used.png", "image"), /offline/);
  const before = requests;
  assert.equal(dispatch("https://outside.test/asset.png", "image"), undefined);
  assert.equal(dispatch("/write", "", "POST"), undefined);
  assert.equal(requests, before, "External and mutating requests are not intercepted");
  console.log("PASS: actual service-worker fetch handler, on-demand media and versioned script offline cache");
})().catch(error => { console.error(error); process.exitCode = 1; });
