export type CodeRange = readonly [number, number];

const MAX_CODE_POINT = 0x10ffff;

export class CharSet {
	readonly ranges: readonly CodeRange[];

	private constructor(ranges: readonly CodeRange[]) {
		this.ranges = ranges;
	}

	static readonly EMPTY = new CharSet([]);
	static readonly ALL = new CharSet([[0, MAX_CODE_POINT]]);

	static of(ranges: readonly CodeRange[]): CharSet {
		const sorted = [...ranges].filter(([lo, hi]) => lo <= hi).sort((a, b) => a[0] - b[0]);
		const merged: [number, number][] = [];
		for (const [lo, hi] of sorted) {
			const last = merged.at(-1);
			if (last !== undefined && lo <= last[1] + 1) last[1] = Math.max(last[1], hi);
			else merged.push([lo, hi]);
		}
		return new CharSet(merged);
	}

	static chars(text: string): CharSet {
		return CharSet.of([...text].map((c) => [c.codePointAt(0)!, c.codePointAt(0)!] as const));
	}

	union(other: CharSet): CharSet {
		return CharSet.of([...this.ranges, ...other.ranges]);
	}

	complement(): CharSet {
		const out: CodeRange[] = [];
		let next = 0;
		for (const [lo, hi] of this.ranges) {
			if (lo > next) out.push([next, lo - 1]);
			next = hi + 1;
		}
		if (next <= MAX_CODE_POINT) out.push([next, MAX_CODE_POINT]);
		return new CharSet(out);
	}

	minus(other: CharSet): CharSet {
		return this.complement().union(other).complement();
	}

	has(codePoint: number): boolean {
		return this.ranges.some(([lo, hi]) => lo <= codePoint && codePoint <= hi);
	}

	covers(other: CharSet): boolean {
		return other.minus(this).isEmpty();
	}

	isEmpty(): boolean {
		return this.ranges.length === 0;
	}

	size(): number {
		return this.ranges.reduce((total, [lo, hi]) => total + hi - lo + 1, 0);
	}
}

export const LINE_TERMINATORS = CharSet.chars('\n\r  ');

const DIGIT = CharSet.of([[0x30, 0x39]]);
const WORD = CharSet.of([
	[0x30, 0x39],
	[0x41, 0x5a],
	[0x5f, 0x5f],
	[0x61, 0x7a]
]);
const SPACE = CharSet.chars('\t\n\v\f\r       　﻿').union(CharSet.of([[0x2000, 0x200a]]));
const DOT = LINE_TERMINATORS.complement();

const propertySets = new Map<string, CharSet>();

function unicodeProperty(body: string): CharSet {
	const cached = propertySets.get(body);
	if (cached !== undefined) return cached;
	const test = new RegExp(`^\\p{${body}}$`, 'u');
	const ranges: [number, number][] = [];
	let start = -1;
	for (let cp = 0; cp <= MAX_CODE_POINT + 1; cp++) {
		const inside = cp <= MAX_CODE_POINT && (cp < 0xd800 || cp > 0xdfff) && test.test(String.fromCodePoint(cp));
		if (inside && start < 0) start = cp;
		if (!inside && start >= 0) {
			ranges.push([start, cp - 1]);
			start = -1;
		}
	}
	const set = CharSet.of(ranges);
	propertySets.set(body, set);
	return set;
}

type Node =
	| { readonly type: 'set'; readonly set: CharSet }
	| { readonly type: 'seq'; readonly items: readonly Node[] }
	| { readonly type: 'alt'; readonly arms: readonly Node[] }
	| { readonly type: 'repeat'; readonly item: Node; readonly min: number; readonly max: number | undefined };

class UnsupportedPattern extends Error {}

class PatternParser {
	private at = 0;

	private readonly source: string;

	constructor(source: string) {
		this.source = source;
	}

	parse(): Node {
		const node = this.alternation();
		if (this.at < this.source.length) throw new UnsupportedPattern(`unexpected '${this.source[this.at]}'`);
		return node;
	}

	private peek(): string | undefined {
		return this.source[this.at];
	}

	private take(): string {
		const cp = this.source.codePointAt(this.at);
		if (cp === undefined) throw new UnsupportedPattern('unexpected end');
		const char = String.fromCodePoint(cp);
		this.at += char.length;
		return char;
	}

	private alternation(): Node {
		const arms = [this.sequence()];
		while (this.peek() === '|') {
			this.at++;
			arms.push(this.sequence());
		}
		return arms.length === 1 ? arms[0]! : { type: 'alt', arms };
	}

	private sequence(): Node {
		const items: Node[] = [];
		while (this.at < this.source.length && this.peek() !== '|' && this.peek() !== ')') {
			items.push(this.quantified(this.atom()));
		}
		return items.length === 1 ? items[0]! : { type: 'seq', items };
	}

