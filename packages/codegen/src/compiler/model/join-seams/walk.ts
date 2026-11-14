import type { GrammarRule } from '../../../grammar-shapes/grammar-json.ts';
import { type GrammarView, type Token, unwrap } from './grammar-view.ts';
import { NO_STATE } from './parser-tables.ts';
import { Continuations, EMPTY, NIL, NONE, Witnesses } from './witnesses.ts';

export const ENTRY = -1;
const START_STATE = 1;
const REPEAT_ROUNDS = 4;

const DISCOVER = 0;
const SOLVE = 1;
const SYMBOLIC = 2;
type Mode = typeof DISCOVER | typeof SOLVE | typeof SYMBOLIC;

export type Entries = ReadonlyMap<number, number>;

interface Position {
	readonly cur: Entries;
	readonly lex: Entries;
	readonly prev: Entries;
	readonly through: Entries;
	readonly fresh: boolean;
}

export interface Summary {
	any: number;
	nullable: boolean;
	readonly lex: Map<number, number>;
	readonly prev: Map<number, number>;
	readonly through: Map<number, number>;
}

export interface Sighting {
	readonly scope: number;
	readonly witness: number;
	readonly cont: number;
}

export interface Seam {
	node: GrammarRule;
	readonly lexed: Set<number>;
	readonly prev: Map<number, Sighting>;
	readonly entry: Map<number, Sighting>;
	readonly through: Map<number, Sighting>;
}

export interface Call {
	cur: number;
	readonly lex: Map<number, number>;
	cont: number;
}

export interface Through {
	readonly callee: number;
	readonly context: Entries;
}

interface ScopeBody {
	readonly name: string;
	readonly body: GrammarRule;
}

const NOTHING: Entries = new Map();
const OPTIMISTIC: Summary = { any: EMPTY, nullable: true, lex: new Map(), prev: new Map(), through: new Map() };

export function refSource(scope: number): number {
	return -scope - 2;
}

export function isRef(source: number): boolean {
	return source <= -2;
}

export function refScope(source: number): number {
	return -source - 2;
}

export class SeamWalk {
	readonly witnesses = new Witnesses();
	readonly conts = new Continuations();
	readonly seams = new Map<string, Seam>();
	readonly calls = new Map<number, Map<number, Call>>();
	readonly summaries = new Map<number, Summary>();
	readonly throughs: Through[] = [];
	readonly walked: number[] = [];
	readonly forkStates = new Set<number>();
	readonly joinText = new Map<number, string>();
	readonly rootScope: number;
	readonly entries: number[] = [];
	readonly stateCount: number;
	readonly symbolCount: number;
	solveWalks = 0;
	private readonly bodies: ScopeBody[] = [];
	private readonly bodyIndex = new Map<GrammarRule, number>();
	private readonly callees = new Map<number, Set<number>>();
	private readonly tokenIndex = new Map<GrammarRule, Map<string, number>>();
	private readonly throughIndex = new Map<Entries, Map<number, number>>();
	private readonly splicing = new Set<string>();
	private readonly queued = new Set<number>();
	private mode: Mode = DISCOVER;
	private current = 0;
	private pending: number[] = [];

	constructor(readonly view: GrammarView) {
		const { tables } = view;
		this.stateCount = tables.stateCount;
		this.symbolCount = tables.symbolCount;
		const statesBySymbol = new Map<number, number[]>();
		for (let state = 0; state < tables.stateCount; state++) {
			for (const id of tables.valid[state]!) {
				if (tables.isTerminal(id) || tables.next(state, id) === NO_STATE) continue;
				const list = statesBySymbol.get(id);
				if (list === undefined) statesBySymbol.set(id, [state]);
				else list.push(state);
			}
		}
		for (const name of Object.keys(view.rules)) {
			if (view.spliced(name) || view.isLexical(name)) continue;
			const states = new Set<number>(name === view.startRule ? [START_STATE] : []);
			for (const id of view.namedIds(name)) for (const state of statesBySymbol.get(id) ?? []) states.add(state);
			for (const state of states) this.entries.push(this.scopeOf(name, view.rules[name]!, state));
		}
		this.rootScope = this.scopeOf(view.startRule, view.rules[view.startRule]!, START_STATE);
	}

