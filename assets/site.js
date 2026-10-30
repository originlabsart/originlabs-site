/* Origin Labs site behaviour. Everything you need to fill in lives in CONFIG. */
const CONFIG = {
  CALENDLY_URL: "https://calendly.com/partnerships-originlabs/30min",
  LEAD_WEBHOOK_URL: "",
  CHAT_ENDPOINT: "https://origin-labs-evie.origin-labs.workers.dev/chat",
  REVIEWS_ENDPOINT: "https://origin-labs-evie.origin-labs.workers.dev/reviews",        // same Worker, e.g. "https://origin-labs-evie.<you>.workers.dev/reviews". Empty = review button hidden           // Evie's AI server (the Cloudflare Worker in /worker), e.g. "https://origin-labs-evie.<you>.workers.dev/chat". Empty = scripted replies        // Creator Engine intake, e.g. "https://<dashboard-host>/webhooks/website-lead"
  CONTACT_EMAIL: "partnerships@originlabs.art",
  PARTNERSHIPS_ALIAS: "Jay, Partnerships Lead",
  COMPANY: { name: "", number: "", registeredOffice: "" },   // shown in footer + legal once filled
  SOCIAL: { X: "", Instagram: "", TikTok: "", LinkedIn: "", YouTube: "", Telegram: "" },
};

document.documentElement.classList.add("js");
// ?theme=dark|light previews a theme (used for screenshots and QA)
const _t = new URLSearchParams(location.search).get("theme");
if (_t === "dark" || _t === "light") document.documentElement.dataset.theme = _t;

// The script is deferred, so readyState is "interactive" when it runs; wait for DOMContentLoaded so
// everything defined further down this file exists before any init function uses it.
function onReady(fn) { document.readyState === "complete" ? fn() : document.addEventListener("DOMContentLoaded", fn); }

onReady(() => {
  // header border on scroll
  const header = document.querySelector(".site-header");
  const onScroll = () => header && header.classList.toggle("scrolled", window.scrollY > 8);
  onScroll(); window.addEventListener("scroll", onScroll, { passive: true });

  // mobile menu
  const toggle = document.querySelector(".menu-toggle"), nav = document.getElementById("site-nav");
  if (toggle && nav) toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.classList.toggle("is-open", open);
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    toggle.innerHTML = open
      ? '<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>'
      : "Menu";
  });

  // reveal on scroll
  const io = "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -8% 0px" }) : null;
  document.querySelectorAll(".reveal").forEach((el) => io ? io.observe(el) : el.classList.add("in"));

  // alias + contact placeholders
  document.querySelectorAll("[data-alias]").forEach((el) => (el.textContent = CONFIG.PARTNERSHIPS_ALIAS));
  document.querySelectorAll("[data-contact-email]").forEach((el) => {
    el.textContent = CONFIG.CONTACT_EMAIL; if (el.tagName === "A") el.href = "mailto:" + CONFIG.CONTACT_EMAIL;
  });

  // socials
  document.querySelectorAll("[data-social]").forEach((el) => {
    const links = Object.entries(CONFIG.SOCIAL).filter(([, url]) => url);
    el.innerHTML = links.map(([n, url]) => `<a href="${url}" rel="me noopener" target="_blank">${n}</a>`).join("");
  });

  // company details
  const c = CONFIG.COMPANY;
  document.querySelectorAll("[data-company-line]").forEach((el) => {
    if (c.name) el.textContent = ` · ${c.name}${c.number ? ", company no. " + c.number : ""}`;
  });
  document.querySelectorAll("[data-company-block]").forEach((el) => {
    el.innerHTML = c.name
      ? `<strong>${c.name}</strong><br>${c.number ? "Company number " + c.number + "<br>" : ""}${c.registeredOffice ? "Registered office: " + c.registeredOffice : ""}`
      : "Company registration details will be published here.";
  });

  initSelector();
  initCalendly();
  initContactForm();
});