	private quantified(item: Node): Node {
		const bounds = this.quantifier();
		if (bounds === undefined) return item;
		if (this.peek() === '?') this.at++;
		return this.quantified({ type: 'repeat', item, min: bounds[0], max: bounds[1] });
	}

	private quantifier(): readonly [number, number | undefined] | undefined {
		switch (this.peek()) {
			case '*':
				this.at++;
				return [0, undefined];
			case '+':
				this.at++;
				return [1, undefined];
			case '?':
				this.at++;
				return [0, 1];
			case '{': {
				const match = /^\{(\d+)(,(\d*))?\}/.exec(this.source.slice(this.at));
				if (match === null) return undefined;
				this.at += match[0].length;
				const min = Number(match[1]);
				return [min, match[2] === undefined ? min : match[3] === '' ? undefined : Number(match[3])];
			}
			default:
				return undefined;
		}
	}

	private atom(): Node {
		const char = this.take();
		switch (char) {
			case '(': {
				if (this.source.startsWith('?:', this.at)) this.at += 2;
				else if (this.source.startsWith('?<', this.at) && !/^\?<[=!]/.test(this.source.slice(this.at))) {
					this.at = this.source.indexOf('>', this.at) + 1;
				} else if (this.peek() === '?') throw new UnsupportedPattern('lookaround');
				const inner = this.alternation();
				if (this.take() !== ')') throw new UnsupportedPattern('unclosed group');
				return inner;
			}
			case '[':
				return { type: 'set', set: this.charClass() };
			case '.':
				return { type: 'set', set: DOT };
			case '\\':
				return { type: 'set', set: this.escape(false) };
			case '^':
			case '$':
				throw new UnsupportedPattern('anchor');
			case '*':
			case '+':
			case '?':
				throw new UnsupportedPattern('dangling quantifier');
			default:
				return { type: 'set', set: CharSet.chars(char) };
		}
	}

	private charClass(): CharSet {
		const negated = this.peek() === '^';
		if (negated) this.at++;
		let set = CharSet.EMPTY;
		while (this.peek() !== ']') {
			if (this.at >= this.source.length) throw new UnsupportedPattern('unclosed class');
			const lo = this.classAtom();
			if (this.peek() === '-' && this.source[this.at + 1] !== ']' && lo.single !== undefined) {
				this.at++;
				const hi = this.classAtom();
				if (hi.single === undefined) throw new UnsupportedPattern('class range to a set');
				set = set.union(CharSet.of([[lo.single, hi.single]]));
				continue;
			}
			set = set.union(lo.set);
		}
		this.at++;
		return negated ? set.complement() : set;
	}

	private classAtom(): { readonly set: CharSet; readonly single: number | undefined } {
		const char = this.take();
		const set = char === '\\' ? this.escape(true) : CharSet.chars(char);
		return { set, single: set.size() === 1 ? set.ranges[0]![0] : undefined };
	}

	private escape(inClass: boolean): CharSet {
		const char = this.take();
		switch (char) {
			case 'd':
				return DIGIT;
			case 'D':
				return DIGIT.complement();
			case 'w':
				return WORD;
			case 'W':
				return WORD.complement();
			case 's':
				return SPACE;
			case 'S':
				return SPACE.complement();
			case 'n':
				return CharSet.chars('\n');
			case 'r':
				return CharSet.chars('\r');
			case 't':
				return CharSet.chars('\t');
			case 'v':
				return CharSet.chars('\v');
			case 'f':
				return CharSet.chars('\f');
			case '0':
				return CharSet.chars('\0');
			case 'b':
				if (inClass) return CharSet.chars('\b');
				throw new UnsupportedPattern('word boundary');
			case 'B':
				throw new UnsupportedPattern('word boundary');
			case 'x':
				return this.hexEscape(/^[0-9a-fA-F]{2}/);
			case 'u':
				if (this.peek() === '{') {
					const match = /^\{([0-9a-fA-F]+)\}/.exec(this.source.slice(this.at));
					if (match === null) throw new UnsupportedPattern('bad \\u{}');
					this.at += match[0].length;
					return CharSet.of([[parseInt(match[1]!, 16), parseInt(match[1]!, 16)]]);
				}
				return this.hexEscape(/^[0-9a-fA-F]{4}/);
			case 'p':
			case 'P': {
				const match = /^\{([^}]+)\}/.exec(this.source.slice(this.at));
				if (match === null) throw new UnsupportedPattern('bad \\p{}');
				this.at += match[0].length;
				const set = unicodeProperty(match[1]!);
				return char === 'p' ? set : set.complement();
			}
			default:
				if (/[1-9]/.test(char)) throw new UnsupportedPattern('backreference');
				return CharSet.chars(char);
		}
	}

	private hexEscape(digits: RegExp): CharSet {
		const match = digits.exec(this.source.slice(this.at));
		if (match === null) throw new UnsupportedPattern('bad hex escape');
		this.at += match[0].length;
		const cp = parseInt(match[0], 16);
		return CharSet.of([[cp, cp]]);
	}
}

