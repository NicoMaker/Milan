// Caricamento dati (fetch), gestione errore, avvio dell'applicazione.
Object.assign(MilanHomeApp.prototype, {
  async fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Risposta non valida per ${url}`);
    return res.json();
  },

  showError() {
    this.DOM.loading.innerHTML = `
      <p>Non riusciamo a caricare l'archivio delle stagioni.</p>
      <button class="retry-button" id="retry-button">Riprova</button>
    `;
    document
      .getElementById("retry-button")
      .addEventListener("click", () => location.reload());
  },

  async loadData() {
    try {
      const [data, logos] = await Promise.all([
        this.fetchJSON("data.json"),
        this.fetchJSON("assets/data/logos.json"),
      ]);
      this.DOM.loading.classList.add("hidden");
      this.renderTimeline(data.seasons, logos);
    } catch (err) {
      console.error(err);
      this.showError();
    }
  },
});

// Inizializzazione
document.addEventListener("DOMContentLoaded", () => {
  const app = new MilanHomeApp();
  app.init();
});
