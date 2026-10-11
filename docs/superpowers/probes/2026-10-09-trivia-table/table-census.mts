/**
 * Measures: whether a gap's owner, the smallest node containing tokens on both sides of it, is the
 * tree-sitter parent of every entry (extra or `ERROR`) in the gap, and which side the assignment
 * gives each entry.
 *
 * Over every corpus entry of the five grammars, with the token walk of `walk.mts` (zero-width
 * `MISSING` leaves included). Gap k lies between token k and token k + 1; the file's edges are
 * owned by the root. Within the owner, the left child is its named child whose last token is k, the
 * right child its named child whose first token is k + 1. The side:
 *   an entry on token k's last row trails the left child, the rest lead the right child;
 *   with no left child every entry leads the right one, with no right child every entry trails the
 *   left one;
 *   an owner with no named child takes them as its `inner`;
 *   an owner with named children but none beside the gap takes none (unowned).
 * Run (from the root of a checkout):
 *   ./node_modules/.bin/tsx docs/superpowers/probes/2026-10-09-trivia-table/table-census.mts [out.json]
 * Prints: per grammar, entries, owner-not-parent entries, sides (and the trailing entries that lie
 *   before their owner's closing edge token, after its last child: a comment after a python block's
 *   last statement, before its dedent), unowned entries by owner kind,
 *   hidden-token texts, node-edge tokens (hidden zero-width tokens, `walk.mts`), zero-width leaves
 *   and `ERROR` entries. Exits 1 if any entry's owner is not its
 *   tree-sitter parent.
 */
import { writeFileSync } from 'node:fs';
import { isEntry, walk, type TsNode } from './walk.mts';

const ROOT = `${process.cwd()}/`;
const { loadCorpusEntries, loadWebTreeSitter } = await import(`${ROOT}packages/tools/src/validate/common.ts`);
const { Parser, Language } = await loadWebTreeSitter();

type Side = 'leading' | 'trailing' | 'inner' | 'unowned';
const SIDES: Side[] = ['leading', 'trailing', 'inner', 'unowned'];

function ancestors(node: TsNode): TsNode[] {
	const out: TsNode[] = [];
	for (let at: TsNode | null = node; at !== null; at = at.parent) out.push(at);
	return out;
}

/** The smallest node containing both, by their ancestor chains. */
function common(a: TsNode, b: TsNode): TsNode {
	const ids = new Set(ancestors(a).map((node) => node.id));
	return ancestors(b).find((node) => ids.has(node.id))!;
}

/** The child of `owner` on `node`'s ancestor chain, when `node` lies under `owner`. */
function childOn(owner: TsNode, node: TsNode): TsNode | undefined {
	let child: TsNode | undefined;
	for (let at: TsNode | null = node; at !== null && at.id !== owner.id; at = at.parent) child = at;
	return child;
}

const sideHolders = (node: TsNode): TsNode[] => node.children.filter((child) => child.isNamed && !isEntry(child));

interface Tally {
	sources: number;
	entries: number;
	notParent: number;
	sides: Record<Side, number>;
	unownedBy: Record<string, number>;
	hiddenTokens: number;
	edges: number;
	beforeEdge: number;
	zeroWidth: number;
	errors: number;
}
const results: Record<string, Tally> = {};
const misses: { grammar: string; entry: string; kind: string; row: number; owner: string; parent: string }[] = [];

