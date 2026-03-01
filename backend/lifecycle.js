import { DomainError } from "./errors.js";

export const NOTE_STATUS = Object.freeze({
  LOCKED_SENT: "locked_sent",
  REVEALED: "revealed",
});

const ALLOWED_TRANSITIONS = Object.freeze({
  [NOTE_STATUS.LOCKED_SENT]: [NOTE_STATUS.REVEALED],
  [NOTE_STATUS.REVEALED]: [],
});

export function assertTransition(current, next) {
  const allowed = ALLOWED_TRANSITIONS[current] ?? [];
  if (!allowed.includes(next)) {
    throw new DomainError(`Invalid note transition from '${current}' to '${next}'.`, {
      status: 409,
      code: "invalid_transition",
    });
  }
}
