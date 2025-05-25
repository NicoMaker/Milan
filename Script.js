document.addEventListener("DOMContentLoaded", () => {
    // Aggiorna l'anno corrente nel footer
    document.getElementById("current-year").textContent = new Date().getFullYear()

    // Elementi DOM
    const seasonsContainer = document.getElementById("seasons-container")
    const loadingContainer = document.getElementById("loading-container")

    // Carica i dati dal file JSON
    fetch("data.json")
        .then((response) => {
            if (!response.ok) {
                throw new Error("Errore nel caricamento dei dati")
            }
            return response.json()
        })
        .then((data) => {
            // Nascondi il loader
            loadingContainer.style.display = "none"

            // Genera le card delle stagioni
            renderSeasons(data.seasons)
        })
        .catch((error) => {
            console.error("Errore:", error)
            loadingContainer.innerHTML = `
                <p>Errore nel caricamento dei dati. Riprova più tardi.</p>
                <button onclick="location.reload()" class="retry-button">Riprova</button>
            `
        })

    // Funzione per generare le card delle stagioni
    function renderSeasons(seasons) {
        seasons.forEach((season, index) => {
            // Crea la card della stagione
            const seasonCard = document.createElement("div")
            seasonCard.className = "season-card"
            seasonCard.style.animationDelay = `${index * 0.1}s`

            // Aggiungi badge per i campioni d'Italia (se isChampion è true O se position è 1)
            if (season.isChampion || season.position === 1) {
                const championBadge = document.createElement("div")
                championBadge.className = "champion-badge"
                championBadge.innerHTML = `
                    <svg class="trophy-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                        <path d="M4 22h16"></path>
                        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
                        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
                        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
                    </svg>
                `
                championBadge.title = "Campione d'Italia"
                seasonCard.appendChild(championBadge)
            }

            // Crea l'header della stagione
            const seasonHeader = document.createElement("div")
            seasonHeader.className = "season-header"
            seasonHeader.innerHTML = `<h3>Stagione ${season.year}</h3>`

            // Crea il contenuto della stagione
            const seasonContent = document.createElement("div")
            seasonContent.className = "season-content"

            // Crea le informazioni della stagione
            const seasonInfo = document.createElement("div")
            seasonInfo.className = "season-info"

            // Aggiungi la posizione in campionato
            const positionContainer = document.createElement("div")
            positionContainer.className = "position-container"

            const positionBadge = document.createElement("div")
            positionBadge.className = "position-badge"
            positionBadge.textContent = season.position

            const positionText = document.createElement("div")
            positionText.className = "position-text"

            // Testo in base alla posizione
            let positionDescription
            if (season.position === 1) {
                positionDescription = "Campione d'Italia"
            }
            else {
                positionDescription = `${season.position}° posto in Serie A`
            }

            positionText.textContent = positionDescription

            positionContainer.appendChild(positionBadge)
            positionContainer.appendChild(positionText)
            seasonInfo.appendChild(positionContainer)

            // Aggiungi le competizioni
            if (season.competitions && season.competitions.length > 0) {
                const competitionsContainer = document.createElement("div")
                competitionsContainer.className = "competitions-container"

                const competitionsTitle = document.createElement("div")
                competitionsTitle.className = "competitions-title"
                competitionsTitle.textContent = "Competizioni"
                competitionsContainer.appendChild(competitionsTitle)

                const competitionsGrid = document.createElement("div")
                competitionsGrid.className = "competitions-grid"

                // Sempre 2 colonne per una migliore visualizzazione
                competitionsGrid.style.gridTemplateColumns = "repeat(2, 1fr)"

                // Aggiungi ogni competizione
                season.competitions.forEach((competition) => {
                    const competitionItem = document.createElement("div")
                    competitionItem.className = "competition-item"

                    // Aggiungi classe speciale se il Milan ha vinto questa competizione
                    if (competition.winner || (competition.name === "Serie A" && season.position === 1)) {
                        competitionItem.classList.add("competition-winner")
                    }

                    const competitionIcon = document.createElement("img")
                    competitionIcon.className = "competition-icon"
                    competitionIcon.src = competition.icon
                    competitionIcon.alt = competition.name

                    const competitionName = document.createElement("span")
                    competitionName.className = "competition-name"
                    competitionName.textContent = competition.name

                    // Aggiungi badge di vittoria se il Milan ha vinto questa competizione
                    // o se è Serie A e position è 1
                    if (competition.winner || (competition.name === "Serie A" && season.position === 1)) {
                        const winnerBadge = document.createElement("div")
                        winnerBadge.className = "winner-badge"
                        winnerBadge.title = "Vincitore"
                        winnerBadge.innerHTML = `
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12"></path>
                                <path d="M15 7a4 4 0 1 0-8 0"></path>
                                <path d="M17.8 11.8c.4-.7.7-1.5.7-2.3a5.5 5.5 0 0 0-5.5-5.5c0-1.4-1.1-2.5-2.5-2.5S8 2.6 8 4a5.5 5.5 0 0 0-5.5 5.5c0 .8.3 1.6.7 2.3"></path>
                            </svg>
                        `
                        competitionItem.appendChild(winnerBadge)
                    }

                    competitionItem.appendChild(competitionIcon)
                    competitionItem.appendChild(competitionName)
                    competitionsGrid.appendChild(competitionItem)
                })

                competitionsContainer.appendChild(competitionsGrid)
                seasonInfo.appendChild(competitionsContainer)
            }

            // Crea il pulsante per visualizzare la rosa
            const viewButton = document.createElement("a")
            viewButton.className = "view-button"
            viewButton.href = season.link
            viewButton.textContent = "Visualizza Rosa"

            // Assembla la card
            seasonContent.appendChild(seasonInfo)
            seasonContent.appendChild(viewButton)

            seasonCard.appendChild(seasonHeader)
            seasonCard.appendChild(seasonContent)

            // Aggiungi la card al container
            seasonsContainer.appendChild(seasonCard)
        })
    }
})