	pairKey(source: number, symbol: number): number {
		const code = source === ENTRY ? 0 : isRef(source) ? this.stateCount + 1 + refScope(source) : source + 1;
		return code * this.symbolCount + symbol;
	}

	sourceOfPair(key: number): number {
		const code = Math.floor(key / this.symbolCount);
		return code === 0 ? ENTRY : code <= this.stateCount ? code - 1 : refSource(code - this.stateCount - 1);
	}

	symbolOfPair(key: number): number {
		return key % this.symbolCount;
	}

	stateOfScope(scope: number): number {
		return scope % this.stateCount;
	}

	scopeName(scope: number): string {
		return `${this.bodies[Math.floor(scope / this.stateCount)]!.name}@${scope % this.stateCount}`;
	}

	run(): void {
		this.discover();
		this.solve();
		this.symbolic();
	}

	private scopeOf(name: string, body: GrammarRule, state: number): number {
		let index = this.bodyIndex.get(body);
		if (index === undefined) {
			index = this.bodies.length;
			this.bodies.push({ name, body });
			this.bodyIndex.set(body, index);
		}
		return index * this.stateCount + state;
	}

	private walkScope(scope: number): readonly Position[] {
		this.current = scope;
		const state = scope % this.stateCount;
		const { body } = this.bodies[Math.floor(scope / this.stateCount)]!;
		const lex = this.mode === SYMBOLIC ? new Map([[ENTRY, EMPTY]]) : NOTHING;
		return this.walk(
			body,
			[{ cur: new Map([[state, EMPTY]]), lex, prev: NOTHING, through: NOTHING, fresh: true }],
			NIL
		);
	}

	private discover(): void {
		this.mode = DISCOVER;
		this.pending = [...this.entries];
		for (const scope of this.entries) this.queued.add(scope);
		while (this.pending.length > 0) {
			const scope = this.pending.pop()!;
			this.callees.set(scope, new Set());
			this.summaries.set(scope, { any: NONE, nullable: false, lex: new Map(), prev: new Map(), through: new Map() });
			this.walkScope(scope);
		}
		this.queued.clear();
	}

	private solve(): void {
		this.mode = SOLVE;
		for (const component of stronglyConnected(this.callees.keys(), (scope) => this.callees.get(scope)!)) {
			const members = new Set(component);
			const callers = new Map<number, number[]>();
			let recursive = component.length > 1;
			for (const member of component) {
				for (const callee of this.callees.get(member)!) {
					if (!members.has(callee)) continue;
					if (callee === member) recursive = true;
					const list = callers.get(callee);
					if (list === undefined) callers.set(callee, [member]);
					else list.push(member);
				}
			}
			if (!recursive) {
				this.solveScope(component[0]!);
				continue;
			}
			const queue = [...component];
			const inQueue = new Set(component);
			for (let head = 0; head < queue.length; head++) {
				const scope = queue[head]!;
				inQueue.delete(scope);
				if (!this.solveScope(scope)) continue;
				for (const caller of callers.get(scope) ?? []) {
					if (inQueue.has(caller)) continue;
					inQueue.add(caller);
					queue.push(caller);
				}
			}
		}
	}

	private solveScope(scope: number): boolean {
		this.solveWalks++;
		const end = this.walkScope(scope);
		const summary = this.summaries.get(scope)!;
		const { witnesses } = this;
		let changed = false;
		for (const position of end) {
			if (position.fresh) {
				if (!summary.nullable) summary.nullable = changed = true;
				continue;
			}
			for (const witness of position.cur.values()) {
				if (witnesses.cost(witness) >= witnesses.cost(summary.any)) continue;
				summary.any = witness;
				changed = true;
			}
		}
		return changed;
	}

	private symbolic(): void {
		this.mode = SYMBOLIC;
		this.pending = [...this.entries];
		for (const scope of this.entries) this.queued.add(scope);
		while (this.pending.length > 0) {
			const scope = this.pending.pop()!;
			this.walked.push(scope);
			const end = this.walkScope(scope);
			const summary = this.summaries.get(scope)!;
			for (const position of end) {
				if (position.fresh) continue;
				for (const [source, witness] of position.lex) setMin(this.witnesses, summary.lex, source, witness);
				for (const [pair, witness] of position.prev) setMin(this.witnesses, summary.prev, pair, witness);
				for (const [through, witness] of position.through) setMin(this.witnesses, summary.through, through, witness);
			}
		}
	}

