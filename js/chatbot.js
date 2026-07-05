/* ============================================================
   Ask Elijah — Atunbi Assistant
   A lightweight, offline, browser-only assistant. It answers
   questions about Elijah Snoz from a built-in knowledge base
   (sourced from this site). When it can't answer, it offers a
   one-click Google search and suggests emailing Elijah.
   No API key, no backend, no tracking.
   ============================================================ */
(function () {
  "use strict";

  var EMAIL = "elijahsnoz@gmail.com";

  /* ---------- Knowledge base ----------
     Each topic has trigger keywords and an HTML answer.
     Matching is scored by how many keywords appear in the question. */
  var KB = [
    {
      id: "about",
      keywords: ["who", "who is", "who's", "bio", "biography", "yourself", "introduce", "about him", "about elijah", "about you", "background"],
      answer:
        "<strong>Elijah Snoz</strong> (also known as <em>Ajayi VII</em>, signed <em>@Ajayivii</em>) is a painter, musician, and creative technologist. " +
        "He works at the intersection of art, music, technology, and innovation — building ideas that shape culture. " +
        "He's the founder of the <strong>Atunbi</strong> movement — <em>Rebirth</em>."
    },
    {
      id: "companies",
      keywords: ["company", "companies", "ceo", "founder", "business", "techart", "x wurld", "xwurld", "west group", "entertainment", "venture", "technology", "startup", "brand"],
      answer:
        "Elijah is the <strong>Founder &amp; CEO</strong> of three ventures:" +
        "<ul><li><strong>TechArt Venture</strong></li><li><strong>X Wurld Technology</strong></li><li><strong>West Group Entertainment</strong></li></ul>" +
        "Across them he blends art, music, technology, and innovation to create meaningful experiences."
    },
    {
      id: "atunbi",
      keywords: ["atunbi", "rebirth", "movement", "reborn", "world of rebirth", "meaning"],
      answer:
        "<strong>Atunbi</strong> means <em>“Rebirth.”</em> It's a movement Elijah is building — a <em>World of Rebirth</em> " +
        "inspired by his new works and the sound of Ajayi VII, for every reborn soul on earth. Welcome to Atunbi. 🌀"
    },
    {
      id: "buy-art",
      keywords: ["buy", "purchase", "price", "prices", "cost", "sale", "sell", "available", "acquire", "collect", "saatchi", "opensea", "own", "how much", "order"],
      answer:
        "Original works and prints are available through <a href=\"https://www.saatchiart.com/en-ng/elijahsnoz\" target=\"_blank\" rel=\"noopener\">Saatchi Art</a>, " +
        "<a href=\"https://art.africa/elijah-ajayi\" target=\"_blank\" rel=\"noopener\">Art Africa</a>, " +
        "<a href=\"https://artconnect.com/elijah-ajayi-0Ro6Yv0YrbZTkZa6LqCRF\" target=\"_blank\" rel=\"noopener\">ArtConnect</a> and " +
        "<a href=\"https://opensea.io/ajayivii\" target=\"_blank\" rel=\"noopener\">OpenSea</a>. " +
        "For commissions or pricing, email <a href=\"mailto:" + EMAIL + "\">" + EMAIL + "</a>."
    },
    {
      id: "paintings",
      keywords: ["paint", "painting", "paintings", "artwork", "artworks", "canvas", "gallery", "neo-expression", "expressionist", "pieces"],
      answer:
        "Elijah is a neo-expressionist painter with <strong>200+ original paintings</strong> — loud, layered mosaics of pattern, symbol and bold colour, all signed <em>@Ajayivii</em>. " +
        "You can explore them in the <a href=\"#gallery\">Gallery</a> on this page."
    },
    {
      id: "music",
      keywords: ["music", "song", "songs", "ep", "album", "track", "tracks", "listen", "stream", "sound", "record", "spotify", "apple music", "soundcloud", "playlist"],
      answer:
        "Elijah makes music as <strong>Ajayi VII</strong> — soulful, cinematic and emotional. His EP <strong>“Ajayi VII”</strong> features tracks like " +
        "<em>Do It My Way, Without You, LEVEL, Emotion, Hallelujah, It's U, Love You Mama, Seyi, AM/PM, Local</em> and <em>Home</em>. " +
        "Listen in the <a href=\"#music\">Music</a> section, or on " +
        "<a href=\"https://open.spotify.com/artist/1Mh0dX2GiETx534pGDyKk8\" target=\"_blank\" rel=\"noopener\">Spotify</a>, " +
        "<a href=\"https://music.apple.com/artist/elijah-snoz\" target=\"_blank\" rel=\"noopener\">Apple Music</a> and " +
        "<a href=\"https://soundcloud.com/elijahsnoz\" target=\"_blank\" rel=\"noopener\">SoundCloud</a>."
    },
    {
      id: "without-you",
      keywords: ["without you", "featured track", "single"],
      answer:
        "<strong>“Without You”</strong> is a featured track from the EP <strong>Ajayi VII</strong> — it captures the raw emotion of loss, reflection and resilience, " +
        "the space between heartbreak and healing. Hear it in the <a href=\"#music\">Music</a> section."
    },
    {
      id: "exhibition",
      keywords: ["exhibition", "exhibit", "show", "solo", "nike", "nike art gallery", "when", "where", "event", "opening", "2026", "april"],
      answer:
        "Elijah's <strong>first solo exhibition</strong> opens at the <strong>Nike Art Gallery</strong> on <strong>April 21st, 2026</strong> — " +
        "a full-scale journey through the Atunbi universe. See details in the <a href=\"#journal\">Journal</a> section. 🌟"
    },
    {
      id: "catalogue",
      keywords: ["catalogue", "catalog", "pdf", "download", "ipadabo", "brochure", "booklet"],
      answer:
        "Yes! You can download the exhibition catalogue, <em>“Ipadabo by Elijah,”</em> as a PDF from the " +
        "<a href=\"#journal\">Journal</a> section (the “Download the Catalogue” button on the exhibition card)."
    },
    {
      id: "contact",
      keywords: ["contact", "email", "reach", "book", "booking", "commission", "commissions", "hire", "collaborate", "collaboration", "work with", "message", "get in touch", "enquiry", "inquiry"],
      answer:
        "For commissions, bookings and collaborations, email Elijah directly at " +
        "<a href=\"mailto:" + EMAIL + "\">" + EMAIL + "</a>. " +
        "You'll also find every link in the <a href=\"#connect\">Connect</a> section."
    },
    {
      id: "social",
      keywords: ["social", "instagram", "insta", "tiktok", "tik tok", "youtube", "twitter", " x ", "facebook", "follow", "handle", "profile", "account", "media"],
      answer:
        "Follow Elijah here:<ul>" +
        "<li><a href=\"https://www.instagram.com/elijahsnoz/\" target=\"_blank\" rel=\"noopener\">Instagram — @elijahsnoz</a></li>" +
        "<li><a href=\"https://www.tiktok.com/@elijahsnoz\" target=\"_blank\" rel=\"noopener\">TikTok — @elijahsnoz</a></li>" +
        "<li><a href=\"https://www.youtube.com/@ELIJAHSNOZ\" target=\"_blank\" rel=\"noopener\">YouTube — @ELIJAHSNOZ</a></li>" +
        "<li><a href=\"https://x.com/elijahsnoz\" target=\"_blank\" rel=\"noopener\">X — @elijahsnoz</a></li>" +
        "<li><a href=\"https://open.spotify.com/artist/1Mh0dX2GiETx534pGDyKk8\" target=\"_blank\" rel=\"noopener\">Spotify</a></li>" +
        "<li><a href=\"https://soundcloud.com/elijahsnoz\" target=\"_blank\" rel=\"noopener\">SoundCloud</a></li></ul>"
    },
    {
      id: "origin",
      keywords: ["from", "origin", "born", "nigeria", "nigerian", "ile-ife", "ile ife", "where is he from", "based", "location", "country"],
      answer:
        "Elijah's roots trace to <strong>Ile-Ife, Nigeria</strong> — the cradle of his neo-expressionist style and bold African colour, now expanding into the Atunbi universe."
    },
    {
      id: "name",
      keywords: ["ajayi", "ajayivii", "ajayi vii", "vii", "why", "nickname", "alias", "called"],
      answer:
        "Elijah records and signs his work as <strong>Ajayi VII</strong> (<em>@Ajayivii</em>) — the name that ties his paintings and his music into one universe."
    }
  ];

  /* ---------- Intent matching ---------- */
  function normalize(s) { return " " + s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ") + " "; }

  var GREETINGS = ["hi", "hey", "hello", "yo", "sup", "good morning", "good afternoon", "good evening", "howdy"];
  var THANKS = ["thanks", "thank you", "thank u", "appreciate", "cheers", "thx"];
  var BYE = ["bye", "goodbye", "see you", "later", "take care"];

  function hasAny(text, list) {
    for (var i = 0; i < list.length; i++) { if (text.indexOf(" " + list[i] + " ") !== -1) return true; }
    return false;
  }

  function bestMatch(question) {
    var text = normalize(question);
    var best = null, bestScore = 0;
    for (var i = 0; i < KB.length; i++) {
      var topic = KB[i], score = 0;
      for (var k = 0; k < topic.keywords.length; k++) {
        var kw = topic.keywords[k].toLowerCase();
        if (text.indexOf(" " + kw + " ") !== -1) {
          score += kw.indexOf(" ") !== -1 ? 3 : 1; // multi-word phrases weigh more
        }
      }
      if (score > bestScore) { bestScore = score; best = topic; }
    }
    return { topic: best, score: bestScore };
  }

  function fallback(question) {
    var q = encodeURIComponent("Elijah Snoz " + question);
    return "I don't have that one on hand — but let's find out. 💫<br>" +
      "<a href=\"https://www.google.com/search?q=" + q + "\" target=\"_blank\" rel=\"noopener\">🔍 Search Google for this</a><br>" +
      "Or ask Elijah directly — he'd love to answer: <a href=\"mailto:" + EMAIL +
      "?subject=" + encodeURIComponent("Question from your website") + "\">✉️ Email " + EMAIL + "</a>";
  }

  function respond(question) {
    var text = normalize(question);
    if (hasAny(text, THANKS)) return "Anytime! 😊 Anything else about Elijah's art, music or the Atunbi movement?";
    if (hasAny(text, BYE)) return "Take care — and welcome to Atunbi. 🌀 Come back anytime.";
    var m = bestMatch(question);
    if (m.topic && m.score > 0) return m.topic.answer;
    if (hasAny(text, GREETINGS)) return "Hey there! 👋 I'm the Atunbi Assistant. Ask me anything about Elijah Snoz — his paintings, music, the exhibition, or how to get in touch.";
    return fallback(question);
  }

  /* ---------- UI ---------- */
  var SUGGESTIONS = [
    "Who is Elijah Snoz?",
    "Tell me about Atunbi",
    "Where is the exhibition?",
    "How can I buy his art?",
    "How do I book him?"
  ];

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function build() {
    // Launcher
    var launcher = el("button", "ask-launcher", '<i class="fas fa-comment-dots"></i><span>Ask Elijah</span>');
    launcher.setAttribute("aria-label", "Ask Elijah — open chat");

    // Panel
    var panel = el("div", "ask-panel");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Ask Elijah chat");
    panel.innerHTML =
      '<div class="ask-head">' +
        '<span class="ask-orb"></span>' +
        '<div class="ask-head-txt"><strong>Ask Elijah</strong><small>Atunbi Assistant · always on</small></div>' +
        '<button class="ask-close" aria-label="Close chat"><i class="fas fa-times"></i></button>' +
      '</div>' +
      '<div class="ask-log" id="askLog"></div>' +
      '<div class="ask-chips" id="askChips"></div>' +
      '<form class="ask-input" id="askForm">' +
        '<input id="askText" type="text" autocomplete="off" placeholder="Ask about art, music, Atunbi…" aria-label="Type your question">' +
        '<button type="submit" aria-label="Send"><i class="fas fa-paper-plane"></i></button>' +
      '</form>';

    document.body.appendChild(launcher);
    document.body.appendChild(panel);

    var log = panel.querySelector("#askLog");
    var chips = panel.querySelector("#askChips");
    var form = panel.querySelector("#askForm");
    var input = panel.querySelector("#askText");
    var greeted = false;

    function scroll() { log.scrollTop = log.scrollHeight; }

    function addUser(text) {
      var row = el("div", "ask-msg user");
      var bubble = el("div", "ask-bubble");
      bubble.textContent = text;               // user text = plain text (safe)
      row.appendChild(bubble);
      log.appendChild(row);
      scroll();
    }

    function addBot(html, instant) {
      if (instant) {
        var row = el("div", "ask-msg bot");
        row.appendChild(el("div", "ask-bubble", html));
        log.appendChild(row);
        scroll();
        return;
      }
      // typing indicator, then reply
      var typing = el("div", "ask-msg bot");
      typing.appendChild(el("div", "ask-bubble ask-typing", '<span></span><span></span><span></span>'));
      log.appendChild(typing);
      scroll();
      setTimeout(function () {
        typing.querySelector(".ask-bubble").classList.remove("ask-typing");
        typing.querySelector(".ask-bubble").innerHTML = html;
        scroll();
      }, 550 + Math.min(html.length * 4, 700));
    }

    function ask(text) {
      text = (text || "").trim();
      if (!text) return;
      addUser(text);
      input.value = "";
      addBot(respond(text));
    }

    // Suggestion chips
    SUGGESTIONS.forEach(function (s) {
      var chip = el("button", "ask-chip", s);
      chip.addEventListener("click", function () { ask(s); });
      chips.appendChild(chip);
    });

    form.addEventListener("submit", function (e) { e.preventDefault(); ask(input.value); });

    function open() {
      panel.classList.add("open");
      launcher.classList.add("hidden");
      if (!greeted) {
        greeted = true;
        addBot("Hi! 👋 I'm the <strong>Atunbi Assistant</strong>. Ask me anything about Elijah Snoz — his paintings, music, the exhibition, or how to reach him. If I don't know, I'll point you to Google or to Elijah himself. 🌀", true);
      }
      setTimeout(function () { input.focus(); }, 300);
    }
    function close() { panel.classList.remove("open"); launcher.classList.remove("hidden"); }

    launcher.addEventListener("click", open);
    panel.querySelector(".ask-close").addEventListener("click", close);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
