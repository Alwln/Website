/* ============================================
   CipherTaal — de teksten die in Javascript staan

   Alles wat zichtbaar in de HTML staat wordt daar al vertaald.
   Deze paar regels worden door het script zelf gemaakt, dus die
   volgen hier de taal van de pagina (het lang-attribuut op <html>).

   Een nieuwe taal toevoegen: één blok erbij, meer niet.
   ============================================ */

const CipherTaal = (function () {
  const TEKSTEN = {
    nl: {
      openLabel: 'Open AI-assistent',
      sluitLabel: 'Sluit AI-assistent',
      groet: 'Hoi, ik ben Cipher. Waarmee kan ik je helpen?',
      typt: 'Cipher is aan het typen',
      ballonEen: 'Kan ik u ergens mee helpen?',
      ballonTwee: 'Hallo daar?',
      fout: 'Cipher kan er nu even niet bij. Probeer het straks opnieuw, of mail naar contact@avdbsecurity.com.',
      teveel: 'Even normaal typen graag — probeer het over een paar minuten opnieuw.',
      contactLink: 'Contact opnemen →'
    },
    en: {
      openLabel: 'Open AI assistant',
      sluitLabel: 'Close AI assistant',
      groet: "Hi, I'm Cipher. What can I help you with?",
      typt: 'Cipher is typing',
      ballonEen: 'Anything I can help you with?',
      ballonTwee: 'Hello there?',
      fout: "Cipher can't be reached right now. Please try again shortly, or email contact@avdbsecurity.com.",
      teveel: 'Please slow down a little — try again in a few minutes.',
      contactLink: 'Get in touch →'
    }
  };

  const code = (document.documentElement.lang || 'nl').toLowerCase().split('-')[0];

  return TEKSTEN[code] || TEKSTEN.nl;
})();


/* ============================================
   CipherChat — chatinterface-API
   ============================================ */

