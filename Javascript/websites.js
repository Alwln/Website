/* ============================================================
   WEBSITES
   Alleen de niet-kritieke interacties van deze pagina: de hero-regel
   wordt één keer getypt en secties komen rustig in beeld tijdens het
   scrollen. Dit bestand laadt deferred en blokkeert de eerste render niet.
   De kleine progressive-enhancement vlag wordt apart in <head> gezet.
   ============================================================ */

(function () {

    "use strict";

    var rustig = window.matchMedia("(prefers-reduced-motion: reduce)").matches;


    /* =========================
       DE ZIN DIE GESCHREVEN WORDT
    ========================= */

    function typen() {

        var regel = document.querySelector("[data-typ]");
        if (!regel) return;

        var zin = regel.getAttribute("data-typ");
        var veld = regel.querySelector(".typ-tekst");
        if (!veld) return;

        /* Geen animatie gevraagd, dan staat de zin er meteen. */
        if (rustig) {
            veld.textContent = zin;
            regel.classList.add("typ-klaar");
            return;
        }

        veld.textContent = "";
        regel.classList.add("typ-bezig");

        var i = 0;

        function tik() {

            veld.textContent = zin.slice(0, ++i);

            /* Klaar: de punt mag erbij en de cursor knippert nog even uit. */
            if (i >= zin.length) {
                regel.classList.remove("typ-bezig");
                regel.classList.add("typ-klaar");
                return;
            }

            /* Na een spatie een adempauze, anders leest het als een teller. */
            var vorig = zin.charAt(i - 1);
            var pauze = vorig === " " ? 130 : 48 + Math.random() * 44;

            window.setTimeout(tik, pauze);
        }

        window.setTimeout(tik, 700);
    }


    /* =========================
       IN BEELD KOMEN
    ========================= */

    function onthullen() {

        var blokken = document.querySelectorAll("[data-onthul]");
        if (!blokken.length) return;

        function toon(blok) {
            blok.classList.add("in-beeld");
        }

        /* Zonder waarnemer of zonder animatiewens: alles direct zichtbaar. */
        if (rustig || !("IntersectionObserver" in window)) {
            Array.prototype.forEach.call(blokken, toon);
            return;
        }

        var waarnemer = new IntersectionObserver(function (regels) {

            regels.forEach(function (regel) {

                if (!regel.isIntersecting) return;

                toon(regel.target);
                waarnemer.unobserve(regel.target);
            });

        }, {
            rootMargin: "0px 0px -12% 0px",
            threshold: 0.12
        });

        Array.prototype.forEach.call(blokken, function (blok) {
            waarnemer.observe(blok);
        });
    }


    /* =========================
       START
       De vlag staat er al, de rest wacht op de DOM.
    ========================= */

    function start() {
        typen();
        onthullen();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start);
    } else {
        start();
    }

}());