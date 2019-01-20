export default function IntersectionError(message) {
  this.name = 'IntersectionError';
  this.message = message || 'Position already taken';
  this.stack = (new Error()).stack;
}
IntersectionError.prototype = Object.create(Error.prototype);
IntersectionError.prototype.constructor = IntersectionError;