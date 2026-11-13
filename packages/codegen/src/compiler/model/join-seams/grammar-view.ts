import type { GrammarJson, GrammarRule } from '../../../grammar-shapes/grammar-json.ts';
import type { ExternalRole } from '../../../types/ir.ts';
import type { Rule } from '../../../types/rule.ts';
import { matchesWordShape, ruleToRegexSource, wordCharClass } from '../../../util/word-matcher.ts';
import {
	type CharSet,
	dfaAccepts,
	longestAcceptedPrefix,
	patternDfa,
	shortestPrintableAccepted,
	type PatternDfa
} from '../pattern-automaton.ts';
import type { ParserTables } from './parser-tables.ts';

export type ViewRule = GrammarRule | Rule<'evaluate'>;

export interface ExternalTokens {
	readonly roles: ReadonlyMap<string, ExternalRole['role']>;
	readonly bodies: ReadonlyMap<string, ViewRule>;
}

export interface Token {
	readonly symbol: number;
	readonly text: string | null;
	readonly immediate: boolean;
	readonly role: ExternalRole['role'] | null;
	readonly literal: boolean;
	readonly spellings: readonly string[];
}

export const PROHIBITIVE = 1e6;
export const KEYWORD_COST = 2;

const WRAPPERS = new Set<GrammarRule['type']>([
	'PREC',
	'PREC_LEFT',
	'PREC_RIGHT',
	'PREC_DYNAMIC',
	'FIELD',
	'ALIAS',
	'RESERVED'
]);
const LEXICAL = new Set<GrammarRule['type']>(['TOKEN', 'IMMEDIATE_TOKEN', 'PATTERN', 'STRING']);
const MAX_TEXT_DEPTH = 60;
const MAX_SPELLINGS = 8;

export function unwrap(rule: GrammarRule): GrammarRule {
	let at = rule;
	while (WRAPPERS.has(at.type)) at = (at as { readonly content: GrammarRule }).content;
	return at;
}

export function contentOf(rule: GrammarRule): GrammarRule | undefined {
	return 'content' in rule ? rule.content : undefined;
}

function symbolsIn(rule: GrammarRule, out: Set<string>): void {
	const stack = [rule];
	while (stack.length > 0) {
		const at = stack.pop()!;
		if (at.type === 'SYMBOL') out.add(at.name);
		else if (at.type === 'SEQ' || at.type === 'CHOICE') stack.push(...at.members);
		else if ('content' in at) stack.push(at.content);
	}
}

export class GrammarView {
	readonly rules: Readonly<Record<string, GrammarRule>>;
	readonly startRule: string;
	readonly inline: ReadonlySet<string>;
	readonly conflicted: ReadonlySet<string>;
	readonly externals: ReadonlySet<string>;
	readonly extrasOnly: ReadonlySet<string>;
	readonly keyOf = new Map<GrammarRule, string>();
	readonly ownerOf = new Map<GrammarRule, string>();
	readonly isWordChar: (char: string) => boolean;
	private readonly auxTokensByOwner = new Map<string, number[]>();
	private readonly auxRepeatsByOwner = new Map<string, number[]>();
	private readonly auxRepeatsAll: number[] = [];
	private readonly literalIdsCache = new Map<string, readonly number[]>();
	private readonly punctCache = new Map<string, boolean>();
	private readonly namedIdsCache = new Map<string, readonly number[]>();
	private readonly lexicalCache = new Map<string, boolean>();
	private readonly textCache = new Map<ViewRule, string | null>();
	private readonly spellingsCache = new Map<ViewRule, readonly string[]>();
	private readonly dfaCache = new Map<GrammarRule, PatternDfa | null>();
	private readonly symbolReferences = new Map<number, GrammarRule>();
	private readonly firstCache = new Map<GrammarRule, readonly string[]>();
	private readonly ruleFirst = new Map<string, Set<string>>();
	private readonly ruleNullable = new Set<string>();
	private readonly ruleLast = new Map<string, Set<string>>();
	private lastSolved = false;

