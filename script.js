// Variabili globali per il dataset e l'ordinamento corrente
let cittaErasmus = [];
let testoRicercaCorrente = "";
let ordinamentoCorrente = "qualita_vita";

// Alias rapido per getElementById
const $ = id => document.getElementById(id);

// AVVIO APPLICAZIONE
document.addEventListener("DOMContentLoaded", () => {
    caricaDatiDaFile();           // Carica subito i dati dal file di testo
    configuraEventiRicerca();     // Collega la barra di ricerca
    configuraEventiOrdinamento(); // Collega il menu di ordinamento
    configuraFinestreModali();    // Collega i pulsanti di apertura/chiusura modali
    configuraEventiQuiz();        // Collega il form del quiz di orientamento
});

// Legge il file dati_citta.txt tramite Fetch API (richiede Live Server, non doppio clic)
async function caricaDatiDaFile() {
    try {
        const risposta = await fetch('dati_citta.txt');
        if (!risposta.ok) throw new Error("File 'dati_citta.txt' non trovato. Usa Live Server.");
        const testo = await risposta.text();
        parseDati(testo);            // Converte il testo in oggetti JavaScript
        popolaMenuConfronto();       // Riempie i menu <select> del confronto
        renderizzaGrigliaCitta();    // Disegna le card nella griglia
    } catch (errore) {
        console.error("Errore caricamento dati:", errore);
        const msgErrore = $("errorMessage");
        if (msgErrore) {
            msgErrore.textContent = errore.message; // Mostra errore a schermo se esiste l'elemento
            msgErrore.classList.remove("nascosto");
        }
    }
}

// Converte le righe "Nome|Paese|Regione|..." in oggetti JavaScript
// Formato atteso: Nome|Paese|Regione|QualitàVita|Servizi|Sostenibilità|Affitto|Mobilità|Settori
function parseDati(rawText) {
    const righe = rawText.split('\n').filter(r => r.trim() && !r.startsWith('#')); // Salta righe vuote e commenti
    cittaErasmus = righe.map(riga => {
        const parti = riga.split('|').map(p => p.trim());
        if (parti.length < 9) return null; // Salta righe malformate
        // Genera un ID sicuro dal nome: minuscolo, senza accenti, spazi sostituiti da _
        const idTesto = parti[0].toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, "_");
        return {
            id:            idTesto,
            nome:          parti[0],
            paese:         parti[1],
            regione:       parti[2],
            qualita_vita:  parseInt(parti[3]) || 0,
            servizi:       parseInt(parti[4]) || 0,
            sostenibilita: parseInt(parti[5]) || 0,
            costo_affitto: parseInt(parti[6]) || 0,
            mobilita:      parti[7],
            settori:       parti[8]
        };
    }).filter(c => c !== null); // Rimuove le righe non valide
}

// Popola i due menu <select> di confronto con le città caricate, ordinate alfabeticamente
function popolaMenuConfronto() {
    const menu1 = $("selezionaCitta1");
    const menu2 = $("selezionaCitta2");
    if (!menu1 || !menu2) return;
    menu1.innerHTML = '<option value="" disabled selected>Scegli la prima città...</option>';
    menu2.innerHTML = '<option value="" disabled selected>Scegli la seconda città...</option>';
    const cittaOrdinate = [...cittaErasmus].sort((a, b) => a.nome.localeCompare(b.nome)); // Ordine alfabetico
    cittaOrdinate.forEach(c => {
        menu1.appendChild(new Option(`${c.nome} (${c.paese})`, c.id));
        menu2.appendChild(new Option(`${c.nome} (${c.paese})`, c.id));
    });
}