	private summaryOf(name: string, body: GrammarRule, state: number): { scope: number; summary: Summary } {
		const scope = this.scopeOf(name, body, state);
		if (this.mode === DISCOVER) {
			this.callees.get(this.current)!.add(scope);
			if (!this.queued.has(scope)) {
				this.queued.add(scope);
				this.pending.push(scope);
			}
			return { scope, summary: OPTIMISTIC };
		}
		const summary = this.summaries.get(scope);
		if (summary === undefined)
			throw new Error(`join seams: scope ${this.scopeName(scope)} was not discovered before it was solved`);
		if (this.mode === SYMBOLIC && !this.queued.has(scope)) {
			this.queued.add(scope);
			this.pending.push(scope);
		}
		return { scope, summary };
	}

	private throughKey(callee: number, context: Entries): number {
		let byCallee = this.throughIndex.get(context);
		if (byCallee === undefined) this.throughIndex.set(context, (byCallee = new Map()));
		let key = byCallee.get(callee);
		if (key === undefined) {
			key = this.throughs.length;
			this.throughs.push({ callee, context });
			byCallee.set(callee, key);
		}
		return key;
	}

	private tokenOf(symbol: number, node: GrammarRule, immediate: boolean, override?: string): number {
		let byNode = this.tokenIndex.get(node);
		if (byNode === undefined) this.tokenIndex.set(node, (byNode = new Map()));
		const key =
			override === undefined ? `${symbol}|${immediate ? 1 : 0}` : `${symbol}|${immediate ? 1 : 0}|${override}`;
		const known = byNode.get(key);
		if (known !== undefined) return known;
		const { view } = this;
		const { tables } = view;
		const literal = tables.named[symbol] === 0 && tables.visible[symbol] === 1;
		const role = node.type === 'SYMBOL' ? (view.externalTokens.roles.get(node.name) ?? null) : null;
		const text = override ?? (literal ? tables.names[symbol]! : view.tokenText(node));
		const spellings = text !== null && !literal ? view.spellings(node).filter((spelling) => spelling !== text) : [];
		const token: Token = {
			symbol,
			text,
			immediate: immediate || node.type === 'IMMEDIATE_TOKEN',
			role,
			literal,
			spellings
		};
		const index = this.witnesses.tokens.length;
		this.witnesses.tokens.push(token);
		byNode.set(key, index);
		return index;
	}

	private joinable(symbol: number, token: Token): boolean {
		const { view } = this;
		if (
			!view.tables.isTerminal(symbol) ||
			token.text === null ||
			!view.isPunct(token.text) ||
			view.endsLine(view.tables.names[symbol]!)
		)
			return false;
		this.joinText.set(symbol, token.text);
		return true;
	}

	private extend(
		map: Map<number, number>,
		key: number,
		base: number,
		item: number,
		itemCost: number,
		sub: boolean
	): void {
		if (this.mode === DISCOVER) {
			if (!map.has(key)) map.set(key, EMPTY);
			return;
		}
		const { witnesses } = this;
		const cost = witnesses.cost(base) + itemCost;
		const old = map.get(key);
		if (old !== undefined && witnesses.cost(old) <= cost) return;
		map.set(key, sub ? witnesses.withSub(base, item, cost) : witnesses.withToken(base, item, cost));
	}

	private extendSub(map: Map<number, number>, key: number, base: number, sub: number): void {
		this.extend(map, key, base, sub, this.witnesses.cost(sub), true);
	}

	private keep(map: Map<number, number>, key: number, witness: number): void {
		if (this.mode === DISCOVER) {
			if (!map.has(key)) map.set(key, EMPTY);
			return;
		}
		setMin(this.witnesses, map, key, witness);
	}

