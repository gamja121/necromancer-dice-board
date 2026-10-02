(() => {
  "use strict";

  const scene = document.getElementById("introScene");
  const advance = document.getElementById("introAdvance");
  const impactStage = document.getElementById("impactStage");
  const dialogueStage = document.getElementById("dialogueStage");
  const name = document.getElementById("dialogueName");
  const text = document.getElementById("dialogueText");
  const portraits = [...document.querySelectorAll(".portrait")];

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
  let leaving = false;\n\n  async function ensureLandscape() {\n    if (globalThis.V2Landscape?.request) {\n      try { await V2Landscape.request(); } catch (_) {}\n    }\n  }

  function renderLine() {
    const line = dialogue[index];
    name.textContent = line.speaker;
    text.textContent = line.text;
    portraits.forEach((portrait) => {
      const speaking = portrait.dataset.speaker === line.speaker;
      portrait.classList.toggle("is-speaking", speaking);
    });
    if (line.speaker === "시스템") {
      portraits.forEach((portrait) => portrait.classList.remove("is-speaking"));
    }
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

  advance.addEventListener("click", async () => {\n    await ensureLandscape();
    if (leaving) return;
    if (!started) {
      beginDialogue();
      return;
    }
    if (index >= dialogue.length - 1) {
      finishIntro();
      return;
    }
    index += 1;
    renderLine();
  });

  advance.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    advance.click();
  });
})();
\nwindow.addEventListener("orientationchange", () => { globalThis.V2Landscape?.request?.(); });\n\n})();\n