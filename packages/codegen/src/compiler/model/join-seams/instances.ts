import type { GrammarRule } from '../../../grammar-shapes/grammar-json.ts';
import { type ConcreteSighting, hasBit, NO_ENTRY, type SeamClosure } from './closure.ts';
import { contentOf, type GrammarView, type Token, unwrap } from './grammar-view.ts';
import { ENTRY, type SeamWalk } from './walk.ts';

const INF = 1e9;
const MAX_TOKENS = 4000;
const MAX_DEPTH = 400;
const FIXPOINT_ROUNDS = 200;
const MAX_ALTERNATIVE_CONTEXTS = 4;
const SCANNED_CALLERS = 12;

export interface Context {
	readonly prefix: readonly Token[];
	readonly suffix: readonly GrammarRule[];
}

export interface Instance {
	readonly tokens: readonly Token[];
	readonly seamAt: number;
}

export type BuildFailure =
	| 'no context'
	| 'no entry context'
	| 'witness too long'
	| 'no continuation starting with the next token'
	| 'no suffix yield';

export class InstanceBuilder {
	private readonly depth = new Map<number, number>();
	private readonly parent = new Map<number, number>();
	private readonly contexts = new Map<number, Context | null>();
	private readonly entryContexts = new Map<string, Context | null>();
	private readonly lengths = new Map<string, number>();
	private readonly firstTables = new Map<string, Map<string, number>>();

	constructor(
		readonly view: GrammarView,
		readonly walk: SeamWalk,
		readonly closure: SeamClosure
	) {
		const callees = new Map<number, number[]>();
		for (const [callee, byCaller] of walk.calls) {
			for (const caller of byCaller.keys()) {
				const list = callees.get(caller);
				if (list === undefined) callees.set(caller, [callee]);
				else list.push(callee);
			}
		}
		this.depth.set(walk.rootScope, 0);
		for (let frontier = [walk.rootScope]; frontier.length > 0; ) {
			const next: number[] = [];
			for (const scope of frontier) {
				for (const callee of callees.get(scope) ?? []) {
					if (this.depth.has(callee)) continue;
					this.depth.set(callee, this.depth.get(scope)! + 1);
					this.parent.set(callee, scope);
					next.push(callee);
				}
			}
			frontier = next;
		}
		this.solveLengths();
	}

	private flatten(witness: number, out: Token[]): boolean {
		return this.walk.witnesses.flatten(witness, out, MAX_TOKENS);
	}

	context(scope: number): Context | null {
		if (scope === this.walk.rootScope) return { prefix: [], suffix: [] };
		const known = this.contexts.get(scope);
		if (known !== undefined) return known;
		const chain: number[] = [];
		for (
			let at: number | undefined = scope;
			at !== undefined && at !== this.walk.rootScope && !this.contexts.has(at);
			at = this.parent.get(at)
		)
			chain.push(at);
		for (let k = chain.length - 1; k >= 0; k--) {
			const at = chain[k]!;
			const caller = this.parent.get(at);
			const above = caller === undefined ? null : this.context(caller);
			let value: Context | null = null;
			if (caller !== undefined && above !== null) {
				const call = this.walk.calls.get(at)!.get(caller)!;
				const prefix = [...above.prefix];
				if (this.flatten(call.cur, prefix))
					value = { prefix, suffix: [...this.walk.conts.nodesOf(call.cont), ...above.suffix] };
			}
			this.contexts.set(at, value);
		}
		return this.contexts.get(scope) ?? null;
	}

	entryContext(scope: number, state: number): Context | null {
		const key = `${scope}#${state}`;
		const known = this.entryContexts.get(key);
		if (known !== undefined) return known;
		let best: Context | null = null;
		const seen = new Set<number>([scope]);
		for (
			let frontier: { scope: number; conts: GrammarRule[] }[] = [{ scope, conts: [] }];
			frontier.length > 0 && best === null;
		) {
			const next: { scope: number; conts: GrammarRule[] }[] = [];
			for (const item of frontier) {
				if (item.scope === this.walk.rootScope) {
					if (state === 1) best = shorter(best, { prefix: [], suffix: item.conts });
					continue;
				}
				for (const [caller, call] of this.walk.calls.get(item.scope) ?? []) {
					const conts = [...item.conts, ...this.walk.conts.nodesOf(call.cont)];
					const lead = this.closure.contextLead(call.lex, state);
					if (lead !== undefined) {
						const above = this.context(caller);
						if (above === null) continue;
						const prefix = [...above.prefix];
						if (this.flatten(lead.witness(), prefix))
							best = shorter(best, { prefix, suffix: [...conts, ...above.suffix] });
						continue;
					}
					const inherited = this.closure.entryLex(caller);
					if (!call.lex.has(ENTRY) || inherited === undefined || !hasBit(inherited, state) || seen.has(caller))
						continue;
					seen.add(caller);
					next.push({ scope: caller, conts });
				}
			}
			frontier = next;
		}
		this.entryContexts.set(key, best);
		return best;
	}

