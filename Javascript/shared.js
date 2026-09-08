/* =========================
   PAGINAOVERGANG
   Subtiele overgang tussen interne pagina's. Ankerlinks,
   telefoon, e-mail en externe links blijven direct reageren.
========================= */

(function () {

    "use strict";


    document.querySelectorAll("a[href]").forEach(function (link) {

        link.addEventListener("click", function (event) {

            const href = link.getAttribute("href");

            if (
                event.defaultPrevented ||
                !href ||
                href.startsWith("#") ||
                href.startsWith("mailto:") ||
                href.startsWith("tel:") ||
                link.hasAttribute("download") ||
                (link.target && link.target !== "_self") ||
                event.ctrlKey ||
                event.metaKey ||
                event.shiftKey ||
                event.altKey
            ) {
                return;
            }


            const url = new URL(link.href, window.location.href);

            if (url.origin !== window.location.origin) {
                return;
            }


            event.preventDefault();

            document.body.classList.add("page-leaving");


            setTimeout(function () {
                window.location.href = url.href;
            }, 80);
        });
    });


    /* Teruggaan via de browser mag nooit een vervaagde pagina tonen */

    window.addEventListener("pageshow", function () {
        document.body.classList.remove("page-leaving");
    });

})();


/* =========================
   NAVIGATIE
   Op brede schermen blijft de volledige navigatie zichtbaar.
   Onder 760px wordt dezelfde navigatie compact geopend.
========================= */

(function () {

    "use strict";


    const navbar = document.querySelector(".navbar");
    if (!navbar) return;


    const toggle = navbar.querySelector(".nav-toggle");
    const navigatie = document.getElementById("primary-navigation");
    const mobiel = window.matchMedia("(max-width: 760px)");


    /* =========================
       MOBIEL MENU
    ========================= */

    if (toggle && navigatie) {

        document.body.classList.add("nav-ready");


        function menuIsOpen() {
            return toggle.getAttribute("aria-expanded") === "true";
        }


        function sluitMenu(geefFocusTerug) {

            if (!menuIsOpen()) return;

            toggle.setAttribute("aria-expanded", "false");
            toggle.setAttribute("aria-label", "Open menu");

            if (geefFocusTerug) {
                toggle.focus();
            }
        }


        function openMenu() {

            document.body.classList.remove("nav-verborgen");

            toggle.setAttribute("aria-expanded", "true");
            toggle.setAttribute("aria-label", "Sluit menu");
        }


        toggle.addEventListener("click", function () {

            if (menuIsOpen()) {
                sluitMenu(false);
            } else {
                openMenu();
            }
        });


        navigatie.addEventListener("click", function (event) {

            if (event.target.closest("a")) {
                sluitMenu(false);
            }
        });


        document.addEventListener("keydown", function (event) {

            if (event.key === "Escape" && menuIsOpen()) {
                sluitMenu(true);
            }
        });


        document.addEventListener("click", function (event) {

            if (menuIsOpen() && !navbar.contains(event.target)) {
                sluitMenu(false);
            }
        });


        navbar.addEventListener("focusout", function () {

            requestAnimationFrame(function () {

                if (
                    menuIsOpen() &&
                    !navbar.contains(document.activeElement)
                ) {
                    sluitMenu(false);
                }
            });
        });


        mobiel.addEventListener("change", function () {

            sluitMenu(false);
            document.body.classList.remove("nav-verborgen");
        });
    }


    /* =========================
       NAVBAR BIJ HET SCROLLEN
       Naar beneden uit beeld, bij omhoog scrollen direct terug.
    ========================= */

    const drempel = 6;
    const bovenzone = 90;

    let vorige = window.scrollY;
    let gepland = false;


    function menuOpen() {

        return Boolean(
            toggle &&
            toggle.getAttribute("aria-expanded") === "true"
        );
    }


    function toonNavbar() {
        document.body.classList.remove("nav-verborgen");
    }


    function kijkNaarScroll() {

        gepland = false;

        const nu = window.scrollY;
        const verschil = nu - vorige;


        /* Een geopend mobiel menu blijft altijd in beeld */

        if (menuOpen() || nu <= bovenzone) {

            toonNavbar();
            vorige = nu;

            return;
        }


        if (Math.abs(verschil) < drempel) {
            return;
        }


        document.body.classList.toggle(
            "nav-verborgen",
            verschil > 0
        );

        vorige = nu;
    }


    window.addEventListener("scroll", function () {

        if (gepland) return;

        gepland = true;

        requestAnimationFrame(kijkNaarScroll);

    }, {passive: true});


    /* Toetsenbordfocus mag nooit in een verborgen navbar terechtkomen */

    navbar.addEventListener("focusin", toonNavbar);

})();


