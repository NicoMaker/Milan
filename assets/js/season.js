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

  const ROLE_ORDER = ["Portiere", "Difensore", "Centrocampista", "Attaccante", "Sconosciuto"];
  const ROLE_PLURALS = {
    Portiere: "Portieri",
    Difensore: "Difensori",
    Centrocampista: "Centrocampisti",
    Attaccante: "Attaccanti",
  };
  const MONTHS = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return dateStr;
    return `${date.getDate().toString().padStart(2, "0")} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Placeholder SVG locale: sostituisce foto/bandiere che non caricano,
  // al posto di un servizio esterno che potrebbe non essere più disponibile.
  const placeholder = (label, bg = "#18181b", fg = "#c9a24b") => {
    const text = (label || "?").trim().slice(0, 2).toUpperCase();
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150'><rect width='100%' height='100%' fill='${bg}'/><text x='50%' y='55%' font-family='sans-serif' font-size='54' fill='${fg}' text-anchor='middle' dominant-baseline='middle'>${text}</text></svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  };

  const withFallback = (img, label) => {
    img.addEventListener("error", () => { img.src = placeholder(label); }, { once: true });
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
    withFallback(img, player.nome.split(" ").map((s) => s[0]).join(""));

    card.querySelectorAll("h3").forEach((el) => (el.textContent = player.nome));
    card.querySelectorAll(".maglia").forEach((el) => (el.textContent = player.numero_di_maglia));
    card.querySelector(".birth-date").innerHTML = `Nato il <span class="formatted-date">${formatDate(player.data_nascita)}</span>`;
    card.querySelector(".role").textContent = player.ruolo || "Ruolo sconosciuto";

    if (player.bandiera) {
      const nationalityEl = card.querySelector(".nationality");
      const flagImg = document.createElement("img");
      flagImg.src = player.bandiera;
      flagImg.alt = player.nazionalita ? `Bandiera ${player.nazionalita}` : "Bandiera";
      flagImg.className = "flag";
      flagImg.loading = "lazy";
      withFallback(flagImg, player.nazionalita);
      nationalityEl.appendChild(flagImg);
    }

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
      DOM.noResults.querySelector("p").textContent = "Seleziona almeno un ruolo per vedere la rosa.";
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = players.filter(
      (p) =>
        activeFilters.includes(p.ruolo) &&
        (term === "" ||
          p.nome.toLowerCase().includes(term) ||
          p.numero_di_maglia.toString().includes(term) ||
          p.nazionalita?.toLowerCase().includes(term))
    );

    if (filtered.length === 0) {
      DOM.noResults.classList.remove("hidden");
      DOM.noResults.querySelector("p").textContent = "Nessun giocatore corrisponde alla ricerca. Prova con un nome, un numero di maglia o una nazionalità.";
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
          .forEach((player, i) => cardsContainer.appendChild(createPlayerCard(player, i)));

        DOM.roles.appendChild(section);
      });
  };

  const updateFiltersUI = () => {
    const allBtn = document.querySelector('[data-filter="all"]');
    const allRoles = ["Portiere", "Difensore", "Centrocampista", "Attaccante"];
    const allSelected = allRoles.every((r) => activeFilters.includes(r));

    DOM.filters.forEach((btn) => {
      const filter = btn.dataset.filter;
      btn.classList.toggle("active", filter === "all" ? allSelected : activeFilters.includes(filter));
      btn.setAttribute("aria-pressed", btn.classList.contains("active") ? "true" : "false");
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
    const matches = players.filter(
      (p) =>
        p.nome.toLowerCase().includes(q) ||
        p.numero_di_maglia.toString().includes(query) ||
        p.nazionalita?.toLowerCase().includes(q) ||
        p.ruolo?.toLowerCase().includes(q)
    );

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

          item.innerHTML = `
            <span class="suggestion-jersey">${player.numero_di_maglia}</span>
            <span class="suggestion-name">${player.nome}</span>
          `;

          if (player.bandiera) {
            const flag = document.createElement("img");
            flag.src = player.bandiera;
            flag.alt = "";
            flag.className = "suggestion-flag";
            withFallback(flag, player.nazionalita);
            item.appendChild(flag);
          }

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

  DOM.search.addEventListener("input", (e) => generateSuggestions(e.target.value.trim()));
  DOM.search.addEventListener("focus", () => {
    const value = DOM.search.value.trim();
    if (value.length >= 2) generateSuggestions(value);
  });
  DOM.searchBtn.addEventListener("click", performSearch);

  DOM.search.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && selectedSuggestionIdx === -1) performSearch();

    if (!DOM.suggestions.classList.contains("hidden") && suggestionsList.length) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        selectedSuggestionIdx = Math.min(selectedSuggestionIdx + 1, suggestionsList.length - 1);
        updateSuggestionSelection();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        selectedSuggestionIdx = Math.max(selectedSuggestionIdx - 1, -1);
        updateSuggestionSelection();
      } else if (e.key === "Enter" && selectedSuggestionIdx >= 0) {
        e.preventDefault();
        DOM.search.value = suggestionsList[selectedSuggestionIdx].getAttribute("data-player-name");
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
      const allRoles = ["Portiere", "Difensore", "Centrocampista", "Attaccante"];

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

  DOM.loading.classList.remove("hidden");
  fetch("player.json")
    .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Risposta non valida"))))
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
      document.getElementById("retry-button")?.addEventListener("click", () => location.reload());
    });
});
