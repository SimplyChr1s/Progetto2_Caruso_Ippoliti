 // Variabili globali per il dataset e il filtro regione attivo
let erasmusCities = [], currentRegion = "all", recommendedCityIdGlobal = null;
 
// Alias rapido per getElementById
const $ = id => document.getElementById(id);
 
// Dizionario etichette per i parametri numerici
const labelMap = {
    quality_of_life: "Qualità della vita",
    services:        "Infrastrutture e servizi",
    sustainability:  "Sostenibilità ecologica"
};
 
// AVVIO APPLICAZIONE
document.addEventListener('DOMContentLoaded', () => {
 
    // Carica subito i dati dal file di testo
    loadDatasetFromFile();
 
    // Evento sulla barra di ricerca (searchBar è già presente nell'HTML di Caruso)
    const searchBar = $('searchBar');
    if (searchBar) {
        searchBar.addEventListener('input', () => {
            if (typeof renderExploreGrid === 'function') renderExploreGrid();
        });
    }

    const btnQuiz = $('btnOpenQuiz');
    if (btnQuiz) {
        btnQuiz.addEventListener('click', () => {
            // Quando Caruso aggiunge la modale quiz, questo blocco la aprirà
            const form    = $('techQuizForm');
            const result  = $('quizResultBox');
            const modal   = $('quizModal');
            if (form)   { form.reset(); form.classList.remove('hidden'); }
            if (result)  result.classList.add('hidden');
            if (modal)   modal.classList.remove('hidden');
        });
    }
 
});
 

// Legge il file dati_citta.txt tramite Fetch
function loadDatasetFromFile() {
    fetch('dati_citta.txt')
        .then(res => {
            if (!res.ok) throw new Error("File 'dati_citta.txt' non trovato. Avvia con Live Server.");
            return res.text();
        })
        .then(txt => {
            parseTextData(txt);       // Converte il testo in oggetti
            populateSelectMenus();    // Riempie i menu select di confronto
            if (typeof renderExploreGrid === 'function') renderExploreGrid(); // Disegna le card (
        })
        .catch(err => {
            const errBox = $('errorMessage');
            if (errBox) { errBox.textContent = err.message; errBox.classList.remove('hidden'); }
            else console.error("ERRORE DATI:", err.message);
        });
}
 
// Converte le righe "Nome|Paese|Regione|..." in oggetti JavaScript
function parseTextData(rawText) {
    let idCounter = 1;
    rawText.split('\n').forEach(line => {
        if (!line.trim() || line.startsWith('#')) return; // Salta righe vuote e commenti
        const p = line.split('|');
        if (p.length >= 9) {
            erasmusCities.push({
                id:             idCounter++,
                name:           p[0].trim(),
                country:        p[1].trim(),
                region:         p[2].trim(),
                quality_of_life: parseInt(p[3]),
                services:       parseInt(p[4]),
                sustainability: parseInt(p[5]),
                rent_cost:      parseInt(p[6]),
                mobility:       p[7].trim(),
                lifestyle:      p[8].trim()
            });
        }
    });
}
 
// Popola i due menu <select> di confronto con le città caricate, usando il nome come testo e l'id come valore
function populateSelectMenus() {
    const sel1 = $('compareSelect1');
    const sel2 = $('compareSelect2');
    erasmusCities.forEach(c => {
        if (sel1) sel1.add(new Option(c.name, c.id));
        if (sel2) sel2.add(new Option(c.name, c.id));
    });
}