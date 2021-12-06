export default class IntersectionError extends Error {
  constructor(message: string) {
    super(message);

    this.name = 'IntersectionError';
    this.message = message || 'Position is already taken';
    this.stack = new Error().stack;
  }
}