	private shift(positions: readonly Position[], symbol: number, tokenIndex: number): Position[] {
		const { witnesses, view } = this;
		const { tables } = view;
		const token = witnesses.tokens[tokenIndex]!;
		const tokenCost = view.tokenCost(token);
		const symbolic = this.mode === SYMBOLIC;
		const joinable = symbolic && this.joinable(symbol, token);
		const out: Position[] = [];
		for (const position of positions) {
			const cur = new Map<number, number>();
			for (const [state, witness] of position.cur) {
				const next = tables.next(state, symbol);
				if (next !== NO_STATE) this.extend(cur, next, witness, tokenIndex, tokenCost, false);
			}
			if (cur.size === 0) continue;
			let prev: Entries = NOTHING;
			if (joinable) {
				const pairs = new Map<number, number>();
				for (const [source, witness] of position.lex) {
					if (source < 0 || tables.isValid(source, symbol))
						this.extend(pairs, this.pairKey(source, symbol), witness, tokenIndex, tokenCost, false);
				}
				prev = pairs;
			}
			out.push({ cur, lex: symbolic ? cur : NOTHING, prev, through: NOTHING, fresh: false });
		}
		return merge(witnesses, out);
	}

	private recordCall(callee: number, cur: number, lex: Entries, cont: number): void {
		const { witnesses } = this;
		let byCaller = this.calls.get(callee);
		if (byCaller === undefined) this.calls.set(callee, (byCaller = new Map()));
		const call = byCaller.get(this.current);
		if (call === undefined) {
			byCaller.set(this.current, { cur, lex: new Map(lex), cont });
			return;
		}
		if (witnesses.cost(call.cur) > witnesses.cost(cur)) {
			call.cur = cur;
			call.cont = cont;
		}
		for (const [source, witness] of lex) setMin(witnesses, call.lex, source, witness);
	}

	private nonterminal(
		name: string,
		symbol: number,
		positions: readonly Position[],
		body: GrammarRule,
		cont: number
	): Position[] {
		const { view, witnesses } = this;
		const { tables } = view;
		const symbolic = this.mode === SYMBOLIC;
		const forks = symbolic && (view.conflicted.has(name) || view.conflicted.has(tables.names[symbol]!));
		const out: Position[] = [];
		for (const position of positions) {
			const cur = new Map<number, number>();
			const lex = symbolic ? new Map<number, number>() : undefined;
			const through = symbolic ? new Map<number, number>() : undefined;
			const nullCur = new Map<number, number>();
			let nullable = false;
			for (const [state, witness] of position.cur) {
				const next = tables.next(state, symbol);
				if (next === NO_STATE) continue;
				const { scope, summary } = this.summaryOf(name, body, state);
				if (symbolic) this.recordCall(scope, witness, position.lex, cont);
				if (summary.any !== NONE) {
					this.extendSub(cur, next, witness, summary.any);
					if (lex !== undefined && through !== undefined) {
						this.keep(lex, refSource(scope), witness);
						this.keep(through, this.throughKey(scope, position.lex), witness);
						if (forks) {
							this.extendSub(lex, next, witness, summary.any);
							this.forkStates.add(next);
						}
					}
				}
				if (summary.nullable) {
					nullable = true;
					this.keep(nullCur, next, witness);
				}
			}
			if (cur.size > 0)
				out.push({ cur, lex: lex ?? NOTHING, prev: NOTHING, through: through ?? NOTHING, fresh: false });
			if (nullable)
				out.push({
					cur: nullCur,
					lex: position.lex,
					prev: position.prev,
					through: position.through,
					fresh: position.fresh
				});
		}
		return merge(witnesses, out);
	}

	private note(rule: GrammarRule, node: GrammarRule, positions: readonly Position[], cont: number): void {
		if (this.mode !== SYMBOLIC) return;
		const key = this.view.keyOf.get(rule)!;
		const { witnesses } = this;
		for (const position of positions) {
			if (position.fresh) continue;
			let seam = this.seams.get(key);
			if (seam === undefined)
				this.seams.set(key, (seam = { node, lexed: new Set(), prev: new Map(), entry: new Map(), through: new Map() }));
			seam.node = node;
			for (const source of position.lex.keys()) seam.lexed.add(source);
			for (const [pair, witness] of position.prev) {
				const into = this.sourceOfPair(pair) === ENTRY ? seam.entry : seam.prev;
				const slot = into === seam.entry ? this.current * this.symbolCount + this.symbolOfPair(pair) : pair;
				if (witnesses.cost(into.get(slot)?.witness ?? NONE) > witnesses.cost(witness))
					into.set(slot, { scope: this.current, witness, cont });
			}
			for (const [through, witness] of position.through) {
				if (witnesses.cost(seam.through.get(through)?.witness ?? NONE) > witnesses.cost(witness))
					seam.through.set(through, { scope: this.current, witness, cont });
			}
		}
	}