/* ---------------------------------------------------------- industry selector */
const WORLDS = {
  "viral": {
    page: "/meme-creators",
    label: "Viral memes & characters",
    intro: "Your clip, character or catchphrase is everywhere. Other people are already building around it. We help you take part officially.",
    ideas: [
      ["Official community project", "A creator-backed project that fans can tell apart from the copies, with you involved by agreement."],
      ["Character home on the web", "A site that tells the origin story, credits you, and gives fans one official place to land."],
      ["Creator fees, paid to you", "A slice of every trade on your official coin, straight to your wallet."],
    ],
  },
  "ai": {
    page: "/viral-characters",
    label: "AI characters",
    intro: "You run an original AI personality with its own voice and audience. We can give it a world to live in.",
    ideas: [
      ["Character universe site", "Lore, episodes and a home base for the character outside the feed."],
      ["Interactive experiences", "Chat or game experiences where fans can meet the character."],
      ["Official community project", "A sanctioned project around the character, structured with you from day one."],
      ["Licensing groundwork", "Clarifying what you own so the character can be licensed safely."],
    ],
  },
  "games": {
    page: "/game-developers",
    label: "Indie games & mods",
    intro: "Your game or mod has a cult following and characters people love. We build around the world you made.",
    ideas: [
      ["Community hub", "Leaderboards, lore and community features beyond Discord."],
      ["Playable spin-offs", "Small browser or mobile experiences starring your characters."],
      ["Official community project", "A project for your player base, designed around your IP and your rules."],
      ["Official game coin", "A coin for your player base, with a share of every trade paid to you."],
    ],
  },
  "art": {
    page: "/artists",
    label: "Digital art & illustration",
    intro: "You've drawn a character or image people keep sharing. You should be the one credited, and involved.",
    ideas: [
      ["Official character project", "An authorised project around your character, with you credited as the artist."],
      ["Portfolio & licensing site", "A professional home that makes commercial enquiries easy."],
      ["Official artist coin", "A coin fans can buy into, with creator fees paid to you."],
    ],
  },
  "animation": {
    page: "/artists",
    label: "Animation & comics",
    intro: "Your recurring characters and formats have a real audience. We help turn a series into a world.",
    ideas: [
      ["Series home", "An archive and story site for your characters and episodes."],
      ["Official community project", "A project fans can join, built around your series."],
      ["Interactive extras", "Small games and experiences set in your universe."],
      ["Character coin", "An official coin for your breakout character, credited to you."],
    ],
  },
  "music": {
    label: "Music & sounds",
    intro: "Your track or sound took on a life of its own. The audience that used it can become a community.",
    ideas: [
      ["Sound origin page", "Credit, story and links that send the trend back to you."],
      ["Official community project", "A project around the sound or song, designed with you."],
      ["Fan platform", "A direct home for your listeners outside streaming platforms."],
      ["Release coin", "A coin around your release, with fans backing it from day one."],
    ],
  },
  "nostalgia": {
    page: "/meme-creators",
    label: "Nostalgic internet icons",
    intro: "Something you made years ago is still being shared. A second chapter can be built around it, this time with you.",
    ideas: [
      ["Official revival", "An authorised return for the meme, built around the original creator."],
      ["Archive & story site", "The definitive origin story, told by the person who made it."],
      ["Official community project", "A project for the people who still love it."],
    ],
  },
  "brands": {
    label: "Independent brands & products",
    intro: "Your product or brand has a cult following that behaves like a community. We give it somewhere to gather.",
    ideas: [
      ["Community membership", "Perks and recognition for your most loyal customers."],
      ["Official community project", "A brand-led project designed around your audience."],
      ["Web & app builds", "Storefronts, apps and experiences built for growth."],
      ["Collaborations", "Collabs with creators who fit your world."],
    ],
  },
  "talent": {
    page: "/talent-ventures",
    label: "Celebrities & athletes",
    intro: "You have the name and the idea. We build the app, a real one people use, and launch it to an audience far beyond your fanbase.",
    ideas: [
      ["Your own app", "A real iPhone and Android app with a real-world use, built with you from the idea up."],
      ["Training, fan club or lifestyle", "Coaching and challenges, first listens and live access, routines and bookings: whatever fits you."],
      ["The launch", "Taken to our crypto communities, partners and press, alongside your own fans."],
      ["A venture that grows", "New features, more users and new partnerships long after launch day."],
    ],
  },
  "charity": {
    page: "/charities",
    label: "Charities & animal causes",
    intro: "Wildlife charities, rescues, shelters and pets with a story. People already love your animals, so let's turn that love into funding.",
    ideas: [
      ["Official cause coin", "A coin built around your animal or cause, with an agreed share of every trade paid to you."],
      ["Campaign website", "The story, the animals, what the money funds and a running total supporters can watch grow."],
      ["Adoption & appeal campaigns", "Campaigns around a single rescue, a vet bill or a new home for the long-stayers."],
      ["Community & content", "We grow and run the community, with updates on the animals your project helps."],
    ],
  },
  "personalities": {
    page: "/streamers",
    label: "Streamers, YouTubers & podcasters",
    intro: "Your community already has its own jokes, language and loyalty. We build things it can belong to.",
    ideas: [
      ["Official community project", "A project for your audience that you shape and approve."],
      ["Fan hub", "A home for clips, lore and community moments."],
      ["Interactive experiences", "Games and events built around your channel."],
    ],
  },
};

