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
    return [];
  };

  const getBirthFlags = (player) => {
    if (player.bandiera_nascita) {
      return [player.bandiera_nascita];
    }
    return [];
  };

  const getCitizenshipDisplay = (player) => {
    return player.cittadinanza || "Nazionalità sconosciuta";
  };

  const getBirthDisplay = (player) => {
    return player.nazionalita_nascita || "Nazionalità sconosciuta";
  };

  const hasDualNationality = (player) => {
    return player.cittadinanza && player.nazionalita_nascita && 
           player.cittadinanza !== player.nazionalita_nascita;
  };

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

  const createPlayerCard = (player, index) => {
    const card = document
      .getElementById("player-card-template")
      .content.cloneNode(true)
      .querySelector(".card");
    card.style.setProperty("--i", index);

    const img = card.querySelector(".card-img");
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

    card.querySelectorAll("h3").forEach((el) => (el.textContent = player.nome));
    card
      .querySelectorAll(".maglia")
      .forEach((el) => (el.textContent = player.numero_di_maglia));

    // Data di nascita + luogo + età
    const birthSpan = card.querySelector(".birth-date");
    const birthDateObj = new Date(player.data_nascita);
    const age = calculateAge(birthDateObj);
    let birthHTML = `Nato il <span class="formatted-date">${formatDate(player.data_nascita)}</span>`;
    if (player.luogo_nascita) {
      birthHTML += ` a <span class="birth-place">${player.luogo_nascita}</span>`;
    }
    if (age !== null) {
      birthHTML += ` <span class="age">(${age} anni – stagione ${seasonDisplay})</span>`;
    }
    birthSpan.innerHTML = birthHTML;

    card.querySelector(".role").textContent = player.ruolo || "Ruolo sconosciuto";

    // --- GESTIONE NAZIONALITÀ - SOLO BANDIERE (SENZA TESTO) ---
    const nationalityEl = card.querySelector(".nationality");
    if (nationalityEl) {
      nationalityEl.innerHTML = '';
      
      const hasDual = hasDualNationality(player);
      
      // Container per le informazioni sulla nazionalità
      const infoContainer = document.createElement("div");
      infoContainer.className = "nationality-info";
      infoContainer.style.display = "flex";
      infoContainer.style.flexDirection = "column";
      infoContainer.style.gap = "6px";
      infoContainer.style.width = "100%";

      // 1. CITTADINANZA (sempre presente)
      const citizenshipRow = document.createElement("div");
      citizenshipRow.className = "nationality-row";
      citizenshipRow.style.display = "flex";
      citizenshipRow.style.alignItems = "center";
      citizenshipRow.style.gap = "8px";
      citizenshipRow.style.padding = "4px 0";
      
      const citizenshipLabel = document.createElement("span");
      citizenshipLabel.className = "nationality-label";
      citizenshipLabel.textContent = "Cittadinanza:";
      citizenshipLabel.style.fontSize = "0.8rem";
      citizenshipLabel.style.fontWeight = "bold";
      citizenshipLabel.style.color = "#FDB813";
      citizenshipLabel.style.minWidth = "110px";
      citizenshipLabel.style.flexShrink = "0";
      
      const citizenshipFlags = getCitizenshipFlags(player);
      
      const citizenshipValue = document.createElement("span");
      citizenshipValue.className = "nationality-value";
      citizenshipValue.style.display = "flex";
      citizenshipValue.style.alignItems = "center";
      citizenshipValue.style.gap = "4px";
      citizenshipValue.style.flexWrap = "wrap";
      
      // Aggiungi solo bandiere di cittadinanza (senza testo)
      citizenshipFlags.forEach(flag => {
        citizenshipValue.appendChild(
          createFlagElement(flag, "Cittadinanza", "flag-small", "Cittadinanza")
        );
      });
      
      citizenshipRow.appendChild(citizenshipLabel);
      citizenshipRow.appendChild(citizenshipValue);
      infoContainer.appendChild(citizenshipRow);

      // 2. NAZIONALITÀ DI NASCITA (solo se diversa dalla cittadinanza)
      if (hasDual) {
        const birthRow = document.createElement("div");
        birthRow.className = "nationality-row";
        birthRow.style.display = "flex";
        birthRow.style.alignItems = "center";
        birthRow.style.gap = "8px";
        birthRow.style.padding = "4px 0";
        
        const birthLabel = document.createElement("span");
        birthLabel.className = "nationality-label";
        birthLabel.textContent = "Nazionalità di nascita:";
        birthLabel.style.fontSize = "0.8rem";
        birthLabel.style.fontWeight = "bold";
        birthLabel.style.color = "#64B5F6";
        birthLabel.style.minWidth = "110px";
        birthLabel.style.flexShrink = "0";
        
        const birthFlags = getBirthFlags(player);
        
        const birthValue = document.createElement("span");
        birthValue.className = "nationality-value";
        birthValue.style.display = "flex";
        birthValue.style.alignItems = "center";
        birthValue.style.gap = "4px";
        birthValue.style.flexWrap = "wrap";
        
        // Aggiungi solo bandiere di nascita (senza testo)
        birthFlags.forEach(flag => {
          birthValue.appendChild(
            createFlagElement(flag, "Nascita", "flag-small", "Nazionalità di nascita")
          );
        });
        
        birthRow.appendChild(birthLabel);
        birthRow.appendChild(birthValue);
        infoContainer.appendChild(birthRow);
      }

      nationalityEl.appendChild(infoContainer);
    }

    // Flip card
    const toggle = () => card.classList.toggle("flipped");
    card.addEventListener("click", toggle);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle();
      }
    });

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
      
      // Cerca per nome
      if (p.nome.toLowerCase().includes(term)) return true;
      
      // Cerca per numero maglia
      if (p.numero_di_maglia.toString().includes(term)) return true;
      
      // Cerca per cittadinanza
      if (p.cittadinanza?.toLowerCase().includes(term)) return true;
      
      // Cerca per nazionalità di nascita
      if (p.nazionalita_nascita?.toLowerCase().includes(term)) return true;
      
      // Cerca per luogo di nascita
      if (p.luogo_nascita?.toLowerCase().includes(term)) return true;
      
      // Cerca per ruolo
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
          let flagHTML = '';
          
          // Mostra bandiera di cittadinanza
          const citizenshipFlags = getCitizenshipFlags(player);
          if (citizenshipFlags.length > 0) {
            flagHTML += citizenshipFlags.map(f => 
              `<img src="${f}" class="suggestion-flag" style="width:20px;height:13px;object-fit:cover;border-radius:2px;margin-right:2px;" alt="Cittadinanza" loading="lazy" title="Cittadinanza">`
            ).join('');
          }
          
          // Se c'è doppia nazionalità, mostra anche bandiera di nascita
          if (hasDual) {
            const birthFlags = getBirthFlags(player);
            if (birthFlags.length > 0) {
              flagHTML += birthFlags.map(f => 
                `<img src="${f}" class="suggestion-flag" style="width:20px;height:13px;object-fit:cover;border-radius:2px;margin-right:2px;opacity:0.7;" alt="Nascita" loading="lazy" title="Nazionalità di nascita">`
              ).join('');
            }
          }

          let nationalityText = getCitizenshipDisplay(player);
          if (hasDual) {
            nationalityText += ` (nato ${getBirthDisplay(player)})`;
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