// Disegna le card nella griglia, applicando il filtro testo e l'ordinamento correnti
function renderizzaGrigliaCitta() {
    const griglia = $("grigliaCitta");
    if (!griglia) return;
    griglia.innerHTML = ""; // Svuota la griglia prima di ridisegnare

    // Filtra per testo cercato su nome, paese e settori
    let cittaFiltrate = cittaErasmus.filter(c => {
        const term = testoRicercaCorrente.toLowerCase();
        return c.nome.toLowerCase().includes(term) ||
               c.paese.toLowerCase().includes(term) ||
               c.settori.toLowerCase().includes(term);
    });

    // Ordina: affitto crescente (più economico prima), tutto il resto decrescente
    if (ordinamentoCorrente === "costo_affitto") {
        cittaFiltrate.sort((a, b) => a.costo_affitto - b.costo_affitto);
    } else {
        cittaFiltrate.sort((a, b) => b[ordinamentoCorrente] - a[ordinamentoCorrente]);
    }

    if (cittaFiltrate.length === 0) {
        griglia.innerHTML = `<p style="grid-column:1/-1; text-align:center; padding:3rem;">Nessuna città trovata.</p>`;
        return;
    }

    cittaFiltrate.forEach(c => {
        const card = document.createElement("div");
        card.className = "card-citta";
        card.setAttribute("onclick", `apriDettaglioCitta('${c.id}')`); // Apre la scheda al clic
        card.innerHTML = `
            <div class="card-immagine" style="background-image: url('Immagini/${c.id}.jpg');">
                <h3>${c.nome}</h3>
            </div>
            <div class="card-info">
                <div class="testo-riga"><span>Qualità della Vita</span><span>${c.qualita_vita}/100</span></div>
                <div class="barra-grigia"><div class="barra-riempimento" style="width: ${c.qualita_vita}%;"></div></div>
                <div class="testo-riga"><span>Infrastrutture e Servizi</span><span>${c.servizi}/100</span></div>
                <div class="barra-grigia"><div class="barra-riempimento" style="width: ${c.servizi}%;"></div></div>
                <div class="testo-riga"><span>Sostenibilità Ecologica</span><span>${c.sostenibilita}/100</span></div>
                <div class="barra-grigia"><div class="barra-riempimento" style="width: ${c.sostenibilita}%;"></div></div>
                <div class="testo-riga" style="margin-top:0.5rem; border-top:1px solid #e2e8f0; padding-top:0.5rem;">
                    <span>Alloggio stimato:</span><span><strong>€ ${c.costo_affitto}/mese</strong></span>
                </div>
            </div>
        `;
        griglia.appendChild(card);
    });
}

// Collega la barra di ricerca: aggiorna il testo corrente e ridisegna la griglia ad ogni tasto
function configuraEventiRicerca() {
    const inputCerca = $("inputCerca");
    if (inputCerca) {
        inputCerca.addEventListener("input", (e) => {
            testoRicercaCorrente = e.target.value;
            renderizzaGrigliaCitta();
        });
    }
}

// Collega il menu di ordinamento: cambia criterio e ridisegna la griglia
function configuraEventiOrdinamento() {
    const selectOrdine = $("selezionaOrdine");
    if (selectOrdine) {
        selectOrdine.addEventListener("change", (e) => {
            ordinamentoCorrente = e.target.value;
            renderizzaGrigliaCitta();
        });
    }
}

// Configura tutti i pulsanti di apertura e chiusura delle finestre modali
function configuraFinestreModali() {

    // Pulsante "Confronta" — avvia il confronto tra le due città selezionate
    const btnConfronta = $("bottoneConfronta");
    if (btnConfronta) btnConfronta.onclick = eseguiConfronto;

    // Pulsanti X di chiusura modali
    const btnChiudiConfronto = $("chiudiConfronto");
    if (btnChiudiConfronto) btnChiudiConfronto.onclick = () => $("finestraConfronto").classList.add("nascosto");

    const btnChiudiDettaglio = $("chiudiDettaglio");
    if (btnChiudiDettaglio) btnChiudiDettaglio.onclick = () => $("finestraDettaglio").classList.add("nascosto");

    const btnChiudiQuiz = $("chiudiQuiz");
    if (btnChiudiQuiz) btnChiudiQuiz.onclick = () => $("finestraQuiz").classList.add("nascosto");

    // Clic sullo sfondo oscurato chiude la finestra corrispondente
    ["finestraConfronto", "finestraDettaglio", "finestraQuiz"].forEach(idModale => {
        const modale = $(idModale);
        if (modale) {
            modale.addEventListener("click", (e) => {
                if (e.target === modale) modale.classList.add("nascosto"); // Chiude solo se clic fuori dalla finestra
            });
        }
    });

    // Pulsante "Scopri la città più adatta a te" — apre il quiz
    const btnApriQuiz = $("bottoneApriQuiz");
    if (btnApriQuiz) {
        btnApriQuiz.onclick = () => {
            const form = $("moduloQuiz");
            const risultato = $("risultatoQuiz");
            if (form)     { form.reset(); form.classList.remove("nascosto"); } // Resetta il form ad ogni apertura
            if (risultato)  risultato.classList.add("nascosto");
            $("finestraQuiz").classList.remove("nascosto");
        };
    }
}

