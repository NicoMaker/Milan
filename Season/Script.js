document.addEventListener("DOMContentLoaded", () => {
  // Aggiorna footer
  document.getElementById("year").innerHTML = `<p>&copy; ${new Date().getFullYear()} A.C. Milan - Tutti i diritti riservati</p>`;

  // DOM Elements
  const DOM = {
    roles: document.getElementById("roles-container"),
    loading: document.getElementById("loading-indicator"),
    noResults: document.getElementById("no-results"),
    search: document.getElementById("search-input"),
    searchBtn: document.getElementById("search-button"),
    suggestions: document.getElementById("search-suggestions"),
    filters: document.querySelectorAll(".filter-btn")
  };

  // App State
  let players = [];
  let activeFilters = ["Portiere", "Difensore", "Centrocampista", "Attaccante"];
  let searchTerm = "";
  let suggestionsList = [];
  let selectedSuggestionIdx = -1;

  // Costanti
  const ROLE_ORDER = ["Portiere", "Difensore", "Centrocampista", "Attaccante", "Sconosciuto"];
  const ROLE_PLURALS = {
    Portiere: "Portieri",
    Difensore: "Difensori",
    Centrocampista: "Centrocampisti",
    Attaccante: "Attaccanti"
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return `${date.getDate().toString().padStart(2, '0')} ${["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"][date.getMonth()]} ${date.getFullYear()}`;
  };

  const createPlayerCard = (player, index) => {
    const card = document.getElementById("player-card-template").content.cloneNode(true).querySelector(".card");
    card.style.animationDelay = `${0.1 * index}s`;
    
    const img = card.querySelector(".card-img");
    img.src = player.immagine || "https://via.placeholder.com/150?text=No+Image";
    img.alt = player.nome;

    card.querySelectorAll("h3").forEach(el => el.textContent = player.nome);
    card.querySelectorAll(".maglia").forEach(el => el.textContent = player.numero_di_maglia);
    card.querySelector(".birth-date").innerHTML = `Nato il: <span class="formatted-date">${formatDate(player.data_nascita)}</span>`;

    if (player.bandiera) {
      const nationalityEl = card.querySelector(".nationality");
      nationalityEl.innerHTML = `<img src="${player.bandiera}" alt="Bandiera ${player.nazionalita}" class="flag">`;
    }

    card.addEventListener("click", () => card.classList.toggle("flipped"));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        card.classList.toggle("flipped");
      }
    });

    return card;
  };

  const renderPlayers = () => {
    DOM.roles.innerHTML = "";

    if (activeFilters.length === 0) {
      DOM.noResults.classList.remove("hidden");
      DOM.noResults.querySelector("p").textContent = "Seleziona almeno un ruolo per visualizzare i giocatori.";
      return;
    }

    const filtered = players.filter(p => 
      activeFilters.includes(p.ruolo) && 
      (searchTerm === "" || p.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
       p.numero_di_maglia.toString().includes(searchTerm) ||
       (p.nazionalita?.toLowerCase().includes(searchTerm.toLowerCase())))
    );

    if (filtered.length === 0) {
      DOM.noResults.classList.remove("hidden");
      DOM.noResults.querySelector("p").textContent = "Nessun giocatore trovato. Prova con un'altra ricerca.";
      return;
    }

    DOM.noResults.classList.add("hidden");

    // Raggruppa per ruolo
    const grouped = filtered.reduce((acc, p) => {
      const role = p.ruolo || "Sconosciuto";
      (acc[role] = acc[role] || []).push(p);
      return acc;
    }, {});

    Object.keys(grouped)
      .sort((a, b) => ROLE_ORDER.indexOf(a) - ROLE_ORDER.indexOf(b))
      .forEach((role, idx) => {
        const section = document.createElement("div");
        section.className = "role-section";
        section.style.animationDelay = `${idx * 0.2}s`;
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
    const allSelected = allRoles.every(r => activeFilters.includes(r));

    DOM.filters.forEach(btn => {
      const filter = btn.dataset.filter;
      if (filter === "all") {
        btn.classList.toggle("active", allSelected);
      } else {
        btn.classList.toggle("active", activeFilters.includes(filter));
      }
    });
  };

  const performSearch = () => {
    searchTerm = DOM.search.value.trim();
    DOM.suggestions.classList.add("hidden");
    renderPlayers();
  };

  const generateSuggestions = (query) => {
    if (query.length < 2) {
      DOM.suggestions.classList.add("hidden");
      return;
    }

    const matches = players.filter(p => 
      p.nome.toLowerCase().includes(query.toLowerCase()) ||
      p.numero_di_maglia.toString().includes(query) ||
      p.nazionalita?.toLowerCase().includes(query.toLowerCase()) ||
      p.ruolo?.toLowerCase().includes(query.toLowerCase())
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
      .forEach(role => {
        const header = document.createElement("div");
        header.className = "suggestion-category";
        header.textContent = ROLE_PLURALS[role] || `${role}s`;
        DOM.suggestions.appendChild(header);

        grouped[role].forEach(player => {
          const item = document.createElement("div");
          item.className = "suggestion-item";
          item.setAttribute("data-player-name", player.nome);
          
          item.innerHTML = `
            <span class="suggestion-jersey">${player.numero_di_maglia}</span>
            <span class="suggestion-name">${player.nome}</span>
            ${player.bandiera ? `<span class="suggestion-nationality"><img src="${player.bandiera}" alt="Bandiera ${player.nazionalita}" class="suggestion-flag"></span>` : ""}
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

  // Event Listeners
  DOM.search.addEventListener("input", (e) => generateSuggestions(e.target.value.trim()));
  DOM.search.addEventListener("focus", () => DOM.search.value.trim().length >= 2 && generateSuggestions(DOM.search.value.trim()));
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

  const updateSuggestionSelection = () => {
    suggestionsList.forEach((s, i) => {
      s.classList.toggle("selected", i === selectedSuggestionIdx);
      if (i === selectedSuggestionIdx) s.scrollIntoView({ block: "nearest" });
    });
  };

  document.addEventListener("click", (e) => {
    if (!DOM.suggestions.contains(e.target) && e.target !== DOM.search) {
      DOM.suggestions.classList.add("hidden");
    }
  });

  // Filter Logic
  DOM.filters.forEach(btn => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.filter;
      const allBtn = document.querySelector('[data-filter="all"]');
      const allRoles = ["Portiere", "Difensore", "Centrocampista", "Attaccante"];

      if (filter === "all") {
        if (activeFilters.length === 4) {
          activeFilters = [];
          allBtn.classList.remove("active");
        } else {
          activeFilters = [...allRoles];
          allBtn.classList.add("active");
          DOM.filters.forEach(f => f !== allBtn && f.classList.remove("active"));
        }
      } else {
        if (activeFilters.includes(filter)) {
          activeFilters = activeFilters.filter(f => f !== filter);
          allBtn.classList.remove("active");
        } else {
          activeFilters.push(filter);
          if (activeFilters.length === 4) {
            activeFilters = [...allRoles];
            allBtn.classList.add("active");
            DOM.filters.forEach(f => f !== allBtn && f.classList.remove("active"));
          }
        }
        updateFiltersUI();
      }
      renderPlayers();
    });
  });

  // Load Data
  DOM.loading.classList.remove("hidden");
  fetch("player.json")
    .then(res => res.ok ? res.json() : Promise.reject("Errore caricamento"))
    .then(data => {
      players = data;
      DOM.loading.classList.add("hidden");
      updateFiltersUI();
      renderPlayers();
    })
    .catch(err => {
      console.error(err);
      DOM.loading.innerHTML = `<p>Errore nel caricamento: ${err.message}</p><button id="retry-button" class="filter-btn">Riprova</button>`;
      document.getElementById("retry-button")?.addEventListener("click", () => location.reload());
    });
});