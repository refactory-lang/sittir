import type { ChoiceRule, FieldRule, OptionalRule, SeqRule, StringRule, SymbolRule } from './rule.ts';

export type RuntimeRule = { readonly type: string };

type SymbolLike = { type: 'SYMBOL'; name: string };

export type FieldLike = {
	type: 'FIELD';
	name: string;
	content: unknown;
	metadata?: unknown;
};

export function isSymbolLike(v: unknown): v is SymbolLike {
	if (!v || typeof v !== 'object') return false;
	const t = (v as { type?: unknown }).type;
	if (t === 'SYMBOL' && typeof (v as { name?: unknown }).name === 'string') return true;
	return extractSymbolName(v) !== undefined;
}

function extractSymbolName(v: unknown): string | undefined {
	if (!v || typeof v !== 'object') return undefined;
	const r = v as Record<string, unknown>;
	const t = r.type;
	if (isSymbolType(t)) return typeof r.name === 'string' ? r.name : undefined;
	if (r.symbol && typeof r.symbol === 'object') {
		return extractSymbolName(r.symbol);
	}
	return undefined;
}

export function isFieldLike(v: unknown): v is FieldLike {
	if (!v || typeof v !== 'object') return false;
	const t = (v as { type?: unknown }).type;
	return t === 'FIELD' && typeof (v as { name?: unknown }).name === 'string';
}

export function isEnrichShapedFieldWrapper(v: unknown): v is FieldLike {
	if (!isFieldLike(v)) return false;
	const symName = extractSymbolName(v.content);
	if (symName === undefined) return false;
	if (symName.startsWith('_kw_')) return true;
	const strippedSym = symName.replace(/^_/, '');
	if (v.name === symName || v.name === strippedSym) return true;
	const baseName = v.name.replace(/[0-9]+$/, '');
	return baseName !== v.name && (baseName === symName || baseName === strippedSym);
}

export function isContainerType(t: string): boolean {
	return t === 'SEQ' || t === 'CHOICE';
}

export function isWrapperType(t: string): boolean {
	return (
		t === 'OPTIONAL' ||
		t === 'REPEAT' ||
		t === 'REPEAT1' ||
		t === 'FIELD' ||
		t === 'TOKEN' ||
		t === 'IMMEDIATE_TOKEN' ||
		t === 'BLANK'
	);
}

export function isPrecWrapper(rule: { type: string }): boolean {
	const t = rule.type;
	return t === 'PREC' || t === 'PREC_LEFT' || t === 'PREC_RIGHT' || t === 'PREC_DYNAMIC';
}

export function typeEq(t: unknown, upper: string): boolean {
	return t === upper;
}

export const isSeqType = <T>(t: T): t is T & { type: 'SEQ' } & SeqRule => typeEq(t, 'SEQ');
export const isChoiceType = <T>(t: T): t is T & { type: 'CHOICE' } & ChoiceRule => typeEq(t, 'CHOICE');
export const isOptionalType = <T>(t: T): t is T & { type: 'OPTIONAL' } & OptionalRule => typeEq(t, 'OPTIONAL');
export const isFieldType = <T>(t: T): t is T & { type: 'FIELD' } & FieldRule => typeEq(t, 'FIELD');
export const isSymbolType = <T>(t: T): t is T & { type: 'SYMBOL' } & SymbolRule => typeEq(t, 'SYMBOL');
export const isStringType = <T>(t: T): t is T & { type: 'STRING' } & StringRule => typeEq(t, 'STRING');
export const isPlainRepeatType = (t: unknown): boolean => typeEq(t, 'REPEAT');
export const isRepeatType = (t: unknown): boolean => typeEq(t, 'REPEAT') || typeEq(t, 'REPEAT1');
export const isBlankType = (t: unknown): boolean => typeEq(t, 'BLANK');
