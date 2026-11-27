import type * as TS from 'web-tree-sitter';
import type { GrammarRule } from '../../../grammar-shapes/grammar-json.ts';
import { type ParsedTree, type ParserLanguage, treeParser, type TreeParser } from '../../../engine-loader.ts';

const STATE_LINE = /state:(\d+), row:(\d+), col:(\d+)/;
const LEXED_LINE = /^lexed_lookahead sym:(.*), size:(\d+)/;
const LOG_ESCAPES: Readonly<Record<string, string>> = { t: '\t', n: '\n', v: '\v', f: '\f', r: '\r', '\\': '\\' };
const UTF16_BYTES = 2;

export interface LexEvent {
	readonly offset: number;
	readonly end: number;
	readonly state: number;
	readonly symbol: string;
}

export class ParseOracle implements Disposable {
	private readonly parser: TreeParser;
	private readonly logged: TreeParser;
	private log: string[] | null = null;
	parses = 0;

	constructor(language: ParserLanguage) {
		this.parser = treeParser(language);
		this.logged = treeParser(language, (message) => {
			if (this.log !== null && (message.startsWith('process version') || message.startsWith('lexed_lookahead')))
				this.log.push(message);
		});
	}

	parse(text: string): ParsedTree {
		this.parses++;
		return this.parser.parse(text);
	}

	lexEvents(text: string): LexEvent[] {
		const lineStarts = [0];
		for (let at = text.indexOf('\n'); at >= 0; at = text.indexOf('\n', at + 1)) lineStarts.push(at + 1);
		this.log = [];
		this.parses++;
		this.logged.parse(text)[Symbol.dispose]();
		const lines = this.log;
		this.log = null;
		const out: LexEvent[] = [];
		for (let k = 0; k + 1 < lines.length; k++) {
			const state = STATE_LINE.exec(lines[k]!);
			const lexed = LEXED_LINE.exec(lines[k + 1]!);
			if (state === null || lexed === null) continue;
			const offset = lineStarts[Number(state[2])]! + Number(state[3]) / UTF16_BYTES;
			out.push({
				offset,
				end: offset + Number(lexed[2]) / UTF16_BYTES,
				state: Number(state[1]),
				symbol: lexed[1]!.replace(/\\([tnvfr\\])/g, (_, char: string) => LOG_ESCAPES[char]!)
			});
		}
		return out;
	}

	[Symbol.dispose](): void {
		this.parser[Symbol.dispose]();
		this.logged[Symbol.dispose]();
	}
}

export function sameTree(a: TS.Node, b: TS.Node): boolean {
	const stack: [TS.Node, TS.Node][] = [[a, b]];
	while (stack.length > 0) {
		const [left, right] = stack.pop()!;
		if (
			left.grammarId !== right.grammarId ||
			left.typeId !== right.typeId ||
			left.childCount !== right.childCount ||
			left.isMissing !== right.isMissing
		)
			return false;
		if (left.childCount === 0) {
			if (left.text !== right.text) return false;
			continue;
		}
		for (let k = 0; k < left.childCount; k++) stack.push([left.child(k)!, right.child(k)!]);
	}
	return true;
}

export function leavesOf(root: TS.Node): TS.Node[] {
	const out: TS.Node[] = [];
	const stack: TS.Node[] = [root];
	while (stack.length > 0) {
		const node = stack.pop()!;
		if (node.childCount === 0) {
			if (!node.isExtra) out.push(node);
			continue;
		}
		for (let k = node.childCount - 1; k >= 0; k--) stack.push(node.child(k)!);
	}
	return out;
}

export function errorNear(root: TS.Node, from: number, to: number): boolean {
	const stack: TS.Node[] = [root];
	while (stack.length > 0) {
		const node = stack.pop()!;
		if (node.isError || node.isMissing) {
			if (node.startIndex <= to && node.endIndex >= from) return true;
			continue;
		}
		if (!node.hasError) continue;
		for (let k = 0; k < node.childCount; k++) stack.push(node.child(k)!);
	}
	return false;
}

export const SEAM_SPACE = ' ';
export const SPACE_IS_PARSE_ERROR = 'a space at the seam is a parse error';
export const SPACE_IN_HIDDEN_TOKEN = 'the space lexes into a hidden token';