	private walk(rule: GrammarRule, positions: readonly Position[], cont: number): readonly Position[] {
		if (positions.length === 0) return positions;
		this.note(rule, rule, positions, cont);
		const { view } = this;
		switch (rule.type) {
			case 'STRING':
				return this.shiftAll(positions, view.literalIds(rule.value), rule, false);
			case 'BLANK':
			case 'EOF':
				return positions;
			case 'PATTERN':
			case 'TOKEN':
			case 'IMMEDIATE_TOKEN': {
				const inner = rule.type === 'PATTERN' ? rule : unwrap(rule.content);
				if (inner.type === 'STRING')
					return this.shiftAll(positions, view.literalIds(inner.value), inner, rule.type === 'IMMEDIATE_TOKEN');
				return this.shiftAll(positions, view.auxTokens(view.ownerOf.get(rule)!), rule, false);
			}
			case 'SYMBOL':
				return this.symbol(rule, positions, cont);
			case 'SEQ': {
				let at: readonly Position[] = positions;
				const conts = this.mode === SYMBOLIC ? this.seqConts(rule.members, cont) : undefined;
				rule.members.forEach((member, k) => {
					at = this.walk(member, at, conts === undefined ? NIL : conts[k]!);
				});
				return at;
			}
			case 'CHOICE': {
				const out: Position[] = [];
				for (const member of rule.members) out.push(...this.walk(member, positions, cont));
				return merge(this.witnesses, out);
			}
			case 'REPEAT':
			case 'REPEAT1':
				return this.repeat(rule, positions, cont);
			case 'ALIAS':
				return this.alias(rule, positions, cont);
			default:
				return this.walk(rule.content, positions, cont);
		}
	}

	private seqConts(members: readonly GrammarRule[], cont: number): number[] {
		const out: number[] = [];
		let at = cont;
		for (let k = members.length - 1; k >= 0; k--) {
			out.push(at);
			at = this.conts.push(members[k]!, at);
		}
		return out.reverse();
	}

	private shiftAll(
		positions: readonly Position[],
		symbols: readonly number[],
		node: GrammarRule,
		immediate: boolean,
		fallback?: string
	): Position[] {
		const out: Position[] = [];
		for (const symbol of symbols) {
			let token = this.tokenOf(symbol, node, immediate);
			if (fallback !== undefined && this.witnesses.tokens[token]!.text === null)
				token = this.tokenOf(symbol, node, immediate, fallback);
			out.push(...this.shift(positions, symbol, token));
		}
		return merge(this.witnesses, out);
	}

	private symbol(
		rule: GrammarRule & { readonly type: 'SYMBOL' },
		positions: readonly Position[],
		cont: number
	): readonly Position[] {
		const { view } = this;
		const { name } = rule;
		if (view.spliced(name)) {
			const signature = `${name}|${positions.map((position) => [...position.cur.keys()].sort((a, b) => a - b).join('.')).join(';')}`;
			if (this.splicing.has(signature)) return [];
			this.splicing.add(signature);
			try {
				return this.walk(view.rules[name]!, positions, cont);
			} finally {
				this.splicing.delete(signature);
			}
		}
		const ids = view.namedIds(name);
		if (view.isLexical(name)) {
			if (ids.length > 0) return this.shiftAll(positions, ids, rule, false);
			const body = view.rules[name];
			return body === undefined ? [] : this.walk(body, positions, cont);
		}
		const out: Position[] = [];
		for (const id of ids) out.push(...this.nonterminal(name, id, positions, view.rules[name]!, cont));
		return merge(this.witnesses, out);
	}

