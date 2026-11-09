export type NumberBase = 'float' | 2 | 8 | 10 | 16;

/**
 * The literal text a builder writes for a numeric value. `affix` is the
 * prefix an integer base writes before its digits (`0x`), or, for a float,
 * the spelling that makes a whole number a float literal (`.0`). Text and
 * `undefined` pass through for the slot guard to judge.
 *
 * Refused: a negative value, `-0` included (a unary minus applied to a positive literal), a
 * number with no literal spelling (NaN, Infinity), an integer past
 * `Number.MAX_SAFE_INTEGER` (it has already lost precision; a bigint keeps
 * it), and a bigint for a float literal.
 */
export function numberText<V extends string | number | bigint | undefined>(
	base: NumberBase,
	affix: string,
	value: V
): V extends number | bigint ? string : V {
	if (typeof value !== 'number' && typeof value !== 'bigint') return value as never;
	const refused = numberRefusal(value, base !== 'float');
	if (refused !== undefined) throw new RangeError(`numberText: ${refused}`);
	if (base === 'float') {
		if (typeof value === 'bigint') throw new TypeError(`numberText: a bigint (${value}n) cannot spell a float literal; pass a number`);
		const text = String(value);
		return (Number.isInteger(value) && !text.includes('e') ? `${text}${affix}` : text) as never;
	}
	if (typeof value === 'number' && !Number.isInteger(value)) return String(value) as never;
	return `${affix}${value.toString(base)}` as never;
}

export function numberRefusal(value: number | bigint, integer: boolean): string | undefined {
	if (typeof value === 'number' && !Number.isFinite(value)) return `${value} has no literal spelling`;
	const negativeZero = Object.is(value, -0);
	if (value < 0 || negativeZero) {
		return `${negativeZero ? '-0' : value}: a negative number is a unary minus applied to a positive literal; build the literal from its absolute value`;
	}
	if (integer && typeof value === 'number' && Number.isInteger(value) && !Number.isSafeInteger(value)) {
		return `${value} is past Number.MAX_SAFE_INTEGER and has lost precision; pass it as a bigint`;
	}
	return undefined;
}
