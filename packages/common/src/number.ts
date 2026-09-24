export type NumberBase = 'float' | 2 | 8 | 10 | 16;

export function numberText<V extends string | number | undefined>(
	base: NumberBase,
	prefix: string,
	value: V
): V extends number ? string : V {
	if (typeof value !== 'number') return value as never;
	if (base === 'float' || !Number.isInteger(value) || value < 0) return String(value) as never;
	return `${prefix}${value.toString(base)}` as never;
}