	private repeat(
		rule: GrammarRule & { readonly type: 'REPEAT' | 'REPEAT1' },
		positions: readonly Position[],
		cont: number
	): readonly Position[] {
		const { view, witnesses } = this;
		const { tables } = view;
		const symbolic = this.mode === SYMBOLIC;
		const content = rule.content;
		const contentName = view.keyOf.get(content)!;
		const aux = view.auxRepeats(view.ownerOf.get(rule)!);
		const iterate = (
			position: Position,
			origins: ReadonlyMap<number, ReadonlySet<number>>
		): { position: Position; origins: Map<number, Set<number>> } | null => {
			const cur = new Map<number, number>();
			const lex = symbolic ? new Map<number, number>() : undefined;
			const through = symbolic ? new Map<number, number>() : undefined;
			const nextOrigins = new Map<number, Set<number>>();
			const reach = (from: number, witness: number): void => {
				for (const symbol of aux) {
					const next = tables.next(from, symbol);
					if (next === NO_STATE) continue;
					this.keep(cur, next, witness);
					let set = nextOrigins.get(next);
					if (set === undefined) nextOrigins.set(next, (set = new Set()));
					set.add(from);
				}
			};
			for (const [state, witness] of position.cur) {
				const { scope, summary } = this.summaryOf(contentName, content, state);
				if (symbolic) this.recordCall(scope, witness, position.lex, cont);
				if (summary.any === NONE) continue;
				const iteration =
					this.mode === DISCOVER
						? EMPTY
						: witnesses.withSub(witness, summary.any, witnesses.cost(witness) + witnesses.cost(summary.any));
				reach(state, iteration);
				for (const origin of origins.get(state) ?? []) reach(origin, iteration);
				if (lex !== undefined && through !== undefined) {
					this.keep(lex, refSource(scope), witness);
					this.keep(through, this.throughKey(scope, position.lex), witness);
				}
			}
			return cur.size === 0
				? null
				: {
						position: { cur, lex: lex ?? NOTHING, prev: NOTHING, through: through ?? NOTHING, fresh: false },
						origins: nextOrigins
					};
		};
		const after: Position[] = [];
		let frontier: { position: Position; origins: ReadonlyMap<number, ReadonlySet<number>> }[] = positions.map(
			(position) => ({ position, origins: new Map() })
		);
		for (let round = 0; round < REPEAT_ROUNDS && frontier.length > 0; round++) {
			const next: { position: Position; origins: Map<number, Set<number>> }[] = [];
			for (const item of frontier) {
				this.note(content, content, [item.position], cont);
				const step = iterate(item.position, item.origins);
				if (step !== null) next.push(step);
			}
			for (const step of next) after.push(step.position);
			if (next.length === 0) break;
			const origins = new Map<number, Set<number>>();
			for (const step of next) {
				for (const [state, set] of step.origins) {
					let into = origins.get(state);
					if (into === undefined) origins.set(state, (into = new Set()));
					for (const origin of set) into.add(origin);
				}
			}
			frontier = [
				{
					position: merge(
						witnesses,
						next.map((step) => step.position)
					)[0]!,
					origins
				}
			];
		}
		const tail = merge(witnesses, after);
		return rule.type === 'REPEAT' ? merge(witnesses, [...positions, ...tail]) : tail;
	}

