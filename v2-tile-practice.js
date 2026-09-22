(() => {
  "use strict";
  const image = document.getElementById("tileTestImage");
  const enter = document.getElementById("tileTestEnter");
  const inheritance = document.getElementById("tileTestInheritance");
  const exit = document.getElementById("tileTestExit");

  enter.addEventListener("click", () => {
    image.src = "art/v2-style/map-test/events/home-interior.jpg";
    image.alt = "우리집 실내 풍경";
    enter.hidden = true;
    inheritance.hidden = false;
    inheritance.focus();
  });
  inheritance.addEventListener("click", () => V2HomeInheritance.open());
  exit.addEventListener("click", () => {
    window.location.assign("v2-map-practice.html");
  });
})();
