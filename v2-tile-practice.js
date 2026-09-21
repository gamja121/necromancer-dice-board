(() => {
  "use strict";
  const image = document.getElementById("tileTestImage");
  const enter = document.getElementById("tileTestEnter");
  const exit = document.getElementById("tileTestExit");

  enter.addEventListener("click", () => {
    image.src = "art/v2-style/map-test/events/home-interior.jpg";
    image.alt = "우리집 실내 풍경";
    enter.hidden = true;
    exit.focus();
  });
  exit.addEventListener("click", () => {
    window.location.assign("v2-map-practice.html");
  });
})();
