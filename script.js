// Security & Protection Services - Overlay Mobile Menu
console.log("Security & Protection Services loaded");

(() => {
    // 🔒 Voorkom dubbel initialiseren
    if (window.__navbarInitialized) return;
    window.__navbarInitialized = true;

    const navbar = document.querySelector(".navbar");
    if (!navbar) return;

    let lastScrollY = window.scrollY;
    let hideTimeout = null;
    let isMobileMenuOpen = false;

    // Create mobile overlay menu
    function createMobileOverlay() {
        // Create hamburger menu button
        const mobileMenuBtn = document.createElement('div');
        mobileMenuBtn.className = 'mobile-menu-btn';
        mobileMenuBtn.innerHTML = '<span></span><span></span><span></span>';

        // Create overlay container
        const mobileOverlay = document.createElement('div');
        mobileOverlay.className = 'mobile-overlay';

        // Create overlay content
        const overlayContent = document.createElement('div');
        overlayContent.className = 'mobile-overlay-content';

        // Create menu links based on the original nav-rechts
        const navRechts = document.querySelector('.nav-rechts');
        if (navRechts) {
            const links = navRechts.querySelectorAll('a');
            links.forEach(link => {
                const newLink = link.cloneNode(true);
                newLink.classList.remove('Service-button', 'Contact-button');
                overlayContent.appendChild(newLink);
            });
        }

        mobileOverlay.appendChild(overlayContent);

        // Add to body
        document.body.appendChild(mobileOverlay);

        // Add button to navbar
        const navLinks = document.querySelector('.nav-links');
        if (navLinks) {
            navLinks.appendChild(mobileMenuBtn);
        }

        // Toggle menu function
        function toggleMobileMenu() {
            isMobileMenuOpen = !isMobileMenuOpen;
            mobileMenuBtn.classList.toggle('active');
            mobileOverlay.classList.toggle('active');
            document.body.classList.toggle('menu-open');

            // Disable navbar hide on scroll when menu is open
            if (isMobileMenuOpen) {
                navbar.classList.remove("navbar--hidden");
                if (hideTimeout) {
                    clearTimeout(hideTimeout);
                    hideTimeout = null;
                }
            }
        }

        // Add click event to hamburger button
        mobileMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleMobileMenu();
        });

        // Add click event to overlay links
        const overlayLinks = overlayContent.querySelectorAll('a');
        overlayLinks.forEach(link => {
            link.addEventListener('click', function() {
                toggleMobileMenu();
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (isMobileMenuOpen &&
                !mobileOverlay.contains(e.target) &&
                !mobileMenuBtn.contains(e.target)) {
                toggleMobileMenu();
            }
        });

        // Close menu with escape key
        document.addEventListener('keydown', function(e) {
            if (isMobileMenuOpen && e.key === 'Escape') {
                toggleMobileMenu();
            }
        });
    }

    // Initialize mobile menu only on mobile screens
    function initMobileMenu() {
        if (window.innerWidth <= 768) {
            // Hide original nav-rechts on mobile
            const navRechts = document.querySelector('.nav-rechts');
            if (navRechts) {
                navRechts.style.display = 'none';
            }

            // Create mobile overlay if it doesn't exist
            if (!document.querySelector('.mobile-overlay')) {
                createMobileOverlay();
            }
        } else {
            // Show original nav-rechts on desktop
            const navRechts = document.querySelector('.nav-rechts');
            if (navRechts) {
                navRechts.style.display = 'flex';
            }

            // Remove mobile overlay
            const mobileOverlay = document.querySelector('.mobile-overlay');
            const mobileMenuBtn = document.querySelector('.mobile-menu-btn');

            if (mobileOverlay) mobileOverlay.remove();
            if (mobileMenuBtn) mobileMenuBtn.remove();

            // Reset body class
            document.body.classList.remove('menu-open');
            isMobileMenuOpen = false;
        }
    }

    // Initialize on load
    initMobileMenu();

    // Re-initialize on resize
    window.addEventListener('resize', initMobileMenu);

    // Original scroll behavior for navbar
    window.addEventListener("scroll", () => {
        // Don't hide navbar when mobile menu is open
        if (isMobileMenuOpen) return;

        const currentScrollY = window.scrollY;
        const scrollingDown = currentScrollY > lastScrollY;
        const scrollingUp = currentScrollY < lastScrollY;

        // 🔽 Scroll omlaag → kort blijven → weg
        if (scrollingDown && currentScrollY > 120) {
            if (!hideTimeout) {
                hideTimeout = setTimeout(() => {
                    navbar.classList.add("navbar--hidden");
                }, 250);
            }
        }

        // 🔼 Klein beetje omhoog → direct terug
        if (scrollingUp) {
            if (hideTimeout) {
                clearTimeout(hideTimeout);
                hideTimeout = null;
            }
            navbar.classList.remove("navbar--hidden");
        }

        lastScrollY = currentScrollY;
    });

    console.log("Navbar and mobile menu initialized");
})();