// Esegue il confronto tra le due città selezionate nei menu a tendina
function eseguiConfronto() {
    const id1 = $("selezionaCitta1").value;
    const id2 = $("selezionaCitta2").value;

    if (!id1 || !id2) { alert("Seleziona due città per il confronto."); return; }
    if (id1 === id2)  { alert("Scegli due città diverse."); return; }

    const citta1 = cittaErasmus.find(c => c.id === id1);
    const citta2 = cittaErasmus.find(c => c.id === id2);
    if (!citta1 || !citta2) return;

    // Aggiorna le intestazioni della finestra di confronto
    $("nomeVsA").textContent          = citta1.nome;
    $("paeseVsA").textContent         = citta1.paese;
    $("nomeVsB").textContent          = citta2.nome;
    $("paeseVsB").textContent         = citta2.paese;
    $("colonnaCittaA").textContent    = citta1.nome;
    $("colonnaCittaB").textContent    = citta2.nome;
    $("tableHeaderCityA").textContent = citta1.nome;
    $("tableHeaderCityB").textContent = citta2.nome;

    // Genera le barre di confronto parametrico
    const contenitoreBarre = $("contenitoreBarre");
    contenitoreBarre.innerHTML = "";

    const parametri = [
        { chiave: "qualita_vita",  etichetta: "Qualità della vita",      inverso: false },
        { chiave: "servizi",       etichetta: "Infrastrutture e servizi", inverso: false },
        { chiave: "sostenibilita", etichetta: "Sostenibilità ecologica",  inverso: false },
        { chiave: "costo_affitto", etichetta: "Costo dell'alloggio",      inverso: true  } // Inverso: affitto basso = meglio
    ];

    parametri.forEach(p => {
        const val1 = citta1[p.chiave];
        const val2 = citta2[p.chiave];
        let classe1 = "neutro", classe2 = "neutro";

        if (val1 !== val2) {
            if (!p.inverso) {
                // Punteggio più alto = verde (vantaggioso)
                classe1 = val1 > val2 ? "vantaggioso" : "svantaggioso";
                classe2 = val2 > val1 ? "vantaggioso" : "svantaggioso";
            } else {
                // Per l'affitto: valore più basso = verde (vantaggioso)
                classe1 = val1 < val2 ? "vantaggioso" : "svantaggioso";
                classe2 = val2 < val1 ? "vantaggioso" : "svantaggioso";
            }
        }

        const maxRif = p.chiave === "costo_affitto" ? 1200 : 100; // Base di riferimento per la percentuale
        const perc1  = (val1 / maxRif) * 100;
        const perc2  = (val2 / maxRif) * 100;

        const riga = document.createElement("div");
        riga.className = "riga-statistica-confronto";
        riga.innerHTML = `
            <div class="testo-parametro-centrato">${p.etichetta}</div>
            <div class="riga-barra-doppia-orizzontale">
                <div class="blocco-singolo-barra">
                    <div class="eticetta-valore-citta">${citta1.nome}: ${p.chiave === "costo_affitto" ? "€ " : ""}${val1}</div>
                    <div class="barra-grigia"><div class="barra-riempimento ${classe1}" style="width: ${perc1}%;"></div></div>
                </div>
                <div class="blocco-singolo-barra">
                    <div class="eticetta-valore-citta">${citta2.nome}: ${p.chiave === "costo_affitto" ? "€ " : ""}${val2}</div>
                    <div class="barra-grigia"><div class="barra-riempimento ${classe2}" style="width: ${perc2}%;"></div></div>
                </div>
            </div>
        `;
        contenitoreBarre.appendChild(riga);
    });

    // Tabella con i dati qualitativi (mobilità, settori, regione)
    $("corpoTabellaConfronto").innerHTML = `
        <tr><td><strong>Macroregione</strong></td><td>${citta1.regione}</td><td>${citta2.regione}</td></tr>
        <tr><td><strong>Mobilità Interna</strong></td><td>${citta1.mobilita}</td><td>${citta2.mobilita}</td></tr>
        <tr><td><strong>Settori di Studio</strong></td><td>${citta1.settori}</td><td>${citta2.settori}</td></tr>
    `;

    disegnaGraficoRadar(citta1, citta2); // Disegna il grafico radar sul Canvas
    $("finestraConfronto").classList.remove("nascosto");
}

