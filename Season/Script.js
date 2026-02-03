document.addEventListener("DOMContentLoaded", () => {
  // Elementi DOM
  const rolesContainer = document.getElementById("roles-container");
  const loadingIndicator = document.getElementById("loading-indicator");
  const noResults = document.getElementById("no-results");
  const searchInput = document.getElementById("search-input");
  const searchButton = document.getElementById("search-button");
  const searchSuggestions = document.getElementById("search-suggestions");
  const filterButtons = document.querySelectorAll(".filter-btn");
  const playerCardTemplate = document.getElementById("player-card-template");

  // Stato dell'applicazione
  let allPlayers = [];
  let selectedFilters = ["Portiere", "Difensore", "Centrocampista", "Attaccante"]; // Array per i filtri selezionati - inizializzato con tutti i ruoli
  let searchTerm = "";
  let selectedSuggestionIndex = -1;
  let visibleSuggestions = [];

  // Attiva visivamente tutti i pulsanti filtro all'avvio
  filterButtons.forEach((btn) => {
    btn.classList.add("active");
  });

  // Carica i dati dal file JSON
  fetch("player.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Errore nel recupero del file JSON");
      }
      return response.json();
    })
    .then((players) => {
      // Salva tutti i giocatori
      allPlayers = players;

      // Nascondi il caricamento
      loadingIndicator.classList.add("hidden");

      // Organizza e visualizza i giocatori
      displayPlayers();
    })
    .catch((error) => {
      console.error("Errore nel caricare i dati:", error);
      loadingIndicator.innerHTML = `
        <p>Si è verificato un errore nel caricamento dei dati.</p>
        <p>Dettaglio: ${error.message}</p>
        <button id="retry-button" class="filter-btn">Riprova</button>
      `;

      document.getElementById("retry-button")?.addEventListener("click", () => {
        window.location.reload();
      });
    });

  // Funzione per visualizzare i giocatori in base ai filtri
  function displayPlayers() {
    // Pulisci il contenitore
    rolesContainer.innerHTML = "";

    // Se nessun filtro selezionato, non mostrare nulla
    if (selectedFilters.length === 0) {
      noResults.classList.remove("hidden");
      noResults.querySelector("p").textContent = "Seleziona almeno un ruolo per visualizzare i giocatori.";
      return;
    }

    // Filtra i giocatori in base al ruolo e alla ricerca
    const filteredPlayers = allPlayers.filter((player) => {
      // Filtra per ruolo
      const roleMatch = selectedFilters.includes(player.ruolo);

      // Filtra per termine di ricerca
      const searchMatch =
        searchTerm === "" ||
        player.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.numero_di_maglia.toString().includes(searchTerm) ||
        (player.nazionalita &&
          player.nazionalita.toLowerCase().includes(searchTerm.toLowerCase()));

      return roleMatch && searchMatch;
    });

    // Mostra messaggio se non ci sono risultati
    if (filteredPlayers.length === 0) {
      noResults.classList.remove("hidden");
      noResults.querySelector("p").textContent = "Nessun giocatore trovato. Prova con un'altra ricerca.";
      return;
    } else {
      noResults.classList.add("hidden");
    }

    // Raggruppa i giocatori per ruolo
    const playersByRole = {};

    filteredPlayers.forEach((player) => {
      const role = player.ruolo || "Sconosciuto";
      if (!playersByRole[role]) {
        playersByRole[role] = [];
      }
      playersByRole[role].push(player);
    });

    // Ordine dei ruoli
    const roleOrder = [
      "Portiere",
      "Difensore",
      "Centrocampista",
      "Attaccante",
      "Sconosciuto",
    ];

    // Ordina i ruoli
    const sortedRoles = Object.keys(playersByRole).sort((a, b) => {
      return roleOrder.indexOf(a) - roleOrder.indexOf(b);
    });

    // Crea sezioni per ogni ruolo
    sortedRoles.forEach((role, roleIndex) => {
      // Ordina i giocatori per numero di maglia
      const players = playersByRole[role].sort(
        (a, b) =>
          Number.parseInt(a.numero_di_maglia) -
          Number.parseInt(b.numero_di_maglia)
      );

      // Crea la sezione
      const roleSection = document.createElement("div");
      roleSection.classList.add("role-section");
      roleSection.style.animationDelay = `${roleIndex * 0.2}s`;

      // Aggiungi il titolo del ruolo
      const roleTitle = document.createElement("h2");

      // Pluralizza il nome del ruolo
      let roleName = role;
      if (role === "Portiere") roleName = "Portieri";
      else if (role === "Difensore") roleName = "Difensori";
      else if (role === "Centrocampista") roleName = "Centrocampisti";
      else if (role === "Attaccante") roleName = "Attaccanti";

      roleTitle.textContent = roleName;
      roleSection.appendChild(roleTitle);

      // Crea il contenitore delle carte
      const roleCards = document.createElement("div");
      roleCards.classList.add("role-cards");

      // Aggiungi le carte per ogni giocatore
      players.forEach((player, index) => {
        const card = createPlayerCard(player, index, players.length);
        roleCards.appendChild(card);
      });

      roleSection.appendChild(roleCards);
      rolesContainer.appendChild(roleSection);
    });
  }

  // Funzione per formattare la data in formato italiano
  function formatDate(dateString) {
    const date = new Date(dateString);
    // Aggiungi lo zero davanti se il giorno è minore di 10
    const day = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate();
    const monthNames = [
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
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
  }

  // Funzione modificata per creare la card del giocatore
  function createPlayerCard(player, index, totalPlayers) {
    // Clona il template
    const card = playerCardTemplate.content
      .cloneNode(true)
      .querySelector(".card");

    // Imposta l'ordine di animazione con ritardo progressivo
    card.style.animationDelay = `${0.1 * index}s`;

    // Imposta i dati del giocatore
    const img = card.querySelector(".card-img");
    img.src =
      player.immagine || "https://via.placeholder.com/150?text=No+Image";
    img.alt = player.nome;

    // Imposta il nome
    const nameElements = card.querySelectorAll("h3");
    nameElements.forEach((el) => (el.textContent = player.nome));

    // Imposta il numero di maglia
    const magliaElements = card.querySelectorAll(".maglia");
    magliaElements.forEach((el) => (el.textContent = player.numero_di_maglia));

    // Imposta i dati aggiuntivi sul retro
    const formattedDate = formatDate(player.data_nascita);
    card.querySelector(
      ".birth-date"
    ).innerHTML = `Nato il: <span class="formatted-date">${formattedDate}</span>`;

    
    // Aggiungi solo la bandiera senza il testo della nazionalità
    const nationalityElement = card.querySelector(".nationality");
    if (nationalityElement && player.bandiera) {
      const flagImg = document.createElement("img");
      flagImg.src = player.bandiera;
      flagImg.alt = `Bandiera ${player.nazionalita}`;
      flagImg.classList.add("flag");

      nationalityElement.innerHTML = "";
      nationalityElement.appendChild(flagImg);
    }

    // Aggiungi l'evento per girare la carta
    card.addEventListener("click", () => {
      card.classList.toggle("flipped");
    });

    // Aggiungi supporto per tastiera
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        card.classList.toggle("flipped");
      }
    });

    return card;
  }

  // Funzione migliorata per generare suggerimenti di ricerca
  function generateSuggestions(query) {
    if (!query || query.length < 2) {
      searchSuggestions.classList.add("hidden");
      return;
    }

    // Pulisci i suggerimenti precedenti
    searchSuggestions.innerHTML = "";

    // Filtra i giocatori in base alla query (migliorata per essere più inclusiva)
    const matchingPlayers = allPlayers.filter(
      (player) =>
        player.nome.toLowerCase().includes(query.toLowerCase()) ||
        player.numero_di_maglia.toString().includes(query) ||
        (player.nazionalita &&
          player.nazionalita.toLowerCase().includes(query.toLowerCase())) ||
        (player.ruolo &&
          player.ruolo.toLowerCase().includes(query.toLowerCase()))
    );

    if (matchingPlayers.length === 0) {
      searchSuggestions.classList.add("hidden");
      return;
    }

    // Raggruppa i giocatori per ruolo
    const playersByRole = {};

    matchingPlayers.forEach((player) => {
      const role = player.ruolo || "Altro";
      if (!playersByRole[role]) {
        playersByRole[role] = [];
      }
      playersByRole[role].push(player);
    });

    // Ordine dei ruoli
    const roleOrder = [
      "Portiere",
      "Difensore",
      "Centrocampista",
      "Attaccante",
      "Altro",
    ];

    // Ordina i ruoli
    const sortedRoles = Object.keys(playersByRole).sort((a, b) => {
      return roleOrder.indexOf(a) - roleOrder.indexOf(b);
    });

    // Resetta l'array dei suggerimenti visibili
    visibleSuggestions = [];

    // Crea i suggerimenti per ogni ruolo
    sortedRoles.forEach((role) => {
      // Crea l'intestazione della categoria
      const categoryHeader = document.createElement("div");
      categoryHeader.classList.add("suggestion-category");

      // Pluralizza il nome del ruolo
      let roleName = role;
      if (role === "Portiere") roleName = "Portieri";
      else if (role === "Difensore") roleName = "Difensori";
      else if (role === "Centrocampista") roleName = "Centrocampisti";
      else if (role === "Attaccante") roleName = "Attaccanti";

      categoryHeader.textContent = roleName;
      searchSuggestions.appendChild(categoryHeader);

      // Aggiungi i giocatori di questa categoria
      playersByRole[role].forEach((player) => {
        const suggestionItem = document.createElement("div");
        suggestionItem.classList.add("suggestion-item");
        suggestionItem.setAttribute("role", "option");
        suggestionItem.setAttribute("tabindex", "-1");
        suggestionItem.setAttribute("data-player-name", player.nome);

        // Aggiungi il numero di maglia
        const jerseyNumber = document.createElement("span");
        jerseyNumber.classList.add("suggestion-jersey");
        jerseyNumber.textContent = player.numero_di_maglia;
        suggestionItem.appendChild(jerseyNumber);

        // Aggiungi il nome del giocatore
        const playerName = document.createElement("span");
        playerName.classList.add("suggestion-name");
        playerName.textContent = player.nome;
        suggestionItem.appendChild(playerName);

        // Aggiungi la nazionalità e la bandiera se disponibili (con dimensioni ridotte)
        if (player.nazionalita && player.bandiera) {
          const nationalityContainer = document.createElement("span");
          nationalityContainer.classList.add("suggestion-nationality");

          const flagImg = document.createElement("img");
          flagImg.src = player.bandiera;
          flagImg.alt = `Bandiera ${player.nazionalita}`;
          flagImg.classList.add("suggestion-flag");

          nationalityContainer.appendChild(flagImg);
          suggestionItem.appendChild(nationalityContainer);
        }

        // Aggiungi l'evento click
        suggestionItem.addEventListener("click", () => {
          searchInput.value = player.nome;
          searchSuggestions.classList.add("hidden");
          performSearch();
        });

        searchSuggestions.appendChild(suggestionItem);
        visibleSuggestions.push(suggestionItem);
      });
    });

    // Mostra i suggerimenti
    searchSuggestions.classList.remove("hidden");
    selectedSuggestionIndex = -1;
  }

  // Gestione dell'input di ricerca
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim();
    generateSuggestions(query);
  });

  // Gestione del focus sull'input di ricerca
  searchInput.addEventListener("focus", () => {
    if (searchInput.value.trim().length >= 2) {
      generateSuggestions(searchInput.value.trim());
    }
  });

  // Chiudi i suggerimenti quando si clicca fuori
  document.addEventListener("click", (e) => {
    if (!searchSuggestions.contains(e.target) && e.target !== searchInput) {
      searchSuggestions.classList.add("hidden");
    }
  });

  // Gestione della navigazione con tastiera
  searchInput.addEventListener("keydown", (e) => {
    // Se i suggerimenti non sono visibili, non fare nulla
    if (searchSuggestions.classList.contains("hidden")) {
      return;
    }

    // Naviga tra i suggerimenti con i tasti freccia
    if (e.key === "ArrowDown") {
      e.preventDefault();
      selectedSuggestionIndex = Math.min(
        selectedSuggestionIndex + 1,
        visibleSuggestions.length - 1
      );
      updateSelectedSuggestion();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, -1);
      updateSelectedSuggestion();
    } else if (e.key === "Enter" && selectedSuggestionIndex >= 0) {
      e.preventDefault();
      const selectedSuggestion = visibleSuggestions[selectedSuggestionIndex];
      searchInput.value = selectedSuggestion.getAttribute("data-player-name");
      searchSuggestions.classList.add("hidden");
      performSearch();
    } else if (e.key === "Escape") {
      e.preventDefault();
      searchSuggestions.classList.add("hidden");
    }
  });

  // Aggiorna la selezione visiva dei suggerimenti
  function updateSelectedSuggestion() {
    visibleSuggestions.forEach((suggestion, index) => {
      if (index === selectedSuggestionIndex) {
        suggestion.classList.add("selected");
        suggestion.scrollIntoView({ block: "nearest" });
      } else {
        suggestion.classList.remove("selected");
      }
    });
  }

  // Gestione della ricerca
  searchButton.addEventListener("click", performSearch);
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && selectedSuggestionIndex === -1) {
      performSearch();
    }
  });

  function performSearch() {
    searchTerm = searchInput.value.trim();
    searchSuggestions.classList.add("hidden");
    displayPlayers();
  }

  // Gestione dei filtri con selezione multipla
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;

      if (filter === "all") {
        // Se clicco su "Tutti"
        if (button.classList.contains("active")) {
          // Se "Tutti" è già attivo, lo disattivo e deseleziono tutto
          button.classList.remove("active");
          selectedFilters = [];
          // Rimuovi active da tutti gli altri bottoni
          filterButtons.forEach((btn) => {
            if (btn.dataset.filter !== "all") {
              btn.classList.remove("active");
            }
          });
        } else {
          // Attivo "Tutti" e seleziono tutti i ruoli
          button.classList.add("active");
          selectedFilters = ["Portiere", "Difensore", "Centrocampista", "Attaccante"];
          // Attiva tutti gli altri bottoni
          filterButtons.forEach((btn) => {
            btn.classList.add("active");
          });
        }
      } else {
        // Clicco su un ruolo specifico
        if (button.classList.contains("active")) {
          // Rimuovo il ruolo dai filtri
          button.classList.remove("active");
          const index = selectedFilters.indexOf(filter);
          if (index > -1) {
            selectedFilters.splice(index, 1);
          }
          // Disattivo "Tutti" se un ruolo viene deselezionato
          const allButton = document.querySelector('[data-filter="all"]');
          allButton.classList.remove("active");
        } else {
          // Aggiungo il ruolo ai filtri
          button.classList.add("active");
          selectedFilters.push(filter);
          
          // Se tutti i ruoli sono selezionati, attivo anche "Tutti"
          const allRoles = ["Portiere", "Difensore", "Centrocampista", "Attaccante"];
          const allSelected = allRoles.every(role => selectedFilters.includes(role));
          if (allSelected) {
            const allButton = document.querySelector('[data-filter="all"]');
            allButton.classList.add("active");
          }
        }
      }

      // Aggiorna la visualizzazione
      displayPlayers();
    });
  });

  // Aggiorna l'anno nel footer
  document.getElementById("year").innerHTML = `
     <p>&copy; ${new Date().getFullYear()} A.C. Milan - Tutti i diritti riservati</p>`;
});