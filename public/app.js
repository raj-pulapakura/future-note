import { buildCreatePayload } from "./create-flow.js";
import {
  loadSentHistory,
  patchSentHistoryEntry,
  saveSentHistory,
  upsertSentHistoryEntry,
} from "./local-history.js";
import {
  escapeHtml,
  renderMetadataDisclosure,
  renderRecipientCard,
  renderSentHistoryItem,
  resolveEmotionPreset,
} from "./ui.js";

const root = document.querySelector("#app");
const ACTIVE_EMOTION_CLASSES = ["emotion-send-relief", "emotion-locked-anticipation", "emotion-reveal-release"];
const LOCKED_HEADLINE_PHRASES = [
  "Sealed words, waiting.",
  "Something is held in ink.",
  "A future truth is resting.",
  "The page is quiet for now.",
  "A reveal is approaching.",
];
const HEADLINE_SWAP_DURATION_MS = 760;
const CINEMA_EXIT_DURATION_MS = 560;
const CINEMA_PRELUDE_STEP_MS = 860;
const CINEMA_PRELUDE_FINAL_HOLD_MS = 420;
const CINEMA_RELEASE_DELAY_MS = 190;
const CINEMA_PRELUDE_LINES = ["inhale.", "hold.", "it arrives."];
let lockedHeadlineTimer = null;
let lastLockedHeadlinePhrase = "";
let interactionListenersBound = false;
let writingPulseTimer = null;
let headlineSwapTimer = null;
let cinematicRunToken = 0;

function setStatus(text, { isError = false } = {}) {
  const statusNode = document.querySelector("#status");
  if (!statusNode) {
    return;
  }

  statusNode.classList.remove("status--pulse");
  statusNode.textContent = text;
  statusNode.dataset.error = String(Boolean(isError));
  void statusNode.offsetWidth;
  statusNode.classList.add("status--pulse");
}

function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}

function syncMotionMode() {
  if (!root) {
    return "full";
  }

  const motionMode = prefersReducedMotion() ? "reduced" : "full";
  root.dataset.motion = motionMode;
  return motionMode;
}

function clearEmotions() {
  if (!root) {
    return;
  }

  root.classList.remove(...ACTIVE_EMOTION_CLASSES);
}

function cueAppLoadAnimation() {
  if (!root) {
    return;
  }

  root.classList.remove("app-awake");
  window.requestAnimationFrame(() => {
    root.classList.add("app-awake");
  });
}

function bindInteractionAnimations() {
  if (!root || interactionListenersBound) {
    return;
  }

  interactionListenersBound = true;
  root.addEventListener("pointerdown", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const interactive = target.closest("button, summary, a");
    if (!(interactive instanceof HTMLElement)) {
      return;
    }

    interactive.classList.remove("interaction-pop");
    void interactive.offsetWidth;
    interactive.classList.add("interaction-pop");
    window.setTimeout(() => {
      interactive.classList.remove("interaction-pop");
    }, 450);
  });
}

function pulseWritingSurface(messageInput) {
  if (!(messageInput instanceof HTMLTextAreaElement)) {
    return;
  }

  const compose = messageInput.closest(".compose");
  if (!(compose instanceof HTMLElement)) {
    return;
  }

  compose.classList.add("compose--active");
  if (writingPulseTimer) {
    window.clearTimeout(writingPulseTimer);
  }

  writingPulseTimer = window.setTimeout(() => {
    compose.classList.remove("compose--active");
  }, 900);
}

function getRecipientHeadlineText() {
  const headline = document.querySelector("#recipientHeadline");
  if (!(headline instanceof HTMLElement)) {
    return "";
  }

  const active =
    headline.querySelector(".headline__text--current") ??
    headline.querySelector(".headline__text");

  return active instanceof HTMLElement ? active.textContent?.trim() ?? "" : "";
}

function pickLockedHeadlinePhrase({ avoid = "" } = {}) {
  if (LOCKED_HEADLINE_PHRASES.length === 1) {
    return LOCKED_HEADLINE_PHRASES[0];
  }

  let candidate = LOCKED_HEADLINE_PHRASES[Math.floor(Math.random() * LOCKED_HEADLINE_PHRASES.length)];
  while (candidate === lastLockedHeadlinePhrase || candidate === avoid) {
    candidate = LOCKED_HEADLINE_PHRASES[Math.floor(Math.random() * LOCKED_HEADLINE_PHRASES.length)];
  }

  return candidate;
}