// Disegna il grafico radar su Canvas 2D nativo (nessuna libreria esterna)
function disegnaGraficoRadar(c1, c2) {
    const canvas   = $("disegnoRadar");
    const ctx      = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Pulisce il canvas prima di ridisegnare

    const centroX   = canvas.width  / 2;
    const centroY   = canvas.height / 2;
    const raggioMax = 120;

    const assi      = ["Qualità Vita", "Servizi", "Sostenibilità", "Affitto"];
    const valoriC1  = [c1.qualita_vita, c1.servizi, c1.sostenibilita, Math.min(100, (c1.costo_affitto / 1200) * 100)];
    const valoriC2  = [c2.qualita_vita, c2.servizi, c2.sostenibilita, Math.min(100, (c2.costo_affitto / 1200) * 100)];

    // Cerchi concentrici di riferimento al 25%, 50%, 75% e 100%
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth   = 1;
    for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        ctx.arc(centroX, centroY, (raggioMax / 4) * i, 0, 2 * Math.PI);
        ctx.stroke();
    }

    // 4 assi radiali (90° ciascuno, partendo dall'alto)
    ctx.fillStyle = "#64748b";
    ctx.font      = "bold 11px system-ui";
    const angoli  = assi.map((_, idx) => (Math.PI / 2) * idx - Math.PI / 2);

    angoli.forEach((angolo, i) => {
        const x = centroX + Math.cos(angolo) * raggioMax;
        const y = centroY + Math.sin(angolo) * raggioMax;
        ctx.beginPath();
        ctx.moveTo(centroX, centroY);
        ctx.lineTo(x, y); // Disegna l'asse radiale
        ctx.stroke();
        let dx = Math.cos(angolo) * 20; // Offset per evitare sovrapposizione con la linea
        let dy = Math.sin(angolo) * 12;
        if (i === 0 || i === 2) dx -= 25;
        ctx.fillText(assi[i], x + dx, y + dy);
    });

    // Disegna il poligono colorato di una città sui 4 assi
    const disegnaPoligono = (valori, coloreFill, coloreStroke) => {
        ctx.beginPath();
        valori.forEach((val, i) => {
            const raggio = (val / 100) * raggioMax;
            const x = centroX + Math.cos(angoli[i]) * raggio;
            const y = centroY + Math.sin(angoli[i]) * raggio;
            if (i === 0) ctx.moveTo(x, y);
            else         ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fillStyle   = coloreFill;   ctx.fill();
        ctx.strokeStyle = coloreStroke; ctx.lineWidth = 2; ctx.stroke();
    };

    disegnaPoligono(valoriC1, "rgba(0, 82, 255, 0.2)", "#0052ff");  // Città A in blu
    disegnaPoligono(valoriC2, "rgba(255, 75, 75, 0.2)",  "#ff4b4b"); // Città B in rosso
}

// Apre la scheda dettaglio di una singola città (chiamata al clic su una card)
function apriDettaglioCitta(idCitta) {
    const citta = cittaErasmus.find(c => c.id === idCitta);
    if (!citta) return;

    $("dettaglioNome").textContent          = citta.nome;
    $("dettaglioPaeseRegione").textContent  = `${citta.paese} — Macroregione: ${citta.regione}`;
    $("dettaglioImmagine").style.backgroundImage = `url('Immagini/${citta.id}.jpg')`; // Immagine di sfondo dinamica

    // Griglia dei punteggi e dati operativi
    $("dettaglioPunteggi").innerHTML = `
        <div class="box-punteggio-singolo"><span>Qualità della Vita</span><strong>${citta.qualita_vita} / 100</strong></div>
        <div class="box-punteggio-singolo"><span>Infrastrutture e Servizi</span><strong>${citta.servizi} / 100</strong></div>
        <div class="box-punteggio-singolo"><span>Sostenibilità Verde</span><strong>${citta.sostenibilita} / 100</strong></div>
        <div class="box-punteggio-singolo"><span>Costo Alloggio Medio</span><strong>€ ${citta.costo_affitto} / mese</strong></div>
        <div class="box-punteggio-singolo"><span>Mobilità Urbana</span><strong>${citta.mobilita}</strong></div>
        <div class="box-punteggio-singolo"><span>Indirizzo di Studio</span><strong>${citta.settori}</strong></div>
    `;

    // Testi generati dinamicamente per le recensioni dei docenti
    $("reportProfSimone").textContent = `La città di ${citta.nome} presenta un ecosistema favorevole per i percorsi di formazione in ${citta.settori}. Le infrastrutture didattiche sono certificate e integrate a livello europeo. Valutazione complessiva del coordinamento: ampiamente positiva.`;
    $("reportProfChiara").textContent  = `L'alloggio a ${citta.nome} comporta una spesa media di € ${citta.costo_affitto} mensili. Si raccomanda di avviare le ricerche della stanza con almeno tre mesi di anticipo. La mobilità interna si attesta su livelli di efficienza classificati come "${citta.mobilita}".`;

    $("finestraDettaglio").classList.remove("nascosto");
}

// Gestisce l'invio del quiz di orientamento e calcola la città più adatta
function configuraEventiQuiz() {
    const moduloQuiz = $("moduloQuiz");
    if (!moduloQuiz) return;

    moduloQuiz.addEventListener("submit", (e) => {
        e.preventDefault(); // Impedisce il ricaricamento della pagina
        const corsoScelto  = moduloQuiz.elements["corso"].value;
        const budgetScelto = moduloQuiz.elements["budget"].value;
        const priorita     = moduloQuiz.elements["importance"].value;

        let migliorCitta = null;
        let punteggioMax = -1;

        cittaErasmus.forEach(c => {
            let punteggio = 0;
            if (c.settori.toLowerCase().includes(corsoScelto.toLowerCase())) punteggio += 15; // +15 se il settore corrisponde
            if (budgetScelto === "basso" && c.costo_affitto <= 500) punteggio += 10;          // +10 se il budget è rispettato
            else if (budgetScelto === "alto" && c.costo_affitto > 500) punteggio += 5;
            punteggio += (c[priorita] * 0.2); // Aggiunge il 20% del parametro scelto come priorità
            if (punteggio > punteggioMax) { punteggioMax = punteggio; migliorCitta = c; }
        });

        if (migliorCitta) {
            moduloQuiz.classList.add("nascosto"); // Nasconde il form
            $("nomeCittaConsigliata").textContent = `${migliorCitta.nome} (${migliorCitta.paese})`;
            $("spiegazioneRisultato").textContent = `In base al tuo interesse per l'area "${corsoScelto}", questa destinazione è ottimale. Costo alloggio stimato: € ${migliorCitta.costo_affitto}/mese.`;
            $("risultatoQuiz").classList.remove("nascosto"); // Mostra il box risultato

            // Pulsante "Mostra nella Griglia" — scorre e evidenzia la card consigliata
            const btnVai = $("bottoneVaiACitta");
            if (btnVai) {
                btnVai.onclick = () => {
                    $("finestraQuiz").classList.add("nascosto");
                    $("inputCerca").value = "";
                    testoRicercaCorrente  = "";
                    renderizzaGrigliaCitta();
                    const cardEvidenziata = document.querySelector(`.card-citta[onclick*="${migliorCitta.id}"]`);
                    if (cardEvidenziata) {
                        cardEvidenziata.classList.add("evidenziata");                          // Aggiunge bordo verde
                        cardEvidenziata.scrollIntoView({ behavior: "smooth", block: "center" });
                        setTimeout(() => cardEvidenziata.classList.remove("evidenziata"), 5000); // Rimuove dopo 5 secondi
                    }
                };
            }
        }
    });
}