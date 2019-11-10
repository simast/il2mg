declare module 'lazy-property' {
	export default function addLazyProperty<O extends object, P extends keyof O>(
		obj: O,
		prop: P,
		init: (this: O) => O[P],
		enumerable?: boolean,
	): void;
}
