export class DomainError extends Error {
  constructor(message, { status = 400, code = "bad_request" } = {}) {
    super(message);
    this.name = "DomainError";
    this.status = status;
    this.code = code;
  }
}