interface NfaState {
	readonly edges: { readonly set: CharSet; readonly to: number }[];
	readonly epsilon: number[];
}

class NfaBuilder {
	readonly states: NfaState[] = [];

	state(): number {
		this.states.push({ edges: [], epsilon: [] });
		return this.states.length - 1;
	}

	fragment(node: Node): { readonly start: number; readonly end: number } {
		const start = this.state();
		const end = this.state();
		this.wire(node, start, end);
		return { start, end };
	}

	private wire(node: Node, from: number, to: number): void {
		switch (node.type) {
			case 'set':
				this.states[from]!.edges.push({ set: node.set, to });
				return;
			case 'seq': {
				let at = from;
				node.items.forEach((item, i) => {
					const next = i === node.items.length - 1 ? to : this.state();
					this.wire(item, at, next);
					at = next;
				});
				if (node.items.length === 0) this.states[from]!.epsilon.push(to);
				return;
			}
			case 'alt':
				for (const arm of node.arms) this.wire(arm, from, to);
				return;
			case 'repeat': {
				let at = from;
				for (let i = 0; i < node.min; i++) {
					const next = this.state();
					this.wire(node.item, at, next);
					at = next;
				}
				if (node.max === undefined) {
					const loop = this.state();
					this.states[at]!.epsilon.push(loop);
					this.wire(node.item, loop, loop);
					this.states[loop]!.epsilon.push(to);
					return;
				}
				this.states[at]!.epsilon.push(to);
				for (let i = node.min; i < node.max; i++) {
					const next = this.state();
					this.wire(node.item, at, next);
					this.states[next]!.epsilon.push(to);
					at = next;
				}
				return;
			}
		}
	}
}

export interface DfaEdge {
	readonly set: CharSet;
	readonly to: number;
}

export interface DfaState {
	readonly accepting: boolean;
	readonly edges: readonly DfaEdge[];
}

export interface PatternDfa {
	readonly states: readonly DfaState[];
}

const dfaByPattern = new Map<string, PatternDfa | undefined>();

export function patternDfa(pattern: string): PatternDfa | undefined {
	if (dfaByPattern.has(pattern)) return dfaByPattern.get(pattern);
	let dfa: PatternDfa | undefined;
	try {
		dfa = determinize(new PatternParser(pattern).parse());
	} catch (error) {
		if (!(error instanceof UnsupportedPattern)) throw error;
		dfa = undefined;
	}
	dfaByPattern.set(pattern, dfa);
	return dfa;
}

function determinize(root: Node): PatternDfa {
	const nfa = new NfaBuilder();
	const { start, end } = nfa.fragment(root);
	const closure = (seeds: Iterable<number>): number[] => {
		const seen = new Set<number>();
		const stack = [...seeds];
		while (stack.length > 0) {
			const at = stack.pop()!;
			if (seen.has(at)) continue;
			seen.add(at);
			stack.push(...nfa.states[at]!.epsilon);
		}
		return [...seen].sort((a, b) => a - b);
	};
	const boundaries = new Set<number>([0]);
	for (const state of nfa.states) {
		for (const { set } of state.edges) {
			for (const [lo, hi] of set.ranges) {
				boundaries.add(lo);
				if (hi < MAX_CODE_POINT) boundaries.add(hi + 1);
			}
		}
	}
	const cuts = [...boundaries].sort((a, b) => a - b);
	const atoms: CodeRange[] = cuts.map((lo, i) => [lo, (cuts[i + 1] ?? MAX_CODE_POINT + 1) - 1] as const);

	const keyOf = (members: readonly number[]): string => members.join(',');
	const members: number[][] = [closure([start])];
	const index = new Map([[keyOf(members[0]!), 0]]);
	const states: { accepting: boolean; edges: DfaEdge[] }[] = [];
	for (let i = 0; i < members.length; i++) {
		const current = members[i]!;
		const targets = new Map<number, CodeRange[]>();
		for (const atom of atoms) {
			const next = closure(
				current.flatMap((at) => nfa.states[at]!.edges.filter((edge) => edge.set.has(atom[0])).map((edge) => edge.to))
			);
			if (next.length === 0) continue;
			const key = keyOf(next);
			let to = index.get(key);
			if (to === undefined) {
				to = members.length;
				members.push(next);
				index.set(key, to);
			}
			targets.set(to, [...(targets.get(to) ?? []), atom]);
		}
		states.push({
			accepting: current.includes(end),
			edges: [...targets].map(([to, ranges]) => ({ set: CharSet.of(ranges), to }))
		});
	}
	return { states };
}

