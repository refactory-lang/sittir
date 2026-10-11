/**
 * The token walk the trivia table's probes share, over a wasm tree-sitter tree: a node's tokens in
 * tree order (its leaves, and the text a hidden token leaves between two children), and the entries
 * it passes (extras, and `ERROR` nodes, which are entries rather than tokens).
 */
export type TsNode = {
	id: number;
	type: string;
	isNamed: boolean;
	isExtra: boolean;
	isMissing: boolean;
	startIndex: number;
	endIndex: number;
	startPosition: { row: number; column: number };
	endPosition: { row: number; column: number };
	childCount: number;
	children: TsNode[];
	parent: TsNode | null;
};

export type Token = { start: number; end: number; text: string; row: number; endRow: number; node: TsNode; hidden: boolean };
export type Entry = { start: number; end: number; node: TsNode };

export interface Walk {
	tokens: Token[];
	entries: Entry[];
}

/** Whether a node is an entry, not tokens: an extra, or an `ERROR`. */
export const isEntry = (node: TsNode): boolean => node.isExtra || node.type === 'ERROR';

/**
 * The walk under `root`. A hidden zero-width token (python's `_indent` and `_dedent`) is no node,
 * but the node it bounds reaches past its own first or last token over the entries before or after
 * it; the walk puts a zero-width token at that node edge. With `zeroWidth` false every zero-width
 * token is passed (a `MISSING` leaf, and those edges): it has no whitespace of its own.
 */
export function walk(root: TsNode, source: string, zeroWidth = true): Walk {
	const tokens: Token[] = [];
	const entries: Entry[] = [];
	const rowOf = (byte: number): number => {
		let row = 0;
		for (let i = source.indexOf('\n'); i !== -1 && i < byte; i = source.indexOf('\n', i + 1)) row++;
		return row;
	};
	const hidden = (owner: TsNode, from: number, to: number): void => {
		const text = source.slice(from, to);
		const trimmed = text.trim();
		if (trimmed === '') return;
		const start = from + text.indexOf(trimmed);
		const end = start + trimmed.length;
		tokens.push({ start, end, text: trimmed, row: rowOf(start), endRow: rowOf(end), node: owner, hidden: true });
	};
	const visit = (node: TsNode): void => {
		if (isEntry(node)) {
			entries.push({ start: node.startIndex, end: node.endIndex, node });
			return;
		}
		if (node.childCount === 0) {
			if (zeroWidth || node.endIndex > node.startIndex) {
				tokens.push({
					start: node.startIndex,
					end: node.endIndex,
					text: source.slice(node.startIndex, node.endIndex),
					row: node.startPosition.row,
					endRow: node.endPosition.row,
					node,
					hidden: false
				});
			}
			return;
		}
		const before = tokens.length;
		let at = node.startIndex;
		for (const child of node.children) {
			hidden(node, at, child.startIndex);
			visit(child);
			at = child.endIndex;
		}
		hidden(node, at, node.endIndex);
		if (!zeroWidth || node.parent === null) return;
		const own = tokens.slice(before);
		const first = Math.min(...own.map((token) => token.start));
		const last = Math.max(...own.map((token) => token.end));
		const edge = (byte: number): Token => ({ start: byte, end: byte, text: '', row: rowOf(byte), endRow: rowOf(byte), node, hidden: true });
		if (own.length > 0 && node.startIndex < first) tokens.push(edge(node.startIndex));
		if (own.length > 0 && node.endIndex > last) tokens.push(edge(node.endIndex));
	};
	visit(root);
	tokens.sort((a, b) => a.start - b.start || a.end - b.end);
	entries.sort((a, b) => a.start - b.start);
	return { tokens, entries };
}