function stopLockedHeadlineCycle() {
  if (lockedHeadlineTimer) {
    window.clearInterval(lockedHeadlineTimer);
    lockedHeadlineTimer = null;
  }

  if (headlineSwapTimer) {
    window.clearTimeout(headlineSwapTimer);
    headlineSwapTimer = null;
  }
}

function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function resetCinematicReveal() {
  cinematicRunToken += 1;

  if (!root) {
    return;
  }

  root.classList.remove("cinema-transition", "cinema-mode", "cinema-prelude-active", "cinema-release-bloom");
  const shell = document.querySelector(".journal-shell--recipient");
  if (shell instanceof HTMLElement) {
    shell.removeAttribute("aria-hidden");
  }

  const stage = document.querySelector("#cinemaStage");
  if (stage instanceof HTMLElement) {
    stage.classList.remove("cinema-stage--live");
    stage.hidden = true;
    stage.innerHTML = "";
    stage.setAttribute("aria-hidden", "true");
  }
}

async function runCinematicPrelude(stage, runToken) {
  const prelude = stage.querySelector(".cinema-prelude");
  if (!(prelude instanceof HTMLElement)) {
    return;
  }

  if (prefersReducedMotion()) {
    prelude.textContent = "";
    stage.classList.remove("cinema-stage--prelude");
    stage.classList.add("cinema-stage--prelude-done");
    return;
  }

  stage.classList.remove("cinema-stage--prelude-done");
  stage.classList.add("cinema-stage--prelude");
  root?.classList.add("cinema-prelude-active");

  for (const line of CINEMA_PRELUDE_LINES) {
    if (runToken !== cinematicRunToken) {
      return;
    }

    prelude.classList.remove("cinema-prelude__line--live");
    prelude.textContent = line;
    void prelude.offsetWidth;
    prelude.classList.add("cinema-prelude__line--live");
    await delay(CINEMA_PRELUDE_STEP_MS);
  }

  if (runToken !== cinematicRunToken) {
    return;
  }

  await delay(CINEMA_PRELUDE_FINAL_HOLD_MS);
  if (runToken !== cinematicRunToken) {
    return;
  }

  stage.classList.remove("cinema-stage--prelude");
  stage.classList.add("cinema-stage--prelude-done");
  root?.classList.remove("cinema-prelude-active");
  await delay(CINEMA_RELEASE_DELAY_MS);
}

async function activateCinematicReveal(message, { animateExit = true, withPrelude = true } = {}) {
  if (!root) {
    return;
  }

  const content = String(message ?? "").trim();
  if (!content) {
    return;
  }

  const runToken = ++cinematicRunToken;
  const stage = document.querySelector("#cinemaStage");
  const shell = document.querySelector(".journal-shell--recipient");
  if (!(stage instanceof HTMLElement)) {
    return;
  }

  stage.hidden = false;
  stage.setAttribute("aria-hidden", "false");
  stage.classList.remove("cinema-stage--live", "cinema-stage--prelude", "cinema-stage--prelude-done");
  stage.innerHTML = `
    <p class="cinema-prelude" aria-hidden="true"></p>
    <p class="cinema-message">${escapeHtml(content)}</p>
  `;

  if (animateExit) {
    root.classList.add("cinema-transition");
    const exitDelay = prefersReducedMotion() ? 80 : CINEMA_EXIT_DURATION_MS;
    await delay(exitDelay);
  }

  if (runToken !== cinematicRunToken) {
    return;
  }

  root.classList.add("cinema-mode");
  if (shell instanceof HTMLElement) {
    shell.setAttribute("aria-hidden", "true");
  }

  if (withPrelude) {
    await runCinematicPrelude(stage, runToken);
    if (runToken !== cinematicRunToken) {
      return;
    }
  }

  root.classList.add("cinema-release-bloom");
  window.setTimeout(() => {
    if (runToken === cinematicRunToken) {
      root.classList.remove("cinema-release-bloom");
    }
  }, prefersReducedMotion() ? 60 : 620);

  window.requestAnimationFrame(() => {
    if (runToken !== cinematicRunToken) {
      return;
    }
    stage.classList.add("cinema-stage--live");
  });
}