let EXAMPLES = {};
function initSelector() {
  const root = document.querySelector("[data-selector]");
  if (!root) return;
  const list = root.querySelector('[role="tablist"]'), panel = root.querySelector('[role="tabpanel"]');
  const keys = Object.keys(WORLDS);
  list.innerHTML = keys.map((k, i) =>
    `<button role="tab" id="tab-${k}" aria-controls="world-panel" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-k="${k}">${WORLDS[k].label}</button>`).join("");
  const show = (k) => {
    const w = WORLDS[k];
    list.querySelectorAll('[role="tab"]').forEach((t) => {
      const on = t.dataset.k === k; t.setAttribute("aria-selected", on); t.tabIndex = on ? 0 : -1;
    });
    panel.setAttribute("aria-labelledby", "tab-" + k);
    const real = ((EXAMPLES.worlds || {})[k] || []).map((id) => EXAMPLES.items[id]).filter(Boolean);
    const realHtml = real.length ? `<div class="real"><p class="real-title">It's already happened</p><div class="real-grid">${real.map((x) =>
      `<a class="real-item" href="${x.href}"${x.href.startsWith("http") ? ' target="_blank" rel="noopener"' : ""}><img src="${x.art}" alt="${x.name} token image" loading="lazy"><span><b>${x.name}</b><small>${x.line}</small></span></a>`).join("")}</div></div>` : "";
    panel.innerHTML = `<h3>${w.label}</h3><p class="muted">${w.intro}</p>${realHtml}<p class="eyebrow ideas-eyebrow">What we could build with you</p>
      <div class="ideas">${w.ideas.map(([t, d]) => `<div class="idea"><b>${t}</b><p>${d}</p></div>`).join("")}</div>
      <div class="actions"><a class="btn" href="/book">Talk it through <span class="arrow">→</span></a>${w.page ? `<a class="btn btn-ghost" href="${w.page}">See the full page</a>` : ""}</div>`;
  };
  list.addEventListener("click", (e) => { const t = e.target.closest('[role="tab"]'); if (t) show(t.dataset.k); });
  list.addEventListener("keydown", (e) => {
    if (!["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(e.key)) return;
    e.preventDefault();
    const tabs = [...list.querySelectorAll('[role="tab"]')], i = tabs.indexOf(document.activeElement);
    const next = tabs[(i + (e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
    next.focus(); show(next.dataset.k);
  });
  const fromHash = location.hash.slice(1);
  const first = WORLDS[fromHash] ? fromHash : keys[0];
  show(first);
  fetch("/assets/examples.json").then((r) => r.json()).then((d) => { EXAMPLES = d; const cur = list.querySelector('[aria-selected="true"]'); show(cur ? cur.dataset.k : first); }).catch(() => {});
}

/* ---------------------------------------------------------- calendly */
function initCalendly() {
  const box = document.querySelector("[data-calendly]");
  if (!box) return;
  if (!CONFIG.CALENDLY_URL) {
    const mail = `mailto:${CONFIG.CONTACT_EMAIL}?subject=${encodeURIComponent("Free 15-minute call")}&body=${encodeURIComponent("Hi Origin Labs,\n\nHere's a link to my work:\n\nTimes that suit me (with my time zone):\n\n")}`;
    box.innerHTML = `<h3 class="book-h">Pick a time by email</h3><p class="muted">Send a link to your work and two times that suit you. We'll confirm your call within one working day.</p><a class="btn btn-big book-btn" href="${mail}">Email us to book <span class="arrow">→</span></a><p class="small muted book-addr">${CONFIG.CONTACT_EMAIL}</p>`;
    return;
  }
  const url = CONFIG.CALENDLY_URL + (CONFIG.CALENDLY_URL.includes("?") ? "&" : "?") + "hide_gdpr_banner=1&hide_event_type_details=1&primary_color=00b386&text_color=111111&background_color=ffffff";
  box.innerHTML = `<div class="calendly-inline-widget" data-url="${url}"></div>`;
  const s = document.createElement("script");
  s.src = "https://assets.calendly.com/assets/external/widget.js"; s.async = true;
  document.body.appendChild(s);
}

/* ---------------------------------------------------------- contact form */
function initContactForm() {
  const form = document.querySelector("[data-contact-form]");
  if (!form) return;
  const status = form.querySelector(".form-status");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    if (data.company_website) return;                       // honeypot
    const referral = form.dataset.contactForm === "referral";
    if (referral && (!data.name || !data.email || !data.creator)) { status.textContent = "Please fill in your name, email and the creator's name."; return; }
    if (!referral && (!data.name || !data.email || !data.message)) { status.textContent = "Please fill in your name, email and message."; return; }
    if (!CONFIG.LEAD_WEBHOOK_URL) {
      const lines = referral
        ? [`Referred by: ${data.name}${data.company ? " (" + data.company + ")" : ""}`, `Email: ${data.email}`, `Creator: ${data.creator}`, `Work: ${data.work || ""}`, "", data.message || ""]
        : [`Name: ${data.name}`, `Work: ${data.work || ""}`, "", data.message];
      const subject = referral ? `Creator referral: ${data.creator} (from ${data.name})` : "Partnership enquiry from " + data.name;
      location.href = `mailto:${CONFIG.CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\r\n"))}`;
      return;
    }
    status.textContent = "Sending…";
    try {
      const r = await fetch(CONFIG.LEAD_WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, kind: referral ? "referral" : "enquiry", source: "website", page: location.pathname }) });
      if (!r.ok) throw new Error(r.status);
      form.reset(); status.textContent = "Thanks, we'll be in touch within two working days.";
    } catch {
      status.innerHTML = `Something went wrong. Please email <a href="mailto:${CONFIG.CONTACT_EMAIL}">${CONFIG.CONTACT_EMAIL}</a>.`;
    }
  });
}

/* ---------------------------------------------------------- showcase filters */
onReady(() => {
  const bar = document.querySelector("[data-filters]");
  if (!bar) return;
  bar.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-filter]");
    if (!chip) return;
    const f = chip.dataset.filter;
    bar.querySelectorAll("[data-filter]").forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
    document.querySelectorAll(".showcase [data-cat]").forEach((card) => {
      card.hidden = !(f === "all" || card.dataset.cat === f);
      if (!card.hidden) card.classList.add("in");
    });
    collapse(true);
  });

  // On phones the list is long, so only the first few cards show until "See more" is tapped.
  const more = document.querySelector("[data-see-more]");
  const phone = matchMedia("(max-width: 760px)");
  const FIRST = 4;
  let collapsed = true;
  function collapse(reset) {
    if (!more) return;
    if (reset) collapsed = true;
    const cards = [...document.querySelectorAll(".showcase .cc")];
    const shown = cards.filter((c) => !c.hidden);
    const active = phone.matches && shown.length > FIRST;
    let n = 0;
    cards.forEach((c) => { c.classList.toggle("more-hidden", active && collapsed && !c.hidden && n++ >= FIRST); });
    more.hidden = !active;
    const rest = shown.filter((c) => !c.classList.contains("cc-cta")).length - FIRST;
    more.textContent = collapsed ? `See ${rest} more creators` : "Show fewer";
  }
  if (more) {
    more.addEventListener("click", () => {
      collapsed = !collapsed;
      collapse(false);
      if (collapsed) document.querySelector(".showcase").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    phone.addEventListener("change", () => collapse(false));
    collapse(true);
  }
});

