import type { PortableDecimalParts } from '@sittir/types';

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
	const refused = numberRefusal(value, base !== 'float', false);
	if (refused !== undefined) throw new RangeError(`numberText: ${refused}`);
	if (base === 'float') {
		if (typeof value === 'bigint') throw new TypeError(`numberText: a bigint (${value}n) cannot spell a float literal; pass a number`);
		const text = String(value);
		return (Number.isInteger(value) && !text.includes('e') ? `${text}${affix}` : text) as never;
	}
	if (typeof value === 'number' && !Number.isInteger(value)) return String(value) as never;
	return `${affix}${value.toString(base)}` as never;
}

export type IntegerBase = Exclude<NumberBase, 'float'>;

const DIGITS: Readonly<Record<IntegerBase, string>> = { 2: '01', 8: '0-7', 10: '0-9', 16: '0-9a-fA-F' };

export function integerSpelling(base: IntegerBase, affix: string): string {
	const marker = [...affix].map((char) => (char.toLowerCase() === char.toUpperCase() ? char : `[${char.toLowerCase()}${char.toUpperCase()}]`)).join('');
	return `${marker}_*[${DIGITS[base]}][${DIGITS[base]}_]*`;
}

const BIGINT_PREFIX: Readonly<Record<IntegerBase, string>> = { 2: '0b', 8: '0o', 10: '', 16: '0x' };

const spellings = new Map<string, RegExp>();

export function integerValue(base: IntegerBase, affix: string, text: string): bigint | undefined {
	const key = `${base} ${affix}`;
	let spelling = spellings.get(key);
	if (spelling === undefined) spellings.set(key, (spelling = new RegExp(`^(?:${integerSpelling(base, affix)})$`, 'u')));
	if (!spelling.test(text)) return undefined;
	return BigInt(`${BIGINT_PREFIX[base]}${text.slice(affix.length).replaceAll('_', '')}`);
}

export function numberRefusal(value: number | bigint, integer: boolean, signed: boolean): string | undefined {
	if (typeof value === 'number' && !Number.isFinite(value)) return `${value} has no literal spelling`;
	const negativeZero = Object.is(value, -0);
	if (!signed && (value < 0 || negativeZero)) {
		return `${negativeZero ? '-0' : value}: a negative number is a unary minus applied to a positive literal; build the literal from its absolute value`;
	}
	if (integer && typeof value === 'number' && Number.isInteger(value) && !Number.isSafeInteger(value)) {
		return `${value} is past Number.MAX_SAFE_INTEGER and has lost precision; pass it as a bigint`;
	}
	return undefined;
}

type Part<P extends PortableDecimalParts, K extends keyof PortableDecimalParts> = K extends keyof P ? Exclude<P[K], undefined> : never;

export type DecimalSpelling<P extends PortableDecimalParts, S extends boolean = boolean> = { readonly [K in Part<P, 'integer' | 'fraction'>]: string } & (S extends true
	? { readonly [K in Part<P, 'exponent'>]: string } & { readonly [K in Part<P, 'marker'>]: 'e' }
	: { readonly [K in Part<P, 'exponent'>]?: string } & { readonly [K in Part<P, 'marker'>]?: 'e' }) & { readonly [K in Part<P, 'exponentSign'>]?: '-' };

const spelledParts = (spelling: string, parts: PortableDecimalParts): Record<string, string> | undefined => {
	const [, integer, fraction, sign, exponent] = /^(\d+)(?:\.(\d+))?(?:e([+-])(\d+))?$/.exec(spelling) ?? [];
	if (integer === undefined) return undefined;
	const out: Record<string, string> = {};
	if (parts.integer !== undefined) out[parts.integer] = integer;
	else if (integer !== '0') return undefined;
	if (parts.fraction !== undefined) out[parts.fraction] = fraction ?? '0';
	else if (fraction !== undefined) return undefined;
	if (exponent === undefined) return out;
	if (parts.exponent === undefined) return undefined;
	out[parts.exponent] = exponent;
	if (parts.marker !== undefined) out[parts.marker] = 'e';
	if (sign !== '-') return out;
	if (parts.exponentSign === undefined) return undefined;
	out[parts.exponentSign] = '-';
	return out;
};

const significandOf = (value: number | bigint): { readonly digits: string; readonly power: number } | undefined => {
	const [, whole, fraction = '', exponent = '0'] = /^(\d+)(?:\.(\d+))?(?:e([+-]\d+))?$/.exec(typeof value === 'number' ? value.toExponential() : String(value)) ?? [];
	if (whole === undefined) return undefined;
	const written = `${whole}${fraction}`;
	const digits = written.replace(/0+$/, '') || '0';
	return { digits, power: Number(exponent) - fraction.length + written.length - digits.length };
};

const exponentSpelling = (mantissa: string, power: number): string => `${mantissa}e${power < 0 ? '-' : '+'}${Math.abs(power)}`;

export function decimalSpelling<const P extends PortableDecimalParts, const S extends boolean>(value: number | bigint, parts: P, scientific: S): DecimalSpelling<P, S> | undefined {
	const significand = significandOf(value);
	const spellings = scientific
		? [significand && exponentSpelling(significand.digits, significand.power)]
		: [
				String(value),
				...(typeof value === 'number' && parts.exponent !== undefined
					? [value.toExponential(), significand && exponentSpelling(`0.${significand.digits}`, significand.power + significand.digits.length)]
					: [])
			];
	for (const spelling of spellings) {
		const out = spelling === undefined ? undefined : spelledParts(spelling, parts);
		if (out !== undefined) return out as DecimalSpelling<P, S>;
	}
	return undefined;
}