function setRecipientHeadlineText(text, { animate = false } = {}) {
  const headline = document.querySelector("#recipientHeadline");
  if (!(headline instanceof HTMLElement)) {
    return;
  }

  const incomingText = String(text ?? "").trim();
  if (!incomingText) {
    return;
  }

  const active =
    headline.querySelector(".headline__text--current") ??
    headline.querySelector(".headline__text");

  if (!(active instanceof HTMLElement)) {
    const span = document.createElement("span");
    span.className = "headline__text headline__text--current";
    span.textContent = incomingText;
    headline.replaceChildren(span);
    lastLockedHeadlinePhrase = incomingText;
    return;
  }

  if (active.textContent?.trim() === incomingText) {
    return;
  }

  const shouldAnimate = animate && !prefersReducedMotion();
  if (!shouldAnimate) {
    active.className = "headline__text headline__text--current";
    active.textContent = incomingText;
    headline.classList.remove("headline--is-swapping");
    const stale = headline.querySelector(".headline__text--next");
    if (stale instanceof HTMLElement) {
      stale.remove();
    }
    lastLockedHeadlinePhrase = incomingText;
    return;
  }

  if (headlineSwapTimer) {
    window.clearTimeout(headlineSwapTimer);
    headlineSwapTimer = null;
  }

  const stale = headline.querySelector(".headline__text--next");
  if (stale instanceof HTMLElement) {
    stale.remove();
  }

  active.classList.remove("headline__text--current");
  active.classList.add("headline__text--leaving");

  const next = document.createElement("span");
  next.className = "headline__text headline__text--next";
  next.textContent = incomingText;
  headline.append(next);
  headline.classList.add("headline--is-swapping");

  window.requestAnimationFrame(() => {
    next.classList.add("headline__text--entering");
  });

  headlineSwapTimer = window.setTimeout(() => {
    active.remove();
    next.classList.remove("headline__text--next", "headline__text--entering");
    next.classList.add("headline__text--current");
    headline.classList.remove("headline--is-swapping");
    headlineSwapTimer = null;
  }, HEADLINE_SWAP_DURATION_MS);

  lastLockedHeadlinePhrase = incomingText;
}

function startLockedHeadlineCycle() {
  stopLockedHeadlineCycle();
  const current = getRecipientHeadlineText();
  setRecipientHeadlineText(pickLockedHeadlinePhrase({ avoid: current }), { animate: true });

  if (prefersReducedMotion()) {
    return;
  }

  lockedHeadlineTimer = window.setInterval(() => {
    setRecipientHeadlineText(pickLockedHeadlinePhrase({ avoid: getRecipientHeadlineText() }), { animate: true });
  }, 3200);
}

function applyEmotion(preset, { persist = false } = {}) {
  if (!root) {
    return;
  }

  const emotion = resolveEmotionPreset(preset, { reducedMotion: prefersReducedMotion() });
  syncMotionMode();
  clearEmotions();
  root.classList.add(emotion.className);

  if (!persist) {
    window.setTimeout(() => {
      if (root.classList.contains(emotion.className)) {
        root.classList.remove(emotion.className);
      }
    }, emotion.motionMode === "reduced" ? 80 : 900);
  }
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const payload = await response.json();
  if (!response.ok) {
    const message = payload?.error?.message ?? "Request failed.";
    throw new Error(message);
  }

  return payload;
}

function renderHomeShell() {
  root.innerHTML = `
    <main class="journal-shell">
      <p class="brand">Future Note</p>
      <h1 class="headline">Write now. Reveal later.</h1>

      <form id="createForm" class="compose">
        <label class="sr-only" for="messageInput">Message</label>
        <textarea id="messageInput" class="compose__message" rows="8" placeholder="Write the message..." required></textarea>
        <div class="compose__actions">
          <button type="submit" class="button">Seal note</button>
          <p id="status" class="status" role="status" aria-live="polite"></p>
        </div>
      </form>

      <section id="createResult" class="result-slot" aria-live="polite"></section>

      <section class="history">
        <header class="history__header">
          <h2>Sent</h2>
        </header>
        <div id="historyList" class="history__list"></div>
      </section>
    </main>
  `;
}

