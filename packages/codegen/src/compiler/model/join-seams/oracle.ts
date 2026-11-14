import type * as TS from 'web-tree-sitter';
import { type ParsedTree, type ParserLanguage, treeParser, type TreeParser } from '../../../engine-loader.ts';

const STATE_LINE = /state:(\d+), row:(\d+), col:(\d+)/;
const LEXED_LINE = /^lexed_lookahead sym:(.*), size:/;

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

	lexStatesAt(text: string, offset: number, symbol: string): Set<number> {
		const before = text.slice(0, offset);
		const row = before.split('\n').length - 1;
		const column = (offset - (before.lastIndexOf('\n') + 1)) * 2;
		this.log = [];
		this.parses++;
		this.logged.parse(text)[Symbol.dispose]();
		const lines = this.log;
		this.log = null;
		const out = new Set<number>();
		for (let k = 0; k + 1 < lines.length; k++) {
			const state = STATE_LINE.exec(lines[k]!);
			const lexed = LEXED_LINE.exec(lines[k + 1]!);
			if (
				state !== null &&
				lexed !== null &&
				Number(state[2]) === row &&
				Number(state[3]) === column &&
				lexed[1] === symbol
			)
				out.add(Number(state[1]));
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
