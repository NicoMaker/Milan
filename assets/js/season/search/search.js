// Ricerca giocatori: input, suggerimenti con autocomplete e navigazione da tastiera.
Object.assign(MilanSeasonApp.prototype, {
  closeSuggestions() {
    this.DOM.suggestions.classList.add("hidden");
    this.DOM.search.setAttribute("aria-expanded", "false");
    this.DOM.search.removeAttribute("aria-activedescendant");
    this.selectedSuggestionIdx = -1;
  },

  performSearch() {
    this.searchTerm = this.DOM.search.value.trim();
    this.closeSuggestions();
    this.renderPlayers();
  },

  updateSuggestionSelection() {
    this.suggestionsList.forEach((s, i) => {
      const isSelected = i === this.selectedSuggestionIdx;
      s.classList.toggle("selected", isSelected);
      s.setAttribute("aria-selected", isSelected ? "true" : "false");
      if (isSelected) {
        s.scrollIntoView({ block: "nearest" });
        this.DOM.search.setAttribute("aria-activedescendant", s.id);
      }
    });
    if (this.selectedSuggestionIdx === -1) {
      this.DOM.search.removeAttribute("aria-activedescendant");
    }
  },

  buildSuggestionFlags(player) {
    const wrap = document.createElement("span");
    wrap.className = "suggestion-flags";

    const citizenshipFlags = this.getCitizenshipFlags(player);
    citizenshipFlags.forEach((f) => {
      const img = this.createFlagElement(
        f,
        "Cittadinanza",
        "suggestion-flag",
        "Cittadinanza",
      );
      wrap.appendChild(img);
    });

    if (this.hasDualNationality(player)) {
      const birthFlags = this.getBirthFlags(player).filter(
        (f) => f !== citizenshipFlags[0],
      );
      birthFlags.forEach((f) => {
        const img = this.createFlagElement(
          f,
          "Nazionalità di nascita",
          "suggestion-flag is-birth-flag",
          "Nazionalità di nascita",
        );
        wrap.appendChild(img);
      });
    }

    return wrap;
  },

  generateSuggestions(query) {
    if (query.length < 2) {
      this.closeSuggestions();
      return;
    }

    const q = query.toLowerCase();
    const matches = this.players.filter((p) =>
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
      this.closeSuggestions();
      return;
    }

    this.DOM.suggestions.innerHTML = "";
    this.suggestionsList = [];

    const grouped = Object.groupBy(matches, (p) => p.ruolo || "Altro");
    let optionIndex = 0;

    Object.keys(grouped)
      .sort((a, b) => this.ROLE_ORDER.indexOf(a) - this.ROLE_ORDER.indexOf(b))
      .forEach((role) => {
        const header = document.createElement("div");
        header.className = "suggestion-category";
        header.textContent = this.ROLE_PLURALS[role] || role;
        this.DOM.suggestions.appendChild(header);

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

          let nationalityText = this.getCitizenshipDisplay(player);
          const birthText = this.getBirthDisplay(player);
          if (birthText && birthText !== nationalityText) {
            nationalityText += ` (nato ${birthText})`;
          }
          const nationality = document.createElement("span");
          nationality.className = "suggestion-nationality";
          nationality.textContent = nationalityText;

          item.append(
            jersey,
            name,
            nationality,
            this.buildSuggestionFlags(player),
          );

          item.addEventListener("click", () => {
            this.DOM.search.value = player.nome;
            this.closeSuggestions();
            this.performSearch();
          });

          this.DOM.suggestions.appendChild(item);
          this.suggestionsList.push(item);
        });
      });

    this.DOM.suggestions.classList.remove("hidden");
    this.DOM.search.setAttribute("aria-expanded", "true");
    this.selectedSuggestionIdx = -1;
  },

  bindSearch() {
    const debouncedSuggestions = this.debounce((value) =>
      this.generateSuggestions(value),
    );

    this.DOM.search.addEventListener("input", (e) =>
      debouncedSuggestions(e.target.value.trim()),
    );
    this.DOM.search.addEventListener("focus", () => {
      const value = this.DOM.search.value.trim();
      if (value.length >= 2) this.generateSuggestions(value);
    });
    this.DOM.searchBtn.addEventListener("click", () => this.performSearch());

    this.DOM.search.addEventListener("keydown", (e) => {
      const suggestionsOpen =
        !this.DOM.suggestions.classList.contains("hidden") &&
        this.suggestionsList.length;

      if (e.key === "Enter" && this.selectedSuggestionIdx === -1) {
        this.performSearch();
        return;
      }

      if (!suggestionsOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        this.selectedSuggestionIdx = Math.min(
          this.selectedSuggestionIdx + 1,
          this.suggestionsList.length - 1,
        );
        this.updateSuggestionSelection();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        this.selectedSuggestionIdx = Math.max(
          this.selectedSuggestionIdx - 1,
          -1,
        );
        this.updateSuggestionSelection();
      } else if (e.key === "Enter" && this.selectedSuggestionIdx >= 0) {
        e.preventDefault();
        this.DOM.search.value =
          this.suggestionsList[this.selectedSuggestionIdx].dataset.playerName;
        this.closeSuggestions();
        this.performSearch();
      } else if (e.key === "Escape") {
        this.closeSuggestions();
      }
    });

    document.addEventListener("click", (e) => {
      if (
        !this.DOM.suggestions.contains(e.target) &&
        e.target !== this.DOM.search
      ) {
        this.closeSuggestions();
      }
    });
  },
});
