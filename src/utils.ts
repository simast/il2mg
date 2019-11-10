declare enum Enum {}
type StringKeyOf<T extends object> = Extract<keyof T, string>;

/**
 * Get TypeScript enum keys.
 *
 * @param e Enum to get keys for.
 * @returns Enum keys as an array.
 */
export function getEnumKeys<E extends typeof Enum>(e: E): StringKeyOf<E>[] {
	return Object.keys(e).filter((key): key is StringKeyOf<E> =>
		isNaN(Number(key)),
	);
}

/**
 * Get TypeScript enum values.
 *
 * @param e Enum to get values for.
 * @returns Enum values as an array.
 */
export function getEnumValues<E extends typeof Enum>(
	e: E,
): E[StringKeyOf<E>][] {
	return getEnumKeys(e).map(key => e[key]);
}

/**
 * Test if enum contains specified value.
 *
 * @param e Enum to test value for.
 * @param value Value to verify against enum.
 * @returns Boolean indicating if value is part of enum.
 */
export function enumContainsValue<
	E extends typeof Enum,
	V extends E[StringKeyOf<E>]
>(e: E, value: V): boolean {
	return getEnumValues(e).includes(value);
}