/* ---------------------------------------------------------- how it works: scrolling story */
onReady(() => {
  const root = document.querySelector("[data-hiw]");
  if (!root) return;
  const steps = [...root.querySelectorAll(".hstep")];
  const candles = [...root.querySelectorAll(".hc")];
  const label = root.querySelector("[data-hiw-label]");
  const fill = root.querySelector(".hiw-rail-fill");
  const stepsBox = root.querySelector(".hiw-steps");
  const decos = [...root.querySelectorAll("[data-speed]")];
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const names = ["A quick chat", "Your plan", "The deal", "We build it", "Launch day", "Get paid & grow"];
  const fired = new Set();
  const SPARK = (c) => `<svg viewBox="-12 -12 24 24"><path d="M0,-11 Q2,-2 11,0 Q2,2 0,11 Q-2,2 -11,0 Q-2,-2 0,-11Z" fill="${c}" stroke="#111" stroke-width="1.6"/></svg>`;

  function burst(x, y, big, money) {
    if (calm || !money) return;  // only Launch day and Get paid & grow burst
    const b = document.createElement("div");
    b.className = "burst"; b.style.left = x + "px"; b.style.top = y + "px";
    const n = big ? 34 : 16;
    for (let i = 0; i < n; i++) {
      const el = document.createElement("span");
      const kind = Math.random();
      if (!money) { el.className = "pt pt-spark"; el.innerHTML = SPARK(["#FFC93C", "#00C9A7", "#FF7AC6"][i % 3]); }
      else if (kind < .38) { el.className = "pt pt-coin"; el.innerHTML = '<img src="/assets/logo-mark.svg" alt="">'; }
      else if (kind < .62) { el.className = "pt pt-cash"; el.textContent = "$"; }
      else if (kind < .82) { el.className = "pt pt-spark"; el.innerHTML = SPARK(["#FFC93C", "#00C9A7", "#FF7AC6"][i % 3]); }
      else { el.className = "pt pt-bill"; el.textContent = "$"; }
      const a = Math.random() * Math.PI * 2, r = (big ? 120 : 70) + Math.random() * (big ? 220 : 110);
      el.style.setProperty("--dx", Math.cos(a) * r + "px");
      el.style.setProperty("--dy", Math.sin(a) * r - (big ? 60 : 30) + "px");
      el.style.setProperty("--r", (Math.random() * 540 - 270) + "deg");
      el.style.setProperty("--s", (.7 + Math.random() * .7).toFixed(2));
      el.style.setProperty("--d", (0.9 + Math.random() * .7).toFixed(2) + "s");
      b.appendChild(el);
    }
    document.body.appendChild(b);
    setTimeout(() => b.remove(), 1800);
  }
  function burstAt(el, big, money) {
    const r = el.getBoundingClientRect();
    burst(r.left + r.width / 2 + scrollX, r.top + r.height / 2 + scrollY, big, money);
  }

  // On phones the chart sits above the steps, so it plays itself as soon as the page opens instead of waiting for a scroll.
  const auto = matchMedia("(max-width: 900px)").matches;
  function light(n) {
    candles.forEach((c, i) => { c.classList.toggle("on", i < n); c.classList.toggle("now", i === n - 1); });
    if (label) label.textContent = n ? `Step ${n} of 6 · ${names[n - 1]}` : (auto ? "Six steps" : "Scroll to start");
  }
  if (auto) {
    let n = 0;
    const tick = () => {
      n++; light(n);
      if (n >= 5 && candles[n - 1]) burstAt(candles[n - 1].querySelector(".hc-c"), n === 6, true);
      if (n < 6) setTimeout(tick, calm ? 450 : 650);
    };
    setTimeout(tick, 500);
    root.querySelector(".hiw-chart")?.addEventListener("click", () => { if (n >= 6) { n = 0; light(0); setTimeout(tick, 250); } });
  }

  function activate(n) {
    steps.forEach((s, i) => s.classList.toggle("is-on", i < n));
    if (!auto) light(n);
    if (n && !fired.has(n)) {
      fired.add(n);
      const money = n >= 5;  // dollar bursts only for Launch day and Get paid & grow
      burstAt(steps[n - 1].querySelector(".hstep-icon"), n === 6, money);
      if (!auto && candles[n - 1]) setTimeout(() => burstAt(candles[n - 1].querySelector(".hc-c"), false, money), 250);
    }
  }

  steps.forEach((s, i) => s.querySelector(".hstep-card").addEventListener("click", () => burstAt(s.querySelector(".hstep-icon"), i === 5, i >= 4)));

  let ticking = false;
  function onScroll() {
    ticking = false;
    const vh = innerHeight, mid = vh * 0.55;
    let n = 0;
    steps.forEach((s, i) => { if (s.getBoundingClientRect().top < mid) n = i + 1; });
    activate(n);
    const box = stepsBox.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (mid - box.top) / box.height));
    if (fill) fill.style.setProperty("--fill", (p * 100).toFixed(1) + "%");
    if (calm) return;
    const top = root.getBoundingClientRect().top;
    decos.forEach((d) => { d.style.transform = `translate3d(0, ${(-top * parseFloat(d.dataset.speed)).toFixed(1)}px, 0)`; });
    steps.forEach((s) => {
      const r = s.getBoundingClientRect(), off = (r.top + r.height / 2 - vh / 2) / vh;
      s.style.transform = `translate3d(${(off * -18).toFixed(1)}px, ${(off * 26).toFixed(1)}px, 0)`;
    });
  }
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener("resize", onScroll);
  onScroll();
});

/* ---------------------------------------------------------- homepage hero parallax */
onReady(() => {
  const hero = document.querySelector("[data-hero]");
  if (!hero || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const els = [...hero.querySelectorAll("[data-par]")];
  let ticking = false;
  const run = () => {
    ticking = false;
    const y = Math.min(scrollY, 1400);
    els.forEach((el) => {
      const sp = parseFloat(el.dataset.par);
      el.style.transform = el.classList.contains("hs-art")
        ? `translate3d(0, ${(y * sp).toFixed(1)}px, 0) scale(${(1 + y * 0.00012).toFixed(4)})`
        : `translate3d(0, ${(y * sp).toFixed(1)}px, 0)`;
    });
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(run); } }, { passive: true });
  run();
});

/* ---------------------------------------------------------- generic scroll parallax: [data-py] inside [data-parallax-scope] */
onReady(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const scopes = [...document.querySelectorAll("[data-parallax-scope]")];
  const k = innerWidth < 900 ? 0.45 : 1;   // gentler drift on phones
  if (!scopes.length) return;
  let ticking = false;
  const run = () => {
    ticking = false;
    scopes.forEach((sc) => {
      const r = sc.getBoundingClientRect(), off = r.top + r.height / 2 - innerHeight / 2;
      sc.querySelectorAll("[data-py]").forEach((el) => {
        el.style.transform = `translate3d(0, ${(off * parseFloat(el.dataset.py) * k).toFixed(1)}px, 0)`;
      });
    });
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(run); } }, { passive: true });
  run();
});