	alternativeContexts(sighting: ConcreteSighting): Context[] {
		const out: Context[] = [];
		const callers = [...(this.walk.calls.get(sighting.scope) ?? new Map())].slice(0, SCANNED_CALLERS);
		for (const [caller, call] of callers) {
			if (!this.depth.has(caller)) continue;
			const lead =
				sighting.entry === NO_ENTRY ? { witness: () => call.cur } : this.closure.contextLead(call.lex, sighting.entry);
			if (lead === undefined) continue;
			const above = this.context(caller);
			if (above === null) continue;
			const prefix = [...above.prefix];
			if (this.flatten(lead.witness(), prefix))
				out.push({ prefix, suffix: [...this.walk.conts.nodesOf(call.cont), ...above.suffix] });
			if (out.length >= MAX_ALTERNATIVE_CONTEXTS) break;
		}
		return out;
	}

	build(sighting: ConcreteSighting, node: GrammarRule, next: string, override?: Context): Instance | BuildFailure {
		const context =
			override ??
			(sighting.entry !== NO_ENTRY ? this.entryContext(sighting.scope, sighting.entry) : this.context(sighting.scope));
		if (context === null) return sighting.entry !== NO_ENTRY ? 'no entry context' : 'no context';
		const tokens = [...context.prefix];
		if (!this.flatten(sighting.witness(), tokens)) return 'witness too long';
		const rest = [...this.walk.conts.nodesOf(sighting.cont), ...context.suffix];
		const head = this.firstIs(node, next);
		if (head === null) return 'no continuation starting with the next token';
		const tail: Token[] = [];
		if (!rest.every((member) => this.yieldOf(member, tail))) return 'no suffix yield';
		return { tokens: [...tokens, ...head, ...tail], seamAt: tokens.length };
	}

	private leafCost(rule: GrammarRule, text: string): number {
		return rule.type === 'STRING' ? this.view.literalCost(text) : 1;
	}

	private tokenLength(rule: GrammarRule): number {
		return this.view.tokenText(rule) === null ? INF : 1;
	}

	private nodeLength(rule: GrammarRule): number {
		const { view } = this;
		switch (rule.type) {
			case 'STRING':
				return rule.value === '' ? 0 : view.literalCost(rule.value);
			case 'PATTERN':
			case 'TOKEN':
			case 'IMMEDIATE_TOKEN':
				return this.tokenLength(rule);
			case 'BLANK':
			case 'EOF':
			case 'REPEAT':
				return 0;
			case 'SEQ': {
				let sum = 0;
				for (const member of rule.members) {
					sum += this.nodeLength(member);
					if (sum >= INF) return INF;
				}
				return sum;
			}
			case 'CHOICE':
				return Math.min(...rule.members.map((member) => this.nodeLength(member)));
			case 'SYMBOL': {
				if (view.externals.has(rule.name))
					return view.externalTokens.roles.has(rule.name) || view.tokenText(rule) !== null ? 1 : INF;
				if (view.isLexical(rule.name))
					return view.rules[rule.name] === undefined ? INF : this.tokenLength(view.rules[rule.name]!);
				return this.lengths.get(rule.name) ?? INF;
			}
			case 'ALIAS':
				return !rule.named && (rule.content.type !== 'SYMBOL' || view.isLexical(rule.content.name))
					? 1
					: this.nodeLength(rule.content);
			default:
				return this.nodeLength(rule.content);
		}
	}

	private solveLengths(): void {
		const { view } = this;
		for (let round = 0; round < FIXPOINT_ROUNDS; round++) {
			let changed = false;
			for (const [name, rule] of Object.entries(view.rules)) {
				if (view.isLexical(name)) continue;
				const length = this.nodeLength(rule);
				if (length < (this.lengths.get(name) ?? INF)) {
					this.lengths.set(name, length);
					changed = true;
				}
			}
			if (!changed) break;
		}
	}

