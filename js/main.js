(() => {
  const REPO = { owner: "drishabhh", name: "sapna-workout", branch: "main" };
  const PLAN_PATH = "data/today.json";
  const ADMIN_PASSWORD = "SapnaJim";
  const LS_TOKEN = "sapna_gh_token";
  const SS_UNLOCKED = "sapna_admin_unlocked";

  const BUILTIN_GIFS = [
    { path: "media/arm-circles.gif", label: "Arm circles" },
    { path: "media/torso-rotations.gif", label: "Torso rotations" },
    { path: "media/leg-swings.gif", label: "Leg swings" },
    { path: "media/bodyweight-squats.gif", label: "Bodyweight squats" },
    { path: "media/cycle-walk.gif", label: "Cycle / walk" },
    { path: "media/chest-press.gif", label: "Chest press" },
    { path: "media/shoulder-press.gif", label: "Shoulder press" },
    { path: "media/lat-pulldown.gif", label: "Lat pulldown" },
    { path: "media/cable-row.gif", label: "Cable row" },
    { path: "media/leg-curl.gif", label: "Leg curl" },
    { path: "media/db-squats.gif", label: "DB squats" },
  ];

  const DEFAULT_PLAN = {
    updatedAt: null,
    headline: "Aaj ka workout",
    support: "Stretch, cycle or walk, then strength — with form demos for every move.",
    restNote: {
      title: "Rest & water",
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

  function renderPlan(plan) {
    currentPlan = plan;
    $("hero-headline").textContent = plan.headline || DEFAULT_PLAN.headline;
    $("hero-support").textContent = plan.support || DEFAULT_PLAN.support;
    $("rest-title").textContent = plan.restNote?.title || DEFAULT_PLAN.restNote.title;
    $("rest-body").innerHTML = plan.restNote?.bodyHtml || DEFAULT_PLAN.restNote.bodyHtml;

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
      restNote: {
        title: $("edit-rest-title").value.trim() || DEFAULT_PLAN.restNote.title,
        bodyHtml: $("edit-rest-body").value.trim() || DEFAULT_PLAN.restNote.bodyHtml,
      },
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
    $("edit-rest-body").value = plan.restNote?.bodyHtml || "";
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

  function builtinPickerHtml(selectedGif) {
    const options = BUILTIN_GIFS.map((g) => {
      const selected = selectedGif === g.path ? "is-selected" : "";
      return `<button type="button" class="gif-pick ${selected}" data-pick-gif="${escapeAttr(g.path)}" title="${escapeAttr(g.label)}">
        <img src="${escapeAttr(g.path)}" alt="" loading="lazy" />
        <span>${escapeHtml(g.label)}</span>
      </button>`;
    }).join("");
    return `<div class="gif-picker" role="listbox" aria-label="Built-in GIFs">${options}</div>`;
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
        const previewBlock = useSvg
          ? `<div class="admin-preview admin-preview-svg" data-preview>${legSwingSvg()}</div>`
          : preview
            ? `<div class="admin-preview" data-preview><img src="${escapeAttr(preview)}" alt="Preview: ${escapeAttr(move.name)}" /></div>`
            : `<div class="admin-preview admin-preview-empty" data-preview><span>No GIF selected</span></div>`;
        return `<article class="admin-move" data-index="${index}">
          <div class="admin-move-top">
            <strong>#${index + 1}</strong>
            <div class="admin-move-tools">
              <button type="button" class="btn-icon" data-act="up" title="Move up" ${index === 0 ? "disabled" : ""}>↑</button>
              <button type="button" class="btn-icon" data-act="down" title="Move down" ${index === draftMoves.length - 1 ? "disabled" : ""}>↓</button>
              <button type="button" class="btn-icon danger" data-act="remove" title="Remove">✕</button>
            </div>
          </div>
          ${previewBlock}
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
          <div class="field">
            <span>Built-in GIF</span>
            ${builtinPickerHtml(move.gif)}
          </div>
          <label class="field">
            <span>Custom GIF URL / path (optional)</span>
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
    if (useSvg) {
      box.className = "admin-preview admin-preview-svg";
      box.innerHTML = legSwingSvg();
      return;
    }
    if (preview) {
      box.className = "admin-preview";
      box.innerHTML = `<img src="${escapeAttr(preview)}" alt="Preview: ${escapeAttr(move.name || "move")}" />`;
      return;
    }
    box.className = "admin-preview admin-preview-empty";
    box.innerHTML = `<span>No GIF selected</span>`;
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
    el.hidden = false;
    document.body.classList.add("admin-open");
  }

  function closeOverlay(el) {
    el.hidden = true;
    const gateOpen = !$("admin-gate").hidden;
    const editorOpen = !$("admin-editor").hidden;
    if (!gateOpen && !editorOpen) document.body.classList.remove("admin-open");
  }

  function openGate() {
    setStatus($("gate-status"), "");
    $("gate-password").value = "";
    closeOverlay($("admin-editor"));
    openOverlay($("admin-gate"));
    // Delay focus so mobile keyboard doesn't fight the sheet animation
    setTimeout(() => $("gate-password")?.focus(), 50);
  }

  function openEditor() {
    $("admin-token").value = getToken() ? "••••••••••••" : "";
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
    // Scroll sheet to top for mobile
    $("admin-editor").querySelector(".admin-sheet")?.scrollTo(0, 0);
  }

  function requestAdmin(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      if (sessionStorage.getItem(SS_UNLOCKED) === "1") openEditor();
      else openGate();
    } catch (err) {
      console.error(err);
      if (typeof window.__sapnaOpenGate === "function") window.__sapnaOpenGate(e);
    }
  }

  // Used by inline bootstrap after password unlock
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

    on($("gate-form"), "submit", (e) => {
      e.preventDefault();
      const typed = (($("gate-password") || {}).value || "").trim();
      if (typed === ADMIN_PASSWORD) {
        sessionStorage.setItem(SS_UNLOCKED, "1");
        closeOverlay($("admin-gate"));
        // Defer editor open — avoids mobile race after closing gate
        setTimeout(openEditor, 30);
      } else {
        setStatus($("gate-status"), "Wrong password. Try again.", "error");
        $("gate-password")?.focus();
      }
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
      draftMoves.push({
        id: uid("move"),
        name: "New move",
        rx: "2 sets × 12",
        gif: "",
        demo: "img",
        kind: "main",
        pendingFile: null,
      });
      renderAdminMoves();
    });

    on($("admin-moves"), "click", (e) => {
      const pick = e.target.closest("[data-pick-gif]");
      if (pick) {
        const card = pick.closest(".admin-move");
        const index = Number(card?.dataset.index);
        if (Number.isNaN(index) || !draftMoves[index]) return;
        syncDraftFromDom();
        const move = draftMoves[index];
        if (move._objectUrl) {
          URL.revokeObjectURL(move._objectUrl);
          move._objectUrl = null;
        }
        move.pendingFile = null;
        move.gif = pick.getAttribute("data-pick-gif") || "";
        move.demo = "img";
        const gifInput = card.querySelector('[data-field="gif"]');
        const svgInput = card.querySelector('[data-field="svg"]');
        const fileInput = card.querySelector('[data-field="file"]');
        if (gifInput) gifInput.value = move.gif;
        if (svgInput) svgInput.checked = false;
        if (fileInput) fileInput.value = "";
        card.querySelectorAll(".gif-pick").forEach((el) => {
          el.classList.toggle("is-selected", el.getAttribute("data-pick-gif") === move.gif);
        });
        updateCardPreview(card, move);
        return;
      }

      const btn = e.target.closest("[data-act]");
      if (!btn) return;
      const card = btn.closest(".admin-move");
      const index = Number(card?.dataset.index);
      if (Number.isNaN(index)) return;
      syncDraftFromDom();
      const act = btn.dataset.act;
      if (act === "remove") draftMoves.splice(index, 1);
      if (act === "up" && index > 0) {
        const [item] = draftMoves.splice(index, 1);
        draftMoves.splice(index - 1, 0, item);
      }
      if (act === "down" && index < draftMoves.length - 1) {
        const [item] = draftMoves.splice(index, 1);
        draftMoves.splice(index + 1, 0, item);
      }
      renderAdminMoves();
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
      syncDraftFromDom();
      if (field === "file" || field === "svg" || field === "gif") {
        updateCardPreview(card, draftMoves[index]);
        card.querySelectorAll(".gif-pick").forEach((el) => {
          el.classList.toggle("is-selected", el.getAttribute("data-pick-gif") === draftMoves[index].gif);
        });
      }
    });

    on($("preview-plan"), "click", () => {
      syncDraftFromDom();
      const plan = buildPlanFromDraft();
      renderPlan(plan);
      setStatus($("publish-status"), "Preview applied on this page only (not posted yet).", "info");
      closeOverlay($("admin-editor"));
      document.getElementById("workout")?.scrollIntoView({ behavior: "smooth" });
    });

    on($("publish-plan"), "click", () => publishPlan());
    window.__sapnaAdminReady = true;
  }

  async function init() {
    try {
      wireAdmin();
    } catch (err) {
      console.error("Admin wiring failed", err);
    }
    try {
      const plan = await loadPublishedPlan();
      renderPlan(plan);
    } catch (err) {
      console.error("Plan render failed", err);
      renderPlan(clone(DEFAULT_PLAN));
    }
  }

  init();
})();
