/* ============================================================
   TAALKEUZE
   Twee kleine dingen, meer niet:

     1. Onthouden welke taal de bezoeker zelf kiest, zodat de
        suggestie hieronder daarna niet meer in de weg zit.
     2. Eén keer voorstellen om naar de andere taal te gaan
        wanneer de browsertaal niet bij deze pagina past.

   Er wordt nooit automatisch omgeleid. De bezoeker beslist.

   De doel-URL komt uit de <link rel="alternate" hreflang="…">
   die al in de <head> staat, zodat een adres maar op één plek
   in de pagina hoeft te staan.

   De keuze wordt opgeslagen in localStorage. Dat is strikt
   noodzakelijke, functionele opslag voor een voorkeur die de
   bezoeker zelf aangeeft: geen tracking, geen profiel, en de
   waarde verlaat het apparaat niet.
   ============================================================ */

(function () {
    "use strict";

    var SLEUTEL = "avdb-taal";
    var WACHT = 1200;      /* de suggestie valt niet over de eerste indruk heen */

    var huidig = (document.documentElement.lang || "nl").toLowerCase().split("-")[0];


    /* =========================
       OPSLAG
       Een privévenster of geblokkeerde site-instellingen laten
       localStorage gooien. Dat mag de pagina nooit breken.
    ========================= */

    function lees() {
        try {
            return window.localStorage.getItem(SLEUTEL);
        } catch (fout) {
            return null;
        }
    }

    function schrijf(waarde) {
        try {
            window.localStorage.setItem(SLEUTEL, waarde);
        } catch (fout) {
            /* niets aan te doen, en niet erg */
        }
    }


    /* =========================
       DE ANDERE TAAL VAN DEZE PAGINA
    ========================= */

    function zoekAlternatief() {
        var links = document.querySelectorAll('link[rel="alternate"][hreflang]');

        for (var i = 0; i < links.length; i++) {
            var code = (links[i].getAttribute("hreflang") || "").toLowerCase().split("-")[0];

            if (code && code !== "x" && code !== huidig) {
                return { taal: code, url: links[i].href };
            }
        }

        return null;
    }


    /* =========================
       DE KNOP IN DE NAVBAR
       Kiest de bezoeker zelf een taal, dan is dat vanaf nu de
       voorkeur en hoeft er niets meer voorgesteld te worden.
    ========================= */

    var knop = document.querySelector(".lang-switch");

    if (knop) {
        knop.addEventListener("click", function () {
            var gekozen = (knop.getAttribute("hreflang") || "").toLowerCase().split("-")[0];
            if (gekozen) schrijf(gekozen);
        });
    }


    /* =========================
       WELKE TAAL WIL DEZE BEZOEKER?
       Een eerdere keuze weegt zwaarder dan de browserinstelling.
       Spreekt de browser geen van beide talen, dan is Engels de
       breedste tweede taal.
    ========================= */

    function voorkeur() {
        var bewaard = lees();
        if (bewaard === "nl" || bewaard === "en") return bewaard;

        var talen = (navigator.languages && navigator.languages.length)
            ? navigator.languages
            : [navigator.language || ""];

        for (var i = 0; i < talen.length; i++) {
            var code = String(talen[i]).toLowerCase().split("-")[0];
            if (code === "nl") return "nl";
            if (code === "en") return "en";
        }

        return "en";
    }


    /* =========================
       DE SUGGESTIE
    ========================= */

    var TEKSTEN = {
        en: {
            tekst: "This page is also available in English.",
            ga: "Read in English",
            nee: "No thanks",
            sluit: "Dismiss"
        },
        nl: {
            tekst: "Deze pagina is er ook in het Nederlands.",
            ga: "Lees in het Nederlands",
            nee: "Nee, bedankt",
            sluit: "Sluiten"
        }
    };

    function toon(doel) {
        var woorden = TEKSTEN[doel.taal];
        if (!woorden) return;

        var blok = document.createElement("aside");
        blok.className = "lang-hint";
        blok.setAttribute("role", "note");
        blok.lang = doel.taal;

        var tekst = document.createElement("p");
        tekst.className = "lang-hint-tekst";
        tekst.textContent = woorden.tekst;

        var acties = document.createElement("div");
        acties.className = "lang-hint-acties";

        var ga = document.createElement("a");
        ga.className = "lang-hint-ga";
        ga.href = doel.url;
        ga.hreflang = doel.taal;
        ga.textContent = woorden.ga;

        var nee = document.createElement("button");
        nee.className = "lang-hint-nee";
        nee.type = "button";
        nee.textContent = woorden.nee;

        var sluit = document.createElement("button");
        sluit.className = "lang-hint-sluit";
        sluit.type = "button";
        sluit.setAttribute("aria-label", woorden.sluit);
        sluit.textContent = "✕";

        acties.appendChild(ga);
        acties.appendChild(nee);

        blok.appendChild(sluit);
        blok.appendChild(tekst);
        blok.appendChild(acties);

        document.body.appendChild(blok);

        /* Eerst in de pagina, dan pas laten verschijnen. Anders
           slaat de browser de overgang over. */
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                blok.classList.add("is-visible");
            });
        });

        function weg() {
            blok.classList.remove("is-visible");
            setTimeout(function () {
                if (blok.parentNode) blok.parentNode.removeChild(blok);
            }, 400);
        }

        /* Gaat de bezoeker mee, dan is dat vanaf nu de voorkeur. */
        ga.addEventListener("click", function () {
            schrijf(doel.taal);
        });

        /* Zegt de bezoeker nee, dan blijft deze taal de voorkeur
           en wordt er niets meer voorgesteld. */
        function nietMeer() {
            schrijf(huidig);
            weg();
        }

        nee.addEventListener("click", nietMeer);
        sluit.addEventListener("click", nietMeer);

        document.addEventListener("keydown", function (gebeurtenis) {
            if (gebeurtenis.key === "Escape" && blok.parentNode) nietMeer();
        });
    }


    /* =========================
       STARTEN
    ========================= */

    var alternatief = zoekAlternatief();
    if (!alternatief) return;

    var gewenst = voorkeur();

    /* De bezoeker zit al goed, of de andere taal is niet de taal
       die hij zoekt. In beide gevallen: niets doen. */
    if (gewenst === huidig || gewenst !== alternatief.taal) return;

    setTimeout(function () {
        toon(alternatief);
    }, WACHT);

})();