const CipherChat = (function () {
  /* ------------------------------------------------------------
     Vul dit in ZODRA de Worker gedeployd is (zie SETUP.md).
     Voorbeeld: 'https://cipher-api.jouw-subdomein.workers.dev'
     of, met een eigen route: 'https://api.avdbsecurity.com'
  ------------------------------------------------------------ */
  const CIPHER_API_URL = 'https://cipher-api.avdbsecurity.workers.dev';

  const MAX_HISTORY = 8;      // laatste N berichten die als context meegaan
  const REQUEST_TIMEOUT_MS = 20000;

  const agent = document.getElementById('aiAgent');
  const orb = document.getElementById('aiButton');
  const chat = document.getElementById('cipherChat');
  const messages = document.getElementById('chatMessages');
  const input = document.getElementById('chatInput');
  const sendBtn = document.getElementById('chatSend');
  const closeBtn = document.getElementById('chatClose');

  input.maxLength = 500;

  let isOpen = false;
  let greeted = false;
  let typingEl = null;
  let isSending = false;
  let history = [];

  function open() {
    if (isOpen) return;
    isOpen = true;

    chat.classList.add('is-open');
    agent.classList.add('chat-is-open');
    orb.setAttribute('aria-expanded', 'true');
    orb.setAttribute('aria-label', CipherTaal.sluitLabel);

    if (!greeted) {
      greeted = true;
      addMessage(CipherTaal.groet);
    }

    setTimeout(() => input.focus(), 350);
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;

    chat.classList.remove('is-open');
    agent.classList.remove('chat-is-open');
    orb.setAttribute('aria-expanded', 'false');
    orb.setAttribute('aria-label', CipherTaal.openLabel);

    orb.focus();
  }

  function toggle() {
    isOpen ? close() : open();
  }

  function scrollDown() {
    messages.scrollTo({ top: messages.scrollHeight, behavior: 'smooth' });
  }

  /**
   * Voegt een bericht toe aan het gesprek.
   * @param {string} text
   * @param {'cipher'|'user'} from
   */
  function addMessage(text, from = 'cipher') {
    hideTyping();

    const el = document.createElement('div');
    el.className = 'msg msg--' + (from === 'user' ? 'user' : 'cipher');
    el.textContent = text;

    messages.appendChild(el);
    scrollDown();
    return el;
  }

  function showTyping() {
    if (typingEl) return;

    typingEl = document.createElement('div');
    typingEl.className = 'msg msg--cipher msg--typing';
    typingEl.setAttribute('aria-label', CipherTaal.typt);
    typingEl.innerHTML = '<i></i><i></i><i></i>';

    messages.appendChild(typingEl);
    scrollDown();
  }

  function hideTyping() {
    if (!typingEl) return;
    typingEl.remove();
    typingEl = null;
  }

  function setSending(state) {
    isSending = state;
    sendBtn.disabled = state;
  }

  /* Zoekt de contactpagina-link op die al in de navigatiebalk van DEZE
     pagina staat, en hergebruikt precies dat pad. Zo werkt het correct
     op elke padverdiepte (bv. "contact.html" op HTML/agent.html, maar
     "HTML/contact.html" op de homepage) zonder dat we dat hier zelf
     hoeven te berekenen of hard te coderen. */
  function getContactHref() {
    const navLink = document.querySelector('.navbar a.Contact');
    return (navLink && navLink.getAttribute('href')) || 'contact.html';
  }

  /* Toont een losse, klikbare knop naar de contactpagina — een echt
     <a>-element dat wijzelf opbouwen, niet iets dat uit de AI-tekst
     wordt geplakt. Zo blijft dit veilig ook al zou een antwoord ooit
     rare tekens bevatten. */
  function addContactLink() {
    hideTyping();

    const wrap = document.createElement('div');
    wrap.className = 'msg msg--cipher msg--contact-link';

    const a = document.createElement('a');
    a.href = getContactHref();
    a.textContent = CipherTaal.contactLink;

    wrap.appendChild(a);
    messages.appendChild(wrap);
    scrollDown();
  }

  async function handleSend() {
    const text = input.value.trim();
    if (!text || isSending) return;

    addMessage(text, 'user');
    input.value = '';
    input.focus();

    const historyForRequest = history.slice(-MAX_HISTORY);
    history.push({ role: 'user', content: text });
    history = history.slice(-MAX_HISTORY);

    setSending(true);
    showTyping();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const lang = (document.documentElement.lang || 'nl').toLowerCase().split('-')[0];

      const response = await fetch(CIPHER_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: historyForRequest, lang }),
        signal: controller.signal
      });

      if (response.status === 429) {
        addMessage(CipherTaal.teveel);
        return;
      }

      if (!response.ok) {
        throw new Error('cipher_api_' + response.status);
      }

      const data = await response.json();
      const answer = typeof data.answer === 'string' && data.answer.trim() ? data.answer.trim() : CipherTaal.fout;

      addMessage(answer);
      if (data.needsContact) addContactLink();

      history.push({ role: 'assistant', content: answer });
      history = history.slice(-MAX_HISTORY);
    } catch (err) {
      addMessage(CipherTaal.fout);
      addContactLink();
    } finally {
      clearTimeout(timeoutId);
      setSending(false);
    }
  }

  sendBtn.addEventListener('click', handleSend);
  closeBtn.addEventListener('click', close);

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSend();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen) close();
  });

  /*
    Klik/tik BUITEN de chat sluit het venster.
    - Alles binnen het chatpaneel (#cipherChat), de orb of #aiAgent telt
      als "binnen" en sluit dus NOOIT het venster.
    - 'pointerdown' i.p.v. 'click': zo sluit het venster ook niet als je
      in de chat tekst selecteert en pas buiten de chat loslaat.
  */
  document.addEventListener('pointerdown', (event) => {
    if (!isOpen) return;

    const binnen =
      chat.contains(event.target) ||
      agent.contains(event.target) ||
      orb.contains(event.target);

    if (!binnen) close();
  });

  return { open, close, toggle, addMessage, showTyping, hideTyping };
})();

/* ============================================
   Tekstballon-timers

   Let op: de voorbeeldvragen-knoppen ([data-agent-vraag] /
   [data-agent-open], bv. op agent.html) worden NIET hier afgehandeld.
   Dat doet Javascript/agent.js al — die simuleert een klik op de
   bestaande aiButton/chatSend-knoppen, en gebruikt dus automatisch
   de listeners hieronder en die van CipherChat zelf. Nog een eigen
   listener hier toevoegen zou de vraag twee keer versturen.
   ============================================ */

(function () {
  const button = document.getElementById('aiButton');
  const bubble = document.getElementById('aiBubble');
  if (!button || !bubble) return;

  const HIDE_AFTER = 20000; // ballon verdwijnt na 20 s negeren

  let hideTimer = null;
  let interacted = false;
  const pendingTimers = [];

  function showBubble(text) {
    if (interacted) return;

    bubble.textContent = text;
    bubble.classList.add('is-visible');

    clearTimeout(hideTimer);
    hideTimer = setTimeout(hideBubble, HIDE_AFTER);
  }

  function hideBubble() {
    bubble.classList.remove('is-visible');
    clearTimeout(hideTimer);
  }

  // 'Click me!' op een willekeurig moment tussen 5 en 10 s
  pendingTimers.push(setTimeout(() => showBubble(CipherTaal.ballonEen), 5000 + Math.random() * 5000));

  // 'Hellooo?' na 1 minuut op de site
  pendingTimers.push(setTimeout(() => showBubble(CipherTaal.ballonTwee), 60000));

  button.addEventListener('click', () => {
    interacted = true;
    hideBubble();
    pendingTimers.forEach(clearTimeout);
    CipherChat.toggle();
  });
})();