	constructor(
		grammar: GrammarJson,
		readonly tables: ParserTables,
		readonly externalTokens: ExternalTokens,
		readonly wordMatcher: RegExp | undefined,
		readonly whitespace: CharSet,
		readonly endsLine: (kind: string) => boolean
	) {
		this.rules = grammar.rules;
		this.startRule = Object.keys(grammar.rules)[0]!;
		this.inline = new Set(grammar.inline ?? []);
		this.conflicted = new Set((grammar.conflicts ?? []).flat());
		this.externals = new Set((grammar.externals ?? []).flatMap((rule) => (rule.type === 'SYMBOL' ? [rule.name] : [])));
		this.isWordChar = wordCharClass(wordMatcher);
		for (const [name, rule] of Object.entries(grammar.rules)) this.index(rule, name, 'root');
		const fromStart = this.reachable([this.startRule]);
		const extraRoots = (grammar.extras ?? []).flatMap((rule) => (rule.type === 'SYMBOL' ? [rule.name] : []));
		this.extrasOnly = new Set([...this.reachable(extraRoots)].filter((name) => !fromStart.has(name)));
		for (let id = 0; id < tables.symbolCount; id++) {
			const name = tables.names[id]!;
			const token = /^(.*)_token\d+$/.exec(name);
			if (token !== null) this.push(this.auxTokensByOwner, token[1]!, id);
			const repeat = /^(.*)_repeat\d+$/.exec(name);
			if (repeat !== null && tables.visible[id] === 0) {
				this.push(this.auxRepeatsByOwner, repeat[1]!, id);
				this.auxRepeatsAll.push(id);
			}
		}
		this.solveFirst();
	}

	private push(map: Map<string, number[]>, key: string, id: number): void {
		const list = map.get(key);
		if (list === undefined) map.set(key, [id]);
		else list.push(id);
	}

	private index(rule: GrammarRule, owner: string, path: string): void {
		this.keyOf.set(rule, `${owner}:${path}`);
		this.ownerOf.set(rule, owner);
		const sub = (segment: string): string => (path === 'root' ? segment : `${path}/${segment}`);
		if (rule.type === 'SEQ' || rule.type === 'CHOICE')
			rule.members.forEach((member, k) => this.index(member, owner, sub(`members.${k}`)));
		else if (rule.type === 'REPEAT' || rule.type === 'REPEAT1') this.index(rule.content, owner, sub('content'));
		else if ('content' in rule) this.index(rule.content, owner, path);
	}

	private reachable(roots: readonly string[]): Set<string> {
		const seen = new Set<string>(roots);
		const stack = [...roots];
		while (stack.length > 0) {
			const rule = this.rules[stack.pop()!];
			if (rule === undefined) continue;
			const found = new Set<string>();
			symbolsIn(rule, found);
			for (const name of found) {
				if (seen.has(name) || this.rules[name] === undefined) continue;
				seen.add(name);
				stack.push(name);
			}
		}
		return seen;
	}

	isPunct(text: string): boolean {
		let punct = this.punctCache.get(text);
		if (punct === undefined) {
			punct = text.length > 0;
			for (const char of text) if (this.isWordChar(char) || this.whitespace.has(char.codePointAt(0)!)) punct = false;
			this.punctCache.set(text, punct);
		}
		return punct;
	}

	isKeyword(text: string): boolean {
		return matchesWordShape(text, this.wordMatcher);
	}

	tokenCost(token: Token): number {
		if (token.text === null) return PROHIBITIVE;
		return token.literal && this.isKeyword(token.text) ? KEYWORD_COST : 1;
	}

	literalCost(text: string): number {
		return this.isKeyword(text) ? KEYWORD_COST : 1;
	}

	literalIds(text: string): readonly number[] {
		let ids = this.literalIdsCache.get(text);
		if (ids === undefined) {
			const { tables } = this;
			const candidates = (tables.idsByName.get(text) ?? []).filter((id) => tables.named[id] === 0);
			const moving = candidates.filter((id) => tables.moves[id] === 1);
			ids = moving.length > 0 ? moving : candidates.slice(0, 1);
			this.literalIdsCache.set(text, ids);
		}
		return ids;
	}

	namedIds(name: string): readonly number[] {
		let ids = this.namedIdsCache.get(name);
		if (ids === undefined) {
			const { tables } = this;
			ids = (tables.idsByName.get(name) ?? []).filter(
				(id) => (tables.named[id] === 1 || tables.visible[id] === 0) && tables.moves[id] === 1
			);
			this.namedIdsCache.set(name, ids);
		}
		return ids;
	}

	isLexical(name: string): boolean {
		let lexical = this.lexicalCache.get(name);
		if (lexical === undefined) {
			const symbols = this.namedIds(name);
			const rule = this.rules[name];
			lexical = this.externals.has(name)
				? true
				: symbols.length > 0
					? symbols.some((id) => this.tables.isTerminal(id))
					: rule === undefined || LEXICAL.has(unwrap(rule).type);
			this.lexicalCache.set(name, lexical);
		}
		return lexical;
	}

	isLeaf(rule: GrammarRule): boolean {
		const at = rule.type === 'ALIAS' ? rule.content : rule;
		return LEXICAL.has(at.type) || (at.type === 'SYMBOL' && this.isLexical(at.name));
	}

	spliced(name: string): boolean {
		return this.inline.has(name) || (!this.isLexical(name) && this.namedIds(name).length === 0);
	}

