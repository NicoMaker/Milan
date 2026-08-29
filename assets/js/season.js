document.addEventListener("DOMContentLoaded", () => {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const DOM = {
    roles: document.getElementById("roles-container"),
    loading: document.getElementById("loading-indicator"),
    noResults: document.getElementById("no-results"),
    search: document.getElementById("search-input"),
    searchBtn: document.getElementById("search-button"),
    suggestions: document.getElementById("search-suggestions"),
    filters: document.querySelectorAll(".filter-btn"),
  };

  let players = [];
  let activeFilters = ["Portiere", "Difensore", "Centrocampista", "Attaccante"];
  let searchTerm = "";
  let suggestionsList = [];
  let selectedSuggestionIdx = -1;

  const ROLE_ORDER = [
    "Portiere",
    "Difensore",
    "Centrocampista",
    "Attaccante",
    "Sconosciuto",
  ];
  const ROLE_PLURALS = {
    Portiere: "Portieri",
    Difensore: "Difensori",
    Centrocampista: "Centrocampisti",
    Attaccante: "Attaccanti",
  };

  const ALL_ROLES = ["Portiere", "Difensore", "Centrocampista", "Attaccante"];

  // --- Piccola utility di debounce, per non ricalcolare i suggerimenti ad ogni tasto ---
  const debounce = (fn, delay = 150) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  };

  // --- Determina l'anno di inizio stagione ---
  const getSeasonStartYear = () => {
    const meta = document.querySelector('meta[name="season-start-year"]');
    if (meta) return parseInt(meta.content, 10);
    const input = document.getElementById("season-start-year");
    if (input) return parseInt(input.value, 10);
    const match = window.location.pathname.match(/\/(\d{4})-\d{4}\//);
    if (match) return parseInt(match[1], 10);
    const now = new Date();
    return now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  };

  const seasonStartYear = getSeasonStartYear();
  const seasonDisplay = `${seasonStartYear}/${seasonStartYear + 1}`;

  // --- Calcolo età ---
  const calculateAge = (birthDate) => {
    if (!birthDate || Number.isNaN(birthDate.getTime())) return null;
    const seasonStart = new Date(seasonStartYear, 7, 1);
    let age = seasonStart.getFullYear() - birthDate.getFullYear();
    const m = seasonStart.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && seasonStart.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const dateFormatter = new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return dateStr;
    return dateFormatter.format(date);
  };

  // Placeholder SVG
  const placeholder = (label, bg = "#18181b", fg = "#c9a24b") => {
    const text = (label || "?").trim().slice(0, 2).toUpperCase();
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150'><rect width='100%' height='100%' fill='${bg}'/><text x='50%' y='55%' font-family='sans-serif' font-size='54' fill='${fg}' text-anchor='middle' dominant-baseline='middle'>${text}</text></svg>`;
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
  };

  // --- Funzioni per gestire cittadinanza e nascita ---
  const getCitizenshipFlags = (player) => {
    if (player.bandiera_cittadinanza) return [player.bandiera_cittadinanza];
    if (player.bandiera) return [player.bandiera];
    return [];
  };

  const getBirthFlags = (player) => {
    if (
      player.bandiera_nascita &&
      player.bandiera_nascita !== player.bandiera_cittadinanza
    ) {
      return [player.bandiera_nascita];
    }
    if (player.bandiera) return [player.bandiera];
    return [];
  };

  const getCitizenshipDisplay = (player) =>
    player.cittadinanza || "Nazionalità sconosciuta";

  const getBirthDisplay = (player) =>
    player.nazionalita_nascita || player.cittadinanza || "Nazione sconosciuta";

  const hasDualNationality = (player) =>
    Boolean(
      player.cittadinanza &&
        player.nazionalita_nascita &&
        player.cittadinanza !== player.nazionalita_nascita,
    );

  // --- Crea elemento bandiera ---
  const createFlagElement = (flagUrl, label, className = "flag", title = "") => {
    const flagImg = document.createElement("img");
    flagImg.src = flagUrl;
    flagImg.alt = label || "Bandiera";
    flagImg.className = className;
    flagImg.loading = "lazy";
    flagImg.title = title || label || "Bandiera";
    withFallback(flagImg, label || "Nazionalità");
    return flagImg;
  };

  // --- Una riga "etichetta: bandiera + testo" nel retro della card ---
  // Sostituisce il precedente blocco di stili inline generati via JS:
  // ora produce solo markup semantico, l'aspetto è delegato interamente a season.css.
  const createNationalityRow = ({ label, isBirth, flagUrl, text }) => {
    const row = document.createElement("div");
    row.className = "nationality-row";

    const labelEl = document.createElement("span");
    labelEl.className = `nationality-label${isBirth ? " is-birth" : ""}`;
    labelEl.textContent = label;
    row.appendChild(labelEl);

    const valueEl = document.createElement("span");
    valueEl.className = "nationality-value";

    if (flagUrl) {
      valueEl.appendChild(
        createFlagElement(flagUrl, text, "flag-small", `${label} ${text}`),
      );
    }

    const textEl = document.createElement("span");
    textEl.className = "nationality-text";
    textEl.textContent = text;
    valueEl.appendChild(textEl);

    row.appendChild(valueEl);
    return row;
  };

  const buildNationalityBlock = (player) => {
    const container = document.createElement("div");
    container.className = "nationality-info";

    container.appendChild(
      createNationalityRow({
        label: "Cittadinanza:",
        isBirth: false,
        flagUrl: getCitizenshipFlags(player)[0],
        text: getCitizenshipDisplay(player),
      }),
    );

    container.appendChild(
      createNationalityRow({
        label: "Nazione nascita:",
        isBirth: true,
        flagUrl: getBirthFlags(player)[0],
        text: getBirthDisplay(player),
      }),
    );

    return container;
  };

  const createPlayerCard = (player, index) => {
    const card = document
      .getElementById("player-card-template")
      .content.cloneNode(true)
      .querySelector(".card");

    card.classList.add("scrollable-card");
    card.style.setProperty("--i", index);
    card.dataset.playerName = player.nome;

    const img = card.querySelector(".card-img");
    if (img) {
      img.src = player.immagine;
      img.alt = player.nome;
      img.loading = "lazy";
      img.decoding = "async";
      withFallback(
        img,
        player.nome
          .split(" ")
          .map((s) => s[0])
          .join(""),
      );
    }

    // Bandierina di cittadinanza sul fronte, sovrapposta alla foto
    const citizenshipFlagFront = card.querySelector(".citizenship-flag-front");
    if (citizenshipFlagFront) {
      const citizenshipUrl = getCitizenshipFlags(player)[0];
      const citizenshipText = getCitizenshipDisplay(player);
      if (citizenshipUrl) {
        citizenshipFlagFront.src = citizenshipUrl;
        citizenshipFlagFront.alt = `Cittadinanza: ${citizenshipText}`;
        citizenshipFlagFront.title = `Cittadinanza: ${citizenshipText}`;
        withFallback(citizenshipFlagFront, citizenshipText);
      } else {
        citizenshipFlagFront.classList.add("hidden");
      }
    }

    // Nome giocatore (fronte + retro)
    card.querySelectorAll(".card-name").forEach((el) => {
      el.textContent = player.nome;
    });

    // Numero maglia
    const magliaEl = card.querySelector(".maglia");
    if (magliaEl) magliaEl.textContent = player.numero_di_maglia;

    // Data di nascita + età
    const birthSpan = card.querySelector(".birth-date");
    if (birthSpan) {
      birthSpan.replaceChildren();
      birthSpan.append("Nato il ");
      const dateSpan = document.createElement("span");
      dateSpan.className = "formatted-date";
      dateSpan.textContent = formatDate(player.data_nascita);
      birthSpan.appendChild(dateSpan);

      const age = calculateAge(new Date(player.data_nascita));
      if (age !== null) {
        const ageSpan = document.createElement("span");
        ageSpan.className = "age";
        ageSpan.textContent = ` (${age} anni – stagione ${seasonDisplay})`;
        birthSpan.appendChild(ageSpan);
      }
    }

    // Ruolo
    const roleEl = card.querySelector(".role");
    if (roleEl) roleEl.textContent = player.ruolo || "Ruolo sconosciuto";

    // Nazionalità (cittadinanza + nascita)
    const nationalityEl = card.querySelector(".nationality");
    if (nationalityEl) {
      nationalityEl.replaceChildren(buildNationalityBlock(player));
    }

    // --- Apertura/chiusura del retro ---
    const toggleCard = (event) => {
      event?.stopPropagation();
      card.classList.toggle("flipped");
    };

    card.addEventListener("click", toggleCard);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleCard(event);
      }
    });
    card.setAttribute("aria-label", `Mostra dettagli di ${player.nome}`);

    return card;
  };

  const renderPlayers = () => {
    DOM.roles.innerHTML = "";

    if (activeFilters.length === 0) {
      DOM.noResults.classList.remove("hidden");
      DOM.noResults.querySelector("p").textContent =
        "Seleziona almeno un ruolo per vedere la rosa.";
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = players.filter((p) => {
      if (!activeFilters.includes(p.ruolo)) return false;
      if (term === "") return true;

      return [
        p.nome,
        p.numero_di_maglia?.toString(),
        p.cittadinanza,
        p.nazionalita_nascita,
        p.luogo_nascita,
        p.ruolo,
      ]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(term));
    });

    if (filtered.length === 0) {
      DOM.noResults.classList.remove("hidden");
      DOM.noResults.querySelector("p").textContent =
        "Nessun giocatore corrisponde alla ricerca. Prova con un nome, un numero di maglia, una nazionalità o un luogo.";
      return;
    }

    DOM.noResults.classList.add("hidden");

    const grouped = Object.groupBy(filtered, (p) => p.ruolo || "Sconosciuto");
    const fragment = document.createDocumentFragment();

    Object.keys(grouped)
      .sort((a, b) => ROLE_ORDER.indexOf(a) - ROLE_ORDER.indexOf(b))
      .forEach((role, idx) => {
        const section = document.createElement("section");
        section.className = "role-section";
        section.style.animationDelay = `${idx * 0.15}s`;

        const heading = document.createElement("h2");
        heading.textContent = ROLE_PLURALS[role] || role;
        section.appendChild(heading);

        const cardsContainer = document.createElement("div");
        cardsContainer.className = "role-cards";
        grouped[role]
          .sort((a, b) => Number(a.numero_di_maglia) - Number(b.numero_di_maglia))
          .forEach((player, i) =>
            cardsContainer.appendChild(createPlayerCard(player, i)),
          );
        section.appendChild(cardsContainer);

        fragment.appendChild(section);
      });

    DOM.roles.appendChild(fragment);
  };

  const updateFiltersUI = () => {
    const allSelected = ALL_ROLES.every((r) => activeFilters.includes(r));

    DOM.filters.forEach((btn) => {
      const filter = btn.dataset.filter;
      const isActive =
        filter === "all" ? allSelected : activeFilters.includes(filter);
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  };

  const closeSuggestions = () => {
    DOM.suggestions.classList.add("hidden");
    DOM.search.setAttribute("aria-expanded", "false");
    DOM.search.removeAttribute("aria-activedescendant");
    selectedSuggestionIdx = -1;
  };

  const performSearch = () => {
    searchTerm = DOM.search.value.trim();
    closeSuggestions();
    renderPlayers();
  };

  const updateSuggestionSelection = () => {
    suggestionsList.forEach((s, i) => {
      const isSelected = i === selectedSuggestionIdx;
      s.classList.toggle("selected", isSelected);
      s.setAttribute("aria-selected", isSelected ? "true" : "false");
      if (isSelected) {
        s.scrollIntoView({ block: "nearest" });
        DOM.search.setAttribute("aria-activedescendant", s.id);
      }
    });
    if (selectedSuggestionIdx === -1) {
      DOM.search.removeAttribute("aria-activedescendant");
    }
  };

  const buildSuggestionFlags = (player) => {
    const wrap = document.createElement("span");
    wrap.className = "suggestion-flags";

    const citizenshipFlags = getCitizenshipFlags(player);
    citizenshipFlags.forEach((f) => {
      const img = createFlagElement(f, "Cittadinanza", "suggestion-flag", "Cittadinanza");
      wrap.appendChild(img);
    });

    if (hasDualNationality(player)) {
      const birthFlags = getBirthFlags(player).filter(
        (f) => f !== citizenshipFlags[0],
      );
      birthFlags.forEach((f) => {
        const img = createFlagElement(
          f,
          "Nazionalità di nascita",
          "suggestion-flag is-birth-flag",
          "Nazionalità di nascita",
        );
        wrap.appendChild(img);
      });
    }

    return wrap;
  };

  const generateSuggestions = (query) => {
    if (query.length < 2) {
      closeSuggestions();
      return;
    }

    const q = query.toLowerCase();
    const matches = players.filter((p) =>
      [
        p.nome,
        p.numero_di_maglia?.toString(),
        p.cittadinanza,
        p.nazionalita_nascita,
        p.luogo_nascita,
        p.ruolo,
      ]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(q)),
    );

    if (matches.length === 0) {
      closeSuggestions();
      return;
    }

    DOM.suggestions.innerHTML = "";
    suggestionsList = [];

    const grouped = Object.groupBy(matches, (p) => p.ruolo || "Altro");
    let optionIndex = 0;

    Object.keys(grouped)
      .sort((a, b) => ROLE_ORDER.indexOf(a) - ROLE_ORDER.indexOf(b))
      .forEach((role) => {
        const header = document.createElement("div");
        header.className = "suggestion-category";
        header.textContent = ROLE_PLURALS[role] || role;
        DOM.suggestions.appendChild(header);

        grouped[role].forEach((player) => {
          const item = document.createElement("div");
          item.className = "suggestion-item";
          item.id = `suggestion-${optionIndex++}`;
          item.setAttribute("role", "option");
          item.setAttribute("aria-selected", "false");
          item.dataset.playerName = player.nome;

          const jersey = document.createElement("span");
          jersey.className = "suggestion-jersey";
          jersey.textContent = player.numero_di_maglia;

          const name = document.createElement("span");
          name.className = "suggestion-name";
          name.textContent = player.nome;

          let nationalityText = getCitizenshipDisplay(player);
          const birthText = getBirthDisplay(player);
          if (birthText && birthText !== nationalityText) {
            nationalityText += ` (nato ${birthText})`;
          }
          const nationality = document.createElement("span");
          nationality.className = "suggestion-nationality";
          nationality.textContent = nationalityText;

          item.append(jersey, name, nationality, buildSuggestionFlags(player));

          item.addEventListener("click", () => {
            DOM.search.value = player.nome;
            closeSuggestions();
            performSearch();
          });

          DOM.suggestions.appendChild(item);
          suggestionsList.push(item);
        });
      });

    DOM.suggestions.classList.remove("hidden");
    DOM.search.setAttribute("aria-expanded", "true");
    selectedSuggestionIdx = -1;
  };

  const debouncedSuggestions = debounce((value) => generateSuggestions(value));

  // --- Ricerca ---
  DOM.search.addEventListener("input", (e) =>
    debouncedSuggestions(e.target.value.trim()),
  );
  DOM.search.addEventListener("focus", () => {
    const value = DOM.search.value.trim();
    if (value.length >= 2) generateSuggestions(value);
  });
  DOM.searchBtn.addEventListener("click", performSearch);

  DOM.search.addEventListener("keydown", (e) => {
    const suggestionsOpen =
      !DOM.suggestions.classList.contains("hidden") && suggestionsList.length;

    if (e.key === "Enter" && selectedSuggestionIdx === -1) {
      performSearch();
      return;
    }

    if (!suggestionsOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      selectedSuggestionIdx = Math.min(
        selectedSuggestionIdx + 1,
        suggestionsList.length - 1,
      );
      updateSuggestionSelection();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      selectedSuggestionIdx = Math.max(selectedSuggestionIdx - 1, -1);
      updateSuggestionSelection();
    } else if (e.key === "Enter" && selectedSuggestionIdx >= 0) {
      e.preventDefault();
      DOM.search.value = suggestionsList[selectedSuggestionIdx].dataset.playerName;
      closeSuggestions();
      performSearch();
    } else if (e.key === "Escape") {
      closeSuggestions();
    }
  });

  document.addEventListener("click", (e) => {
    if (!DOM.suggestions.contains(e.target) && e.target !== DOM.search) {
      closeSuggestions();
    }
  });

  // --- Filtri per ruolo ---
  DOM.filters.forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.filter;

      if (filter === "all") {
        activeFilters = activeFilters.length === 4 ? [] : [...ALL_ROLES];
      } else if (activeFilters.includes(filter)) {
        activeFilters = activeFilters.filter((f) => f !== filter);
      } else {
        activeFilters.push(filter);
        if (activeFilters.length === 4) activeFilters = [...ALL_ROLES];
      }

      updateFiltersUI();
      renderPlayers();
    });
  });

  // --- Caricamento dati ---
  const init = async () => {
    DOM.loading.classList.remove("hidden");
    try {
      const res = await fetch("player.json");
      if (!res.ok) throw new Error("Risposta non valida");
      players = await res.json();
      DOM.loading.classList.add("hidden");
      updateFiltersUI();
      renderPlayers();
    } catch (err) {
      console.error(err);
      DOM.loading.innerHTML = `
        <p>Non riusciamo a caricare la rosa. Verifica la connessione e riprova.</p>
        <button id="retry-button" class="filter-btn">Riprova</button>
      `;
      document
        .getElementById("retry-button")
        ?.addEventListener("click", () => location.reload());
    }
  };

  init();
});
