document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("current-year").textContent =
    new Date().getFullYear();

  const DOM = {
    timeline: document.getElementById("timeline"),
    loading: document.getElementById("loading-container"),
  };

  const ICONS = {
    trophy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>`,
    arrow: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
  };

  // Placeholder SVG in caso un'immagine remota (stemma, icona competizione) non carichi.
  const placeholder = (label) => {
    const text = (label || "?").slice(0, 3).toUpperCase();
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'><rect width='100%' height='100%' rx='10' fill='#18181b'/><text x='50%' y='56%' font-family='sans-serif' font-size='16' fill='#c9a24b' text-anchor='middle'>${text}</text></svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  };

  const withFallback = (img, label) => {
    img.addEventListener(
      "error",
      () => {
        img.src = placeholder(label);
      },
      { once: true },
    );
    return img;
  };

  // "2026-2027" -> { short: "26/27" }
  const shortYear = (year) => {
    const [a, b] = year.split("-");
    return `${a.slice(-2)}/${b.slice(-2)}`;
  };

  const ordinal = (n) => `${n}°`;

  const createCompChip = (comp, isSerieAWinner) => {
    const li = document.createElement("li");
    const isWinner = comp.winner || (comp.name === "Serie A" && isSerieAWinner);
    li.className = `comp-chip${isWinner ? " won" : ""}`;
    const img = document.createElement("img");
    img.src = comp.icon;
    img.alt = "";
    img.loading = "lazy";
    withFallback(img, comp.name);
    const span = document.createElement("span");
    span.textContent = comp.name;
    li.append(img, span);
    return li;
  };

  const createEntry = (season, index) => {
    const isChampion = season.position === 1;
    const isPending = typeof season.position !== "number";

    const entry = document.createElement("article");
    entry.className = `timeline-entry${isChampion ? " is-champion" : ""}`;
    entry.style.setProperty("--i", index);

    const marker = document.createElement("div");
    marker.className = "timeline-marker";
    const [y1, y2] = shortYear(season.year).split("/");
    marker.innerHTML = `${y1}<span class="marker-year-end">/${y2}</span>`;
    entry.appendChild(marker);

    const card = document.createElement("div");
    card.className = "timeline-card";

    const top = document.createElement("div");
    top.className = "card-top";

    if (isPending) {
      top.innerHTML = `
        <span class="position-numeral">–</span>
        <div class="position-meta">
          <h2 class="season-title">Stagione ${season.year}</h2>
          <span class="position-label">Classifica non ancora definita</span>
        </div>
        <span class="pending-tag"><span class="pending-dot"></span>In corso</span>
      `;
    } else {
      top.innerHTML = `
        <span class="position-numeral">${ordinal(season.position)}</span>
        <div class="position-meta">
          <h2 class="season-title">Stagione ${season.year}</h2>
          <span class="position-label">${season.position === 1 ? "Campione d'Italia" : `posto in Serie A`}</span>
        </div>
        ${isChampion ? `<span class="champion-tag">${ICONS.trophy}Scudetto</span>` : ""}
      `;
    }
    card.appendChild(top);

    if (season.competitions?.length) {
      const list = document.createElement("ul");
      list.className = "competitions-row";
      season.competitions.forEach((comp) =>
        list.appendChild(createCompChip(comp, isChampion)),
      );
      card.appendChild(list);
    }

    const link = document.createElement("a");
    link.className = "view-link";
    link.href = season.link;
    link.innerHTML = `Vedi rosa completa ${ICONS.arrow}`;
    card.appendChild(link);

    entry.appendChild(card);
    return entry;
  };

  const renderTimeline = (seasons) => {
    DOM.timeline.innerHTML = "";
    seasons.forEach((season, i) =>
      DOM.timeline.appendChild(createEntry(season, i)),
    );
  };

  const showError = () => {
    DOM.loading.innerHTML = `
      <p>Non riusciamo a caricare l'archivio delle stagioni.</p>
      <button class="retry-button" id="retry-button">Riprova</button>
    `;
    document
      .getElementById("retry-button")
      .addEventListener("click", () => location.reload());
  };

  fetch("data.json")
    .then((res) =>
      res.ok ? res.json() : Promise.reject(new Error("Risposta non valida")),
    )
    .then((data) => {
      DOM.loading.classList.add("hidden");
      renderTimeline(data.seasons);
    })
    .catch((err) => {
      console.error(err);
      showError();
    });
});