export function dfaAccepts(dfa: PatternDfa, text: string): boolean {
	let at = 0;
	for (const char of text) {
		const edge = dfa.states[at]!.edges.find(({ set }) => set.has(char.codePointAt(0)!));
		if (edge === undefined) return false;
		at = edge.to;
	}
	return dfa.states[at]!.accepting;
}

function reachableFrom(dfa: PatternDfa, seeds: readonly number[], keep: (set: CharSet) => boolean): Set<number> {
	const seen = new Set<number>();
	const stack = [...seeds];
	while (stack.length > 0) {
		const at = stack.pop()!;
		if (seen.has(at)) continue;
		seen.add(at);
		for (const edge of dfa.states[at]!.edges) if (keep(edge.set)) stack.push(edge.to);
	}
	return seen;
}

function coaccessible(dfa: PatternDfa): Set<number> {
	const live = new Set(dfa.states.flatMap((state, i) => (state.accepting ? [i] : [])));
	for (let grew = true; grew; ) {
		grew = false;
		dfa.states.forEach((state, i) => {
			if (!live.has(i) && state.edges.some((edge) => live.has(edge.to))) {
				live.add(i);
				grew = true;
			}
		});
	}
	return live;
}

export function crossesLine(dfa: PatternDfa): boolean {
	const live = coaccessible(dfa);
	const reached = reachableFrom(dfa, [0], () => true);
	const afterBreak = reachableFrom(
		dfa,
		[...reached].flatMap((at) => dfa.states[at]!.edges.filter((edge) => !edge.set.minus(LINE_TERMINATORS.complement()).isEmpty()).map((edge) => edge.to)),
		() => true
	);
	return [...afterBreak].some((at) =>
		dfa.states[at]!.edges.some((edge) => live.has(edge.to) && !edge.set.minus(LINE_TERMINATORS).isEmpty())
	);
}

export function requiresNonSpace(dfa: PatternDfa): boolean {
	const spaceOnly = reachableFrom(dfa, [0], (set) => !set.minus(SPACE.complement()).isEmpty());
	return ![...spaceOnly].some((at) => dfa.states[at]!.accepting);
}

export function endsWithLineBreak(dfa: PatternDfa): boolean {
	if (dfa.states[0]!.accepting) return false;
	const into = dfa.states.flatMap((state) => state.edges.filter((edge) => dfa.states[edge.to]!.accepting));
	return into.length > 0 && into.every((edge) => LINE_TERMINATORS.covers(edge.set));
}

export function admitsInside(dfa: PatternDfa, literal: string): boolean {
	const live = coaccessible(dfa);
	return [...reachableFrom(dfa, [0], () => true)].some((start) => {
		let at = start;
		for (const char of literal) {
			const edge = dfa.states[at]!.edges.find(({ set }) => set.has(char.codePointAt(0)!));
			if (edge === undefined) return false;
			at = edge.to;
		}
		return dfa.states[at]!.edges.some((edge) => live.has(edge.to));
	});
}

export function leadingChars(dfa: PatternDfa): CharSet {
	const live = coaccessible(dfa);
	return CharSet.of(dfa.states[0]!.edges.filter((edge) => live.has(edge.to)).flatMap((edge) => edge.set.ranges));
}

export function shortestAccepted(dfa: PatternDfa): string | undefined {
	const paths = new Map<number, string>([[0, '']]);
	const queue = [0];
	for (let head = 0; head < queue.length; head++) {
		const at = queue[head]!;
		if (dfa.states[at]!.accepting) return paths.get(at);
		for (const edge of dfa.states[at]!.edges) {
			if (paths.has(edge.to) || edge.set.isEmpty()) continue;
			paths.set(edge.to, paths.get(at)! + String.fromCodePoint(edge.set.ranges[0]![0]));
			queue.push(edge.to);
		}
	}
	return undefined;
}

export function absorbsRestOfLine(dfa: PatternDfa): boolean {
	const reached = reachableFrom(dfa, [0], () => true);
	const rest = LINE_TERMINATORS.complement();
	return [...reached].some((at) => {
		const state = dfa.states[at]!;
		return state.accepting && state.edges.some((edge) => edge.to === at && edge.set.covers(rest));
	});
}

export function opensLineEnd(pattern: string): boolean | undefined {
	const dfa = patternDfa(pattern);
	if (dfa === undefined) return undefined;
	return absorbsRestOfLine(dfa) && !crossesLine(dfa);
}
