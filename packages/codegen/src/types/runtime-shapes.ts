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
export const isEmptyBody = (rule: unknown): boolean => {
	const r = rule as { type?: unknown; members?: readonly unknown[] } | undefined;
	return isBlankType(r?.type) || (typeEq(r?.type, 'CHOICE') && r?.members?.length === 0);
};

export type CompiledPattern = { readonly regex: RegExp } | { readonly error: Error };

export function compileAnchoredPattern(source: string): CompiledPattern {
	const anchored = `^(?:${source})$`;
	try {
		return { regex: new RegExp(anchored, 'u') };
	} catch {
		try {
			return { regex: new RegExp(anchored) };
		} catch (error) {
			return { error: error as Error };
		}
	}
}

export function patternAcceptsEmpty(source: string): boolean {
	const compiled = compileAnchoredPattern(source);
	return 'regex' in compiled && compiled.regex.test('');
}

type SampleState = { readonly source: string; index: number };

const SAMPLE_FILLERS = ['a', '1', '_', 'x', ' ', '.', '0'];

function sampleClass(state: SampleState): string {
	const negated = state.source[state.index] === '^';
	if (negated) state.index++;
	const members: string[] = [];
	while (state.index < state.source.length && state.source[state.index] !== ']') {
		let ch = state.source[state.index++]!;
		if (ch === '\\') {
			const escaped = state.source[state.index++]!;
			members.push(escaped === 'd' ? '0' : escaped === 'w' ? 'a' : escaped === 's' ? ' ' : escaped === 'n' ? '\n' : escaped);
			continue;
		}
		if (state.source[state.index] === '-' && state.source[state.index + 1] !== ']' && state.index + 1 < state.source.length) {
			state.index++;
			if (state.source[state.index] === '\\') state.index++;
			state.index++;
		}
		members.push(ch);
	}
	state.index++;
	if (!negated) return members[0] ?? 'a';
	return SAMPLE_FILLERS.find((f) => !members.includes(f)) ?? 'a';
}

function sampleAtom(state: SampleState): string {
	const ch = state.source[state.index++]!;
	if (ch === '[') return sampleClass(state);
	if (ch === '(') {
		if (state.source.startsWith('?:', state.index)) state.index += 2;
		else if (state.source[state.index] === '?' && state.source[state.index + 1] === '<') state.index = state.source.indexOf('>', state.index) + 1;
		const inner = sampleAlternation(state);
		state.index++;
		return inner;
	}
	if (ch === '\\') {
		const escaped = state.source[state.index++]!;
		if (escaped === 'd') return '0';
		if (escaped === 'w') return 'a';
		if (escaped === 's') return ' ';
		if (escaped === 'n') return '\n';
		if (escaped === 'r') return '\r';
		if (escaped === 't') return '\t';
		return escaped;
	}
	if (ch === '.') return 'a';
	return ch;
}

function sampleQuantified(state: SampleState): string {
	const atom = sampleAtom(state);
	const q = state.source[state.index];
	if (q === '+' || q === '{') {
		state.index++;
		if (q === '{') {
			const close = state.source.indexOf('}', state.index);
			const min = Number.parseInt(state.source.slice(state.index, close), 10);
			state.index = close + 1;
			return atom.repeat(Number.isNaN(min) ? 1 : Math.max(min, 0));
		}
		return atom;
	}
	if (q === '*' || q === '?') {
		state.index++;
		return q === '*' ? atom : '';
	}
	return atom;
}

function sampleSequence(state: SampleState): string {
	let out = '';
	while (state.index < state.source.length && state.source[state.index] !== '|' && state.source[state.index] !== ')') {
		out += sampleQuantified(state);
	}
	return out;
}

function sampleAlternation(state: SampleState): string {
	const first = sampleSequence(state);
	while (state.source[state.index] === '|') {
		state.index++;
		sampleSequence(state);
	}
	return first;
}

export function samplePattern(source: string): string | null {
	const compiled = compileAnchoredPattern(source);
	if (!('regex' in compiled)) return null;
	try {
		const sample = sampleAlternation({ source, index: 0 });
		return compiled.regex.test(sample) ? sample : null;
	} catch {
		return null;
	}
}

export function matchesEmpty(rule: RuntimeRule): boolean {
	const t = rule.type;
	if (isBlankType(t) || isOptionalType(t) || isPlainRepeatType(t)) return true;
	if (t === 'STRING') return (rule as { value?: unknown }).value === '';
	if (t === 'PATTERN') return patternAcceptsEmpty(String((rule as { value?: unknown }).value));
	const members = (rule as { members?: readonly RuntimeRule[] }).members ?? [];
	if (isChoiceType(t)) return members.some(matchesEmpty);
	if (isSeqType(t)) return members.every(matchesEmpty);
	if (isPrecWrapper(rule as { type: string })) return matchesEmpty((rule as { content?: RuntimeRule }).content!);
	return false;
}
