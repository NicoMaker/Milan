// Classe principale della Home — struttura dati, riferimenti DOM, icone e
// piccole utility condivise dagli altri moduli (02-timeline.js, 03-bootstrap.js).
class MilanHomeApp {
  constructor() {
    this.DOM = {
      timeline: document.getElementById("timeline"),
      loading: document.getElementById("loading-container"),
    };

    this.ICONS = {
      trophy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>`,
      arrow: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
    };
  }

  init() {
    document.getElementById("current-year").textContent =
      new Date().getFullYear();
    this.loadData();
  }

  // --- Placeholder SVG in caso un'immagine remota non carichi ---
  placeholder(label) {
    const text = (label || "?").slice(0, 3).toUpperCase();
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'><rect width='100%' height='100%' rx='10' fill='#18181b'/><text x='50%' y='56%' font-family='sans-serif' font-size='16' fill='#c9a24b' text-anchor='middle'>${text}</text></svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }

  withFallback(img, label) {
    img.addEventListener(
      "error",
      () => {
        img.src = this.placeholder(label);
      },
      { once: true },
    );
    return img;
  }

  // "2026-2027" -> { short: "26/27" }
  shortYear(year) {
    const [a, b] = year.split("-");
    return `${a.slice(-2)}/${b.slice(-2)}`;
  }

  ordinal(n) {
    return `${n}°`;
  }
}
