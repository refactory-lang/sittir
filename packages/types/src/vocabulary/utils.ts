export type SubKindOf<T extends { readonly $kind: string }> = {
	readonly [K in keyof T]: K extends '$kind' ? `${T['$kind']}.${string}` : T[K];
};
