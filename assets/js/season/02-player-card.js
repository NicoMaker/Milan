// Costruzione della card giocatore (fronte/retro) e del blocco nazionalità.
// Produce solo markup semantico: l'aspetto è delegato interamente al CSS.
Object.assign(MilanSeasonApp.prototype, {
  // --- Una riga "etichetta: bandiera + testo" nel retro della card ---
  createNationalityRow({ label, isBirth, flagUrl, text }) {
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
        this.createFlagElement(flagUrl, text, "flag-small", `${label} ${text}`),
      );
    }

    const textEl = document.createElement("span");
    textEl.className = "nationality-text";
    textEl.textContent = text;
    valueEl.appendChild(textEl);

    row.appendChild(valueEl);
    return row;
  },

  buildNationalityBlock(player) {
    const container = document.createElement("div");
    container.className = "nationality-info";

    container.appendChild(
      this.createNationalityRow({
        label: "Cittadinanza:",
        isBirth: false,
        flagUrl: this.getCitizenshipFlags(player)[0],
        text: this.getCitizenshipDisplay(player),
      }),
    );

    container.appendChild(
      this.createNationalityRow({
        label: "Nazione nascita:",
        isBirth: true,
        flagUrl: this.getBirthFlags(player)[0],
        text: this.getBirthDisplay(player),
      }),
    );

    return container;
  },

  createPlayerCard(player, index) {
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
      this.withFallback(
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
      const citizenshipUrl = this.getCitizenshipFlags(player)[0];
      const citizenshipText = this.getCitizenshipDisplay(player);
      if (citizenshipUrl) {
        citizenshipFlagFront.src = citizenshipUrl;
        citizenshipFlagFront.alt = `Cittadinanza: ${citizenshipText}`;
        citizenshipFlagFront.title = `Cittadinanza: ${citizenshipText}`;
        this.withFallback(citizenshipFlagFront, citizenshipText);
      } else {
        citizenshipFlagFront.classList.add("hidden");
      }
    }

    // Bandierina della nazione di nascita, accanto a quella di cittadinanza
    const birthFlagFront = card.querySelector(".birth-flag-front");
    if (birthFlagFront) {
      const birthUrl = this.getBirthFlags(player)[0];
      const birthText = this.getBirthDisplay(player);
      if (birthUrl) {
        birthFlagFront.src = birthUrl;
        birthFlagFront.alt = `Nazione di nascita: ${birthText}`;
        birthFlagFront.title = `Nazione di nascita: ${birthText}`;
        this.withFallback(birthFlagFront, birthText);
      } else {
        birthFlagFront.classList.add("hidden");
      }
    }

    // Nome giocatore (fronte + retro)
    card.querySelectorAll(".card-name").forEach((el) => {
      el.textContent = player.nome;
    });

    // Numero maglia (fronte e retro)
    card.querySelectorAll(".maglia").forEach((el) => {
      el.textContent = player.numero_di_maglia;
    });

    // Data di nascita + età
    const birthSpan = card.querySelector(".birth-date");
    if (birthSpan) {
      birthSpan.replaceChildren();
      birthSpan.append("Nato il ");
      const dateSpan = document.createElement("span");
      dateSpan.className = "formatted-date";
      dateSpan.textContent = this.formatDate(player.data_nascita);
      birthSpan.appendChild(dateSpan);

      const age = this.calculateAge(new Date(player.data_nascita));
      if (age !== null) {
        const ageSpan = document.createElement("span");
        ageSpan.className = "age";
        ageSpan.textContent = ` (${age} anni – stagione ${this.seasonDisplay})`;
        birthSpan.appendChild(ageSpan);
      }
    }

    // Ruolo
    const roleEl = card.querySelector(".role");
    if (roleEl) roleEl.textContent = player.ruolo || "Ruolo sconosciuto";

    // Nazionalità (cittadinanza + nascita)
    const nationalityEl = card.querySelector(".nationality");
    if (nationalityEl) {
      nationalityEl.replaceChildren(this.buildNationalityBlock(player));
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
  },
});