	private alias(
		rule: GrammarRule & { readonly type: 'ALIAS' },
		positions: readonly Position[],
		cont: number
	): readonly Position[] {
		const { view } = this;
		const { tables } = view;
		const content = rule.content;
		const aliasIds = rule.named ? view.namedIds(rule.value) : view.literalIds(rule.value);
		const aliasGotos = aliasIds.filter((id) => !tables.isTerminal(id));
		const lexicalSymbol = content.type === 'SYMBOL' && view.isLexical(content.name);
		const ownTokens =
			content.type === 'STRING'
				? view.literalIds(content.value)
				: content.type === 'SYMBOL' && lexicalSymbol
					? view.namedIds(content.name)
					: [];
		if (ownTokens.length > 0 && content.type === 'SYMBOL' && !rule.named) {
			this.note(rule, content, positions, cont);
			return this.shiftAll(positions, ownTokens, content, false, rule.value);
		}
		if (ownTokens.length > 0) return this.walk(content, positions, cont);
		if (
			lexicalSymbol ||
			content.type === 'PATTERN' ||
			content.type === 'TOKEN' ||
			content.type === 'IMMEDIATE_TOKEN' ||
			content.type === 'STRING'
		) {
			const aliasShifts = aliasIds.filter((id) => tables.isTerminal(id));
			if (aliasGotos.length + aliasShifts.length === 0) return this.walk(content, positions, cont);
			this.note(rule, content, positions, cont);
			const body = content.type === 'SYMBOL' ? view.rules[content.name]! : content;
			const name = content.type === 'SYMBOL' ? content.name : view.keyOf.get(rule)!;
			const out = [...this.shiftAll(positions, aliasShifts, content, false)];
			for (const id of aliasGotos) out.push(...this.nonterminal(name, id, positions, body, cont));
			return merge(this.witnesses, out);
		}
		if (content.type === 'SYMBOL') {
			const own = view.spliced(content.name) ? [] : view.namedIds(content.name);
			if (own.length + aliasGotos.length === 0) return this.walk(content, positions, cont);
			this.note(rule, content, positions, cont);
			const out: Position[] = [];
			for (const id of [...own, ...aliasGotos.filter((id) => !own.includes(id))])
				out.push(...this.nonterminal(content.name, id, positions, view.rules[content.name]!, cont));
			return merge(this.witnesses, out);
		}
		return this.walk(content, positions, cont);
	}
}

export function stronglyConnected(nodes: Iterable<number>, edges: (node: number) => Iterable<number>): number[][] {
	const index = new Map<number, number>();
	const low = new Map<number, number>();
	const onStack = new Set<number>();
	const stack: number[] = [];
	const out: number[][] = [];
	let counter = 0;
	for (const root of nodes) {
		if (index.has(root)) continue;
		const frames: { node: number; next: Iterator<number> }[] = [];
		const enter = (node: number): void => {
			index.set(node, counter);
			low.set(node, counter++);
			stack.push(node);
			onStack.add(node);
			frames.push({ node, next: edges(node)[Symbol.iterator]() });
		};
		enter(root);
		while (frames.length > 0) {
			const frame = frames[frames.length - 1]!;
			const step = frame.next.next();
			if (!step.done) {
				const target = step.value;
				if (!index.has(target)) enter(target);
				else if (onStack.has(target)) low.set(frame.node, Math.min(low.get(frame.node)!, index.get(target)!));
				continue;
			}
			frames.pop();
			const parent = frames[frames.length - 1];
			if (parent !== undefined) low.set(parent.node, Math.min(low.get(parent.node)!, low.get(frame.node)!));
			if (low.get(frame.node) !== index.get(frame.node)) continue;
			const component: number[] = [];
			for (let member = Number.NaN; member !== frame.node; ) {
				member = stack.pop()!;
				onStack.delete(member);
				component.push(member);
			}
			out.push(component);
		}
	}
	return out;
}

function setMin(witnesses: Witnesses, map: Map<number, number>, key: number, witness: number): boolean {
	const old = map.get(key);
	if (old !== undefined && witnesses.cost(old) <= witnesses.cost(witness)) return false;
	map.set(key, witness);
	return true;
}

function union(witnesses: Witnesses, maps: readonly Entries[]): Entries {
	let only: Entries | undefined;
	let count = 0;
	for (const map of maps) {
		if (map.size === 0) continue;
		only = map;
		count++;
	}
	if (count === 0) return NOTHING;
	if (count === 1) return only!;
	const out = new Map<number, number>();
	for (const map of maps) for (const [key, witness] of map) setMin(witnesses, out, key, witness);
	return out;
}

function merge(witnesses: Witnesses, positions: readonly Position[]): Position[] {
	if (positions.length <= 1) return positions as Position[];
	const out: Position[] = [];
	for (const fresh of [true, false]) {
		const group = positions.filter((position) => position.fresh === fresh);
		if (group.length === 0) continue;
		out.push({
			cur: union(
				witnesses,
				group.map((position) => position.cur)
			),
			lex: union(
				witnesses,
				group.map((position) => position.lex)
			),
			prev: union(
				witnesses,
				group.map((position) => position.prev)
			),
			through: union(
				witnesses,
				group.map((position) => position.through)
			),
			fresh
		});
	}
	return out;
}