/* ---------------------------------------------------------- Evie: chat assistant
   Pops up by itself on a visitor's first visit, then lives in the corner button.
   Replies come from CONFIG.CHAT_ENDPOINT (an AI that knows the site and steers people to a call);
   without it, or if it fails, short scripted replies do the same job. */
onReady(() => {
  if (/^\/book\/?$/.test(location.pathname)) return;           // already booking: don't interrupt
  // desktop only: no chat on phones and tablets, including big phones turned sideways (touch-only screens)
  if (matchMedia("(max-width: 900px), (hover: none) and (pointer: coarse)").matches) return;
  const store = (k, v) => { try { return v === undefined ? localStorage.getItem(k) : localStorage.setItem(k, v); } catch { return null; } };
  const sess = (k, v) => { try { return v === undefined ? sessionStorage.getItem(k) : sessionStorage.setItem(k, v); } catch { return null; } };
  const GREETING = "Hey! 👋 Welcome to Origin Labs. I'm Evie, the team's AI assistant. Made something people love? I can point you in the right direction.";
  const QUICK = ["How would I get paid?", "What does it cost?", "Book a free call"];
  let history = []; try { history = JSON.parse(sess("evie_chat") || "[]"); } catch { history = []; }
  let busy = false;

  const root = document.createElement("div");
  root.className = "evie";
  root.innerHTML = `
    <div class="evie-teaser" hidden><button class="evie-teaser-x" aria-label="Dismiss">×</button><button class="evie-teaser-msg">Hey! I'm Evie 👋 Need a hand?</button></div>
    <section class="evie-panel" role="dialog" aria-label="Chat with Evie, Origin Labs' AI assistant" hidden>
      <header class="evie-head">
        <span class="evie-av"><img src="/assets/img/evie.webp" alt="Evie" width="256" height="256"><i></i></span>
        <span class="evie-who"><b>Evie</b><small>AI assistant · Origin Labs</small></span>
        <button class="evie-x" aria-label="Close chat">×</button>
      </header>
      <div class="evie-log" aria-live="polite"></div>
      <div class="evie-quick"></div>
      <a class="evie-book" href="/book">Book a free 15-minute call <span>→</span></a>
      <form class="evie-form"><label class="sr-only" for="evie-in">Message Evie</label>
        <input id="evie-in" autocomplete="off" maxlength="600" placeholder="Type a message…"><button aria-label="Send">➤</button></form>
      <p class="evie-note">For anything important, our team will answer on a call.</p>
    </section>
    <button class="evie-launch" aria-label="Chat with us now"><img src="/assets/img/evie.webp" alt="" width="256" height="256"><span>Chat with us now</span></button>`;
  document.body.appendChild(root);
  const $ = (sel) => root.querySelector(sel);
  const panel = $(".evie-panel"), log = $(".evie-log"), quick = $(".evie-quick"), input = $("#evie-in"), teaser = $(".evie-teaser");

  const esc = (t) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  // light formatting: links to our own pages and the email become clickable
  const fmt = (t) => esc(t).replace(/(^|\s)(\/(book|how-it-works|creator-economy|what-we-build|who-we-work-with|contact|experience|creator-partnerships)\/?)(?=[\s.,!?)]|$)/g, '$1<a href="$2">$2</a>')
    .replace(/partnerships@originlabs\.art/g, '<a href="mailto:partnerships@originlabs.art">partnerships@originlabs.art</a>');
  const bubble = (role, text) => {
    const el = document.createElement("div"); el.className = "evie-msg " + (role === "user" ? "me" : "her");
    el.innerHTML = fmt(text); log.appendChild(el); log.scrollTop = log.scrollHeight; return el;
  };
  const typing = () => { const el = document.createElement("div"); el.className = "evie-msg her evie-typing"; el.innerHTML = "<i></i><i></i><i></i>"; log.appendChild(el); log.scrollTop = log.scrollHeight; return el; };
  const setQuick = (items) => { quick.innerHTML = ""; items.forEach((q) => { const b = document.createElement("button"); b.type = "button"; b.textContent = q; b.onclick = () => send(q); quick.appendChild(b); }); };
  const save = () => sess("evie_chat", JSON.stringify(history.slice(-20)));

  function open(focus = true) {
    teaser.hidden = true; panel.hidden = false; root.classList.add("open"); store("evie_seen", "1");
    if (!log.childElementCount) {
      if (history.length) { history.forEach((m) => bubble(m.role, m.content)); }
      else {
        const t = typing();
        setTimeout(() => { t.remove(); bubble("assistant", GREETING); history.push({ role: "assistant", content: GREETING }); save(); setQuick(QUICK); }, 1300);
      }
    }
    if (focus && matchMedia("(pointer:fine)").matches) setTimeout(() => input.focus(), 50);
  }
  function close() { panel.hidden = true; root.classList.remove("open"); store("evie_closed", "1"); }

  // scripted fallback: short, accurate, always pointing at the call
  function scripted(q) {
    let t = q.toLowerCase().trim();
    // small talk first, so Evie answers a "hello" like a person would
    const greet = /^(hi+|hello+|hey+|hiya|yo|howdy|sup|good (morning|afternoon|evening)|evening|morning)\b[\s,!.]*(there|evie|everyone)?[\s,!.]*/;
    const rest = t.replace(greet, "");
    if (greet.test(t) && !rest.trim()) return "Hey! 👋 Lovely to meet you. I'm Evie, Origin Labs' AI assistant. What have you made? A meme, a character, a game, art, music? Tell me a bit and I'll point you the right way.";
    t = rest || t;
    if (/^(how are you|how('s| is) it going|how are things|you (ok|good|alright)|hows it going)\b/.test(t)) return "I'm great, thanks for asking! 😊 Even better if you've made something people love. What is it?";
    if (/^(thanks|thank you|cheers|ta|nice one|great thanks|perfect thanks)\b/.test(t)) return "You're welcome! If you'd like the team to look at your work properly, a free 15-minute call at /book is the quickest route. Anything else I can help with?";
    if (/^(bye|goodbye|see you|see ya|later|cya|got to go|gotta go)\b/.test(t)) return "Bye for now! 👋 Whenever you're ready, the team's at /book. Have a good one.";
    if (/are you (a |an )?(bot|robot|real|human|person|ai)|is this a bot|real person|am i talking to/.test(t)) return "I'm Origin Labs' AI assistant, so not a person, but the team you'd speak to on the call are very real! Want me to set that up at /book?";
    if (/^(who are you|what are you|what('s| is) your name|your name)\b/.test(t)) return "I'm Evie, the AI assistant for Origin Labs. We partner with the original creators of things the internet loves and get them paid for it. What have you made?";
    if (/what (is|does|do) origin labs|about origin labs|what do you do|what is this( site| website)?/.test(t)) return "Origin Labs partners with the people who made the internet's favourite things, from memes and characters to games and art, builds the official project around their work and gets them paid for it, instead of copycats. Is there something of yours people love?";
    if (/^(ok|okay|cool|nice|great|sounds good|alright|sure|yes|yeah|yep|interesting|wow|lol|haha)\b[\s!.]*$/.test(t)) return "Great! Want me to explain how you'd get paid, what it costs (nothing upfront), or shall I get you booked in for a free call at /book?";
    if (/^(no|nope|nah|not really|not now|maybe later)\b[\s!.]*$/.test(t)) return "No problem at all. I'm here if anything comes up, and the team's always at /book whenever you're ready.";
    if (/help|what can you do|questions?$/.test(t) && t.split(" ").length <= 6) return "Happy to help! I can explain how you'd get paid, what partnering with Origin Labs involves, what it costs, or who we work with. What would you like to know?";
    if (/celebrit|athlete|footballer|fighter|influencer|famous|talent|manager|agent|app idea|build (me |us )?an app|\bapp\b/.test(t)) return "Love it! 🙌 Through Talent Ventures we build real iPhone and Android apps with celebrities, athletes and influencers. Not just a name on a coin, but something people actually use, launched to our crypto communities and partners far beyond your fanbase. More at /talent-ventures, or book a free call at /book.";
    if (/charit|rescue|shelter|wildlife|conservation|sanctuary|adopt|animal welfare|fundrais|donat/.test(t)) return "We'd love to hear about your cause! 🐾 Origin Labs works with wildlife charities, rescues, shelters and pets with a story. We build an official coin project around your animals or cause, run it for you, and an agreed share of everything it earns goes straight to you. No upfront cost and no crypto knowledge needed. More at /charities, or book a free 15-minute call at /book.";
    if (/book|call|talk|human|person|someone|speak/.test(t)) return "Perfect, that's the best next step. Grab a free 15-minute call at /book and our partnerships team will walk you through everything. 🙌";
    if (/cost|price|fee|pay you|charge|free|upfront|money down/.test(t)) return "It costs you nothing upfront. We only earn when your project does, and the split is agreed in writing before anything launches. The exact numbers depend on your project, so our team covers them on a free call at /book.";
    if (/paid|earn|make money|how much|income|wallet|revenue|share/.test(t)) return "Love this question! 🚀 You get an agreed share of what your project earns, written into your contract and paid straight to your own wallet. How big it goes depends on a few things, like the story, the timing and how the launch is run, and that's exactly what our team handles. Projects our team has worked on have passed $10M market caps, with creators earning well over $50K–$100K. On /creator-economy you'll see Nyan Cat's artist made ~$706K and Gas Town's developer $238K in 11 days. Best next step: a free 15-minute call at /book.";
    if (/how|work|process|step|launch|start/.test(t)) return "In short: a 15-minute call, we plan it with you, agree the deal in writing, build it, launch it together, then you get paid while we keep it growing. The full walkthrough is at /how-it-works, or book a call at /book.";
    if (/risk|safe|scam|legit|trust|crypto|coin/.test(t)) return "Fair question. Coins are speculative, so values can rise and fall fast and nobody can promise an income. We put the risks in writing before you commit to anything. The team can answer every question on a free call at /book.";
    if (/who|meme|artist|stream|game|music|character|qualify|eligible/.test(t)) return "We work with original creators: memes, characters, artists, streamers, game makers, musicians and more, as long as it's yours and people recognise it. Tell the team what you made on a free call at /book.";
    return "Great question for the team! The quickest way to get a proper answer is a free 15-minute call at /book. You can also email partnerships@originlabs.art.";
  }

  async function send(text) {
    text = (text || "").trim(); if (!text || busy) return;
    if (/^book a free call$/i.test(text)) { location.href = "/book"; return; }
    busy = true; quick.innerHTML = ""; input.value = "";
    bubble("user", text); history.push({ role: "user", content: text }); save();
    const t = typing(); let reply = "";
    try {
      if (!CONFIG.CHAT_ENDPOINT) throw new Error("no endpoint");
      const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 15000);
      const r = await fetch(CONFIG.CHAT_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: history.slice(-12), page: location.pathname }), signal: ctl.signal });
      clearTimeout(timer);
      if (!r.ok) throw new Error("http " + r.status);
      reply = ((await r.json()).reply || "").trim(); if (!reply) throw new Error("empty");
    } catch { await new Promise((ok) => setTimeout(ok, 900)); reply = scripted(text); }
    t.remove(); bubble("assistant", reply); history.push({ role: "assistant", content: reply }); save();
    if (history.filter((m) => m.role === "user").length >= 2) setQuick(["Book a free call"]);
    busy = false;
  }

  $(".evie-launch").onclick = () => { if (panel.hidden) { store("evie_closed", ""); try { localStorage.removeItem("evie_closed"); } catch {} open(); } else close(); };
  $(".evie-x").onclick = close;
  $(".evie-teaser-msg").onclick = () => open();
  $(".evie-teaser-x").onclick = () => { teaser.hidden = true; store("evie_seen", "1"); };
  $(".evie-form").onsubmit = (e) => { e.preventDefault(); send(input.value); };
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !panel.hidden) close(); });


  panel.addEventListener("transitionend", () => {});
  new MutationObserver(() => sess("evie_open", panel.hidden ? "0" : "1")).observe(panel, { attributes: true, attributeFilter: ["hidden"] });

  // Scroll parallax: the widget floats on a spring, lagging a little behind the page and settling back.
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    let lastY = scrollY, push = 0, pos = 0, running = false;
    const step = () => {
      const v = scrollY - lastY; lastY = scrollY;
      push = Math.max(-28, Math.min(28, push + v * 0.35)) * 0.86;
      pos += (push - pos) * 0.18;
      root.style.transform = `translate3d(0, ${pos.toFixed(2)}px, 0) rotate(${(pos * 0.12).toFixed(2)}deg)`;
      if (Math.abs(pos) > 0.05 || Math.abs(push) > 0.05 || v) requestAnimationFrame(step);
      else { running = false; root.style.transform = ""; }
    };
    addEventListener("scroll", () => { if (!running) { running = true; requestAnimationFrame(step); } }, { passive: true });
  }

  // First-time visitors: the compact panel pops up by itself after a short beat, once ever (open() marks evie_seen).
  // If it was open on the last page, keep it open. Otherwise offer a small "need a hand?" bubble once per visit,
  // after 6 seconds or the first real scroll, until the visitor dismisses it.
  if (sess("evie_open") === "1" && !store("evie_closed")) open(false);
  else if (!store("evie_seen") && !store("evie_closed")) setTimeout(() => { if (panel.hidden && !store("evie_seen")) open(false); }, 2500);
  else if (!store("evie_seen") && !sess("evie_teased")) {
    let shown = false;
    const tease = () => {
      if (shown || !panel.hidden) return;
      shown = true; sess("evie_teased", "1"); teaser.hidden = false;
      removeEventListener("scroll", onScroll);
      setTimeout(() => { teaser.hidden = true; }, 12000);     // it tidies itself away if ignored
    };
    const onScroll = () => { if (scrollY > innerHeight * 0.5) tease(); };
    addEventListener("scroll", onScroll, { passive: true });
    setTimeout(tease, 6000);
  }
});

