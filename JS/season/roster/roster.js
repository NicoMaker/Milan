// Rendering della rosa (sezioni per ruolo + card) e stato dei filtri attivi.
Object.assign(MilanSeasonApp.prototype, {
  renderPlayers() {
    this.DOM.roles.innerHTML = "";

    if (this.activeFilters.length === 0) {
      this.DOM.noResults.classList.remove("hidden");
      this.DOM.noResults.querySelector("p").textContent =
        "Seleziona almeno un ruolo per vedere la rosa.";
      return;
    }

    const term = this.searchTerm.toLowerCase();
    const filtered = this.players.filter((p) => {
      if (!this.activeFilters.includes(p.ruolo)) return false;
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
      this.DOM.noResults.classList.remove("hidden");
      this.DOM.noResults.querySelector("p").textContent =
        "Nessun giocatore corrisponde alla ricerca. Prova con un nome, un numero di maglia, una nazionalità o un luogo.";
      return;
    }

    this.DOM.noResults.classList.add("hidden");

    const grouped = Object.groupBy(filtered, (p) => p.ruolo || "Sconosciuto");
    const fragment = document.createDocumentFragment();

    Object.keys(grouped)
      .sort((a, b) => this.ROLE_ORDER.indexOf(a) - this.ROLE_ORDER.indexOf(b))
      .forEach((role, idx) => {
        const section = document.createElement("section");
        section.className = "role-section";
        section.style.animationDelay = `${idx * 0.15}s`;

        const heading = document.createElement("h2");
        heading.textContent = this.ROLE_PLURALS[role] || role;
        section.appendChild(heading);

        const cardsContainer = document.createElement("div");
        cardsContainer.className = "role-cards";
        grouped[role]
          .sort(
            (a, b) => Number(a.numero_di_maglia) - Number(b.numero_di_maglia),
          )
          .forEach((player, i) =>
            cardsContainer.appendChild(this.createPlayerCard(player, i)),
          );
        section.appendChild(cardsContainer);

        fragment.appendChild(section);
      });

    this.DOM.roles.appendChild(fragment);
  },

  updateFiltersUI() {
    const allSelected = this.ALL_ROLES.every((r) =>
      this.activeFilters.includes(r),
    );

    this.DOM.filters.forEach((btn) => {
      const filter = btn.dataset.filter;
      const isActive =
        filter === "all" ? allSelected : this.activeFilters.includes(filter);
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  },

  // --- Filtri per ruolo ---
  bindFilters() {
    this.DOM.filters.forEach((btn) => {
      btn.addEventListener("click", () => {
        const filter = btn.dataset.filter;

        if (filter === "all") {
          this.activeFilters =
            this.activeFilters.length === 4 ? [] : [...this.ALL_ROLES];
        } else if (this.activeFilters.includes(filter)) {
          this.activeFilters = this.activeFilters.filter((f) => f !== filter);
        } else {
          this.activeFilters.push(filter);
          if (this.activeFilters.length === 4) {
            this.activeFilters = [...this.ALL_ROLES];
          }
        }

        this.updateFiltersUI();
        this.renderPlayers();
      });
    });
  },
});
