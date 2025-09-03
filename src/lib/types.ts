/**
 * Converts optional fields in a type to nullable fields
 * Example:
 * type Input = { name?: string, age: number }
 * type Output = OptionalToNullable<Input> // { name: string | null, age: number }
 */
export type OptionalToNullable<T> = {
  [K in keyof T]: undefined extends T[K] ? NonNullable<T[K]> | null : T[K];
};

/**
 * Converts optional fields or undefined values in a type to nullable fields
 * Example:
 * type Input = { name?: string | undefined, age: number }
 * type Output = UndefinedToNullable<Input> // { name: string | null, age: number }
 */
export type UndefinedToNullable<T> = {
  [K in keyof T]: undefined extends T[K]
    ? Exclude<T[K], undefined> | null
    : T[K];
};
