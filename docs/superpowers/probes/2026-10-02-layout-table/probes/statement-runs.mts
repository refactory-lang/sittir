/**
 * Measures: blank lines between adjacent statements, within a run of one key
 * and at a boundary where the key changes, under four keyings:
 *   kind       the parser kind (the gap census's `--runs` grouping);
 *   through    wrappers keyed by what they hold: python `simple_statements`
 *              by its first statement, `decorated_definition` by its
 *              definition, typescript `export_statement*` by its first named
 *              child (the declaration it exports);
 *   role       `through`, then the bindings role (`import_statement` and
 *              `import_from_statement` are both `import`);
 *   seated     `through`, with rust `attribute_item`s seated onto the item
 *              after them: the attribute-to-item gaps are the item's own and
 *              leave the census, and the unit starts at its first attribute.
 * Also: python module-level boundaries from an import run to a def or class.
 * Sources: each grammar's corpus, and real-world files chosen deterministically
 * (every k-th path, sorted, 1.5-30 KB, that parses without an error):
 *   rust        ~/.cargo/registry/src/<index>/<crate>/src/<file>.rs
 *   typescript  node_modules/<pkg>/<file>.ts (no .d.ts)
 *   python      the 3.14 standard library, top-level .py
 * Gaps holding a comment are left out, as in the gap census.
 * Run (from the root of the checkout to measure):
 *   ./node_modules/.bin/tsx <probes>/statement-runs.mts [files-per-grammar]   default: 120
 * Prints: per grammar, source set and list, the share of gaps (on separate
 *   lines) holding a blank line within runs and at boundaries, with the
 *   histograms, per keying; then the python import-to-definition table.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const ROOT = `${process.cwd()}/`;
const { loadCorpusEntries, loadWebTreeSitter } = await import(`${ROOT}packages/tools/src/validate/common.ts`);
// The parser alone: the tools' loader also checks the native binaries, which this probe never uses.
async function loadLanguageForGrammar(grammar: string): Promise<{ Parser: new () => any; lang: unknown }> {
	const { Parser, Language } = await loadWebTreeSitter();
	return { Parser, lang: await Language.load(`${ROOT}packages/${grammar}/.sittir/parser.wasm`) };
}
const { blankBucketOf, rolesOfBindings, BLANK_BUCKETS } = await import(`${ROOT}packages/tools/src/validate/gap-runs.ts`);
const { grammarPackage } = await import(`${ROOT}packages/codegen/src/grammars.ts`);

type Node = {
	type: string;
	isNamed: boolean;
	isExtra: boolean;
	startIndex: number;
	endIndex: number;
	children: Node[];
	namedChildren: Node[];
	fieldNameForChild(index: number): string | null;
	childForFieldName(name: string): Node | null;
};
type Bucket = (typeof BLANK_BUCKETS)[number];
type Histogram = Record<Bucket, number>;
const PER_GRAMMAR = Number(process.argv[2] ?? 120);
const KEYINGS = ['kind', 'through', 'role', 'seated'] as const;
type Keying = (typeof KEYINGS)[number];

function walk(dir: string, accept: (path: string) => boolean, out: string[], depth = 0): void {
	if (depth > 8) return;
	let names: string[];
	try {
		names = readdirSync(dir);
	} catch {
		return;
	}
	for (const name of names.sort()) {
		const path = join(dir, name);
		let stat;
		try {
			stat = statSync(path);
		} catch {
			continue;
		}
		if (stat.isDirectory()) walk(path, accept, out, depth + 1);
		else if (accept(path) && stat.size >= 1536 && stat.size <= 30720) out.push(path);
	}
}

function realWorld(grammar: string): string[] {
	const paths: string[] = [];
	if (grammar === 'rust') {
		const registry = join(homedir(), '.cargo/registry/src');
		for (const index of readdirSync(registry)) walk(join(registry, index), (p) => p.endsWith('.rs') && p.includes('/src/'), paths);
	} else if (grammar === 'typescript') {
		walk(join(ROOT, 'node_modules'), (p) => p.endsWith('.ts') && !p.endsWith('.d.ts') && !p.includes('/test'), paths);
	} else {
		const lib = '/opt/homebrew/opt/python@3.14/Frameworks/Python.framework/Versions/3.14/lib/python3.14';
		for (const name of readdirSync(lib).sort()) {
			const path = join(lib, name);
			if (name.endsWith('.py') && statSync(path).size >= 1536 && statSync(path).size <= 30720) paths.push(path);
		}
	}
	return paths;
}

const firstNamed = (node: Node): Node | null => node.namedChildren.find((child) => !child.isExtra) ?? null;
const THROUGH: Record<string, (node: Node) => Node | null> = {
	simple_statements: firstNamed,
	simple_statements_elements: firstNamed,
	decorated_definition: (node) => node.childForFieldName('definition')
};
const throughOf = (node: Node): Node | null | undefined => (node.type.startsWith('export_statement') ? firstNamed(node) : THROUGH[node.type]?.(node));

function throughKind(node: Node): string {
	let at = node;
	for (let depth = 0; depth < 4; depth++) {
		const next = throughOf(at);
		if (next === null || next === undefined) break;
		at = next;
	}
	return at.type;
}

interface Unit {
	readonly node: Node;
	readonly start: number;
	readonly end: number;
	readonly kind: string;
	readonly through: string;
}

function lists(root: Node, seat: boolean): { list: string; units: Unit[] }[] {
	const out: { list: string; units: Unit[] }[] = [];
	const visit = (node: Node): void => {
		const items: Node[] = [];
		node.children.forEach((child, index) => {
			if (node.fieldNameForChild(index) === 'statements' && child.isNamed && !child.isExtra) items.push(child);
		});
		if (items.length > 1) {
			const units: Unit[] = [];
			let pendingStart: number | undefined;
			for (const item of items) {
				if (seat && item.type === 'attribute_item') {
					pendingStart ??= item.startIndex;
					continue;
				}
				units.push({ node: item, start: pendingStart ?? item.startIndex, end: item.endIndex, kind: item.type, through: throughKind(item) });
				pendingStart = undefined;
			}
			out.push({ list: node.type, units });
		}
		for (const child of node.children) visit(child);
	};
	visit(root);
	return out;
}

const empty = (): Histogram => Object.fromEntries(BLANK_BUCKETS.map((b: Bucket) => [b, 0])) as Histogram;
type Tally = { within: Histogram; boundary: Histogram };
const share = (h: Histogram): string => {
	const lines = BLANK_BUCKETS.filter((b: Bucket) => b !== 'same-line').reduce((t: number, b: Bucket) => t + h[b], 0);
	const blank = lines - h['0'];
	return lines === 0 ? '  n/a' : `${((100 * blank) / lines).toFixed(1).padStart(5)}%`;
};
const line = (h: Histogram): string => BLANK_BUCKETS.map((b: Bucket) => `${b === 'same-line' ? 'sl' : b}:${h[b]}`).join(' ');

async function measure(grammar: string, label: string, sources: { name: string; source: string }[]): Promise<void> {
	const { Parser, lang } = await loadLanguageForGrammar(grammar);
	const parser = new Parser();
	parser.setLanguage(lang);
	const roles: Map<string, string> = rolesOfBindings(readFileSync(join(grammarPackage(grammar).dir, 'bindings.scm'), 'utf-8'));
	const tallies = new Map<string, Record<Keying, Tally>>();
	const importToDef = empty();
	const importToOther = empty();
	let parsed = 0;
	for (const { source } of sources) {
		const tree = parser.parse(source);
		if (tree === null || tree.rootNode.hasError) {
			tree?.delete();
			continue;
		}
		parsed += 1;
		for (const seat of [false, true]) {
			if (seat && grammar !== 'rust') continue;
			for (const { list, units } of lists(tree.rootNode as unknown as Node, seat)) {
				let tally = tallies.get(list);
				if (tally === undefined) {
					tally = Object.fromEntries(KEYINGS.map((k) => [k, { within: empty(), boundary: empty() }])) as Record<Keying, Tally>;
					tallies.set(list, tally);
				}
				for (let at = 0; at + 1 < units.length; at++) {
					const [left, right] = [units[at]!, units[at + 1]!];
					const gap = source.slice(left.end, right.start);
					if (/\S/.test(gap)) continue;
					const bucket: Bucket = blankBucketOf(gap);
					const keys: Partial<Record<Keying, [string, string]>> = seat
						? { seated: [left.through, right.through] }
						: {
								kind: [left.kind, right.kind],
								through: [left.through, right.through],
								role: [roles.get(left.through) ?? left.through, roles.get(right.through) ?? right.through]
							};
					for (const [keying, pair] of Object.entries(keys) as [Keying, [string, string]][]) {
						tally[keying][pair[0] === pair[1] ? 'within' : 'boundary'][bucket] += 1;
					}
					if (!seat && grammar === 'python' && list === 'module' && /^(future_)?import(_from)?_statement$/.test(left.through) && !/import/.test(right.through)) {
						(/^(function|class)_definition$/.test(right.through) ? importToDef : importToOther)[bucket] += 1;
					}
				}
			}
		}
		tree.delete();
	}
	console.log(`\n## ${grammar}, ${label}: ${parsed} of ${sources.length} sources parsed`);
	for (const [list, tally] of tallies) {
		console.log(`### ${list}`);
		console.log(`| keying | within: blank share | at a boundary: blank share | within | boundary |`);
		console.log(`| --- | --- | --- | --- | --- |`);
		for (const keying of KEYINGS) {
			if (keying === 'seated' && grammar !== 'rust') continue;
			const t = tally[keying];
			console.log(`| ${keying} | ${share(t.within)} | ${share(t.boundary)} | ${line(t.within)} | ${line(t.boundary)} |`);
		}
	}
	if (grammar === 'python') {
		console.log(`python module, import run to a def or class: ${line(importToDef)} (blank share ${share(importToDef)})`);
		console.log(`python module, import run to anything else:  ${line(importToOther)} (blank share ${share(importToOther)})`);
	}
}

for (const grammar of ['rust', 'typescript', 'python']) {
	await measure(grammar, 'corpus', loadCorpusEntries(grammar).map((e: { name?: string; source: string }) => ({ name: e.name ?? '', source: e.source })));
	const all = realWorld(grammar);
	const stride = Math.max(1, Math.floor(all.length / (PER_GRAMMAR * 1.3)));
	const picked = all.filter((_, i) => i % stride === 0).slice(0, Math.ceil(PER_GRAMMAR * 1.3));
	await measure(grammar, `real-world (${picked.length} picked of ${all.length})`, picked.map((p) => ({ name: p, source: readFileSync(p, 'utf-8') })));
}
