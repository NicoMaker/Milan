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
  const MONTHS = [
    "Gennaio",
    "Febbraio",
    "Marzo",
    "Aprile",
    "Maggio",
    "Giugno",
    "Luglio",
    "Agosto",
    "Settembre",
    "Ottobre",
    "Novembre",
    "Dicembre",
  ];

  // --- Determina l'anno di inizio stagione ---
  const getSeasonStartYear = () => {
    const meta = document.querySelector('meta[name="season-start-year"]');
    if (meta) return parseInt(meta.content, 10);
    const input = document.getElementById("season-start-year");
    if (input) return parseInt(input.value, 10);
    const path = window.location.pathname;
    const match = path.match(/\/(\d{4})-\d{4}\//);
    if (match) return parseInt(match[1], 10);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    return currentMonth >= 7 ? currentYear : currentYear - 1;
  };

  const seasonStartYear = getSeasonStartYear();
  const seasonDisplay = `${seasonStartYear}/${seasonStartYear + 1}`;

  // --- Calcolo età ---
  const calculateAge = (birthDate) => {
    if (!birthDate || isNaN(birthDate.getTime())) return null;
    const seasonStart = new Date(seasonStartYear, 7, 1);
    let age = seasonStart.getFullYear() - birthDate.getFullYear();
    const m = seasonStart.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && seasonStart.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return dateStr;
    return `${date.getDate().toString().padStart(2, "0")} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
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
    if (player.bandiera_cittadinanza) {
      return [player.bandiera_cittadinanza];
    }
    if (player.bandiera) {
      return [player.bandiera];
    }
    return [];
  };

  const getBirthFlags = (player) => {
    if (
      player.bandiera_nascita &&
      player.bandiera_nascita !== player.bandiera_cittadinanza
    ) {
      return [player.bandiera_nascita];
    }
    if (player.bandiera) {
      return [player.bandiera];
    }
    return [];
  };

  const getCitizenshipDisplay = (player) => {
    return player.cittadinanza || "Nazionalità sconosciuta";
  };

  const getBirthDisplay = (player) => {
    return (
      player.nazionalita_nascita || player.cittadinanza || "Nazione sconosciuta"
    );
  };

  const getBirthPlace = (player) => {
    return player.luogo_nascita || "Luogo di nascita sconosciuto";
  };

  const hasDualNationality = (player) => {
    return (
      player.cittadinanza &&
      player.nazionalita_nascita &&
      player.cittadinanza !== player.nazionalita_nascita
    );
  };

  // --- Crea elemento bandiera ---
  const createFlagElement = (
    flagUrl,
    label,
    className = "flag",
    title = "",
  ) => {
    const flagImg = document.createElement("img");
    flagImg.src = flagUrl;
    flagImg.alt = label || "Bandiera";
    flagImg.className = className;
    flagImg.loading = "lazy";
    flagImg.title = title || label || "Bandiera";
    withFallback(flagImg, label || "Nazionalità");
    return flagImg;
  };

  // Icone usate nelle righe informative del retro della card.
  const ROW_ICONS = {
    calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`,
    pin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
    flag: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22V4M4 4h14l-2 4 2 4H4"/></svg>`,
    globe: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20Z"/></svg>`,
  };

  // Crea una riga informativa <div class="info-row"> con etichetta e valore,
  // pensata per il retro "passaporto" della card, scorrevole se serve.
  const createInfoRow = (iconKey, label, valueNode) => {
    const row = document.createElement("div");
    row.className = "info-row";

    const labelEl = document.createElement("span");
    labelEl.className = "info-label";
    labelEl.innerHTML = `${ROW_ICONS[iconKey] || ""}<span>${label}</span>`;

    const valueEl = document.createElement("span");
    valueEl.className = "info-value";
    if (typeof valueNode === "string") {
      valueEl.innerHTML = valueNode;
    } else {
      valueEl.appendChild(valueNode);
    }

    row.append(labelEl, valueEl);
    return row;
  };

  const createPlayerCard = (player, index) => {
    const card = document
      .getElementById("player-card-template")
      .content.cloneNode(true)
      .querySelector(".card");

    card.style.setProperty("--i", index);

    // Salva il nome del giocatore per riferimento
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

    // Nome giocatore (fronte + retro)
    card
      .querySelectorAll(".player-name")
      .forEach((el) => (el.textContent = player.nome));

    // Numero maglia (fronte + retro)
    card
      .querySelectorAll(".jersey-chip")
      .forEach((el) => (el.textContent = player.numero_di_maglia));

    // Ruolo (fronte + timbro sul retro)
    card
      .querySelectorAll(".player-role")
      .forEach((el) => (el.textContent = player.ruolo || "Ruolo sconosciuto"));

    // --- RETRO: righe informative scorrevoli ---
    const infoList = card.querySelector(".info-list");
    if (infoList) {
      // 1. Data di nascita + età
      const birthDateObj = new Date(player.data_nascita);
      const age = calculateAge(birthDateObj);
      let birthHTML = formatDate(player.data_nascita);
      if (age !== null) {
        birthHTML += ` <span class="age-badge">${age} anni</span>`;
      }
      infoList.appendChild(createInfoRow("calendar", "Nato il", birthHTML));

      // 2. Luogo di nascita
      infoList.appendChild(
        createInfoRow("pin", "Luogo di nascita", getBirthPlace(player)),
      );

      // 3. Cittadinanza
      const citizenshipFlags = getCitizenshipFlags(player);
      const citizenshipText = getCitizenshipDisplay(player);
      const citizenshipValue = document.createElement("span");
      citizenshipValue.style.display = "contents";
      if (citizenshipFlags.length > 0) {
        citizenshipValue.appendChild(
          createFlagElement(
            citizenshipFlags[0],
            citizenshipText,
            "flag-small",
            `Cittadinanza: ${citizenshipText}`,
          ),
        );
      }
      const citizenshipText_ = document.createElement("span");
      citizenshipText_.textContent = citizenshipText;
      citizenshipValue.appendChild(citizenshipText_);
      infoList.appendChild(
        createInfoRow("flag", "Cittadinanza", citizenshipValue),
      );

      // 4. Nazionalità di nascita, solo se diversa dalla cittadinanza
      if (hasDualNationality(player)) {
        const birthText = getBirthDisplay(player);
        const birthFlags = getBirthFlags(player);
        const birthValue = document.createElement("span");
        birthValue.style.display = "contents";
        if (birthFlags.length > 0) {
          birthValue.appendChild(
            createFlagElement(
              birthFlags[0],
              birthText,
              "flag-small",
              `Nazione di nascita: ${birthText}`,
            ),
          );
        }
        const birthTextSpan = document.createElement("span");
        birthTextSpan.textContent = birthText;
        birthValue.appendChild(birthTextSpan);
        infoList.appendChild(
          createInfoRow("globe", "Nato in", birthValue),
        );
      }
    }

    // --- GESTIONE CLICK PER APRIRE/CHIUDERE IL RETRO ---
    let isFlipped = false;

    const toggleCard = (e) => {
      // Evita che il click su elementi interni causi problemi
      if (e) e.stopPropagation();

      isFlipped = !isFlipped;
      card.classList.toggle("flipped", isFlipped);
    };

    // Aggiungi event listener per click
    card.addEventListener("click", toggleCard);

    // Supporto per tastiera (accessibilità)
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleCard(e);
      }
    });

    // Aggiungi attributo per accessibilità
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
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
      const matchesRole = activeFilters.includes(p.ruolo);
      if (!matchesRole) return false;

      if (term === "") return true;

      if (p.nome.toLowerCase().includes(term)) return true;
      if (p.numero_di_maglia.toString().includes(term)) return true;
      if (p.cittadinanza?.toLowerCase().includes(term)) return true;
      if (p.nazionalita_nascita?.toLowerCase().includes(term)) return true;
      if (p.luogo_nascita?.toLowerCase().includes(term)) return true;
      if (p.ruolo?.toLowerCase().includes(term)) return true;

      return false;
    });

    if (filtered.length === 0) {
      DOM.noResults.classList.remove("hidden");
      DOM.noResults.querySelector("p").textContent =
        "Nessun giocatore corrisponde alla ricerca. Prova con un nome, un numero di maglia, una nazionalità o un luogo.";
      return;
    }

    DOM.noResults.classList.add("hidden");

    const grouped = filtered.reduce((acc, p) => {
      const role = p.ruolo || "Sconosciuto";
      (acc[role] = acc[role] || []).push(p);
      return acc;
    }, {});

    Object.keys(grouped)
      .sort((a, b) => ROLE_ORDER.indexOf(a) - ROLE_ORDER.indexOf(b))
      .forEach((role, idx) => {
        const section = document.createElement("section");
        section.className = "role-section";
        section.style.animationDelay = `${idx * 0.15}s`;
        section.innerHTML = `<h2>${ROLE_PLURALS[role] || role}</h2><div class="role-cards"></div>`;

        const cardsContainer = section.querySelector(".role-cards");
        grouped[role]
          .sort((a, b) => a.numero_di_maglia - b.numero_di_maglia)
          .forEach((player, i) =>
            cardsContainer.appendChild(createPlayerCard(player, i)),
          );

        DOM.roles.appendChild(section);
      });
  };

  const updateFiltersUI = () => {
    const allBtn = document.querySelector('[data-filter="all"]');
    const allRoles = ["Portiere", "Difensore", "Centrocampista", "Attaccante"];
    const allSelected = allRoles.every((r) => activeFilters.includes(r));

    DOM.filters.forEach((btn) => {
      const filter = btn.dataset.filter;
      btn.classList.toggle(
        "active",
        filter === "all" ? allSelected : activeFilters.includes(filter),
      );
      btn.setAttribute(
        "aria-pressed",
        btn.classList.contains("active") ? "true" : "false",
      );
    });
  };

  const performSearch = () => {
    searchTerm = DOM.search.value.trim();
    DOM.suggestions.classList.add("hidden");
    renderPlayers();
  };

  const updateSuggestionSelection = () => {
    suggestionsList.forEach((s, i) => {
      s.classList.toggle("selected", i === selectedSuggestionIdx);
      if (i === selectedSuggestionIdx) s.scrollIntoView({ block: "nearest" });
    });
  };

  const generateSuggestions = (query) => {
    if (query.length < 2) {
      DOM.suggestions.classList.add("hidden");
      return;
    }

    const q = query.toLowerCase();
    const matches = players.filter((p) => {
      if (p.nome.toLowerCase().includes(q)) return true;
      if (p.numero_di_maglia.toString().includes(query)) return true;
      if (p.cittadinanza?.toLowerCase().includes(q)) return true;
      if (p.nazionalita_nascita?.toLowerCase().includes(q)) return true;
      if (p.luogo_nascita?.toLowerCase().includes(q)) return true;
      if (p.ruolo?.toLowerCase().includes(q)) return true;
      return false;
    });

    if (matches.length === 0) {
      DOM.suggestions.classList.add("hidden");
      return;
    }

    DOM.suggestions.innerHTML = "";
    suggestionsList = [];

    const grouped = matches.reduce((acc, p) => {
      const role = p.ruolo || "Altro";
      (acc[role] = acc[role] || []).push(p);
      return acc;
    }, {});

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
          item.setAttribute("role", "option");
          item.setAttribute("data-player-name", player.nome);

          const hasDual = hasDualNationality(player);
          let flagHTML = "";

          const citizenshipFlags = getCitizenshipFlags(player);
          if (citizenshipFlags.length > 0) {
            flagHTML += citizenshipFlags
              .map(
                (f) =>
                  `<img src="${f}" class="suggestion-flag" style="width:20px;height:13px;object-fit:cover;border-radius:2px;margin-right:2px;" alt="Cittadinanza" loading="lazy" title="Cittadinanza">`,
              )
              .join("");
          }

          if (hasDual) {
            const birthFlags = getBirthFlags(player);
            if (
              birthFlags.length > 0 &&
              birthFlags[0] !== citizenshipFlags[0]
            ) {
              flagHTML += birthFlags
                .map(
                  (f) =>
                    `<img src="${f}" class="suggestion-flag" style="width:20px;height:13px;object-fit:cover;border-radius:2px;margin-right:2px;opacity:0.7;" alt="Nascita" loading="lazy" title="Nazionalità di nascita">`,
                )
                .join("");
            }
          }

          let nationalityText = getCitizenshipDisplay(player);
          const birthText = getBirthDisplay(player);
          if (birthText && birthText !== nationalityText) {
            nationalityText += ` (nato ${birthText})`;
          }

          item.innerHTML = `
            <span class="suggestion-jersey">${player.numero_di_maglia}</span>
            <span class="suggestion-name">${player.nome}</span>
            <span class="suggestion-nationality">${nationalityText}</span>
            <span class="suggestion-flags">${flagHTML}</span>
          `;

          item.addEventListener("click", () => {
            DOM.search.value = player.nome;
            DOM.suggestions.classList.add("hidden");
            performSearch();
          });

          DOM.suggestions.appendChild(item);
          suggestionsList.push(item);
        });
      });

    DOM.suggestions.classList.remove("hidden");
    selectedSuggestionIdx = -1;
  };

  // Event listeners
  DOM.search.addEventListener("input", (e) =>
    generateSuggestions(e.target.value.trim()),
  );
  DOM.search.addEventListener("focus", () => {
    const value = DOM.search.value.trim();
    if (value.length >= 2) generateSuggestions(value);
  });
  DOM.searchBtn.addEventListener("click", performSearch);

  DOM.search.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && selectedSuggestionIdx === -1) performSearch();

    if (
      !DOM.suggestions.classList.contains("hidden") &&
      suggestionsList.length
    ) {
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
        DOM.search.value =
          suggestionsList[selectedSuggestionIdx].getAttribute(
            "data-player-name",
          );
        DOM.suggestions.classList.add("hidden");
        performSearch();
      } else if (e.key === "Escape") {
        DOM.suggestions.classList.add("hidden");
      }
    }
  });

  document.addEventListener("click", (e) => {
    if (!DOM.suggestions.contains(e.target) && e.target !== DOM.search) {
      DOM.suggestions.classList.add("hidden");
    }
  });

  DOM.filters.forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.filter;
      const allBtn = document.querySelector('[data-filter="all"]');
      const allRoles = [
        "Portiere",
        "Difensore",
        "Centrocampista",
        "Attaccante",
      ];

      if (filter === "all") {
        if (activeFilters.length === 4) {
          activeFilters = [];
        } else {
          activeFilters = [...allRoles];
        }
      } else if (activeFilters.includes(filter)) {
        activeFilters = activeFilters.filter((f) => f !== filter);
      } else {
        activeFilters.push(filter);
        if (activeFilters.length === 4) activeFilters = [...allRoles];
      }

      updateFiltersUI();
      renderPlayers();
    });
  });

  // Carica i dati
  DOM.loading.classList.remove("hidden");
  fetch("player.json")
    .then((res) =>
      res.ok ? res.json() : Promise.reject(new Error("Risposta non valida")),
    )
    .then((data) => {
      players = data;
      DOM.loading.classList.add("hidden");
      updateFiltersUI();
      renderPlayers();
    })
    .catch((err) => {
      console.error(err);
      DOM.loading.innerHTML = `
        <p>Non riusciamo a caricare la rosa. Verifica la connessione e riprova.</p>
        <button id="retry-button" class="filter-btn">Riprova</button>
      `;
      document
        .getElementById("retry-button")
        ?.addEventListener("click", () => location.reload());
    });
});
