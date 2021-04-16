/**
 * A HTTP error as thrown by controller functions.
 */
export class HttpError extends Error {
  constructor(public readonly code: number, description?: string) {
    super(description);
  }
}
