import _isPlainObject from "lodash/isPlainObject";

export function isPlainObject<T>(x: unknown): x is T {
  return _isPlainObject(x);
}
