// Caricamento dati (fetch) e avvio dell'applicazione.
Object.assign(MilanSeasonApp.prototype, {
  async loadData() {
    this.DOM.loading.classList.remove("hidden");
    try {
      const res = await fetch(this.playersUrl);
      if (!res.ok) throw new Error("Risposta non valida");
      this.players = await res.json();
      this.DOM.loading.classList.add("hidden");
      this.updateFiltersUI();
      this.renderPlayers();
    } catch (err) {
      console.error(err);
      this.DOM.loading.innerHTML = `
        <p>Non riusciamo a caricare la rosa. Verifica la connessione e riprova.</p>
        <button id="retry-button" class="filter-btn">Riprova</button>
      `;
      document
        .getElementById("retry-button")
        ?.addEventListener("click", () => location.reload());
    }
  },
});

// Inizializzazione
document.addEventListener("DOMContentLoaded", () => {
  const app = new MilanSeasonApp();
  app.init();
});