	leafToken(rule: GrammarRule): Token | null {
		const { view } = this;
		if (rule.type === 'ALIAS') {
			const inner = this.leafToken(rule.content);
			if (inner === null) return rule.named ? null : token(rule.value, false, null, true);
			return !rule.named && inner.text === null ? { ...inner, text: rule.value } : inner;
		}
		if (rule.type === 'SYMBOL') {
			const role = view.externalTokens.roles.get(rule.name) ?? null;
			if (view.externals.has(rule.name)) {
				if (role !== null) return token(role === 'newline' ? '\n' : '', false, role, false);
				const text = view.tokenText(rule);
				return text === null ? null : token(text, false, null, false);
			}
			const body = view.rules[rule.name] ?? rule;
			const text = view.tokenText(body);
			return text === null ? null : token(text, unwrap(body).type === 'IMMEDIATE_TOKEN', null, false);
		}
		const text = view.tokenText(rule);
		return text === null ? null : token(text, rule.type === 'IMMEDIATE_TOKEN', null, rule.type === 'STRING');
	}

	yieldOf(rule: GrammarRule, out: Token[], depth = 0): boolean {
		if (depth > MAX_DEPTH) return false;
		if (this.view.isLeaf(rule)) {
			if (rule.type === 'STRING' && rule.value === '') return true;
			const leaf = this.leafToken(rule);
			if (leaf === null) return false;
			out.push(leaf);
			return true;
		}
		switch (rule.type) {
			case 'BLANK':
			case 'EOF':
			case 'REPEAT':
				return true;
			case 'SEQ':
				return rule.members.every((member) => this.yieldOf(member, out, depth + 1));
			case 'CHOICE': {
				let best: GrammarRule | null = null;
				let bestLength = INF;
				for (const member of rule.members) {
					const length = this.nodeLength(member);
					if (length < bestLength) {
						bestLength = length;
						best = member;
					}
				}
				return best !== null && this.yieldOf(best, out, depth + 1);
			}
			case 'REPEAT1':
				return this.yieldOf(rule.content, out, depth + 1);
			case 'SYMBOL': {
				const body = this.view.rules[rule.name];
				return body !== undefined && (this.lengths.get(rule.name) ?? INF) < INF && this.yieldOf(body, out, depth + 1);
			}
			default:
				return contentOf(rule) !== undefined && this.yieldOf(contentOf(rule)!, out, depth + 1);
		}
	}

	private leafFirst(rule: GrammarRule, next: string): Token | null {
		const leaf = this.leafToken(rule);
		if (leaf === null) return null;
		if (leaf.text === next) return leaf;
		if (rule.type !== 'STRING' && this.view.accepts(rule, next)) return { ...leaf, text: next };
		return null;
	}

	private firstLength(rule: GrammarRule, next: string, table: Map<string, number>): number {
		if (this.view.isLeaf(rule)) return this.leafFirst(rule, next) === null ? INF : this.leafCost(rule, next);
		switch (rule.type) {
			case 'BLANK':
			case 'EOF':
				return INF;
			case 'SEQ': {
				let best = INF;
				let before = 0;
				for (let k = 0; k < rule.members.length; k++) {
					const first = this.firstLength(rule.members[k]!, next, table);
					if (first < INF) {
						let rest = 0;
						for (let j = k + 1; j < rule.members.length; j++) rest += this.nodeLength(rule.members[j]!);
						best = Math.min(best, before + first + rest);
					}
					const length = this.nodeLength(rule.members[k]!);
					if (length !== 0) break;
					before += length;
				}
				return best;
			}
			case 'CHOICE':
				return Math.min(...rule.members.map((member) => this.firstLength(member, next, table)));
			case 'REPEAT':
			case 'REPEAT1':
				return this.firstLength(rule.content, next, table);
			case 'SYMBOL':
				return this.view.rules[rule.name] === undefined ? INF : (table.get(rule.name) ?? INF);
			default:
				return contentOf(rule) === undefined ? INF : this.firstLength(contentOf(rule)!, next, table);
		}
	}

	private firstTable(next: string): Map<string, number> {
		let table = this.firstTables.get(next);
		if (table !== undefined) return table;
		table = new Map();
		const { view } = this;
		for (let round = 0; round < FIXPOINT_ROUNDS; round++) {
			let changed = false;
			for (const [name, rule] of Object.entries(view.rules)) {
				if (view.isLexical(name)) continue;
				const length = this.firstLength(rule, next, table);
				if (length < (table.get(name) ?? INF)) {
					table.set(name, length);
					changed = true;
				}
			}
			if (!changed) break;
		}
		this.firstTables.set(next, table);
		return table;
	}

