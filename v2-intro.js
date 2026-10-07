(() => {
  "use strict";
  const scene = document.getElementById("introScene");
  const advance = document.getElementById("introAdvance");
  const impactStage = document.getElementById("impactStage");
  const dialogueStage = document.getElementById("dialogueStage");
  const name = document.getElementById("dialogueName");
  const text = document.getElementById("dialogueText");
  const portraits = [...document.querySelectorAll(".portrait")];
  const heroImg = document.querySelector(".portrait-left img");
  const commanderImg = document.querySelector(".portrait-right img");
  const frameImg = document.querySelector(".dialogue-frame");

  const heroChunks = [
    { path: "assets/intro-data/hero/part-000.txt", mode: "plain" },
    { path: "assets/intro-data/hero/part-001.txt", mode: "plain" },
    { path: "assets/intro-data/hero/part-002.txt", mode: "plain" }
  ];
  const commanderChunks = [
    ...Array.from({ length: 8 }, (_, i) => ({ path: `assets/intro-data/commander/part-${String(i).padStart(3, "0")}.txt`, mode: "plain" })),
    { path: "assets/intro-data/commander/part-008.rev.txt", mode: "reverse" },
    { path: "assets/intro-data/commander/part-009.rev.txt", mode: "reverse" },
    { path: "assets/intro-data/commander/part-010.rev.txt", mode: "reverse" },
    { path: "assets/intro-data/commander/part-011.rev.txt", mode: "reverse" },
    { path: "assets/intro-data/commander/part-012.b64txt.txt", mode: "base64-text" },
    { path: "assets/intro-data/commander/part-013.rev.txt", mode: "reverse" },
    { path: "assets/intro-data/commander/part-014.rev.txt", mode: "reverse" }
  ];

  async function loadChunkImage(img, chunks, fallback, readyValue) {
    if (!img) return;
    try {
      const parts = await Promise.all(chunks.map(async ({ path, mode }) => {
        const response = await fetch(path, { cache: "force-cache" });
        if (!response.ok) throw new Error(`Intro asset chunk failed: ${path}`);
        let chunk = (await response.text()).trim();
        if (mode === "reverse") chunk = [...chunk].reverse().join("");
        if (mode === "base64-text") chunk = atob(chunk.replace(/\s+/g, ""));
        return chunk;
      }));
      img.src = `data:image/webp;base64,${parts.join("")}`;
      await img.decode();
      img.dataset.assetReady = readyValue;
    } catch (error) {
      console.error(error);
      if (fallback) img.src = fallback;
      img.dataset.assetReady = "fallback";
    }
  }

  async function loadDialogueFrame(img) {
    if (!img) return;
    try {
      img.src = "art/v2-style/ui/intro-dialogue-box-clean.svg?v=1";
      if (!img.complete || !img.naturalWidth) await img.decode();
      img.dataset.assetReady = "frame-visible";
    } catch (error) {
      console.error(error);
      img.dataset.assetReady = "fallback";
    }
  }

  const introAssetsReady = Promise.all([
    loadChunkImage(heroImg, heroChunks, "art/v2-style/event-portraits/necromancer.png?v=2", "hero-hd"),
    loadChunkImage(commanderImg, commanderChunks, "art/v2-style/event-portraits/knight-commander.png?v=2", "commander-hd"),
    loadDialogueFrame(frameImg)
  ]);

  const dialogue = [
    { speaker: "기사단장", text: "여기 있었구만." },
    { speaker: "주인공", text: "..." },
    { speaker: "기사단장", text: "외곽 순찰대가 어젯밤 돌아오지 못했다." },
    { speaker: "기사단장", text: "요 며칠 성 밖의 움직임이 심상치 않아." },
    { speaker: "주인공", text: "..." },
    { speaker: "기사단장", text: "오늘부터 네게 외곽 순찰 임무를 맡기겠다." },
    { speaker: "기사단장", text: "성 밖을 한 바퀴 돌며 상황을 확인해라." },
    { speaker: "기사단장", text: "마물과 마주치면 처리하고, 이상한 것이 보이면 기억해 둬." },
    { speaker: "주인공", text: "..." },
    { speaker: "기사단장", text: "돌아오면 보고를 받지." },
    { speaker: "기사단장", text: "살아서 돌아와라." },
    { speaker: "시스템", text: "[외곽 순찰 임무를 받았습니다.]" }
  ];

  let started = false;
  let index = 0;
  let leaving = false;

  function renderLine() {
    const line = dialogue[index];
    name.textContent = line.speaker;
    text.textContent = line.text;
    portraits.forEach((portrait) => {
      portrait.classList.toggle("is-speaking", portrait.dataset.speaker === line.speaker);
    });
    if (line.speaker === "시스템") portraits.forEach((portrait) => portrait.classList.remove("is-speaking"));
  }

  function beginDialogue() {
    started = true;
    impactStage.hidden = true;
    dialogueStage.hidden = false;
    index = 0;
    renderLine();
  }

  async function finishIntro() {
    if (leaving) return;
    leaving = true;
    scene.classList.add("is-ending");
    try { sessionStorage.setItem("necromancer-v2-music-handoff", "map"); } catch (_) {}
    await new Promise((resolve) => setTimeout(resolve, 520));
    location.href = "v2-map-practice.html";
  }

  advance.addEventListener("click", async () => {
    await introAssetsReady;
    if (leaving) return;
    if (!started) { beginDialogue(); return; }
    if (index >= dialogue.length - 1) { await finishIntro(); return; }
    index += 1;
    renderLine();
  });

  advance.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    advance.click();
  });
})();
