/* =========================
   TEKSTEN
   De labels in de kaart staan in de HTML en zijn daar al vertaald.
   Deze paar woorden zet het script zelf neer, dus die volgen hier
   de taal van de pagina (het lang-attribuut op <html>).

   Een taal toevoegen: één blok erbij, meer niet.
========================= */

const PerfTaal = (function () {

    const TEKSTEN = {
        nl: {
            gemeten: "gemeten",
            geenMeting: "niet in deze browser",
            deels: "deels gemeten",
            goed: "Binnen richtwaarden",
            aandacht: "Aandachtspunt"
        },
        en: {
            gemeten: "measured",
            geenMeting: "not in this browser",
            deels: "partly measured",
            goed: "Within targets",
            aandacht: "Needs attention"
        }
    };

    const code = (document.documentElement.lang || "nl").toLowerCase().split("-")[0];

    return TEKSTEN[code] || TEKSTEN.nl;
})();


/* =========================
   LIVE PRESTATIEMETING
   Meet hoe snel deze pagina zelf laadt, in de browser van de
   bezoeker. Leest alleen gegevens over deze pagina - er wordt
   niets van het apparaat uitgelezen, opgeslagen of verstuurd.
========================= */

(function () {

    "use strict";


    const kaart = document.getElementById("perfCard");
    if (!kaart) return;


    const metaEl = document.getElementById("perfMeta");
    const balkEl = document.getElementById("perfBar");

    const rustig = window.matchMedia("(prefers-reduced-motion: reduce)").matches;


    /* Richtwaarden voor de twee laadmetingen die hieronder worden getoond */

    const grensLcp = 2500;
    const grensFcp = 1800;


    let lcp = null;


    /* =========================
       METEN
    ========================= */

    /* Grootste element bijhouden zolang de pagina laadt */

    if (window.PerformanceObserver) {

        try {

            const kijker = new PerformanceObserver(function (lijst) {

                const items = lijst.getEntries();
                const laatste = items[items.length - 1];

                if (laatste) lcp = laatste.startTime;
            });

            kijker.observe({
                type: "largest-contentful-paint",
                buffered: true
            });
        }
        catch (e) {
            /* Browser ondersteunt deze meting niet */
        }
    }


    function eersteWeergave() {

        const verf = performance.getEntriesByType("paint");

        const fcp = verf.find(function (item) {
            return item.name === "first-contentful-paint";
        });

        return fcp ? fcp.startTime : null;
    }


    function domKlaar() {

        const nav = performance.getEntriesByType("navigation")[0];

        return nav ? nav.domContentLoadedEventEnd : null;
    }


    function bronnen() {

        const lijst = performance.getEntriesByType("resource");

        let bytes = 0;

        lijst.forEach(function (item) {
            bytes += item.transferSize || 0;
        });

        const nav = performance.getEntriesByType("navigation")[0];

        if (nav) {
            bytes += nav.transferSize || 0;
        }

        return {
            aantal: lijst.length + 1,
            kb: Math.round(bytes / 1024)
        };
    }


    /* =========================
       TONEN
    ========================= */

    function zetWaarde(id, tekst, oordeel, stil) {

        const el = document.getElementById(id);
        if (!el) return;

        el.textContent = tekst;

        if (oordeel) el.classList.add("goed");
        if (stil) el.classList.add("stil");
    }


    /* Getal laten oplopen naar de eindwaarde */

    function telOp(id, eind, achtervoegsel, oordeel) {

        const el = document.getElementById(id);
        if (!el) return;

        if (rustig) {
            zetWaarde(id, eind + achtervoegsel, oordeel, false);
            return;
        }

        const duur = 700;
        const start = performance.now();


        function frame(nu) {

            const deel = Math.min(1, (nu - start) / duur);
            const soepel = 1 - Math.pow(1 - deel, 3);

            el.textContent = Math.round(eind * soepel) + achtervoegsel;

            if (deel < 1) {
                requestAnimationFrame(frame);
                return;
            }

            if (oordeel) {
                el.classList.add("goed");
            }
        }


        requestAnimationFrame(frame);
    }


    function toon() {

        const fcp = eersteWeergave();
        const dom = domKlaar();
        const res = bronnen();

        if (balkEl) {
            balkEl.classList.add("done");
        }

        if (metaEl) {
            metaEl.textContent = PerfTaal.gemeten;
        }


        /* Eerste weergave */

        if (fcp !== null) {
            telOp("perfFcp", Math.round(fcp), " ms", fcp < grensFcp);
        }
        else {
            zetWaarde("perfFcp", PerfTaal.geenMeting, false, true);
        }


        /* Grootste element */

        if (lcp !== null) {
            telOp("perfLcp", Math.round(lcp), " ms", lcp < grensLcp);
        }
        else {
            zetWaarde("perfLcp", PerfTaal.geenMeting, false, true);
        }


        /* Pagina klaar voor gebruik */

        if (dom !== null) {
            telOp("perfDom", Math.round(dom), " ms", dom < 2000);
        }
        else {
            zetWaarde("perfDom", PerfTaal.geenMeting, false, true);
        }


        /* Verzoeken en gewicht */

        telOp("perfReq", res.aantal, "");
        telOp("perfKb", res.kb, " KB", res.kb < 500);


        /* Samenvatting onderaan - bewust geen volledige Core Web Vitals-score. */

        if (lcp === null || fcp === null) {
            zetWaarde("perfScore", PerfTaal.deels, false, true);
            return;
        }

        const goed = lcp < grensLcp && fcp < grensFcp;

        zetWaarde(
            "perfScore",
            goed ? PerfTaal.goed : PerfTaal.aandacht,
            goed
        );
    }


    /* =========================
       START
    ========================= */

    function begin() {

        if (balkEl) {
            balkEl.classList.add("running");
        }

        /* Even wachten zodat de laatste metingen binnen zijn */

        setTimeout(toon, rustig ? 0 : 900);
    }


    if (document.readyState === "complete") {
        begin();
    }
    else {
        window.addEventListener("load", begin, { once: true });
    }

})();