	auxTokens(owner: string): readonly number[] {
		return this.auxTokensByOwner.get(owner) ?? [];
	}

	auxRepeats(owner: string): readonly number[] {
		return this.auxRepeatsByOwner.get(owner) ?? this.auxRepeatsAll;
	}

	bodyOf(name: string): ViewRule | undefined {
		return this.externals.has(name) ? this.externalTokens.bodies.get(name) : this.rules[name];
	}

	tokenText(rule: ViewRule, depth = 0): string | null {
		const cached = this.textCache.get(rule);
		if (cached !== undefined) return cached;
		if (depth > MAX_TEXT_DEPTH) return null;
		let text: string | null;
		switch (rule.type) {
			case 'STRING':
				text = rule.value;
				break;
			case 'PATTERN':
				text = this.sample(rule) ?? null;
				break;
			case 'BLANK':
			case 'EOF':
			case 'REPEAT':
				text = '';
				break;
			case 'SEQ': {
				const parts = rule.members.map((member) => this.tokenText(member, depth + 1));
				text = parts.includes(null) ? null : parts.join('');
				break;
			}
			case 'CHOICE': {
				const parts = rule.members
					.map((member) => this.tokenText(member, depth + 1))
					.filter((part): part is string => part !== null);
				text = parts.length === 0 ? null : parts.reduce((a, b) => (b.length < a.length ? b : a));
				break;
			}
			case 'SYMBOL': {
				const role = this.externalTokens.roles.get(rule.name);
				const body = this.bodyOf(rule.name);
				text =
					role === 'newline'
						? '\n'
						: role !== undefined
							? ''
							: body === undefined
								? null
								: this.tokenText(body, depth + 1);
				break;
			}
			default:
				text = 'content' in rule ? this.tokenText(rule.content, depth + 1) : null;
		}
		this.textCache.set(rule, text);
		return text;
	}

	spellings(rule: ViewRule, depth = 0): readonly string[] {
		const cached = this.spellingsCache.get(rule);
		if (cached !== undefined) return cached;
		if (depth > MAX_TEXT_DEPTH) return [];
		let out: readonly string[];
		switch (rule.type) {
			case 'STRING':
				out = [rule.value];
				break;
			case 'PATTERN': {
				const sample = this.sample(rule);
				out = sample === undefined ? [] : [sample];
				break;
			}
			case 'BLANK':
			case 'EOF':
			case 'REPEAT':
				out = [''];
				break;
			case 'SEQ': {
				let joined: string[] = [''];
				for (const member of rule.members) {
					const parts = this.spellings(member, depth + 1);
					joined = joined.flatMap((a) => parts.map((b) => a + b)).slice(0, MAX_SPELLINGS);
					if (joined.length === 0) break;
				}
				out = joined;
				break;
			}
			case 'CHOICE':
				out = [...new Set(rule.members.flatMap((member) => this.spellings(member, depth + 1)))].slice(0, MAX_SPELLINGS);
				break;
			case 'SYMBOL': {
				const body = this.bodyOf(rule.name);
				out = body === undefined ? [] : this.spellings(body, depth + 1);
				break;
			}
			default:
				out = 'content' in rule ? this.spellings(rule.content, depth + 1) : [];
		}
		this.spellingsCache.set(rule, out);
		return out;
	}

	leafDfa(rule: GrammarRule): PatternDfa | undefined {
		const cached = this.dfaCache.get(rule);
		if (cached !== undefined) return cached ?? undefined;
		const body = rule.type === 'SYMBOL' ? this.bodyOf(rule.name) : rule.type === 'ALIAS' ? rule.content : rule;
		const resolved = body?.type === 'SYMBOL' ? this.bodyOf(body.name) : body;
		const source = resolved === undefined ? null : ruleToRegexSource(resolved);
		const dfa = source === null ? undefined : patternDfa(source);
		this.dfaCache.set(rule, dfa ?? null);
		return dfa;
	}

	symbolDfa(symbol: number): PatternDfa | undefined {
		let reference = this.symbolReferences.get(symbol);
		if (reference === undefined)
			this.symbolReferences.set(symbol, (reference = { type: 'SYMBOL', name: this.tables.names[symbol]! }));
		return this.leafDfa(reference);
	}

	accepts(rule: GrammarRule, text: string): boolean {
		const dfa = this.leafDfa(rule);
		return dfa !== undefined && dfaAccepts(dfa, text);
	}

	lexesLonger(symbol: number, joined: string, shorter: number): boolean {
		const dfa = this.symbolDfa(symbol);
		return dfa !== undefined && longestAcceptedPrefix(dfa, joined) > shorter;
	}

