declare enum Enum {}
type StringKeyOf<T extends object> = Extract<keyof T, string>

/**
 * Get TypeScript enum keys.
 *
 * @param e Enum to get keys for.
 * @returns Enum keys as an array.
 */
export function getEnumKeys<T extends typeof Enum>(e: T): StringKeyOf<T>[] {
	return Object.keys(e).filter((key): key is StringKeyOf<T> => isNaN(Number(key)))
}

/**
 * Get TypeScript enum values.
 *
 * @param e Enum to get values for.
 * @returns Enum values as an array.
 */
export function getEnumValues<T extends typeof Enum>(e: T): T[StringKeyOf<T>][] {
	return getEnumKeys(e).map(key => e[key])
}