for (const grammar of ['rust', 'typescript', 'python', 'scm', 'regex']) {
	const parser = new Parser();
	parser.setLanguage(await Language.load(`${ROOT}packages/${grammar}/.sittir/parser.wasm`));
	const t: Tally = (results[grammar] = { sources: 0, entries: 0, notParent: 0, sides: { leading: 0, trailing: 0, inner: 0, unowned: 0 }, unownedBy: {}, hiddenTokens: 0, edges: 0, beforeEdge: 0, zeroWidth: 0, errors: 0 });
	for (const { name, source } of loadCorpusEntries(grammar)) {
		t.sources++;
		const root: TsNode = parser.parse(source).rootNode;
		const { tokens, entries } = walk(root, source);
		t.hiddenTokens += tokens.filter((token) => token.hidden && token.text !== '').length;
		t.edges += tokens.filter((token) => token.hidden && token.text === '').length;
		t.zeroWidth += tokens.filter((token) => !token.hidden && token.end === token.start).length;
		let k = -1;
		for (const entry of entries) {
			t.entries++;
			if (entry.node.type === 'ERROR') t.errors++;
			while (k + 1 < tokens.length && tokens[k + 1]!.end <= entry.start && tokens[k + 1]!.start < entry.start + (entry.end > entry.start ? 0 : 1)) k++;
			const left = tokens[k];
			const right = tokens[k + 1];
			const owner = left === undefined || right === undefined ? root : common(left.node, right.node);
			const parent = entry.node.parent ?? root;
			if (parent.id !== owner.id) {
				t.notParent++;
				misses.push({ grammar, entry: name, kind: entry.node.type, row: entry.node.startPosition.row, owner: owner.type, parent: parent.type });
			}
			const holders = sideHolders(owner);
			const leftChild = left === undefined ? undefined : childOn(owner, left.node);
			const rightChild = right === undefined ? undefined : childOn(owner, right.node);
			const lastOf = (child: TsNode): number => child.endIndex;
			const l = leftChild !== undefined && holders.some((h) => h.id === leftChild.id) && left!.end === lastOf(leftChild) ? leftChild : undefined;
			const r = rightChild !== undefined && holders.some((h) => h.id === rightChild.id) && right!.start === rightChild.startIndex ? rightChild : undefined;
			let side: Side;
			if (holders.length === 0) side = 'inner';
			else if (l === undefined && r === undefined) side = 'unowned';
			else if (l === undefined) side = 'leading';
			else if (r === undefined) side = 'trailing';
			else side = entry.node.startPosition.row === left!.endRow ? 'trailing' : 'leading';
			t.sides[side]++;
			if (side === 'trailing' && r === undefined && right !== undefined && right.hidden && right.text === '' && right.node.id === owner.id) t.beforeEdge++;
			if (side === 'unowned') t.unownedBy[owner.type] = (t.unownedBy[owner.type] ?? 0) + 1;
		}
	}
}

console.log(`${'grammar'.padEnd(11)} ${'srcs'.padStart(5)} ${'entries'.padStart(8)} ${'¬parent'.padStart(8)} ${SIDES.map((s) => s.padStart(9)).join(' ')} ${'hidden'.padStart(7)} ${'edges'.padStart(6)} ${'0-width'.padStart(8)} ${'@edge'.padStart(6)} ${'ERROR'.padStart(6)}  unowned by owner`);
for (const [grammar, t] of Object.entries(results)) {
	const by = Object.entries(t.unownedBy).sort((a, b) => b[1] - a[1]).map(([kind, n]) => `${kind} ${n}`).join(', ');
	console.log(`${grammar.padEnd(11)} ${String(t.sources).padStart(5)} ${String(t.entries).padStart(8)} ${String(t.notParent).padStart(8)} ${SIDES.map((s) => String(t.sides[s]).padStart(9)).join(' ')} ${String(t.hiddenTokens).padStart(7)} ${String(t.edges).padStart(6)} ${String(t.zeroWidth).padStart(8)} ${String(t.beforeEdge).padStart(6)} ${String(t.errors).padStart(6)}  ${by}`);
}
for (const miss of misses.slice(0, 40)) console.log(`  owner is not the parent: ${miss.grammar} ${miss.kind} row ${miss.row} in "${miss.entry}": owner ${miss.owner}, parent ${miss.parent}`);
if (process.argv[2]) writeFileSync(process.argv[2], JSON.stringify({ results, misses }, null, '\t'));
process.exitCode = misses.length > 0 ? 1 : 0;
