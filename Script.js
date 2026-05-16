document.addEventListener("DOMContentLoaded", () => {
  // Aggiorna anno nel footer
  document.getElementById("current-year").textContent = new Date().getFullYear();

  const DOM = {
    seasons: document.getElementById("seasons-container"),
    loading: document.getElementById("loading-container")
  };

  const createChampionBadge = () => {
    const badge = document.createElement("div");
    badge.className = "champion-badge";
    badge.title = "Campione d'Italia";
    badge.innerHTML = `<svg class="trophy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>`;
    return badge;
  };

  const createCompetitionItem = (comp, isSerieAWinner) => {
    const item = document.createElement("div");
    item.className = "competition-item";
    
    const isWinner = comp.winner || (comp.name === "Serie A" && isSerieAWinner);
    if (isWinner) item.classList.add("competition-winner");

    item.innerHTML = `
      <img class="competition-icon" src="${comp.icon}" alt="${comp.name}">
      <span class="competition-name">${comp.name}</span>
      ${isWinner ? `<div class="winner-badge" title="Vincitore"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12M15 7a4 4 0 1 0-8 0M17.8 11.8c.4-.7.7-1.5.7-2.3a5.5 5.5 0 0 0-5.5-5.5c0-1.4-1.1-2.5-2.5-2.5S8 2.6 8 4a5.5 5.5 0 0 0-5.5 5.5c0 .8.3 1.6.7 2.3"/></svg></div>` : ""}
    `;
    return item;
  };

  const createSeasonCard = (season, index) => {
    const card = document.createElement("div");
    card.className = "season-card";
    card.style.animationDelay = `${index * 0.1}s`;

    const isChampion = season.isChampion || season.position === 1;
    if (isChampion) card.appendChild(createChampionBadge());

    card.innerHTML += `
      <div class="season-header"><h3>Stagione ${season.year}</h3></div>
      <div class="season-content">
        <div class="season-info">
          <div class="position-container">
            <div class="position-badge">${season.position}</div>
            <div class="position-text">${season.position === 1 ? "Campione d'Italia" : `${season.position}° posto in Serie A`}</div>
          </div>
          ${season.competitions?.length ? `
            <div class="competitions-container">
              <div class="competitions-title">Competizioni</div>
              <div class="competitions-grid" style="grid-template-columns: repeat(2, 1fr)"></div>
            </div>
          ` : ""}
        </div>
        <a class="view-button" href="${season.link}">Visualizza Rosa</a>
      </div>
    `;

    // Aggiungi competizioni dinamicamente
    if (season.competitions?.length) {
      const grid = card.querySelector(".competitions-grid");
      season.competitions.forEach(comp => {
        grid.appendChild(createCompetitionItem(comp, season.position === 1));
      });
    }

    return card;
  };

  const renderSeasons = (seasons) => {
    DOM.seasons.innerHTML = "";
    seasons.forEach((season, i) => DOM.seasons.appendChild(createSeasonCard(season, i)));
  };

  const showError = (message) => {
    DOM.loading.innerHTML = `<p>${message}</p><button onclick="location.reload()" class="retry-button">Riprova</button>`;
  };

  fetch("data.json")
    .then(res => res.ok ? res.json() : Promise.reject("Errore nel caricamento"))
    .then(data => {
      DOM.loading.style.display = "none";
      renderSeasons(data.seasons);
    })
    .catch(err => {
      console.error(err);
      showError("Errore nel caricamento dei dati. Riprova più tardi.");
    });
});