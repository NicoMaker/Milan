// Rendering della timeline: chip competizione, voce stagione, lista completa.
Object.assign(MilanHomeApp.prototype, {
  // Risolve l'icona di una competizione leggendo il json separato dei loghi:
  // - "Serie A": il logo può cambiare di anno in anno -> cerca per year, con
  //   fallback sull'anno più recente disponibile.
  // - Tutte le altre competizioni: logo fisso, sempre lo stesso.
  resolveIcon(logos, comp, year) {
    if (!logos) return undefined;
    if (comp.name === "Serie A") {
      if (logos.serieA?.[year]) return logos.serieA[year];
      const years = Object.keys(logos.serieA || {}).sort();
      return years.length ? logos.serieA[years.at(-1)] : undefined;
    }
    return logos.competitions?.[comp.name];
  },

  createCompChip(comp, isSerieAWinner, year, logos) {
    const li = document.createElement("li");
    const isWinner = comp.winner || (comp.name === "Serie A" && isSerieAWinner);
    li.className = `comp-chip${isWinner ? " won" : ""}`;
    const img = document.createElement("img");
    img.src = this.resolveIcon(logos, comp, year);
    img.alt = "";
    img.loading = "lazy";
    this.withFallback(img, comp.name);
    const span = document.createElement("span");
    span.textContent = comp.name;
    li.append(img, span);
    return li;
  },

  createEntry(season, index, logos) {
    const isChampion = season.position === 1;
    const isPending = typeof season.position !== "number";

    const entry = document.createElement("article");
    entry.className = `timeline-entry${isChampion ? " is-champion" : ""}`;
    entry.style.setProperty("--i", index);

    const marker = document.createElement("div");
    marker.className = "timeline-marker";
    const [y1, y2] = this.shortYear(season.year).split("/");
    marker.innerHTML = `${y1}<span class="marker-year-end">/${y2}</span>`;
    entry.appendChild(marker);

    const card = document.createElement("div");
    card.className = "timeline-card";

    const top = document.createElement("div");
    top.className = "card-top";

    if (isPending) {
      top.innerHTML = `
        <span class="position-numeral">–</span>
        <div class="position-meta">
          <h2 class="season-title">Stagione ${season.year}</h2>
          <span class="position-label">Classifica non ancora definita</span>
        </div>
        <span class="pending-tag"><span class="pending-dot"></span>In corso</span>
      `;
    } else {
      top.innerHTML = `
        <span class="position-numeral">${this.ordinal(season.position)}</span>
        <div class="position-meta">
          <h2 class="season-title">Stagione ${season.year}</h2>
          <span class="position-label">${season.position === 1 ? "Campione d'Italia" : `posto in Serie A`}</span>
        </div>
        ${isChampion ? `<span class="champion-tag">${this.ICONS.trophy}Scudetto</span>` : ""}
      `;
    }
    card.appendChild(top);

    if (season.competitions?.length) {
      const list = document.createElement("ul");
      list.className = "competitions-row";
      season.competitions.forEach((comp) =>
        list.appendChild(
          this.createCompChip(comp, isChampion, season.year, logos),
        ),
      );
      card.appendChild(list);
    }

    const link = document.createElement("a");
    link.className = "view-link";
    link.href = season.link;
    link.innerHTML = `Vedi rosa completa ${this.ICONS.arrow}`;
    card.appendChild(link);

    entry.appendChild(card);
    return entry;
  },

  renderTimeline(seasons, logos) {
    this.DOM.timeline.innerHTML = "";
    const fragment = document.createDocumentFragment();
    seasons.forEach((season, i) =>
      fragment.appendChild(this.createEntry(season, i, logos)),
    );
    this.DOM.timeline.appendChild(fragment);
  },
});