	sampleStartingWith(rule: GrammarRule, prefix: string): string | undefined {
		const dfa = this.leafDfa(rule);
		return dfa === undefined ? undefined : shortestPrintableAccepted(dfa, prefix);
	}

	private sample(rule: GrammarRule & { readonly type: 'PATTERN' }): string | undefined {
		const dfa = patternDfa(rule.value);
		return dfa === undefined ? undefined : shortestPrintableAccepted(dfa);
	}

	firstLiterals(rule: GrammarRule): readonly string[] {
		let out = this.firstCache.get(rule);
		if (out === undefined) {
			const found = new Set<string>();
			this.firstInto(rule, found);
			out = [...found];
			this.firstCache.set(rule, out);
		}
		return out;
	}

	private solveFirst(): void {
		for (let changed = true; changed; ) {
			changed = false;
			for (const [name, rule] of Object.entries(this.rules)) {
				if (this.isLexical(name)) continue;
				let first = this.ruleFirst.get(name);
				if (first === undefined) this.ruleFirst.set(name, (first = new Set()));
				const before = first.size;
				const nullable = this.firstInto(rule, first);
				if (first.size !== before) changed = true;
				if (nullable && !this.ruleNullable.has(name)) {
					this.ruleNullable.add(name);
					changed = true;
				}
			}
		}
	}

	private firstInto(rule: GrammarRule, out: Set<string>): boolean {
		switch (rule.type) {
			case 'STRING':
				out.add(rule.value);
				return rule.value === '';
			case 'BLANK':
				return true;
			case 'EOF':
				return false;
			case 'PATTERN':
			case 'TOKEN':
			case 'IMMEDIATE_TOKEN': {
				const inner = rule.type === 'PATTERN' ? rule : unwrap(rule.content);
				if (inner.type === 'STRING') out.add(inner.value);
				return false;
			}
			case 'SYMBOL': {
				if (this.isLexical(rule.name)) {
					const body = this.rules[rule.name];
					const inner = body === undefined ? undefined : unwrap(body);
					if (inner?.type === 'STRING') out.add(inner.value);
					return false;
				}
				for (const token of this.ruleFirst.get(rule.name) ?? []) out.add(token);
				return this.ruleNullable.has(rule.name);
			}
			case 'SEQ':
				for (const member of rule.members) if (!this.firstInto(member, out)) return false;
				return true;
			case 'CHOICE': {
				let nullable = false;
				for (const member of rule.members) nullable = this.firstInto(member, out) || nullable;
				return nullable;
			}
			case 'REPEAT':
				this.firstInto(rule.content, out);
				return true;
			default:
				return this.firstInto(rule.content, out);
		}
	}

	lastLiterals(rule: GrammarRule): readonly string[] {
		if (!this.lastSolved) this.solveLast();
		const found = new Set<string>();
		this.lastInto(rule, found);
		return [...found];
	}

	private solveLast(): void {
		this.lastSolved = true;
		for (let changed = true; changed; ) {
			changed = false;
			for (const [name, rule] of Object.entries(this.rules)) {
				if (this.isLexical(name)) continue;
				let last = this.ruleLast.get(name);
				if (last === undefined) this.ruleLast.set(name, (last = new Set()));
				const before = last.size;
				this.lastInto(rule, last);
				if (last.size !== before) changed = true;
			}
		}
	}

	private lastInto(rule: GrammarRule, out: Set<string>): boolean {
		switch (rule.type) {
			case 'STRING':
				out.add(rule.value);
				return rule.value === '';
			case 'BLANK':
				return true;
			case 'EOF':
				return false;
			case 'PATTERN':
			case 'TOKEN':
			case 'IMMEDIATE_TOKEN': {
				const inner = rule.type === 'PATTERN' ? rule : unwrap(rule.content);
				if (inner.type === 'STRING') out.add(inner.value);
				return false;
			}
			case 'SYMBOL': {
				if (this.isLexical(rule.name)) {
					const body = this.rules[rule.name];
					const inner = body === undefined ? undefined : unwrap(body);
					if (inner?.type === 'STRING') out.add(inner.value);
					return false;
				}
				for (const token of this.ruleLast.get(rule.name) ?? []) out.add(token);
				return this.ruleNullable.has(rule.name);
			}
			case 'SEQ':
				for (let k = rule.members.length - 1; k >= 0; k--) if (!this.lastInto(rule.members[k]!, out)) return false;
				return true;
			case 'CHOICE': {
				let nullable = false;
				for (const member of rule.members) nullable = this.lastInto(member, out) || nullable;
				return nullable;
			}
			case 'REPEAT':
				this.lastInto(rule.content, out);
				return true;
			default:
				return this.lastInto(rule.content, out);
		}
	}
}