export function absorbedAt(leaves: readonly TS.Node[], seam: number): string | undefined {
	const covering = leaves.find((leaf) => leaf.startIndex <= seam && leaf.endIndex > seam);
	if (covering === undefined) return undefined;
	return covering.startIndex === seam ? 'the space lexes into the next token' : 'the space lexes into the previous token';
}

function unwrapped(rule: GrammarRule): GrammarRule {
	let at = rule;
	while ('content' in at && at.type !== 'REPEAT' && at.type !== 'REPEAT1' && at.type !== 'FIELD' && at.type !== 'ALIAS') at = at.content;
	return at;
}

function matchesMember(rule: GrammarRule, child: TS.Node, field: string | null): boolean {
	const at = unwrapped(rule);
	switch (at.type) {
		case 'FIELD':
			return field === at.name;
		case 'STRING':
			return !child.isNamed && child.type === at.value;
		case 'SYMBOL':
			return child.grammarType === at.name || child.type === at.name;
		case 'ALIAS':
			return child.type === at.value;
		case 'CHOICE':
			return at.members.some((arm) => matchesMember(arm, child, field));
		case 'REPEAT':
		case 'REPEAT1':
			return matchesMember(at.content, child, field);
		default:
			return false;
	}
}

function nullableMember(rule: GrammarRule): boolean {
	const at = unwrapped(rule);
	switch (at.type) {
		case 'BLANK':
		case 'REPEAT':
			return true;
		case 'CHOICE':
			return at.members.some(nullableMember);
		case 'SEQ':
			return at.members.every(nullableMember);
		case 'REPEAT1':
		case 'FIELD':
		case 'ALIAS':
			return nullableMember(at.content);
		default:
			return false;
	}
}

export function ownerNode(seam: string, next: TS.Node): TS.Node | null {
	const owner = seam.slice(0, seam.indexOf(':'));
	let node = next.parent;
	while (node !== null && node.grammarType !== owner) node = node.parent;
	return node;
}

export function memberBefore(
	rules: Readonly<Record<string, GrammarRule>>,
	seam: string,
	previous: TS.Node,
	next: TS.Node
): string | undefined {
	const colon = seam.indexOf(':');
	const owner = seam.slice(0, colon);
	const position = /^members\.(\d+)$/.exec(seam.slice(colon + 1));
	const body = rules[owner] === undefined ? undefined : unwrapped(rules[owner]!);
	if (position === null || body?.type !== 'SEQ') return undefined;
	const node = ownerNode(seam, next);
	if (node === null) return undefined;
	const { members } = body;
	let m = 0;
	let filled = false;
	let previousMember: number | undefined;
	let nextMember: number | undefined;
	for (let k = 0; k < node.childCount; k++) {
		const child = node.child(k)!;
		if (child.isExtra) continue;
		const field = node.fieldNameForChild(k);
		while (m < members.length && !matchesMember(members[m]!, child, field)) {
			if (!filled && !nullableMember(members[m]!)) return undefined;
			m++;
			filled = false;
		}
		if (m === members.length) return undefined;
		if (child.startIndex <= previous.startIndex && previous.endIndex <= child.endIndex) previousMember = m;
		if (child.startIndex === next.startIndex) nextMember = m;
		const at = unwrapped(members[m]!);
		if (at.type === 'REPEAT' || at.type === 'REPEAT1') filled = true;
		else m++;
	}
	if (previousMember === undefined || nextMember !== Number(position[1]) || previousMember >= nextMember) return undefined;
	return `${owner}:members.${previousMember}`;
}

export function parsesAsBuilt(root: TS.Node, seam: number, previous: string, next: string): boolean {
	if (root.hasError) return false;
	const leaves = leavesOf(root);
	const k = leaves.findIndex((leaf) => leaf.endIndex === seam);
	return k >= 0 && leaves[k]!.text === previous && leaves[k + 1]?.startIndex === seam && leaves[k + 1]!.text === next;
}

export function lexStatesOf(events: readonly LexEvent[], end: number, offset?: number, symbol?: string): Set<number> {
	const out = new Set<number>();
	for (const event of events)
		if (event.end === end && (offset === undefined || event.offset === offset) && (symbol === undefined || event.symbol === symbol))
			out.add(event.state);
	return out;
}

export function spaceIsPadding(events: readonly LexEvent[], seam: number, next: TS.Node): boolean {
	return lexStatesOf(events, next.endIndex, seam).size > 0;
}