function renderCreateResult(payload) {
  const container = document.querySelector("#createResult");
  if (!container) {
    return;
  }

  container.innerHTML = `
    <section class="result-card">
      <div class="inline-field inline-field--primary">
        <input id="shareUrlField" type="text" readonly value="${escapeHtml(payload.share_url)}" />
        <button data-copy-target="shareUrlField" class="button button--subtle" type="button">Copy</button>
      </div>

      <details class="meta-disclosure">
        <summary>More</summary>
        <div class="inline-field">
          <input id="manageTokenField" type="text" readonly value="${escapeHtml(payload.manage_token)}" />
          <button data-copy-target="manageTokenField" class="button button--subtle" type="button">Copy</button>
        </div>
      </details>
      ${renderMetadataDisclosure(payload.note, { summary: "Proof" })}
    </section>
  `;
}

async function copyFromField(inputId) {
  const input = document.querySelector(`#${inputId}`);
  if (!(input instanceof HTMLInputElement)) {
    return;
  }

  await navigator.clipboard.writeText(input.value);
  setStatus("");
}

async function syncHistoryStatuses() {
  const { entries } = loadSentHistory();
  if (!entries.length) {
    return;
  }

  const nextEntries = [];
  for (const entry of entries) {
    try {
      const payload = await api(`/api/share/${encodeURIComponent(entry.share_token)}`);
      nextEntries.push({
        ...entry,
        status: payload.note.status,
        created_at: payload.note.created_at,
        sent_at: payload.note.sent_at,
        revealed_at: payload.note.revealed_at,
        recipient_unlocked_at: payload.note.recipient_unlocked_at,
        content_hash: payload.note.content_hash,
        fingerprint_summary: payload.note.fingerprint_summary,
      });
    } catch {
      nextEntries.push(entry);
    }
  }

  saveSentHistory(nextEntries);
}

function renderHistory() {
  const target = document.querySelector("#historyList");
  if (!target) {
    return;
  }

  const { entries, recovered } = loadSentHistory();
  if (recovered) {
    setStatus("Recovered from invalid local history entries.", { isError: false });
  }

  if (!entries.length) {
    target.innerHTML = "";
    return;
  }

  const reducedMotion = prefersReducedMotion();
  target.innerHTML = entries
    .map((entry, index) => renderSentHistoryItem(entry, { reducedMotion, index }))
    .join("\n");
}

async function initializeHome() {
  stopLockedHeadlineCycle();
  renderHomeShell();
  syncMotionMode();
  cueAppLoadAnimation();
  clearEmotions();
  bindInteractionAnimations();

  await syncHistoryStatuses();
  renderHistory();

  const createForm = document.querySelector("#createForm");
  const messageInput = document.querySelector("#messageInput");
  const createResult = document.querySelector("#createResult");

  messageInput?.addEventListener("input", () => {
    pulseWritingSurface(messageInput);
  });

  createForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      const payload = buildCreatePayload(messageInput?.value ?? "");
      const response = await api("/api/notes", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      upsertSentHistoryEntry({
        note_id: response.note.id,
        share_token: response.share_token,
        share_url: response.share_url,
        manage_token: response.manage_token,
        message: payload.message,
        status: response.note.status,
        created_at: response.note.created_at,
        sent_at: response.note.sent_at,
        revealed_at: response.note.revealed_at,
        recipient_unlocked_at: response.note.recipient_unlocked_at,
        content_hash: response.note.content_hash,
        fingerprint_summary: response.note.fingerprint_summary,
      });

      renderCreateResult(response);
      renderHistory();
      if (createForm instanceof HTMLFormElement) {
        createForm.reset();
      }

      applyEmotion("send_relief");
      setStatus("");
    } catch (error) {
      setStatus(error.message, { isError: true });
      if (createResult) {
        createResult.innerHTML = "";
      }
    }
  });

  createResult?.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const fieldId = target.dataset.copyTarget;
    if (!fieldId) {
      return;
    }

    try {
      await copyFromField(fieldId);
    } catch (error) {
      setStatus(error.message, { isError: true });
    }
  });

  document.querySelector("#historyList")?.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (target.dataset.action !== "sender-unlock") {
      return;
    }

    const noteId = target.dataset.noteId;
    if (!noteId) {
      return;
    }

    const { entries } = loadSentHistory();
    const entry = entries.find((item) => item.note_id === noteId);
    if (!entry) {
      setStatus("Unable to find note in local history.", { isError: true });
      return;
    }

    try {
      const response = await api(`/api/manage/${encodeURIComponent(noteId)}/unlock`, {
        method: "POST",
        body: JSON.stringify({ manage_token: entry.manage_token }),
      });

      patchSentHistoryEntry(noteId, {
        status: response.note.status,
        created_at: response.note.created_at,
        sent_at: response.note.sent_at,
        revealed_at: response.note.revealed_at,
        recipient_unlocked_at: response.note.recipient_unlocked_at,
        content_hash: response.note.content_hash,
        fingerprint_summary: response.note.fingerprint_summary,
      });

      renderHistory();
      applyEmotion("send_relief");
      setStatus("");
    } catch (error) {
      setStatus(error.message, { isError: true });
    }
  });
}

