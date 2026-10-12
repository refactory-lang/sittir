// Parse a python corpus with the base and the visible-indent parser and compare what python's
// bindings.scm claims.
//
// usage (from a worktree with web-tree-sitter installed):
//   tsx trees.mts <base parser.wasm> <after parser.wasm> <bindings.scm> <test-fixtures.json>
//
// The corpus is every distinct `expectedOutput` of the python render fixtures. For each source,
// each wasm parses it, the whole bindings.scm runs as one query, and the captures
// (name, type, byte span) are compared. The after parse also reports the new nodes: their count,
// widths and parents.
import { readFileSync } from 'node:fs';
import { Language, Parser, Query } from 'web-tree-sitter';

const [baseWasm, afterWasm, scmPath, fixturesPath] = process.argv.slice(2);
await Parser.init();
const load = async (path: string) => {
	const parser = new Parser();
	const language = await Language.load(path);
	parser.setLanguage(language);
	return { parser, language };
};
const base = await load(baseWasm);
const after = await load(afterWasm);
const scm = readFileSync(scmPath, 'utf8');
const baseQuery = new Query(base.language, scm);
const afterQuery = new Query(after.language, scm);

const fixtures = JSON.parse(readFileSync(fixturesPath, 'utf8')) as { grammar: string; expectedOutput?: string }[];
const sources = [...new Set(fixtures.filter((f) => f.grammar === 'python' && typeof f.expectedOutput === 'string').map((f) => f.expectedOutput!))];

type Cap = string;
const capsOf = (query: Query, parser: Parser, src: string): Cap[] => {
	const tree = parser.parse(src);
	if (tree === null) return ['<no tree>'];
	const out = query
		.captures(tree.rootNode)
		.map((c) => `${c.name}|${c.node.type}|${c.node.startIndex}-${c.node.endIndex}`);
	tree.delete();
	return out.sort();
};

let sourcesWithDiff = 0;
let capturesBase = 0;
let capturesAfter = 0;
const diffs = new Map<string, number>();
const parents = new Map<string, number>();
let newNodes = 0;
let nonZeroWidth = 0;
let hasError = 0;
let hasErrorBase = 0;
for (const src of sources) {
	const a = capsOf(baseQuery, base.parser, src);
	const b = capsOf(afterQuery, after.parser, src);
	capturesBase += a.length;
	capturesAfter += b.length;
	const as = new Set(a);
	const bs = new Set(b);
	const only = [...as].filter((x) => !bs.has(x)).map((x) => `- ${x.split('|')[0]}`).concat([...bs].filter((x) => !as.has(x)).map((x) => `+ ${x.split('|')[0]}`));
	if (only.length > 0) sourcesWithDiff++;
	for (const o of only) diffs.set(o, (diffs.get(o) ?? 0) + 1);

	const tree = after.parser.parse(src)!;
	if (tree.rootNode.hasError) hasError++;
	const stack = [tree.rootNode];
	while (stack.length > 0) {
		const n = stack.pop()!;
		if ((n.type === 'indent' || n.type === 'dedent') && n.isNamed) {
			newNodes++;
			if (n.endIndex !== n.startIndex) nonZeroWidth++;
			const key = `${n.type} in ${n.parent?.type}`;
			parents.set(key, (parents.get(key) ?? 0) + 1);
		}
		for (const c of n.children) stack.push(c);
	}
	tree.delete();
	const t0 = base.parser.parse(src)!;
	if (t0.rootNode.hasError) hasErrorBase++;
	t0.delete();
}
console.log(JSON.stringify({ sources: sources.length, sourcesWithDiff, capturesBase, capturesAfter, hasErrorBase, hasErrorAfter: hasError, newNodes, nonZeroWidth }));
console.log('capture differences (name: sources):', JSON.stringify([...diffs]));
console.log('new nodes by parent:', JSON.stringify([...parents]));
