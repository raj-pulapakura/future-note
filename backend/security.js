import crypto from "node:crypto";

export function hashValue(value) {
  return crypto.createHash("sha256").update(String(value ?? ""), "utf8").digest("hex");
}

export function generateToken(byteLength = 24) {
  return crypto.randomBytes(byteLength).toString("base64url");
}

export function tokenMatchesHash(token, expectedHash) {
  const computedHash = hashValue(token);
  const left = Buffer.from(computedHash, "utf8");
  const right = Buffer.from(String(expectedHash ?? ""), "utf8");

  if (left.length !== right.length) {
    return false;
  }

  return crypto.timingSafeEqual(left, right);
}

export function summarizeFingerprint(hash) {
  if (!hash) {
    return null;
  }

  if (hash.length <= 18) {
    return hash;
  }

  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}
