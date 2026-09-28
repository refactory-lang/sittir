export type NumberBase = 'float' | 2 | 8 | 10 | 16;

/**
 * The literal text a builder writes for a numeric value. `affix` is the
 * prefix an integer base writes before its digits (`0x`), or, for a float,
 * the spelling that makes a whole number a float literal (`.0`). Text and
 * `undefined` pass through for the slot guard to judge.
 *
 * Refused: a negative value (a unary minus applied to a positive literal), a
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
	if (typeof value === 'number' && !Number.isFinite(value)) throw new RangeError(`numberText: ${value} has no literal spelling`);
	if (value < 0) {
		throw new RangeError(
			`numberText: ${value}: a negative number is a unary minus applied to a positive literal; build the literal from its absolute value`
		);
	}
	if (base === 'float') {
		if (typeof value === 'bigint') throw new TypeError(`numberText: a bigint (${value}n) cannot spell a float literal; pass a number`);
		const text = String(value);
		return (Number.isInteger(value) && !text.includes('e') ? `${text}${affix}` : text) as never;
	}
	if (typeof value === 'number') {
		if (!Number.isInteger(value)) return String(value) as never;
		if (!Number.isSafeInteger(value)) {
			throw new RangeError(`numberText: ${value} is past Number.MAX_SAFE_INTEGER and has lost precision; pass it as a bigint`);
		}
	}
	return `${affix}${value.toString(base)}` as never;
}
