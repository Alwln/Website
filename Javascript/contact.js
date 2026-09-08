/* ============================================================
   CONTACT

   Drie dingen, meer niet. Het versturen van het formulier blijft
   in shared.js, dat wordt hier bewust niet overgenomen.

   1. De klok van Utrecht
   2. De rail die meeloopt met de verplichte velden
   3. De onderwerpregel, die ook echt het onderwerp schrijft
   ============================================================ */

(function () {
    "use strict";


    /* =========================
       1. DE KLOK VAN UTRECHT

       De tijd komt uit Europe/Amsterdam, niet uit de klok van de
       bezoeker. Zit hij in een andere tijdzone, dan zetten we zijn
       eigen tijd erachter. Zonder Javascript blijft de zin staan
       die al in de HTML stond.
    ========================= */

    var klok     = document.getElementById("klok");
    var klokTijd = document.getElementById("klokTijd");
    var klokTekst = document.getElementById("klokTekst");

    function utrechtNu() {
        var delen = new Intl.DateTimeFormat("en-GB", {
            timeZone: "Europe/Amsterdam",
            weekday: "short",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        }).formatToParts(new Date());

        var uit = {};
        delen.forEach(function (deel) { uit[deel.type] = deel.value; });

        return {
            dag: uit.weekday,
            uur: parseInt(uit.hour, 10) % 24,
            minuut: uit.minute
        };
    }

    function toestand(nu) {
        var weekend = nu.dag === "Sat" || nu.dag === "Sun";

        if (weekend) {
            return {
                staat: "weekend",
                tekst: "in Utrecht · weekend, maandag pak ik het op"
            };
        }

        if (nu.uur >= 9 && nu.uur < 18) {
            return {
                staat: "open",
                tekst: "in Utrecht · ik zit achter mijn bureau"
            };
        }

        if (nu.uur >= 7 && nu.uur < 22) {
            return {
                staat: "avond",
                tekst: "in Utrecht · buiten kantooruren, ik lees mee"
            };
        }

        return {
            staat: "nacht",
            tekst: "in Utrecht · je bericht staat er morgenochtend"
        };
    }

    function eigenTijd() {
        return new Intl.DateTimeFormat("nl-NL", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        }).format(new Date());
    }

    function tekenKlok() {
        if (!klok || !klokTijd || !klokTekst) {
            return;
        }

        var nu = utrechtNu();
        var hier = ("0" + nu.uur).slice(-2) + ":" + nu.minuut;
        var stand = toestand(nu);

        klokTijd.textContent = hier;
        klokTekst.textContent = stand.tekst;
        klok.setAttribute("data-state", stand.staat);

        /* Alleen tonen als de bezoeker echt ergens anders zit */

        var daar = eigenTijd();
        var elders = klok.querySelector(".klok-elders");

        if (daar !== hier) {
            if (!elders) {
                elders = document.createElement("span");
                elders.className = "klok-elders";
                klok.appendChild(elders);
            }

            elders.textContent = "bij jou " + daar;
        }
        else if (elders) {
            elders.remove();
        }
    }

    tekenKlok();
    setInterval(tekenKlok, 30000);


    /* =========================
       2 EN 3. RAIL EN ONDERWERPREGEL

       Beide hangen aan dezelfde velden, dus ze luisteren naar
       dezelfde gebeurtenis.
    ========================= */

    var formulier = document.getElementById("contact-form");
    if (!formulier) {
        return;
    }

    var rail       = document.getElementById("aanvraagRail");
    var voorbeeld  = document.getElementById("regelVoorbeeld");
    var onderwerp  = document.getElementById("veld-onderwerp");

    var naam       = document.getElementById("veld-naam");
    var bedrijf    = document.getElementById("veld-bedrijf");
    var mail       = document.getElementById("veld-mail");
    var bericht    = document.getElementById("veld-bericht");
    var dienst     = document.getElementById("veld-dienst");
    var budget     = document.getElementById("veld-budget");


    /* De rail telt alleen wat verplicht is. Zo staat hij vol op het
       moment dat je daadwerkelijk kunt versturen, en geen seconde eerder. */

    function vulRail() {
        if (!rail) {
            return;
        }

        var klaar = 0;

        if (naam && naam.value.trim().length > 1) {
            klaar++;
        }

        if (
            mail &&
            mail.value.trim() !== "" &&
            mail.checkValidity()
        ) {
            klaar++;
        }

        if (
            bericht &&
            bericht.value.trim().length >= 10
        ) {
            klaar++;
        }

        rail.style.transform =
            "scaleY(" + (klaar / 3) + ")";
    }


    /* De regel die straks in de inbox staat. Wat hier staat is precies
       wat er verstuurd wordt, want dezelfde tekst gaat het onderwerpveld in. */

    function schrijfOnderwerp() {
        var delen = ["Aanvraag"];

        var wie = naam
            ? naam.value.trim()
            : "";

        var waar = bedrijf
            ? bedrijf.value.trim()
            : "";

        if (wie && waar) {
            delen.push(wie + " (" + waar + ")");
        }
        else if (wie) {
            delen.push(wie);
        }
        else if (waar) {
            delen.push(waar);
        }

        if (dienst && dienst.value) {
            delen.push(dienst.value);
        }

        if (
            budget &&
            budget.value &&
            budget.value !== "Weet ik nog niet"
        ) {
            delen.push(budget.value);
        }

        var regel =
            delen.length > 1
                ? delen.join(" · ")
                : "Aanvraag · —";

        if (voorbeeld) {
            voorbeeld.textContent = regel;
        }

        if (onderwerp) {
            onderwerp.value = regel;
        }
    }

    function bijwerken() {
        vulRail();
        schrijfOnderwerp();
    }

    formulier.addEventListener(
        "input",
        bijwerken
    );

    formulier.addEventListener(
        "change",
        bijwerken
    );

    /* Ook meteen bij binnenkomst, voor het geval de browser velden
       al heeft ingevuld. */

    bijwerken();

}());