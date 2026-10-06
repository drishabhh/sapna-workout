(() => {
  const REPO = { owner: "drishabhh", name: "sapna-workout", branch: "main" };
  const PLAN_PATH = "data/today.json";
  const LS_TOKEN = "sapna_gh_token";
  const SS_UNLOCKED = "sapna_admin_unlocked";

  const LIBRARY_PATH = "data/gif-library.json";
  const FALLBACK_GIFS = [
    { id: "local-arm-circles", name: "Arm circles", path: "media/arm-circles.gif", thumb: "media/arm-circles.gif", group: "stretching", bodyPart: "arms", aliases: ["arm circle"] },
    { id: "local-lat-pulldown", name: "Lat pulldown", path: "media/lat-pulldown.gif", thumb: "media/lat-pulldown.gif", group: "exercises", bodyPart: "back", aliases: ["lat pull down", "lat pull-down"] },
    { id: "local-chest-press", name: "Chest press", path: "media/chest-press.gif", thumb: "media/chest-press.gif", group: "exercises", bodyPart: "chest", aliases: [] },
  ];

  /** @type {any} */
  let gifLibrary = {
    groups: [
      { id: "stretching", label: "Stretching" },
      { id: "exercises", label: "Exercises" },
    ],
    bodyParts: [
      { id: "dumbbell", label: "Dumbbell", kind: "equipment" },
      { id: "back", label: "Back" },
      { id: "chest", label: "Chest" },
      { id: "shoulders", label: "Shoulders" },
      { id: "arms", label: "Arms" },
      { id: "legs", label: "Legs" },
      { id: "core", label: "Core" },
      { id: "cardio", label: "Cardio" },
      { id: "full-body", label: "Full body" },
    ],
    gifs: FALLBACK_GIFS,
  };

  /** @type {{moveIndex:number, level:string, group:string, bodyPart:string, query:string, mode:string}} */
  let gifBrowser = { moveIndex: -1, level: "root", group: "", bodyPart: "", query: "", mode: "edit" };

  /** @type {{step:string, kind:string, group:string, name:string, gif:string, rx:string}} */
  let addWizard = { step: "type", kind: "main", group: "exercises", name: "", gif: "", rx: "" };

  const DEFAULT_PLAN = {
    updatedAt: null,
    headline: "Aaj ka workout",
    support: "Stretch, cycle or walk, then strength — with form demos for every move.",
    restNote: {
      title: "Rest & water",
      body: "Rest 1–1.5 min between sets. Drink water — not cold; warm or room temp, sip by sip.",
      bodyHtml:
        "<strong>Rest 1–1.5 min</strong> between sets. Drink water — <em>not cold</em>; warm or room temp, sip by sip.",
    },
    sections: [
      {
        id: "stretching",
        eyebrow: "Warm-up",
        title: "Stretching",
        subtitle: "10 reps each — easy and controlled",
        kind: "stretch",
        moves: [
          { id: "arm-circles", name: "Arm circles", rx: "10 reps each direction", gif: "media/arm-circles.gif", demo: "img" },
          { id: "torso-rotations", name: "Torso rotations", rx: "10 reps each side", gif: "media/torso-rotations.gif", demo: "img" },
          { id: "leg-swings", name: "Leg swings", rx: "10 reps each leg — hold a wall if needed", gif: "", demo: "svg-leg-swing" },
          { id: "bodyweight-squats", name: "Bodyweight squats", rx: "10 reps — warm-up pace", gif: "media/bodyweight-squats.gif", demo: "img" },
        ],
      },
      {
        id: "exercise",
        eyebrow: "Main session",
        title: "Exercise",
        subtitle: "Cardio pehle, phir strength — follow the prescriptions",
        kind: "main",
        moves: [
          { id: "cycle-walk", name: "Cycle / treadmill walk", rx: "3 min cycle (normal pace) ya 5 min walk", gif: "media/cycle-walk.gif", demo: "img" },
          { id: "chest-press", name: "Chest press flat bench", rx: "5 kg · 2 sets × 12", gif: "media/chest-press.gif", demo: "img" },
          { id: "shoulder-press", name: "Shoulder press", rx: "2.5 kg · 2 sets × 12", gif: "media/shoulder-press.gif", demo: "img" },
          { id: "lat-pulldown", name: "Lat pull down", rx: "20 kg · 2 sets × 12", gif: "media/lat-pulldown.gif", demo: "img" },
          { id: "cable-row", name: "Seated Cable Row", rx: "20 kg · 2 sets × 12", gif: "media/cable-row.gif", demo: "img" },
          { id: "leg-curl", name: "Seated Leg Curl", rx: "15–20 kg · 2 sets × 12", gif: "media/leg-curl.gif", demo: "img" },
          { id: "db-squats", name: "Dumbbell squats", rx: "7.5 kg · 2 sets × 12", gif: "media/db-squats.gif", demo: "img" },
        ],
      },
    ],
  };

  function clone(value) {
    if (typeof structuredClone === "function") return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  }

  /** @type {any} */
  let currentPlan = clone(DEFAULT_PLAN);
  /** @type {Array<{id:string,name:string,rx:string,gif:string,demo:string,kind:string,pendingFile?:File|null}>} */
  let draftMoves = [];

  const $ = (id) => document.getElementById(id);

  function slugify(text) {
    return String(text || "move")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "move";
  }

  function uid(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  }

  function formatRx(rx) {
    return escapeHtml(rx || "").replace(/\bya\b/gi, '<span class="or">ya</span>');
  }

  function legSwingSvg() {
    return `<figure class="demo demo-svg" aria-label="Animated demo of forward and back leg swings">
      <svg class="leg-swing" viewBox="0 0 240 280" role="img" aria-labelledby="legSwingTitle">
        <title id="legSwingTitle">Leg swings demo</title>
        <rect width="240" height="280" fill="#0f2f2c" rx="12"/>
        <line x1="40" y1="230" x2="200" y2="230" stroke="#3d6b64" stroke-width="4"/>
        <g transform="translate(110,70)">
          <circle cx="0" cy="0" r="14" fill="#f3e6d0"/>
          <rect x="-10" y="12" width="20" height="48" rx="8" fill="#7ec8b8"/>
          <rect x="-8" y="58" width="12" height="70" rx="6" fill="#f3e6d0"/>
          <rect x="-18" y="122" width="28" height="10" rx="4" fill="#e8a838"/>
          <g class="swing-leg">
            <rect x="2" y="58" width="12" height="72" rx="6" fill="#f3e6d0"/>
            <rect x="-2" y="124" width="28" height="10" rx="4" fill="#e8a838"/>
          </g>
          <rect x="-28" y="28" width="18" height="10" rx="4" fill="#f3e6d0" transform="rotate(-25 -19 33)"/>
          <rect x="10" y="28" width="18" height="10" rx="4" fill="#f3e6d0" transform="rotate(25 19 33)"/>
        </g>
      </svg>
    </figure>`;
  }

  function moveDemoHtml(move) {
    if (move.demo === "svg-leg-swing" && !move.gif) return legSwingSvg();
    const src = move.gif || "media/bodyweight-squats.gif";
    const alt = `Demo: ${move.name}`;
    return `<figure class="demo"><img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" width="360" height="360" loading="lazy" /></figure>`;
  }

  function escapeAttr(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }


  function htmlToPlainText(html) {
    if (!html) return "";
    const tmp = document.createElement("div");
    // normalize br/p to newlines before textContent
    const normalized = String(html)
      .replace(/<\s*br\s*\/?\s*>/gi, "\n")
      .replace(/<\s*\/\s*p\s*>/gi, "\n")
      .replace(/<\s*p[^>]*>/gi, "");
    tmp.innerHTML = normalized;
    return (tmp.textContent || "").replace(/\u00a0/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  }

  function plainTextToRestHtml(text) {
    const plain = String(text || "").replace(/\r\n/g, "\n").trim();
    if (!plain) return DEFAULT_PLAN.restNote.bodyHtml;
    return escapeHtml(plain).replace(/\n/g, "<br>");
  }

  function applyOrderNumber(fromIndex, requestedOrder) {
    syncDraftFromDom();
    const n = draftMoves.length;
    if (!n) return;
    let target = Number(requestedOrder);
    if (!Number.isFinite(target)) target = fromIndex + 1;
    target = Math.max(1, Math.min(n, Math.round(target)));
    const item = draftMoves[fromIndex];
    if (!item) return;
    const without = draftMoves.filter((_, i) => i !== fromIndex);
    without.splice(target - 1, 0, item);
    draftMoves = without;
    renderAdminMoves();
  }


  function renderPlan(plan) {
    currentPlan = plan;
    $("hero-headline").textContent = plan.headline || DEFAULT_PLAN.headline;
    $("hero-support").textContent = plan.support || DEFAULT_PLAN.support;
    $("rest-title").textContent = plan.restNote?.title || DEFAULT_PLAN.restNote.title;
    const restPlain = plan.restNote?.body;
    $("rest-body").innerHTML = restPlain
      ? plainTextToRestHtml(restPlain)
      : (plan.restNote?.bodyHtml || DEFAULT_PLAN.restNote.bodyHtml);

    const root = $("sections");
    root.innerHTML = (plan.sections || [])
      .map((section) => {
        const moves = (section.moves || [])
          .map(
            (move) => `<li class="move">
            <div class="move-copy">
              <h3>${escapeHtml(move.name)}</h3>
              <p class="rx">${formatRx(move.rx)}</p>
            </div>
            ${moveDemoHtml(move)}
          </li>`
          )
          .join("");
        return `<section class="block" id="${escapeAttr(section.id)}">
          <header class="block-head">
            <p class="eyebrow">${escapeHtml(section.eyebrow || "")}</p>
            <h2>${escapeHtml(section.title || "")}</h2>
            <p class="block-sub">${escapeHtml(section.subtitle || "")}</p>
          </header>
          <ul class="moves">${moves}</ul>
        </section>`;
      })
      .join("");

    observeMoves();
  }

  function observeMoves() {
    const moves = document.querySelectorAll(".move");
    moves.forEach((el) => el.classList.remove("is-visible"));
    if (!("IntersectionObserver" in window)) {
      moves.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );
    moves.forEach((el) => observer.observe(el));
  }

  async function loadPublishedPlan() {
    try {
      const res = await fetch(`${PLAN_PATH}?t=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const plan = await res.json();
      if (!plan?.sections?.length) throw new Error("empty plan");
      return plan;
    } catch {
      return clone(DEFAULT_PLAN);
    }
  }

  function flattenMoves(plan) {
    const out = [];
    for (const section of plan.sections || []) {
      for (const move of section.moves || []) {
        out.push({
          id: move.id || uid("move"),
          name: move.name || "",
          rx: move.rx || "",
          gif: move.gif || "",
          demo: move.demo || "img",
          kind: section.kind === "stretch" ? "stretch" : "main",
          pendingFile: null,
        });
      }
    }
    return out;
  }

  function buildPlanFromDraft() {
    const stretchMoves = draftMoves
      .filter((m) => m.kind === "stretch")
      .map(({ id, name, rx, gif, demo }) => ({
        id,
        name,
        rx,
        gif: demo === "svg-leg-swing" && !gif ? "" : gif,
        demo: gif ? "img" : demo || "img",
      }));
    const mainMoves = draftMoves
      .filter((m) => m.kind !== "stretch")
      .map(({ id, name, rx, gif, demo }) => ({
        id,
        name,
        rx,
        gif: demo === "svg-leg-swing" && !gif ? "" : gif,
        demo: gif ? "img" : demo || "img",
      }));

    return {
      updatedAt: new Date().toISOString(),
      headline: $("edit-headline").value.trim() || DEFAULT_PLAN.headline,
      support: $("edit-support").value.trim() || DEFAULT_PLAN.support,
      restNote: (() => {
        const title = $("edit-rest-title").value.trim() || DEFAULT_PLAN.restNote.title;
        const body = $("edit-rest-body").value.trim() || DEFAULT_PLAN.restNote.body || htmlToPlainText(DEFAULT_PLAN.restNote.bodyHtml);
        return { title, body, bodyHtml: plainTextToRestHtml(body) };
      })(),
      sections: [
        {
          id: "stretching",
          eyebrow: "Warm-up",
          title: "Stretching",
          subtitle: stretchMoves.length ? "Easy and controlled" : "No stretches today",
          kind: "stretch",
          moves: stretchMoves,
        },
        {
          id: "exercise",
          eyebrow: "Main session",
          title: "Exercise",
          subtitle: mainMoves.length ? "Follow the prescriptions" : "No main moves today",
          kind: "main",
          moves: mainMoves,
        },
      ].filter((s) => s.moves.length > 0),
    };
  }

  function fillEditorFromPlan(plan) {
    $("edit-headline").value = plan.headline || "";
    $("edit-support").value = plan.support || "";
    $("edit-rest-title").value = plan.restNote?.title || "";
    $("edit-rest-body").value =
      plan.restNote?.body ||
      htmlToPlainText(plan.restNote?.bodyHtml || DEFAULT_PLAN.restNote.bodyHtml) ||
      DEFAULT_PLAN.restNote.body ||
      "";
    draftMoves = flattenMoves(plan);
    renderAdminMoves();
  }

  function setStatus(el, message, kind = "info") {
    if (!el) return;
    if (!message) {
      el.hidden = true;
      el.textContent = "";
      el.className = "admin-status";
      return;
    }
    el.hidden = false;
    el.textContent = message;
    el.className = `admin-status is-${kind}`;
  }

  function previewSrcForMove(move) {
    if (move.pendingFile) {
      if (!move._objectUrl) move._objectUrl = URL.createObjectURL(move.pendingFile);
      return move._objectUrl;
    }
    if (move.gif) return move.gif;
    if (move.demo === "svg-leg-swing") return "";
    return "";
  }

  async function loadGifLibrary() {
    try {
      const res = await fetch(`${LIBRARY_PATH}?t=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      if (data?.gifs?.length) {
        gifLibrary = {
          groups: data.groups || gifLibrary.groups,
          bodyParts: data.bodyParts || gifLibrary.bodyParts,
          gifs: data.gifs,
        };
      }
    } catch (err) {
      console.warn("GIF library load failed, using fallback", err);
    }
  }

  function normalizeQuery(q) {
    return String(q || "")
      .toLowerCase()
      .replace(/[-_]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function gifMatchesQuery(g, q) {
    if (!q) return true;
    const hay = normalizeQuery(
      [g.name, g.id, g.muscle, g.equipment, g.bodyPart, g.group, ...(g.aliases || [])].join(" ")
    );
    const compact = hay.replace(/\s+/g, "");
    const qCompact = q.replace(/\s+/g, "");
    if (hay.includes(q) || compact.includes(qCompact)) return true;
    // all tokens must appear
    return q.split(" ").filter(Boolean).every((tok) => hay.includes(tok) || compact.includes(tok));
  }

  function isDumbbellGif(g) {
    if (g?.isDumbbell) return true;
    const eq = String(g?.equipment || "").toLowerCase();
    if (eq === "dumbbell") return true;
    const hay = normalizeQuery([g?.name, g?.id, ...(g?.aliases || [])].join(" "));
    return hay.includes("dumbbell") || /(^|\s)db(\s|$)/.test(hay);
  }

  function filterLibrary({ group, bodyPart, query } = {}) {
    const q = normalizeQuery(query);
    let list = gifLibrary.gifs || [];
    if (group) list = list.filter((g) => g.group === group || (!g.group && group === "exercises"));
    if (bodyPart === "dumbbell") {
      list = list.filter((g) => isDumbbellGif(g));
    } else if (bodyPart) {
      list = list.filter((g) => (g.bodyPart || "full-body") === bodyPart);
    }
    if (q) list = list.filter((g) => gifMatchesQuery(g, q));
    return list;
  }

  function openOverlayEl(el) {
    if (!el) return;
    el.hidden = false;
    el.removeAttribute("hidden");
    el.classList.add("is-open");
    el.style.cssText =
      "display:flex !important; position:fixed !important; inset:0 !important; z-index:100000 !important; opacity:1 !important; visibility:visible !important; pointer-events:auto !important; background:rgba(4,14,12,0.82);";
    document.body.classList.add("admin-open");
  }

  function closeOverlayEl(el) {
    if (!el) return;
    el.hidden = true;
    el.setAttribute("hidden", "");
    el.classList.remove("is-open");
    el.style.cssText = "";
  }

  function openGifBrowser(moveIndex, opts = {}) {
    const mode = opts.mode || "edit";
    const group = opts.group || "";
    const level = opts.level || (group ? "body" : "root");
    gifBrowser = { moveIndex, level, group, bodyPart: "", query: "", mode };
    openOverlayEl($("gif-browser"));
    renderGifBrowser();
  }

  function closeGifBrowser() {
    closeOverlayEl($("gif-browser"));
    gifBrowser.moveIndex = -1;
    gifBrowser.mode = "edit";
  }

  function gifBrowserBack() {
    if (gifBrowser.level === "gifs") {
      gifBrowser.level = "body";
      gifBrowser.bodyPart = "";
      gifBrowser.query = "";
    } else if (gifBrowser.level === "body") {
      if (gifBrowser.mode === "wizard") {
        // Return to type step of add wizard
        closeGifBrowser();
        addWizard.step = "type";
        openAddWizard();
        return;
      }
      gifBrowser.level = "root";
      gifBrowser.group = "";
    } else {
      closeGifBrowser();
      return;
    }
    renderGifBrowser();
  }

  function renderGifBrowser() {
    const title = $("gif-browser-title");
    const back = $("gif-browser-back");
    const body = $("gif-browser-body");
    if (!body) return;
    const move = draftMoves[gifBrowser.moveIndex];
    const selected = move?.gif || "";

    if (gifBrowser.level === "root") {
      title.textContent = gifBrowser.mode === "wizard" ? "Pick a move" : "Choose GIF";
      back.hidden = gifBrowser.mode === "wizard";
      const groups = gifLibrary.groups || [];
      body.innerHTML = `<p class="admin-hint">${(gifLibrary.gifs || []).length} demos · pick a category</p>
        <div class="gif-menu-list">
          ${groups
            .map((g) => {
              const count = filterLibrary({ group: g.id }).length;
              return `<button type="button" class="gif-menu-item" data-gif-group="${escapeAttr(g.id)}">
                <strong>${escapeHtml(g.label)}</strong>
                <span>${count} GIFs</span>
              </button>`;
            })
            .join("")}
        </div>`;
      return;
    }

    if (gifBrowser.level === "body") {
      const groupLabel = (gifLibrary.groups || []).find((g) => g.id === gifBrowser.group)?.label || gifBrowser.group;
      title.textContent = groupLabel;
      back.hidden = false;
      const parts = gifLibrary.bodyParts || [];
      // Only show body parts that have items in this group
      const available = parts.filter((p) => filterLibrary({ group: gifBrowser.group, bodyPart: p.id }).length);
      body.innerHTML = `<p class="admin-hint">Pick Dumbbell (all DB moves) or a body part</p>
        <div class="gif-menu-list">
          ${available
            .map((p) => {
              const count = filterLibrary({ group: gifBrowser.group, bodyPart: p.id }).length;
              const equip = p.kind === "equipment" || p.id === "dumbbell";
              return `<button type="button" class="gif-menu-item ${equip ? "is-equipment" : ""}" data-gif-body="${escapeAttr(p.id)}">
                <strong>${escapeHtml(p.label)}</strong>
                <span>${count}${equip ? " · all dumbbell" : ""}</span>
              </button>`;
            })
            .join("")}
        </div>`;
      return;
    }

    // gifs level
    const groupLabel = (gifLibrary.groups || []).find((g) => g.id === gifBrowser.group)?.label || "";
    const partLabel = (gifLibrary.bodyParts || []).find((p) => p.id === gifBrowser.bodyPart)?.label || "";
    title.textContent = `${groupLabel} · ${partLabel}`;
    back.hidden = false;
    const filtered = filterLibrary({
      group: gifBrowser.group,
      bodyPart: gifBrowser.bodyPart,
      query: gifBrowser.query,
    });
    const MAX = gifBrowser.bodyPart === "dumbbell" ? 120 : 60;
    const shown = filtered.slice(0, MAX);
    const grid = shown
      .map((g) => {
        const sel = selected === g.path ? "is-selected" : "";
        return `<button type="button" class="gif-pick ${sel}" data-pick-gif="${escapeAttr(g.path)}" title="${escapeAttr(g.name)}">
          <img src="${escapeAttr(g.path)}" alt="" loading="lazy" decoding="async" />
          <span>${escapeHtml(g.name)}</span>
        </button>`;
      })
      .join("");
    const searchPh = gifBrowser.bodyPart === "dumbbell" ? "Search dumbbell moves (try “db press”)…" : "Search (try “lat pull down”)…";
    body.innerHTML = `
      <input type="search" class="gif-search" id="gif-browser-search" placeholder="${escapeAttr(searchPh)}" value="${escapeAttr(gifBrowser.query)}" enterkeyhint="search" />
      <p class="gif-picker-more">${filtered.length} result${filtered.length === 1 ? "" : "s"}${filtered.length > MAX ? ` · showing ${MAX}` : ""}</p>
      <div class="gif-picker">${grid || `<p class="admin-hint">No matches — try another search</p>`}</div>`;
    const search = $("gif-browser-search");
    if (search && !search.__bound) {
      search.__bound = true;
      search.addEventListener("input", () => {
        gifBrowser.query = search.value;
        const filtered = filterLibrary({
          group: gifBrowser.group,
          bodyPart: gifBrowser.bodyPart,
          query: gifBrowser.query,
        });
        const move = draftMoves[gifBrowser.moveIndex];
        const selected = move?.gif || "";
        const MAX = gifBrowser.bodyPart === "dumbbell" ? 120 : 60;
        const shown = filtered.slice(0, MAX);
        const gridHtml = shown
          .map((g) => {
            const sel = selected === g.path ? "is-selected" : "";
            return `<button type="button" class="gif-pick ${sel}" data-pick-gif="${escapeAttr(g.path)}" title="${escapeAttr(g.name)}">
              <img src="${escapeAttr(g.path)}" alt="" loading="lazy" decoding="async" />
              <span>${escapeHtml(g.name)}</span>
            </button>`;
          })
          .join("");
        const more = body.querySelector(".gif-picker-more");
        const grid = body.querySelector(".gif-picker");
        if (more) more.textContent = `${filtered.length} result${filtered.length === 1 ? "" : "s"}${filtered.length > MAX ? ` · showing ${MAX}` : ""}`;
        if (grid) grid.innerHTML = gridHtml || `<p class="admin-hint">No matches — try another search</p>`;
      });
    }
  }

  function libraryEntryByPath(path) {
    return (gifLibrary.gifs || []).find((g) => g.path === path) || null;
  }

  function selectGifForMove(path) {
    if (gifBrowser.mode === "wizard") {
      const entry = libraryEntryByPath(path);
      addWizard.gif = path;
      addWizard.name = entry?.name || "New move";
      closeGifBrowser();
      addWizard.step = "rx";
      openAddWizard();
      return;
    }
    const idx = gifBrowser.moveIndex;
    if (idx < 0 || !draftMoves[idx]) return;
    const move = draftMoves[idx];
    if (move._objectUrl) {
      URL.revokeObjectURL(move._objectUrl);
      move._objectUrl = null;
    }
    move.pendingFile = null;
    move.gif = path;
    move.demo = "img";
    const entry = libraryEntryByPath(path);
    if (entry?.name && (!move.name || move.name === "New move")) move.name = entry.name;
    closeGifBrowser();
    renderAdminMoves();
  }

  function openAddWizard() {
    openOverlayEl($("add-wizard"));
    renderAddWizard();
  }

  function closeAddWizard() {
    closeOverlayEl($("add-wizard"));
    addWizard = { step: "type", kind: "main", group: "exercises", name: "", gif: "", rx: "" };
  }

  function renderAddWizard() {
    const title = $("add-wizard-title");
    const back = $("add-wizard-back");
    const body = $("add-wizard-body");
    if (!body) return;

    if (addWizard.step === "type") {
      title.textContent = "Add move";
      back.hidden = true;
      body.innerHTML = `<p class="admin-hint">Step 1 of 3 — what kind of move?</p>
        <div class="gif-menu-list">
          <button type="button" class="gif-menu-item" data-wizard-type="stretch" data-wizard-group="stretching">
            <strong>Stretching</strong>
            <span>Warm-up / mobility</span>
          </button>
          <button type="button" class="gif-menu-item" data-wizard-type="main" data-wizard-group="exercises">
            <strong>Exercise</strong>
            <span>Strength / cardio</span>
          </button>
        </div>`;
      return;
    }

    if (addWizard.step === "rx") {
      title.textContent = "Prescription";
      back.hidden = false;
      const preview = addWizard.gif
        ? `<div class="admin-preview" style="pointer-events:none"><img src="${escapeAttr(addWizard.gif)}" alt="" /></div>`
        : "";
      body.innerHTML = `${preview}
        <p class="admin-hint">Step 3 of 3 — sets / reps / weight for <strong>${escapeHtml(addWizard.name)}</strong></p>
        <label class="field">
          <span>Shown on the plan as written</span>
          <input type="text" id="wizard-rx" value="${escapeAttr(addWizard.rx || (addWizard.kind === "stretch" ? "10 reps" : "2 sets × 12"))}" placeholder="e.g. 5 kg · 2 sets × 12" />
        </label>
        <div class="admin-actions">
          <button type="button" class="btn-primary" id="wizard-confirm">Add to plan</button>
        </div>`;
      $("wizard-rx")?.focus();
      return;
    }
  }

  function startAddWizardPick(kind, group) {
    addWizard.kind = kind;
    addWizard.group = group;
    addWizard.step = "pick";
    closeOverlayEl($("add-wizard"));
    // Hierarchical picker locked to chosen group
    openGifBrowser(-1, { mode: "wizard", group, level: "body" });
  }

  function confirmAddWizard() {
    const rxInput = $("wizard-rx");
    const rx = (rxInput?.value || addWizard.rx || "").trim() || (addWizard.kind === "stretch" ? "10 reps" : "2 sets × 12");
    if (!addWizard.gif) {
      addWizard.step = "type";
      renderAddWizard();
      return;
    }
    syncDraftFromDom();
    draftMoves.push({
      id: uid(slugify(addWizard.name || "move")),
      name: addWizard.name || "New move",
      rx,
      gif: addWizard.gif,
      demo: "img",
      kind: addWizard.kind === "stretch" ? "stretch" : "main",
      pendingFile: null,
    });
    closeAddWizard();
    renderAdminMoves();
  }


  function renderAdminMoves() {
    const root = $("admin-moves");
    if (!draftMoves.length) {
      root.innerHTML = `<p class="admin-hint">No moves yet — click “+ Add move”.</p>`;
      return;
    }
    root.innerHTML = draftMoves
      .map((move, index) => {
        const pending = move.pendingFile ? ` · pending upload: ${escapeHtml(move.pendingFile.name)}` : "";
        const preview = previewSrcForMove(move);
        const useSvg = move.demo === "svg-leg-swing" && !move.gif && !move.pendingFile;
        const previewInner = useSvg
          ? legSwingSvg()
          : preview
            ? `<img src="${escapeAttr(preview)}" alt="Preview: ${escapeAttr(move.name)}" />`
            : `<span>No GIF selected — tap to choose</span>`;
        const previewBlock = `<button type="button" class="admin-preview ${useSvg ? "admin-preview-svg" : preview ? "" : "admin-preview-empty"}" data-preview data-open-gif title="Choose GIF">${previewInner}</button>`;
        return `<article class="admin-move" data-index="${index}">
          <div class="admin-move-top">
            <label class="order-field">
              <span>Order</span>
              <input type="number" inputmode="numeric" min="1" max="${draftMoves.length}" step="1" data-field="order" value="${index + 1}" aria-label="Order number" />
            </label>
            <div class="admin-move-tools">
              <button type="button" class="btn-icon danger" data-act="remove" title="Remove">✕</button>
            </div>
          </div>
          ${previewBlock}
          <div class="admin-actions" style="margin-bottom:0.75rem">
            <button type="button" class="btn-ghost" data-open-gif>Choose GIF</button>
          </div>
          <label class="field">
            <span>Name</span>
            <input type="text" data-field="name" value="${escapeAttr(move.name)}" />
          </label>
          <label class="field">
            <span>Type</span>
            <select data-field="kind">
              <option value="stretch" ${move.kind === "stretch" ? "selected" : ""}>Stretch</option>
              <option value="main" ${move.kind !== "stretch" ? "selected" : ""}>Main</option>
            </select>
          </label>
          <label class="field">
            <span>Sets / reps / weight (shown as written)</span>
            <input type="text" data-field="rx" value="${escapeAttr(move.rx)}" placeholder="e.g. 5 kg · 2 sets × 12" />
          </label>
          <label class="field">
            <span>GIF path (set via Choose GIF, or paste URL)</span>
            <input type="text" data-field="gif" value="${escapeAttr(move.gif)}" placeholder="media/… or https://…" />
          </label>
          <label class="field">
            <span>Upload GIF (optional)${pending}</span>
            <input type="file" data-field="file" accept="image/gif,image/*,.gif" />
          </label>
          <label class="field check">
            <input type="checkbox" data-field="svg" ${useSvg ? "checked" : ""} />
            <span>Use built-in leg-swing SVG (only if no GIF)</span>
          </label>
        </article>`;
      })
      .join("");
  }

  function updateCardPreview(card, move) {
    const box = card.querySelector("[data-preview]");
    if (!box) return;
    const useSvg = move.demo === "svg-leg-swing" && !move.gif && !move.pendingFile;
    const preview = previewSrcForMove(move);
    const base = "admin-preview";
    if (useSvg) {
      box.className = `${base} admin-preview-svg`;
      box.innerHTML = legSwingSvg();
      return;
    }
    if (preview) {
      box.className = base;
      box.innerHTML = `<img src="${escapeAttr(preview)}" alt="Preview: ${escapeAttr(move.name || "move")}" />`;
      return;
    }
    box.className = `${base} admin-preview-empty`;
    box.innerHTML = `<span>No GIF selected — tap to choose</span>`;
  }

  function syncDraftFromDom() {
    const cards = $("admin-moves").querySelectorAll(".admin-move");
    cards.forEach((card) => {
      const i = Number(card.dataset.index);
      const move = draftMoves[i];
      if (!move) return;
      move.name = card.querySelector('[data-field="name"]').value.trim();
      move.kind = card.querySelector('[data-field="kind"]').value;
      move.rx = card.querySelector('[data-field="rx"]').value.trim();
      move.gif = card.querySelector('[data-field="gif"]').value.trim();
      const fileInput = card.querySelector('[data-field="file"]');
      if (fileInput?.files?.[0]) {
        if (move._objectUrl) URL.revokeObjectURL(move._objectUrl);
        move.pendingFile = fileInput.files[0];
        move._objectUrl = URL.createObjectURL(move.pendingFile);
      }
      const useSvg = card.querySelector('[data-field="svg"]').checked;
      move.demo = useSvg && !move.gif && !move.pendingFile ? "svg-leg-swing" : "img";
      if (!move.id) move.id = uid(slugify(move.name));
    });
  }

  function getToken() {
    return localStorage.getItem(LS_TOKEN) || "";
  }

  function b64EncodeUnicode(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }

  function arrayBufferToBase64(buffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  async function githubGetSha(path, token) {
    const url = `https://api.github.com/repos/${REPO.owner}/${REPO.name}/contents/${path}?ref=${REPO.branch}`;
    const res = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Could not read ${path}: ${res.status} ${text}`);
    }
    const data = await res.json();
    return data.sha;
  }

  async function githubPutFile(path, contentBase64, message, token) {
    const sha = await githubGetSha(path, token);
    const body = {
      message,
      content: contentBase64,
      branch: REPO.branch,
    };
    if (sha) body.sha = sha;
    const res = await fetch(
      `https://api.github.com/repos/${REPO.owner}/${REPO.name}/contents/${path}`,
      {
        method: "PUT",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Publish failed for ${path}: ${res.status} ${text}`);
    }
    return res.json();
  }

  async function uploadPendingFiles(token) {
    for (const move of draftMoves) {
      if (!move.pendingFile) continue;
      const ext = (move.pendingFile.name.split(".").pop() || "gif").toLowerCase().replace(/[^a-z0-9]/g, "") || "gif";
      const path = `media/${slugify(move.name || move.id)}-${Date.now().toString(36)}.${ext}`;
      const buf = await move.pendingFile.arrayBuffer();
      await githubPutFile(
        path,
        arrayBufferToBase64(buf),
        `Upload GIF for ${move.name || move.id}`,
        token
      );
      move.gif = path;
      move.demo = "img";
      move.pendingFile = null;
    }
  }

  async function publishPlan() {
    const token = getToken() || $("admin-token").value.trim();
    if (!token) {
      setStatus($("publish-status"), "Save a GitHub token first (repo scope).", "error");
      return;
    }
    syncDraftFromDom();
    if (!draftMoves.length) {
      setStatus($("publish-status"), "Add at least one exercise before publishing.", "error");
      return;
    }
    setStatus($("publish-status"), "Publishing… uploading media if needed…", "info");
    $("publish-plan").disabled = true;
    try {
      await uploadPendingFiles(token);
      const plan = buildPlanFromDraft();
      await githubPutFile(
        PLAN_PATH,
        b64EncodeUnicode(JSON.stringify(plan, null, 2) + "\n"),
        `Update today's Sapna workout (${new Date().toISOString().slice(0, 10)})`,
        token
      );
      renderPlan(plan);
      renderAdminMoves();
      setStatus(
        $("publish-status"),
        "Posted. GitHub Pages usually updates in ~30–60 seconds — Sapna can refresh on any device.",
        "ok"
      );
    } catch (err) {
      setStatus($("publish-status"), err.message || String(err), "error");
    } finally {
      $("publish-plan").disabled = false;
    }
  }

  function openOverlay(el) {
    if (!el) return;
    el.hidden = false;
    el.removeAttribute("hidden");
    el.classList.add("is-open");
    el.style.cssText = "display:flex !important; position:fixed !important; inset:0 !important; z-index:99999 !important; opacity:1 !important; visibility:visible !important; pointer-events:auto !important; background:rgba(4,14,12,0.82);";
    document.body.classList.add("admin-open");
  }

  function closeOverlay(el) {
    if (!el) return;
    el.hidden = true;
    el.setAttribute("hidden", "");
    el.classList.remove("is-open");
    el.style.cssText = "";
    const gate = $("admin-gate");
    const editor = $("admin-editor");
    const browser = $("gif-browser");
    const wizard = $("add-wizard");
    const gateOpen = gate && !gate.hidden;
    const editorOpen = editor && !editor.hidden;
    const browserOpen = browser && !browser.hidden;
    const wizardOpen = wizard && !wizard.hidden;
    if (!gateOpen && !editorOpen && !browserOpen && !wizardOpen) document.body.classList.remove("admin-open");
  }

  function openGate() {
    if (typeof window.sapnaAdminOpen === "function") {
      window.sapnaAdminOpen();
      return;
    }
    setStatus($("gate-status"), "");
    if ($("gate-password")) $("gate-password").value = "";
    const lock = window.__sapnaAdminAuth?.getLockStatus?.();
    if (lock?.locked) {
      setStatus($("gate-status"), `Too many attempts. Try again in ${lock.secs}s.`, "error");
    }
    closeOverlay($("admin-editor"));
    openOverlay($("admin-gate"));
    setTimeout(() => $("gate-password") && $("gate-password").focus(), 50);
  }

  function openEditor() {
    if ($("admin-token")) $("admin-token").value = getToken() ? "••••••••••••" : "";
    fillEditorFromPlan(currentPlan);
    setStatus($("publish-status"), "");
    setStatus(
      $("token-status"),
      getToken()
        ? "Token saved in this browser."
        : "Token optional — only needed to Post / Publish online.",
      getToken() ? "ok" : "info"
    );
    closeOverlay($("admin-gate"));
    openOverlay($("admin-editor"));
    const sheet = $("admin-editor") && $("admin-editor").querySelector(".admin-sheet");
    if (sheet) sheet.scrollTop = 0;
  }

  function requestAdmin(e) {
    // onclick= already handles open; keep as backup only (do not stopPropagation)
    if (typeof window.sapnaAdminOpen === "function") {
      window.sapnaAdminOpen(e);
      return;
    }
    try {
      if (sessionStorage.getItem(SS_UNLOCKED) === "1") openEditor();
      else openGate();
    } catch (err) {
      console.error(err);
    }
  }

  // Used by head unlock helper after password success
  window.__sapnaOpenEditor = openEditor;

  function on(el, evt, fn) {
    if (!el) return;
    el.addEventListener(evt, fn);
  }

  function wireAdmin() {
    // Bootstrap already opens the gate; still bind as backup on all Admin controls
    document.querySelectorAll("[data-admin-open]").forEach((btn) => {
      on(btn, "click", requestAdmin);
    });

    on($("gate-cancel"), "click", () => closeOverlay($("admin-gate")));
    on($("admin-close"), "click", () => closeOverlay($("admin-editor")));

    // Tap backdrop to close
    ["admin-gate", "admin-editor"].forEach((id) => {
      on($(id), "click", (e) => {
        if (e.target === $(id)) closeOverlay($(id));
      });
    });


    on($("save-token"), "click", () => {
      const raw = $("admin-token").value.trim();
      if (!raw || raw.startsWith("••")) {
        setStatus($("token-status"), "Paste a new token to save.", "error");
        return;
      }
      localStorage.setItem(LS_TOKEN, raw);
      $("admin-token").value = "••••••••••••";
      setStatus($("token-status"), "Token saved in this browser only.", "ok");
    });

    on($("clear-token"), "click", () => {
      localStorage.removeItem(LS_TOKEN);
      $("admin-token").value = "";
      setStatus($("token-status"), "Token cleared.", "info");
    });

    on($("add-move"), "click", () => {
      syncDraftFromDom();
      addWizard = { step: "type", kind: "main", group: "exercises", name: "", gif: "", rx: "" };
      openAddWizard();
    });

    on($("admin-moves"), "click", (e) => {
      const openGif = e.target.closest("[data-open-gif]");
      if (openGif) {
        const card = openGif.closest(".admin-move");
        const index = Number(card?.dataset.index);
        if (Number.isNaN(index)) return;
        syncDraftFromDom();
        openGifBrowser(index);
        return;
      }

      const btn = e.target.closest("[data-act]");
      if (!btn) return;
      const card = btn.closest(".admin-move");
      const index = Number(card?.dataset.index);
      if (Number.isNaN(index)) return;
      syncDraftFromDom();
      const act = btn.dataset.act;
      if (act === "remove") {
        draftMoves.splice(index, 1);
        renderAdminMoves();
      }
    });

    on($("admin-moves"), "input", (e) => {
      const field = e.target.getAttribute("data-field");
      if (!field) return;
      const card = e.target.closest(".admin-move");
      const index = Number(card?.dataset.index);
      if (Number.isNaN(index) || !draftMoves[index]) return;
      if (field === "gif") {
        draftMoves[index].gif = e.target.value.trim();
        draftMoves[index].demo = draftMoves[index].gif ? "img" : draftMoves[index].demo;
        card.querySelectorAll(".gif-pick").forEach((el) => {
          el.classList.toggle("is-selected", el.getAttribute("data-pick-gif") === draftMoves[index].gif);
        });
        updateCardPreview(card, draftMoves[index]);
      }
      if (field === "name") {
        draftMoves[index].name = e.target.value;
      }
    });

    on($("admin-moves"), "change", (e) => {
      const field = e.target.getAttribute("data-field");
      if (!field) return;
      const card = e.target.closest(".admin-move");
      const index = Number(card?.dataset.index);
      if (Number.isNaN(index) || !draftMoves[index]) return;
      if (field === "order") {
        applyOrderNumber(index, e.target.value);
        return;
      }
      syncDraftFromDom();
      if (field === "file" || field === "svg" || field === "gif") {
        updateCardPreview(card, draftMoves[index]);
      }
    });

    on($("admin-moves"), "keydown", (e) => {
      if (e.key !== "Enter") return;
      const field = e.target.getAttribute("data-field");
      if (field !== "order") return;
      e.preventDefault();
      e.target.blur();
    });

    on($("preview-plan"), "click", () => {
      syncDraftFromDom();
      const plan = buildPlanFromDraft();
      renderPlan(plan);
      setStatus($("publish-status"), "Preview applied on this page only (not posted yet).", "info");
      closeOverlay($("admin-editor"));
      window.__sapnaAllowScroll = true;
      document.getElementById("workout")?.scrollIntoView({ behavior: "smooth" });
    });

    on($("publish-plan"), "click", () => publishPlan());

    on($("gif-browser-close"), "click", () => closeGifBrowser());
    on($("gif-browser-back"), "click", () => gifBrowserBack());
    on($("gif-browser"), "click", (e) => {
      if (e.target === $("gif-browser")) closeGifBrowser();
      const group = e.target.closest("[data-gif-group]");
      if (group) {
        gifBrowser.group = group.getAttribute("data-gif-group") || "";
        gifBrowser.level = "body";
        gifBrowser.bodyPart = "";
        gifBrowser.query = "";
        renderGifBrowser();
        return;
      }
      const bodyPart = e.target.closest("[data-gif-body]");
      if (bodyPart) {
        gifBrowser.bodyPart = bodyPart.getAttribute("data-gif-body") || "";
        gifBrowser.level = "gifs";
        gifBrowser.query = "";
        renderGifBrowser();
        return;
      }
      const pick = e.target.closest("[data-pick-gif]");
      if (pick) {
        selectGifForMove(pick.getAttribute("data-pick-gif") || "");
      }
    });


    on($("add-wizard-close"), "click", () => closeAddWizard());
    on($("add-wizard-back"), "click", () => {
      if (addWizard.step === "rx") {
        // Back to picker for same group
        closeOverlayEl($("add-wizard"));
        openGifBrowser(-1, { mode: "wizard", group: addWizard.group, level: "body" });
        return;
      }
      addWizard.step = "type";
      renderAddWizard();
    });
    on($("add-wizard"), "click", (e) => {
      if (e.target === $("add-wizard")) closeAddWizard();
      const typeBtn = e.target.closest("[data-wizard-type]");
      if (typeBtn) {
        startAddWizardPick(
          typeBtn.getAttribute("data-wizard-type") || "main",
          typeBtn.getAttribute("data-wizard-group") || "exercises"
        );
        return;
      }
      if (e.target.id === "wizard-confirm" || e.target.closest("#wizard-confirm")) {
        confirmAddWizard();
      }
    });

    window.__sapnaAdminReady = true;
  }

  function pinInitialLanding() {
    try {
      if (location.hash && location.hash !== "#top") {
        history.replaceState(null, "", location.pathname + location.search);
      }
    } catch (_) {}
    window.scrollTo(0, 0);
  }

  function wireLandingCta() {
    const cta = document.querySelector('a.cta[href="#workout"]');
    if (!cta || cta.dataset.wired === "1") return;
    cta.dataset.wired = "1";
    cta.addEventListener("click", (e) => {
      const target = document.getElementById("workout");
      if (!target) return;
      e.preventDefault();
      window.__sapnaAllowScroll = true;
      history.replaceState(null, "", "#workout");
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  async function init() {
    pinInitialLanding();
    wireLandingCta();
    try {
      wireAdmin();
    } catch (err) {
      console.error("Admin wiring failed", err);
    }
    try {
      await loadGifLibrary();
    } catch (err) {
      console.warn(err);
    }
    try {
      const plan = await loadPublishedPlan();
      renderPlan(plan);
    } catch (err) {
      console.error("Plan render failed", err);
      renderPlan(clone(DEFAULT_PLAN));
    }
    /* Layout can shift after plan/GIF load — keep first paint at hero top */
    pinInitialLanding();
    requestAnimationFrame(pinInitialLanding);
    setTimeout(pinInitialLanding, 50);
    setTimeout(pinInitialLanding, 200);
  }

  init();
})();