	firstIs(rule: GrammarRule, next: string): Token[] | null {
		const table = this.firstTable(next);
		const out: Token[] = [];
		const go = (at: GrammarRule, depth: number): boolean => {
			if (depth > MAX_DEPTH) return false;
			if (this.view.isLeaf(at)) {
				const leaf = this.leafFirst(at, next);
				if (leaf === null) return false;
				out.push(leaf);
				return true;
			}
			switch (at.type) {
				case 'SEQ': {
					let bestK = -1;
					let best = INF;
					let before = 0;
					for (let k = 0; k < at.members.length; k++) {
						const first = this.firstLength(at.members[k]!, next, table);
						if (first < INF) {
							let rest = 0;
							for (let j = k + 1; j < at.members.length; j++) rest += this.nodeLength(at.members[j]!);
							if (before + first + rest < best) {
								best = before + first + rest;
								bestK = k;
							}
						}
						const length = this.nodeLength(at.members[k]!);
						if (length !== 0) break;
						before += length;
					}
					if (bestK < 0) return false;
					for (let k = 0; k < bestK; k++) if (!this.yieldOf(at.members[k]!, out)) return false;
					if (!go(at.members[bestK]!, depth + 1)) return false;
					for (let k = bestK + 1; k < at.members.length; k++) if (!this.yieldOf(at.members[k]!, out)) return false;
					return true;
				}
				case 'CHOICE': {
					let best: GrammarRule | null = null;
					let bestLength = INF;
					for (const member of at.members) {
						const length = this.firstLength(member, next, table);
						if (length < bestLength) {
							bestLength = length;
							best = member;
						}
					}
					return best !== null && go(best, depth + 1);
				}
				case 'REPEAT':
				case 'REPEAT1':
					return go(at.content, depth + 1);
				case 'SYMBOL': {
					const body = this.view.rules[at.name];
					return body !== undefined && (table.get(at.name) ?? INF) < INF && go(body, depth + 1);
				}
				case 'BLANK':
				case 'EOF':
					return false;
				default:
					return contentOf(at) !== undefined && go(contentOf(at)!, depth + 1);
			}
		};
		return go(rule, 0) ? out : null;
	}

	firstLeaves(rule: GrammarRule): GrammarRule[] {
		const out: GrammarRule[] = [];
		const seen = new Set<string>();
		const go = (at: GrammarRule): boolean => {
			if (this.view.isLeaf(at)) {
				if (at.type !== 'STRING') out.push(at);
				return at.type === 'STRING' && at.value === '';
			}
			switch (at.type) {
				case 'BLANK':
					return true;
				case 'EOF':
					return false;
				case 'REPEAT':
					go(at.content);
					return true;
				case 'SEQ':
					for (const member of at.members) if (!go(member)) return false;
					return true;
				case 'CHOICE': {
					let nullable = false;
					for (const member of at.members) nullable = go(member) || nullable;
					return nullable;
				}
				case 'REPEAT1':
					return go(at.content);
				case 'SYMBOL': {
					const body = this.view.rules[at.name];
					if (seen.has(at.name) || body === undefined) return (this.lengths.get(at.name) ?? INF) === 0;
					seen.add(at.name);
					return go(body);
				}
				default:
					return contentOf(at) !== undefined && go(contentOf(at)!);
			}
		};
		go(rule);
		return out;
	}
}

export function render(tokens: readonly Token[], seamAt: number, gap: string): { text: string; seam: number } | null {
	let text = '';
	let depth = 0;
	let lineStart = true;
	let seam = -1;
	for (let k = 0; k < tokens.length; k++) {
		const token = tokens[k]!;
		if (token.role === 'indent' || token.role === 'dedent' || token.role === 'newline') {
			if (token.role === 'indent') depth++;
			if (token.role === 'dedent') depth = Math.max(0, depth - 1);
			if (token.role === 'newline' || !lineStart) {
				text += '\n';
				lineStart = true;
			}
			if (k === seamAt) return null;
			continue;
		}
		let separator = lineStart ? '    '.repeat(depth) : token.immediate || token.text === '' ? '' : ' ';
		if (k === seamAt) {
			if (lineStart || token.immediate) return null;
			seam = text.length;
			separator = gap;
		}
		text += separator + token.text;
		lineStart = false;
	}
	return seam < 0 ? null : { text, seam };
}

function token(text: string, immediate: boolean, role: Token['role'], literal: boolean): Token {
	return { symbol: -1, text, immediate, role, literal, spellings: [] };
}

function shorter(a: Context | null, b: Context): Context {
	return a === null || b.prefix.length + b.suffix.length < a.prefix.length + a.suffix.length ? b : a;
}
