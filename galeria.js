const track = document.querySelector(".gallery-track");
const slides = Array.from(document.querySelectorAll(".gallery-slide"));

let i = 0;
let timer = null;

function goToSlide(index) {
  if (!track || !slides[index]) return;

  track.scrollTo({
    left: slides[index].offsetLeft,
    behavior: "smooth"
  });
}

function start() {
  stop();
  timer = setInterval(() => {
    i = (i + 1) % slides.length; // 0→1→2→0...
    goToSlide(i);
  }, 4000);
}

function stop() {
  if (timer) clearInterval(timer);
  timer = null;
}

start();

// Pausa al pasar el mouse
track?.addEventListener("mouseenter", stop);
track?.addEventListener("mouseleave", start);

// (Opcional) Si el usuario hace scroll manual, actualiza i al slide más cercano
track?.addEventListener("scroll", () => {
  const left = track.scrollLeft;
  let closest = 0;
  let minDiff = Infinity;

  slides.forEach((s, idx) => {
    const diff = Math.abs(s.offsetLeft - left);
    if (diff < minDiff) { minDiff = diff; closest = idx; }
  });

  i = closest;
}, { passive: true });