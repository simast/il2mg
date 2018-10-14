interface DeepImmutableArray<T> extends ReadonlyArray<Immutable<T>> {}
interface DeepMutableArray<T> extends Array<Mutable<T>> {}
type DeepImmutableObject<T> = { readonly [P in keyof T]: Immutable<T[P]> }
type DeepMutableObject<T> = { -readonly [P in keyof T]: Mutable<T[P]> }

/**
 * Create an immutable type (recursively).
 */
export type Immutable<T> =
	T extends Function ? T :
	'0' extends keyof T ? DeepImmutableObject<T> : // Tuples
	T extends Array<infer V> ? DeepImmutableArray<V> :
	T extends Map<infer K, infer V> ? ReadonlyMap<DeepImmutableObject<K>, DeepImmutableObject<V>> :
	T extends Set<infer V> ? ReadonlySet<DeepImmutableObject<V>> :
	T extends object ? DeepImmutableObject<T> :
	T

/**
 * Create a mutable type (recursively).
 */
export type Mutable<T> =
	T extends Function ? T :
	'0' extends keyof T ? DeepMutableObject<T> : // Tuples
	T extends ReadonlyArray<infer V> ? DeepMutableArray<V> :
	T extends ReadonlyMap<infer K, infer V> ? Map<DeepMutableObject<K>, DeepMutableObject<V>> :
	T extends ReadonlySet<infer V> ? Set<DeepMutableObject<V>> :
	T extends object ? DeepMutableObject<T> :
	T

declare enum Enum {}
type StringKeyOf<T extends object> = Extract<keyof T, string>

/**
 * Get TypeScript enum keys.
 *
 * @param e Enum to get keys for.
 * @returns Enum keys as an array.
 */
export function getEnumKeys<E extends typeof Enum>(e: E): StringKeyOf<E>[] {
	return Object.keys(e).filter((key): key is StringKeyOf<E> => isNaN(Number(key)))
}

/**
 * Get TypeScript enum values.
 *
 * @param e Enum to get values for.
 * @returns Enum values as an array.
 */
export function getEnumValues<E extends typeof Enum>(e: E): E[StringKeyOf<E>][] {
	return getEnumKeys(e).map(key => e[key])
}

/**
 * Test if enum contains specified value.
 *
 * @param e Enum to test value for.
 * @param value Value to verify against enum.
 * @returns Boolean indicating if value is part of enum.
 */
export function enumContainsValue<E extends typeof Enum, V extends E[StringKeyOf<E>]> (
	e: E,
	value: V
): boolean {
	return getEnumValues(e).includes(value)
}
