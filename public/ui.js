export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function formatMoment(isoTimestamp) {
  if (!isoTimestamp) {
    return "Pending";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(isoTimestamp));
}

export function summarizeFingerprint(hash) {
  if (!hash) {
    return "Pending";
  }

  if (hash.length <= 18) {
    return hash;
  }

  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

const EMOTION_PRESETS = new Set(["send_relief", "locked_anticipation", "reveal_release"]);

export function resolveEmotionPreset(preset, { reducedMotion = false } = {}) {
  const normalized = EMOTION_PRESETS.has(preset) ? preset : "locked_anticipation";

  return {
    preset: normalized,
    className: `emotion-${normalized.replaceAll("_", "-")}`,
    motionMode: reducedMotion ? "reduced" : "full",
  };
}

function resolveFingerprintSummary(note) {
  if (note?.fingerprint_summary) {
    return note.fingerprint_summary;
  }

  return summarizeFingerprint(note?.content_hash);
}

export function renderProofMetadata(note) {
  return `
    <dl class="proof-grid">
      <div><dt>Created</dt><dd>${escapeHtml(formatMoment(note.created_at))}</dd></div>
      <div><dt>Sent</dt><dd>${escapeHtml(formatMoment(note.sent_at))}</dd></div>
      <div><dt>Revealed</dt><dd>${escapeHtml(formatMoment(note.revealed_at))}</dd></div>
      <div><dt>Fingerprint</dt><dd><code>${escapeHtml(resolveFingerprintSummary(note))}</code></dd></div>
    </dl>
  `;
}

export function renderMetadataDisclosure(note, { summary = "Meta" } = {}) {
  return `
    <details class="meta-disclosure">
      <summary>${escapeHtml(summary)}</summary>
      ${renderProofMetadata(note)}
    </details>
  `;
}

export function renderStatusPill(status) {
  const normalized = status === "revealed" ? "revealed" : "locked";
  const label = normalized === "revealed" ? "Revealed" : "Locked";
  return `<span class="pill pill--${normalized}">${label}</span>`;
}

export function renderSentHistoryItem(entry, { reducedMotion = false, index = 0 } = {}) {
  const emotion = resolveEmotionPreset(entry.status === "revealed" ? "send_relief" : "locked_anticipation", {
    reducedMotion,
  });
  const unlockAction =
    entry.status === "revealed"
      ? ""
      : `<button class="button button--subtle" data-action="sender-unlock" data-note-id="${escapeHtml(entry.note_id)}">Unlock</button>`;
  const senderMessage = String(entry.message ?? "").trim();
  const messageBlock = senderMessage ? `<p class="history-item__message">${escapeHtml(senderMessage)}</p>` : "";

  return `
    <article
      class="history-item ${emotion.className}"
      data-note-id="${escapeHtml(entry.note_id)}"
      data-motion="${emotion.motionMode}"
      data-emotion="${emotion.preset}"
      style="--history-delay:${Math.min(index, 10) * 80}ms"
    >
      <header class="history-item__head">
        ${renderStatusPill(entry.status)}
        <a class="history-item__link" href="${escapeHtml(entry.share_url)}" target="_blank" rel="noopener">View</a>
      </header>
      ${messageBlock}
      <footer class="history-item__actions">
        ${unlockAction}
        ${renderMetadataDisclosure(entry)}
      </footer>
    </article>
  `;
}

export function renderRecipientCard(note, { reducedMotion = false } = {}) {
  const stage = note.content_visible ? "visible" : note.status === "revealed" ? "ready" : "locked";
  const emotionPreset = stage === "visible" ? "reveal_release" : "locked_anticipation";
  const emotion = resolveEmotionPreset(emotionPreset, { reducedMotion });

  const unlockControl =
    stage === "ready"
      ? `<button class="button button--reveal" data-action="recipient-unlock">Open note</button>`
      : "";

  const mainBlock =
    stage === "visible"
      ? `<p class="note-content">${escapeHtml(note.content ?? "")}</p>`
      : stage === "ready"
        ? `<div class="recipient-card__actions">${unlockControl}</div>`
        : "";

  return `
    <section
      class="recipient-card recipient-card--${stage} ${emotion.className}"
      data-stage="${stage}"
      data-emotion="${emotion.preset}"
      data-motion="${emotion.motionMode}"
    >
      ${mainBlock ? `<div class="recipient-stage recipient-stage--${stage}">${mainBlock}</div>` : ""}
    </section>
  `;
}
