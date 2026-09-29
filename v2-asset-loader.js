(function (root) {
  "use strict";

  const state = new Map();
  const DEFAULT_TIMEOUT = 9000;
  const DEFAULT_RETRIES = 2;

  function absoluteUrl(src) {
    return new URL(src, document.baseURI).href;
  }

  function normalize(src) {
    const url = new URL(src, document.baseURI);
    return url.origin === location.origin ? url.pathname : url.href;
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function probeImage(src, options = {}) {
    const timeout = Number(options.timeout) || DEFAULT_TIMEOUT;
    const retries = Number.isInteger(options.retries) ? options.retries : DEFAULT_RETRIES;
    const key = normalize(src);
    if (state.has(key)) return state.get(key);

    const task = (async () => {
      let lastError = null;
      for (let attempt = 0; attempt <= retries; attempt += 1) {
        const url = absoluteUrl(src);
        try {
          await new Promise((resolve, reject) => {
            const image = new Image();
            let settled = false;
            const timer = setTimeout(() => {
              if (settled) return;
              settled = true;
              reject(new Error(`asset timeout: ${src}`));
            }, timeout);

            const finish = async () => {
              if (settled) return;
              try {
                if (typeof image.decode === "function") await image.decode().catch(() => {});
              } finally {
                settled = true;
                clearTimeout(timer);
                resolve();
              }
            };

            image.decoding = "async";
            image.onload = finish;
            image.onerror = () => {
              if (settled) return;
              settled = true;
              clearTimeout(timer);
              reject(new Error(`asset load failed: ${src}`));
            };
            image.src = attempt === 0 ? url : `${url}${url.includes("?") ? "&" : "?"}retry=${attempt}`;
          });
          return { ok: true, src };
        } catch (error) {
          lastError = error;
          if (attempt < retries) await sleep(180 * (attempt + 1));
        }
      }
      return { ok: false, src, error: lastError };
    })();

    state.set(key, task);
    return task;
  }

  async function setImage(element, src, options = {}) {
    if (!element || !src) return false;
    element.classList.add("is-asset-loading");
    element.classList.remove("is-asset-failed");

    const result = await probeImage(src, options);
    if (result.ok) {
      element.src = src;
      element.classList.remove("is-asset-loading");
      return true;
    }

    const fallback = options.fallback;
    if (fallback && fallback !== src) {
      const fallbackResult = await probeImage(fallback, { retries: 1, timeout: options.timeout });
      if (fallbackResult.ok) {
        element.src = fallback;
        element.classList.remove("is-asset-loading");
        element.classList.add("is-asset-fallback");
        return true;
      }
    }

    element.removeAttribute("src");
    element.classList.remove("is-asset-loading");
    element.classList.add("is-asset-failed");
    if (options.hideOnFail !== false) element.hidden = true;
    console.warn("[V2Assets] image unavailable", src);
    return false;
  }

  async function preload(sources, options = {}) {
    const unique = [...new Set((sources || []).filter(Boolean))];
    const results = await Promise.all(unique.map((src) => probeImage(src, options)));
    return {
      ok: results.every((item) => item.ok),
      failed: results.filter((item) => !item.ok).map((item) => item.src),
      results
    };
  }

  async function bindDocumentAssets(rootNode = document) {
    const elements = [...rootNode.querySelectorAll("img[data-v2-src]")];
    const results = await Promise.all(elements.map((element) => {
      const src = element.dataset.v2Src;
      const fallback = element.dataset.v2Fallback || "";
      return setImage(element, src, { fallback, hideOnFail: element.dataset.v2HideOnFail !== "false" });
    }));
    return results.every(Boolean);
  }

  const documentReady = bindDocumentAssets();

  root.V2Assets = Object.freeze({
    probeImage,
    setImage,
    preload,
    bindDocumentAssets,
    documentReady
  });
})(globalThis);
