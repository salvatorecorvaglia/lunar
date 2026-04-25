export function assertNonEmptyString(value: unknown, name: string): asserts value is string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${name} must be a non-empty string`)
  }
  if (value.includes('\0')) {
    throw new Error(`${name} must not contain null bytes`)
  }
}

export function assertBoundedInt(
  value: unknown,
  name: string,
  min: number,
  max: number
): asserts value is number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${name} must be an integer between ${min} and ${max}`)
  }
}

export function assertValidPath(value: unknown, name: string): asserts value is string {
  assertNonEmptyString(value, name)
  if ((value as string).includes('\0')) {
    throw new Error(`${name} must not contain null bytes`)
  }
}
