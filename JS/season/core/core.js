// Classe principale della pagina Stagione — stato dell'app, riferimenti DOM
// e utility condivise dagli altri moduli (player-card, render, search, bootstrap).
class MilanSeasonApp {
  constructor() {
    this.DOM = {
      roles: document.getElementById("roles-container"),
      loading: document.getElementById("loading-indicator"),
      noResults: document.getElementById("no-results"),
      search: document.getElementById("search-input"),
      searchBtn: document.getElementById("search-button"),
      suggestions: document.getElementById("search-suggestions"),
      filters: document.querySelectorAll(".filter-btn"),
    };

    // Percorso del file JSON della rosa (impostato in JSON/<stagione>/)
    this.playersUrl = document
      .getElementById("playerdata")
      .getAttribute("link");

    this.players = [];
    this.activeFilters = [
      "Portiere",
      "Difensore",
      "Centrocampista",
      "Attaccante",
    ];
    this.searchTerm = "";
    this.suggestionsList = [];
    this.selectedSuggestionIdx = -1;

    this.ROLE_ORDER = [
      "Portiere",
      "Difensore",
      "Centrocampista",
      "Attaccante",
      "Sconosciuto",
    ];
    this.ROLE_PLURALS = {
      Portiere: "Portieri",
      Difensore: "Difensori",
      Centrocampista: "Centrocampisti",
      Attaccante: "Attaccanti",
    };
    this.ALL_ROLES = ["Portiere", "Difensore", "Centrocampista", "Attaccante"];

    this.dateFormatter = new Intl.DateTimeFormat("it-IT", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    this.seasonStartYear = this.getSeasonStartYear();
    this.seasonDisplay = `${this.seasonStartYear}/${this.seasonStartYear + 1}`;
  }

  init() {
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    this.bindFilters();
    this.bindSearch();
    this.loadData();
  }

  // --- Piccola utility di debounce, per non ricalcolare i suggerimenti ad ogni tasto ---
  debounce(fn, delay = 150) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  // --- Determina l'anno di inizio stagione ---
  getSeasonStartYear() {
    const meta = document.querySelector('meta[name="season-start-year"]');
    if (meta) return parseInt(meta.content, 10);
    const input = document.getElementById("season-start-year");
    if (input) return parseInt(input.value, 10);
    const match = window.location.pathname.match(/\/(\d{4})-\d{4}\//);
    if (match) return parseInt(match[1], 10);
    const now = new Date();
    return now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  }

  // --- Calcolo età ---
  calculateAge(birthDate) {
    if (!birthDate || Number.isNaN(birthDate.getTime())) return null;
    const seasonStart = new Date(this.seasonStartYear, 7, 1);
    let age = seasonStart.getFullYear() - birthDate.getFullYear();
    const m = seasonStart.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && seasonStart.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  formatDate(dateStr) {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return dateStr;
    return this.dateFormatter.format(date);
  }

  // --- Placeholder SVG ---
  placeholder(label, bg = "#18181b", fg = "#c9a24b") {
    const text = (label || "?").trim().slice(0, 2).toUpperCase();
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150'><rect width='100%' height='100%' fill='${bg}'/><text x='50%' y='55%' font-family='sans-serif' font-size='54' fill='${fg}' text-anchor='middle' dominant-baseline='middle'>${text}</text></svg>`;
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
  }

  // --- Funzioni per gestire cittadinanza e nascita ---
  getCitizenshipFlags(player) {
    if (player.bandiera_cittadinanza) return [player.bandiera_cittadinanza];
    if (player.bandiera) return [player.bandiera];
    return [];
  }

  getBirthFlags(player) {
    if (
      player.bandiera_nascita &&
      player.bandiera_nascita !== player.bandiera_cittadinanza
    ) {
      return [player.bandiera_nascita];
    }
    if (player.bandiera) return [player.bandiera];
    return [];
  }

  getCitizenshipDisplay(player) {
    return player.cittadinanza || "Nazionalità sconosciuta";
  }

  getBirthDisplay(player) {
    return (
      player.nazionalita_nascita || player.cittadinanza || "Nazione sconosciuta"
    );
  }

  hasDualNationality(player) {
    return Boolean(
      player.cittadinanza &&
      player.nazionalita_nascita &&
      player.cittadinanza !== player.nazionalita_nascita,
    );
  }

  // --- Crea elemento bandiera ---
  createFlagElement(flagUrl, label, className = "flag", title = "") {
    const flagImg = document.createElement("img");
    flagImg.src = flagUrl;
    flagImg.alt = label || "Bandiera";
    flagImg.className = className;
    flagImg.loading = "lazy";
    flagImg.title = title || label || "Bandiera";
    this.withFallback(flagImg, label || "Nazionalità");
    return flagImg;
  }
}