/* ---------------------------------------------------------- visitor reviews: "Leave a review" publishes instantly */
onReady(() => {
  const box = document.querySelector("[data-reviews]");
  if (!box) return;
  box.hidden = false;
  const list = box.querySelector(".rvw-list");
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const star = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z"/></svg>';
  const caLink = (r) => r.ca ? `<a class="rvw-ca" href="${r.chain === "evm" ? "https://dexscreener.com/search?q=" : "https://solscan.io/token/"}${esc(r.ca)}" target="_blank" rel="noopener" title="${esc(r.ca)}">Contract ${esc(r.ca.slice(0, 4))}…${esc(r.ca.slice(-4))} <span aria-hidden="true">↗</span></a>` : "";
  const card = (r) => `<figure class="ts ts-mint rvw-card">${r.banner ? `<div class="ts-art"><img src="${esc(r.banner)}" alt="" loading="lazy" style="object-fit:cover"></div>` : ""}<div class="ts-top"><span class="ts-stars" role="img" aria-label="Rated ${r.rating} out of 5">${star.repeat(r.rating)}</span><span class="ts-project">${r.project ? `${esc(r.project)}${r.ticker ? ` <i>$${esc(r.ticker)}</i>` : ""}` : esc(r.date)}</span></div>
    <blockquote><p>${esc(r.text)}</p></blockquote>${caLink(r)}<figcaption><span class="ts-person">${r.pfp ? `<img class="ts-pfp" src="${esc(r.pfp)}" alt="" loading="lazy">` : `<span class="ts-av">${esc((r.name.match(/\b\w/g) || ["?"]).slice(0, 2).join("").toUpperCase())}</span>`}<span class="ts-who"><b>${esc(r.name)}</b><small>${esc(r.role || (r.project ? "Creator" : "Visitor"))}</small></span></span>${r.earned ? `<span class="ts-paid"><small>Creator earnings</small><b>$${Number(r.earned).toLocaleString("en-US")}+</b></span>` : ""}</figcaption></figure>`;
  const render = (items) => { list.innerHTML = items.map(card).join(""); list.hidden = !items.length; };
  if (CONFIG.REVIEWS_ENDPOINT) fetch(CONFIG.REVIEWS_ENDPOINT).then((r) => r.json()).then((d) => render(d.reviews || [])).catch(() => render([]));
  else render([]);

  const dlg = document.createElement("dialog");
  dlg.className = "rvw-dialog";
  dlg.innerHTML = `<form method="dialog" class="rvw-form" novalidate>
    <button class="rvw-x" value="cancel" aria-label="Close">×</button>
    <h3>Leave a review</h3><p class="muted">Worked with us, or just love what we do? Tell everyone.</p>
    <fieldset class="rvw-stars"><legend>Your rating</legend><span class="rvw-starrow">${[5, 4, 3, 2, 1].map((n) => `<input type="radio" name="rating" id="rv${n}" value="${n}"${n === 5 ? " checked" : ""}><label for="rv${n}" title="${n} star${n > 1 ? "s" : ""}">${star}</label>`).join("")}</span></fieldset>
    <div class="field"><label for="rv-name">Your name</label><input id="rv-name" name="name" maxlength="40" required></div>
    <div class="field"><label for="rv-project">Coin name <span class="muted">(optional)</span></label><input id="rv-project" name="project" maxlength="40" data-caps autocomplete="off" placeholder="E.G. BEBE THE SCUBA DIVING PARROT"></div>
    <div class="field"><label for="rv-ticker">Ticker <span class="muted">(optional)</span></label><input id="rv-ticker" name="ticker" maxlength="11" data-caps data-ticker autocomplete="off" placeholder="E.G. BEBE"></div>
    <div class="field"><label for="rv-earned">How much have you earned? <span class="muted">(optional, in US$)</span></label><input id="rv-earned" name="earned" inputmode="numeric" maxlength="12" autocomplete="off" placeholder="e.g. 24,000"></div>
    <div class="field"><label for="rv-text">Your review</label><textarea id="rv-text" name="text" maxlength="600" required></textarea></div>
    <div class="rvw-uploads">
      <label class="rvw-up rvw-up-pfp"><input type="file" accept="image/*" data-up="pfp"><span class="rvw-up-prev"></span><span class="rvw-up-txt"><b>Profile picture</b><small>Optional</small></span></label>
      <label class="rvw-up rvw-up-banner"><input type="file" accept="image/*" data-up="banner"><span class="rvw-up-prev"></span><span class="rvw-up-txt"><b>Banner image</b><small>Optional · e.g. your artwork</small></span></label>
    </div>
    <div class="hp" aria-hidden="true"><input name="website" tabindex="-1" autocomplete="off"></div>
    <button class="btn btn-big" value="send">Post my review <span class="arrow">→</span></button>
    <p class="form-status" role="status" aria-live="polite"></p></form>`;
  document.body.appendChild(dlg);
  const form = dlg.querySelector("form"), status = dlg.querySelector(".form-status");
  // coin name and ticker are capitals only; the ticker also drops "$" and spaces; earnings keep digits and commas
  dlg.querySelectorAll("[data-caps]").forEach((inp) => inp.addEventListener("input", () => {
    const v = inp.value.toUpperCase().replace(inp.dataset.ticker != null ? /[^A-Z0-9]/g : /[^A-Z0-9 '&.\-!]/g, "");
    if (v !== inp.value) inp.value = v;
  }));
  const earnedInp = dlg.querySelector("#rv-earned");
  earnedInp.addEventListener("input", () => { const d = earnedInp.value.replace(/\D/g, "").slice(0, 8); earnedInp.value = d ? Number(d).toLocaleString("en-US") : ""; });
  // optional images: shrunk in the browser to small JPEGs before sending
  const imgs = { pfp: "", banner: "" };
  const shrink = (file, w, h) => new Promise((ok, bad) => {
    const im = new Image(); im.onerror = bad;
    im.onload = () => {
      const c = document.createElement("canvas"); c.width = w; c.height = h;
      const s = Math.max(w / im.width, h / im.height), dw = im.width * s, dh = im.height * s;
      c.getContext("2d").drawImage(im, (w - dw) / 2, (h - dh) / 2, dw, dh);
      URL.revokeObjectURL(im.src); ok(c.toDataURL("image/jpeg", 0.78));
    };
    im.src = URL.createObjectURL(file);
  });
  dlg.querySelectorAll("[data-up]").forEach((inp) => inp.addEventListener("change", async () => {
    const f = inp.files[0], k = inp.dataset.up, prev = inp.parentElement.querySelector(".rvw-up-prev");
    if (!f) return;
    try { imgs[k] = k === "pfp" ? await shrink(f, 160, 160) : await shrink(f, 720, 405); prev.style.backgroundImage = `url(${imgs[k]})`; inp.parentElement.classList.add("has"); }
    catch { status.textContent = "That image couldn't be read. Try a JPG or PNG."; }
  }));
  box.querySelector("[data-review-open]").onclick = () => { status.textContent = ""; dlg.showModal(); };
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
  form.addEventListener("submit", async (e) => {
    if (e.submitter && e.submitter.value === "cancel") return;
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries()); data.rating = Number(data.rating);
    data.pfp = imgs.pfp; data.banner = imgs.banner; data.earned = data.earned ? Number(String(data.earned).replace(/\D/g, "")) : "";
    if (!CONFIG.REVIEWS_ENDPOINT) {   // review server not switched on yet: send it to the team instead of losing it
      location.href = `mailto:${CONFIG.CONTACT_EMAIL}?subject=${encodeURIComponent("My review of Origin Labs")}&body=${encodeURIComponent(`${data.name}${data.project ? " (" + data.project + (data.ticker ? " $" + data.ticker : "") + ")" : ""}${data.earned ? "\nEarned: $" + data.earned : ""}\nRating: ${data.rating}/5\n\n${data.text}`)}`;
      status.textContent = "Thanks! Your email app has opened with your review ready to send" + (imgs.pfp || imgs.banner ? " (attach your pictures there too)." : "."); return;
    }
    status.textContent = "Posting…";
    try {
      const r = await fetch(CONFIG.REVIEWS_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const d = await r.json();
      if (!r.ok) { status.textContent = d.error || "Something went wrong. Please try again."; return; }
      if (d.review) { list.insertAdjacentHTML("afterbegin", card(d.review)); list.hidden = false; }
      form.reset(); imgs.pfp = imgs.banner = ""; dlg.querySelectorAll(".rvw-up").forEach((u) => { u.classList.remove("has"); u.querySelector(".rvw-up-prev").style.backgroundImage = ""; }); dlg.close();
      list.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } catch { status.textContent = "Couldn't post right now. Please try again in a minute."; }
  });
});

/* ---------------------------------------------------------- footer sticker: sticks on as the footer scrolls in, peels off as it scrolls away */
onReady(() => {
  const el = document.querySelector("[data-sticker]");
  if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  let raf = 0;
  const ease = (x) => x * x * (3 - 2 * x);
  const update = () => {
    raf = 0;
    const vh = innerHeight, top = el.getBoundingClientRect().top;
    const p = Math.min(1, Math.max(0, (vh - top) / (vh * 0.42)));
    el.style.setProperty("--p", ease(p).toFixed(3));
  };
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
  addEventListener("scroll", onScroll, { passive: true }); addEventListener("resize", onScroll); update();
});
