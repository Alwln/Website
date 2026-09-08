/* ============================================================
   AI-ASSISTENTEN
   Alleen de niet-kritieke interacties van deze pagina: secties komen
   rustig in beeld en de demo stuurt het bestaande Cipher-paneel aan.
   ============================================================ */

(function () {

    "use strict";

    var rustig = window.matchMedia("(prefers-reduced-motion: reduce)").matches;


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
       CIPHER OPENEN
       De demo gebruikt alleen het paneel dat al op de pagina staat.
    ========================= */

    function chatIsZichtbaar(chat) {

        var stijl = window.getComputedStyle(chat);

        return !(
            stijl.display === "none" ||
            stijl.visibility === "hidden" ||
            stijl.opacity === "0" ||
            stijl.pointerEvents === "none"
        );
    }


    function openCipher(aiButton, chat, input) {

        if (!chatIsZichtbaar(chat)) {
            aiButton.click();
        }

        window.setTimeout(function () {
            input.focus();
        }, 60);
    }


    function verstuurVraag(input, vraag) {

        input.value = vraag;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
        input.focus();

        var verzend = document.getElementById("chatSend");

        if (verzend) {
            verzend.click();
            return;
        }

        input.dispatchEvent(new KeyboardEvent("keydown", {
            key: "Enter",
            code: "Enter",
            bubbles: true
        }));
    }


    function demo() {

        var aiButton = document.getElementById("aiButton");
        var chat = document.getElementById("cipherChat");
        var input = document.getElementById("chatInput");

        /* Ontbreekt Cipher, dan blijven de links gewone ankerlinks. */
        if (!aiButton || !chat || !input) return;

        var vragen = document.querySelectorAll("[data-agent-vraag]");
        var openers = document.querySelectorAll("[data-agent-open]");

        Array.prototype.forEach.call(vragen, function (link) {

            link.addEventListener("click", function (event) {

                var vraag = link.getAttribute("data-agent-vraag");
                if (!vraag) return;

                event.preventDefault();
                openCipher(aiButton, chat, input);

                window.setTimeout(function () {
                    verstuurVraag(input, vraag);
                }, 90);
            });
        });

        Array.prototype.forEach.call(openers, function (link) {

            link.addEventListener("click", function (event) {
                event.preventDefault();
                openCipher(aiButton, chat, input);
            });
        });
    }


    /* =========================
       START
       De vlag staat er al, de rest wacht op de DOM.
    ========================= */

    function start() {
        onthullen();
        demo();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start);
    } else {
        start();
    }

}());