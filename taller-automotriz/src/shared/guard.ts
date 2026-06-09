export function isNullOrUndefined<T>(val: T | null | undefined): val is null | undefined {
  return val === null || val === undefined;
}

export function assertDefined<T>(val: T | null | undefined, message: string): asserts val is T {
  if (isNullOrUndefined(val)) throw new Error(message);
}

export function isPositiveInt(n: number): boolean {
  return Number.isInteger(n) && n > 0;
}
