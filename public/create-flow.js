export function buildCreatePayload(message) {
  const normalized = String(message ?? "").trim();
  if (!normalized) {
    throw new Error("Message is required.");
  }

  return { message: normalized };
}
