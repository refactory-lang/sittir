export type PatternPiece =
	| { readonly kind: 'escape' | 'class' | 'char'; readonly at: number; readonly text: string }
	| { readonly kind: 'open'; readonly at: number; readonly text: string; readonly group: 'capture' | 'plain' | 'other' }
	| { readonly kind: 'open'; readonly at: number; readonly text: string; readonly group: 'named'; readonly name: string };

const NAMED_OPENING = /\(\?<([A-Za-z_]\w*)>/y;

function classEnd(source: string, from: number): number {
	for (let i = from; i < source.length; i++) {
		if (source[i] === '\\') i += 1;
		else if (source[i] === ']') return i + 1;
	}
	return source.length;
}

function groupOpening(source: string, at: number): PatternPiece {
	if (source[at + 1] !== '?') return { kind: 'open', at, text: '(', group: 'capture' };
	if (source[at + 2] === ':') return { kind: 'open', at, text: '(?:', group: 'plain' };
	NAMED_OPENING.lastIndex = at;
	const named = NAMED_OPENING.exec(source);
	if (named !== null) return { kind: 'open', at, text: named[0], group: 'named', name: named[1]! };
	return { kind: 'open', at, text: '(?', group: 'other' };
}

export function pieceAt(source: string, at: number): PatternPiece {
	const c = source[at]!;
	if (c === '\\') return { kind: 'escape', at, text: source.slice(at, at + 2) };
	if (c === '[') return { kind: 'class', at, text: source.slice(at, classEnd(source, at + 1)) };
	if (c === '(') return groupOpening(source, at);
	return { kind: 'char', at, text: c };
}

export function* pieces(source: string, from = 0): Generator<PatternPiece> {
	for (let at = from; at < source.length; ) {
		const piece = pieceAt(source, at);
		yield piece;
		at += piece.text.length;
	}
}

export function withoutCaptures(source: string): string {
	let out = '';
	for (const piece of pieces(source)) out += piece.kind === 'open' && (piece.group === 'capture' || piece.group === 'named') ? '(?:' : piece.text;
	return out;
}

export function closingParen(source: string, from: number): number {
	let depth = 1;
	for (const piece of pieces(source, from)) {
		if (piece.kind === 'open') depth += 1;
		else if (piece.kind === 'char' && piece.text === ')' && --depth === 0) return piece.at;
	}
	return -1;
}

export type PatternPart = { readonly lit: string } | { readonly group: string; readonly pattern: string };

const CONTROL_ESCAPES: Readonly<Record<string, string>> = { n: '\n', r: '\r', t: '\t', f: '\f', v: '\v', 0: '\0' };
const REGEX_SPECIALS = '[]()|*+?{}.^$';

export function patternParts(source: string): readonly PatternPart[] | undefined {
	const parts: PatternPart[] = [];
	const pushLit = (text: string): void => {
		const last = parts[parts.length - 1];
		if (last !== undefined && 'lit' in last) parts[parts.length - 1] = { lit: last.lit + text };
		else parts.push({ lit: text });
	};
	for (let at = 0; at < source.length; ) {
		const piece = pieceAt(source, at);
		if (piece.kind === 'open' && piece.group === 'named') {
			const end = closingParen(source, at + piece.text.length);
			if (end < 0) return undefined;
			parts.push({ group: piece.name, pattern: source.slice(at + piece.text.length, end) });
			at = end + 1;
			continue;
		}
		if (piece.kind === 'escape') {
			const next = piece.text[1];
			if (next === undefined) return undefined;
			if (/[A-Za-z0-9]/.test(next) && CONTROL_ESCAPES[next] === undefined) return undefined;
			pushLit(CONTROL_ESCAPES[next] ?? next);
		} else if (piece.kind !== 'char' || REGEX_SPECIALS.includes(piece.text)) return undefined;
		else pushLit(piece.text);
		at += piece.text.length;
	}
	return parts;
}

export function patternLiteral(source: string): string | undefined {
	const parts = patternParts(source);
	const only = parts?.length === 1 ? parts[0] : undefined;
	return only !== undefined && 'lit' in only ? only.lit : undefined;
}

const QUANTIFIERS = '*+?{';

function topLevelAlternation(source: string): boolean {
	let depth = 0;
	for (const piece of pieces(source)) {
		if (piece.kind === 'open') depth += 1;
		else if (piece.kind === 'char' && piece.text === ')') depth -= 1;
		else if (piece.kind === 'char' && piece.text === '|' && depth === 0) return true;
	}
	return false;
}

function groupForm(source: string): string {
	let out = '';
	for (let at = 0; at < source.length; ) {
		const piece = pieceAt(source, at);
		const end = piece.kind === 'open' && piece.group !== 'other' ? closingParen(source, at + piece.text.length) : -1;
		if (end < 0) {
			out += piece.text;
			at += piece.text.length;
			continue;
		}
		const inner = source.slice(at + piece.text.length, end);
		const after = source[end + 1];
		const kept = topLevelAlternation(inner) || (after !== undefined && QUANTIFIERS.includes(after));
		out += kept ? `(?:${groupForm(inner)})` : groupForm(inner);
		at = end + 1;
	}
	return out;
}

export function sameUpToGroups(a: string, b: string): boolean {
	return groupForm(a) === groupForm(b);
}

type CodeRanges = readonly (readonly [number, number])[];

const LEXER_CLASSES = new Map<string, CodeRanges>([
	['d', [[0x30, 0x39]]],
	[
		's',
		[
			[0x09, 0x0d],
			[0x20, 0x20]
		]
	],
	[
		'w',
		[
			[0x30, 0x39],
			[0x41, 0x5a],
			[0x5f, 0x5f],
			[0x61, 0x7a]
		]
	]
]);
const LINE_FEED: CodeRanges = [[0x0a, 0x0a]];
const LAST_CODE_POINT = 0x10ffff;
const PLAIN = /^[0-9A-Za-z_]$/;

function codePoint(at: number): string {
	const char = String.fromCodePoint(at);
	if (PLAIN.test(char)) return char;
	const hex = at.toString(16).toUpperCase();
	return at <= 0xff ? `\\x${hex.padStart(2, '0')}` : `\\u{${hex}}`;
}

function spelled(ranges: CodeRanges): string {
	return ranges.map(([lo, hi]) => (lo === hi ? codePoint(lo) : `${codePoint(lo)}-${codePoint(hi)}`)).join('');
}

function complement(ranges: CodeRanges): CodeRanges {
	const out: [number, number][] = [];
	let next = 0;
	for (const [lo, hi] of ranges) {
		if (lo > next) out.push([next, lo - 1]);
		next = hi + 1;
	}
	if (next <= LAST_CODE_POINT) out.push([next, LAST_CODE_POINT]);
	return out;
}

function lexerClass(escape: string): { readonly ranges: CodeRanges; readonly negated: boolean } | undefined {
	const letter = escape.slice(1);
	const ranges = LEXER_CLASSES.get(letter.toLowerCase());
	return ranges === undefined ? undefined : { ranges, negated: letter !== letter.toLowerCase() };
}

const SYNTAX_ESCAPES = '^$\\.*+?()[]{}|/';
const CLASS_SYNTAX_ESCAPES = `${SYNTAX_ESCAPES}-`;
const PUNCTUATION = /^[\x20-\x2f\x3a-\x40\x5b-\x60\x7b-\x7e]$/;

function escapedAsItself(escape: string, syntax: string): string {
	const escaped = escape.slice(1);
	return escape.length === 2 && PUNCTUATION.test(escaped) && !syntax.includes(escaped) ? escaped : escape;
}

function classWithLexerClasses(text: string): string {
	let out = '';
	for (let at = 0; at < text.length; at++) {
		if (text[at] !== '\\') {
			out += text[at];
			continue;
		}
		const escape = text.slice(at, at + 2);
		at += 1;
		const lexer = lexerClass(escape);
		out += lexer === undefined ? escapedAsItself(escape, CLASS_SYNTAX_ESCAPES) : spelled(lexer.negated ? complement(lexer.ranges) : lexer.ranges);
	}
	return out;
}

export function asLexed(source: string): string {
	let out = '';
	for (const piece of pieces(source)) {
		const lexer = piece.kind === 'escape' ? lexerClass(piece.text) : undefined;
		if (piece.kind === 'class') out += classWithLexerClasses(piece.text);
		else if (lexer !== undefined) out += `[${lexer.negated ? '^' : ''}${spelled(lexer.ranges)}]`;
		else if (piece.kind === 'char' && piece.text === '.') out += `[^${spelled(LINE_FEED)}]`;
		else if (piece.kind === 'escape') out += escapedAsItself(piece.text, SYNTAX_ESCAPES);
		else out += piece.text;
	}
	return out;
}