/* =========================
   CONTACTFORMULIER

   Versturen via Web3Forms zonder de bezoeker van de pagina weg te
   sturen. Statusmeldingen blijven binnen het formulier. Staat hier
   en niet in index.js of contact.js, zodat hetzelfde formulier op
   elke pagina hetzelfde werkt.

   De verdediging bestaat uit vier lagen, van goedkoop naar duur:

   1. Honeypot        — een veld dat alleen een bot invult
   2. Vultijd         — niemand vult dit formulier in vier seconden
   3. Veldcontract    — lengtes, vorm en toegestane keuzes
   4. hCaptcha        — de laag die Web3Forms zelf nog eens nakijkt

   Laag 1 tot en met 3 zijn Javascript en dus te omzeilen: ze houden
   de ruis tegen, niet de aanvaller. Laag 4 is de enige die aan de
   serverkant wordt afgedwongen. Daarom moet hCaptcha ook in het
   Web3Forms-dashboard aanstaan, anders is het een tekening van een
   slot en geen slot.
========================= */

(function () {

    "use strict";


    const formulier = document.querySelector(".contact-form");
    const status = document.getElementById("contactStatus");

    if (!formulier || !status) return;

    const TAAL = (document.documentElement.lang || "nl")
        .toLowerCase()
        .startsWith("en")
        ? "en"
        : "nl";

    function tekst(nl, en) {
        return TAAL === "en" ? en : nl;
    }

    formulier.noValidate = true;

    /* hCaptcha/Web3Forms wordt pas geladen nadat iemand het formulier
       daadwerkelijk gebruikt. Zo krijgt een gewone paginabezoeker geen
       verbinding met de captcha-aanbieder zonder reden. */

    const captchaElement = formulier.querySelector(".h-captcha");
    let captchaScriptGeladen = false;

    let captchaScriptMislukt = false;

    if (captchaElement) {
        captchaElement.dataset.lang = TAAL;
    }

    function laadCaptcha() {
        if (!captchaElement || captchaScriptGeladen) return;

        captchaScriptGeladen = true;

        const script = document.createElement("script");
        script.src = "https://web3forms.com/client/script.js";
        script.async = true;
        script.defer = true;
        script.dataset.avdbCaptcha = "true";

        script.addEventListener("error", function () {
            captchaScriptMislukt = true;
        }, {once: true});

        document.head.appendChild(script);
    }

    if (captchaElement) {
        formulier.addEventListener("focusin", laadCaptcha, {once: true});
        formulier.addEventListener("pointerdown", laadCaptcha, {once: true, passive: true});
    }


    /* =========================
       HET VELDCONTRACT

       Dit is wat het formulier accepteert. De HTML herhaalt dezelfde
       grenzen voor de bezoeker, met required en maxlength, maar die
       zijn er voor het gemak. De controle hieronder is leidend.

       De keuzelijsten staan hier bewust uitgeschreven en worden niet
       uit de pagina gelezen. Wie het formulier in de browser aanpast,
       verandert daarmee niet wat er verstuurd mag worden.
    ========================= */

    const REGELS = {

        name: {
            label: tekst("Naam", "Name"),
            verplicht: true,
            min: 2,
            max: 100,
            enkeleRegel: true
        },

        company: {
            label: tekst("Bedrijf", "Company"),
            verplicht: false,
            max: 120,
            enkeleRegel: true
        },

        email: {
            label: tekst("E-mailadres", "Email address"),
            verplicht: true,
            min: 6,
            max: 254,
            enkeleRegel: true,
            patroon: /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/
        },

        phone: {
            label: tekst("Telefoonnummer", "Phone number"),
            verplicht: false,
            max: 25,
            enkeleRegel: true,
            patroon: /^[0-9+()./\s-]{6,25}$/
        },

        service: {
            label: tekst("Dienst", "Service"),
            verplicht: true,
            keuzes: [
                "Maatwerk website",
                "AI-assistent",
                "Onderhoud",
                "Bestaande website verbeteren",
                "Anders",
                "Custom website",
                "AI assistant",
                "Maintenance",
                "Improving an existing website",
                "Something else"
            ]
        },

        budget: {
            label: "Budget",
            verplicht: false,
            keuzes: [
                "",
                "Nog niet zeker",
                "Onder € 1.500",
                "€ 1.500 – € 2.500",
                "€ 2.500 – € 5.000",
                "€ 5.000+",
                "Not sure yet",
                "Under € 1,500",
                "€ 1,500 – € 2,500",
                "€ 2,500 – € 5,000",
                "€ 5,000+"
            ]
        },

        message: {
            label: tekst("Bericht", "Message"),
            verplicht: true,
            min: 10,
            max: 2000,
            maxLinks: 4
        }
    };


    /* Grenzen aan het versturen zelf. Ook zonder captcha kan niemand
       dit formulier gebruiken om iemand onder te spammen. */

    const MINIMALE_VULTIJD = 4000;
    const WACHTTIJD_TUSSEN = 20000;
    const MAXIMUM_PER_BEZOEK = 3;


    const geopend = Date.now();

    let verstuurd = 0;
    let laatsteVerzending = 0;
    let bezig = false;


    /* =========================
       KLEINE HULPJES
    ========================= */

    function veld(naam) {
        return formulier.elements.namedItem(naam);
    }


    function schoon(waarde) {

        /* Onzichtbare stuurtekens horen niet in een bericht en zijn
           het gereedschap van wie met headers wil rommelen. */

        return String(waarde == null ? "" : waarde)
            .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
            .trim();
    }


    /* Zet de melding neer, wijst het veld aan en geeft null terug,
       zodat de controle er in één regel op kan eindigen. */

    function meldFout(tekst, element) {

        status.dataset.state = "error";
        status.textContent = tekst;

        if (element) {
            element.setAttribute("aria-invalid", "true");

            if (typeof element.focus === "function") {
                element.focus();
            }
        }

        return null;
    }


    function wisMelding() {

        /* Een oude melding mag niet blijven staan terwijl de bezoeker
           het opnieuw probeert; dan wijst hij naar het verkeerde veld. */

        status.removeAttribute("data-state");
        status.textContent = "";
    }


    function wisFoutmarkering() {

        formulier
            .querySelectorAll('[aria-invalid="true"]')
            .forEach(function (element) {
                element.removeAttribute("aria-invalid");
            });
    }


    formulier.addEventListener("input", function (event) {

        if (event.target.hasAttribute("aria-invalid")) {
            event.target.removeAttribute("aria-invalid");
        }
    });


    /* =========================
       LAAG 3: HET VELDCONTRACT NALOPEN

       Geeft de opgeschoonde waarden terug, of null zodra er iets
       niet klopt. In dat geval staat de melding al in beeld.
    ========================= */

    function controleerVelden() {

        const waarden = {};


        for (const naam in REGELS) {

            const regel = REGELS[naam];
            const element = veld(naam);

            if (!element) continue;

            const waarde = schoon(element.value);


            if (!waarde) {

                if (regel.verplicht) {
                    return meldFout(
                        tekst(
                            regel.label + " is nog leeg.",
                            regel.label + " is required."
                        ),
                        element
                    );
                }

                waarden[naam] = "";
                continue;
            }


            if (regel.enkeleRegel && /[\r\n]/.test(element.value)) {
                return meldFout(
                    tekst(
                        regel.label + " mag maar één regel zijn.",
                        regel.label + " may only contain one line."
                    ),
                    element
                );
            }


            if (regel.min && waarde.length < regel.min) {
                return meldFout(
                    tekst(
                        regel.label + " is te kort, minimaal " + regel.min + " tekens.",
                        regel.label + " is too short. Use at least " + regel.min + " characters."
                    ),
                    element
                );
            }


            if (regel.max && waarde.length > regel.max) {
                return meldFout(
                    tekst(
                        regel.label + " is te lang, maximaal " + regel.max + " tekens.",
                        regel.label + " is too long. Use no more than " + regel.max + " characters."
                    ),
                    element
                );
            }


            if (regel.patroon && !regel.patroon.test(waarde)) {
                return meldFout(
                    tekst(
                        "Controleer je " + regel.label.toLowerCase() + " even.",
                        "Please check your " + regel.label.toLowerCase() + "."
                    ),
                    element
                );
            }


            if (regel.keuzes && regel.keuzes.indexOf(waarde) === -1) {
                return meldFout(
                    tekst(
                        "Kies een geldige optie bij " + regel.label.toLowerCase() + ".",
                        "Please choose a valid option for " + regel.label.toLowerCase() + "."
                    ),
                    element
                );
            }


            if (regel.maxLinks) {

                const links = waarde.match(/https?:\/\/|www\./gi);

                if (links && links.length > regel.maxLinks) {
                    return meldFout(
                        tekst(
                            "Er staan veel links in je bericht. Laat er een paar weg, dan komt het aan.",
                            "There are too many links in your message. Remove a few and try again."
                        ),
                        element
                    );
                }
            }

            waarden[naam] = waarde;
        }


        return waarden;
    }


    /* =========================
       LAAG 4: DE CAPTCHA

           Alleen verplicht als de widget ook echt op de pagina staat.
           Zo blijft een pagina zonder captcha gewoon werken, terwijl
           een pagina mét captcha niets doorlaat zonder token.
        ========================= */

    /* Eén keer bij het laden vastgesteld en daarna niet meer. Wie het
       blok later uit de pagina sloopt, maakt de captcha daarmee niet
       optioneel; de vlag staat dan al vast op true. */

    const CAPTCHA_VERPLICHT = Boolean(formulier.querySelector(".h-captcha"));


    function captchaToken() {

        const antwoord = formulier.querySelector('textarea[name="h-captcha-response"]');

        return antwoord ? antwoord.value : "";
    }


    function herstelCaptcha() {

        if (window.hcaptcha && typeof window.hcaptcha.reset === "function") {

            try {
                window.hcaptcha.reset();
            } catch (fout) {
                /* Een captcha die niet te resetten valt, mag het
                   versturen niet alsnog laten klappen. */
            }
        }
    }


    /* =========================
       DE ONDERWERPREGEL

       Wat in de inbox komt te staan, wordt hier geschreven. Zo is
       meteen zichtbaar waar een aanvraag over gaat.
    ========================= */

    function onderwerpregel(waarden) {

        const delen = [
            tekst("Aanvraag", "Enquiry")
        ];

        if (waarden.name && waarden.company) {
            delen.push(waarden.name + " (" + waarden.company + ")");
        } else if (waarden.name || waarden.company) {
            delen.push(waarden.name || waarden.company);
        }

        if (waarden.service) delen.push(waarden.service);

        if (
            waarden.budget &&
            waarden.budget !== "Nog niet zeker" &&
            waarden.budget !== "Not sure yet"
        ) {
            delen.push(waarden.budget);
        }

        return delen.join(" · ");
    }


    /* =========================
       VERSTUREN
    ========================= */

    formulier.addEventListener("submit", async function (event) {

        event.preventDefault();

        if (bezig) return;


        const verzendknop = formulier.querySelector('button[type="submit"]');
        if (!verzendknop) return;


        wisMelding();
        wisFoutmarkering();


        /* Laag 1: de honeypot. Een bot vinkt hem aan, een bezoeker
           ziet hem niet eens. We doen alsof het gelukt is en sturen
           niets; wie het probeert, leert er niets van. */

        const honeypot = veld("botcheck");

        if (honeypot && honeypot.checked) {

            formulier.reset();

            status.dataset.state = "success";
            status.textContent = tekst(
                "Dank je, je bericht is binnen.",
                "Thank you, your message has been received."
            );

            return;
        }


        /* Laag 2: de vultijd en het tempo. */

        if (Date.now() - geopend < MINIMALE_VULTIJD) {
            meldFout(
                tekst(
                    "Neem even de tijd om het formulier af te maken.",
                    "Please take a moment to complete the form."
                ),
                null
            );
            return;
        }

        if (verstuurd >= MAXIMUM_PER_BEZOEK) {
            meldFout(
                tekst(
                    "Je hebt al een paar berichten gestuurd. Bel of mail me gerust rechtstreeks.",
                    "You have already sent a few messages. Please call or email me directly."
                ),
                null
            );
            return;
        }

        if (laatsteVerzending && Date.now() - laatsteVerzending < WACHTTIJD_TUSSEN) {
            meldFout(
                tekst(
                    "Je bericht is net verstuurd. Even geduld voor het volgende.",
                    "Your message was just sent. Please wait a moment before sending another."
                ),
                null
            );
            return;
        }


        /* Laag 3. */

        const waarden = controleerVelden();
        if (!waarden) return;


        /* Laag 4. */

        if (CAPTCHA_VERPLICHT && !captchaToken()) {

            laadCaptcha();

            if (captchaScriptMislukt) {
                meldFout(
                    tekst(
                        "De beveiligingscontrole kon niet laden. Controleer of een adblocker of privacyfilter Web3Forms of hCaptcha blokkeert.",
                        "The security check could not load. Check whether an ad blocker or privacy filter is blocking Web3Forms or hCaptcha."
                    ),
                    null
                );
            } else {
                meldFout(
                    tekst(
                        "Rond eerst de beveiligingscontrole af. Lukt dat niet, bel of mail me dan gerust rechtstreeks.",
                        "Please complete the security check first. If it does not work, contact me directly by phone or email."
                    ),
                    null
                );
            }

            return;
        }


        /* Wat verstuurd wordt, is wat de controle heeft doorstaan,
           niet wat er los in de velden stond. */

        const gegevens = new FormData(formulier);

        for (const naam in waarden) {

            if (!gegevens.has(naam)) continue;

            if (waarden[naam]) {
                gegevens.set(naam, waarden[naam]);
            } else {

                /* Een leeg optioneel veld hoeft niet mee. Scheelt
                   drie lege regels in elke mail. */

                gegevens.delete(naam);
            }
        }

        gegevens.set("subject", onderwerpregel(waarden));
        gegevens.delete("botcheck");


        bezig = true;
        verzendknop.disabled = true;

        status.dataset.state = "loading";
        status.textContent = tekst(
            "Je bericht wordt verstuurd…",
            "Your message is being sent…"
        );


        try {

            const response = await fetch(formulier.action, {
                method: "POST",
                body: gegevens,
                headers: {
                    Accept: "application/json"
                }
            });

            const resultaat = await response.json().catch(function () {
                return {};
            });


            if (!response.ok || resultaat.success !== true) {
                throw new Error("Web3Forms heeft het bericht niet geaccepteerd.");
            }


            formulier.reset();
            wisFoutmarkering();

            verstuurd += 1;
            laatsteVerzending = Date.now();

            status.dataset.state = "success";
            status.textContent = tekst(
                "Dank je, je bericht is binnen. Ik reageer meestal binnen één werkdag.",
                "Thank you, your message has been received. I usually reply within one working day."
            );
        } catch (fout) {

            status.dataset.state = "error";
            status.textContent = tekst(
                "Versturen lukte niet. Bel of mail me gerust rechtstreeks.",
                "Your message could not be sent. Please call or email me directly."
            );
        } finally {

            herstelCaptcha();

            bezig = false;
            verzendknop.disabled = false;
        }
    });

})();