function renderRecipientShell() {
  root.innerHTML = `
    <main class="journal-shell journal-shell--recipient">
      <p class="brand">Future Note</p>
      <h1 id="recipientHeadline" class="headline headline--dynamic">
        <span class="headline__text headline__text--current">Sealed words, waiting.</span>
      </h1>
      <p id="status" class="status" role="status" aria-live="polite"></p>
      <div id="recipientCard" class="recipient-slot"></div>
    </main>
    <section id="cinemaStage" class="cinema-stage" aria-live="polite" aria-hidden="true" hidden></section>
  `;
}

async function initializeRecipient(shareToken) {
  renderRecipientShell();
  syncMotionMode();
  cueAppLoadAnimation();
  bindInteractionAnimations();
  const recipientCard = document.querySelector("#recipientCard");
  const revealBuildDelay = prefersReducedMotion() ? 40 : 260;

  async function refreshRecipientView() {
    const payload = await api(`/api/share/${encodeURIComponent(shareToken)}`);

    if (payload.note.content_visible) {
      stopLockedHeadlineCycle();
      await activateCinematicReveal(payload.note.content, { animateExit: false, withPrelude: false });
      setStatus("");
      return;
    }

    resetCinematicReveal();
    const reducedMotion = prefersReducedMotion();
    recipientCard.innerHTML = renderRecipientCard(payload.note, { reducedMotion });

    if (payload.note.status === "revealed") {
      stopLockedHeadlineCycle();
      setRecipientHeadlineText("The seal is open.", { animate: true });
      clearEmotions();
      setStatus("");
      return;
    }

    startLockedHeadlineCycle();
    applyEmotion("locked_anticipation", { persist: true });
    setStatus("");
  }

  try {
    await refreshRecipientView();
  } catch (error) {
    setStatus(error.message, { isError: true });
    recipientCard.innerHTML = "";
    return;
  }

  recipientCard?.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (target.dataset.action !== "recipient-unlock") {
      return;
    }

    const unlockButton = target.closest('button[data-action="recipient-unlock"]');

    try {
      if (unlockButton instanceof HTMLButtonElement) {
        unlockButton.disabled = true;
      }

      setStatus("");
      await delay(revealBuildDelay);

      const payload = await api(`/api/share/${encodeURIComponent(shareToken)}/unlock`, {
        method: "POST",
      });

      stopLockedHeadlineCycle();
      await activateCinematicReveal(payload.note.content, { animateExit: true, withPrelude: true });
      setStatus("");
    } catch (error) {
      setStatus(error.message, { isError: true });
      resetCinematicReveal();
      if (unlockButton instanceof HTMLButtonElement) {
        unlockButton.disabled = false;
      }
    }
  });
}

const shareRouteMatch = /^\/n\/([^/]+)$/.exec(window.location.pathname);
if (shareRouteMatch) {
  initializeRecipient(decodeURIComponent(shareRouteMatch[1]));
} else {
  initializeHome().catch((error) => {
    setStatus(error.message, { isError: true });
  });
}
