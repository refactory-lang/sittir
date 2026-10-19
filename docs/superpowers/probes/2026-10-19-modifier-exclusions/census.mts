// Every combination of up to three atoms at each site (sites.mts), judged by sittir's parser and the
// language's compiler (the over-acceptance probe's judges). A combination is:
// - `grammar` when no order of its modifiers parses clean with the site's kind present;
// - `valid` when some clean order compiles;
// - `rejected` when every clean order is refused; `minimal` when no smaller combination is rejected
//   (a smaller one the grammar refuses still counts: another arm of the kind may admit the larger).
// A minimal rejected combination is an `exclusion` when no other site of the same kind accepts it,
// and `context` when one does: the kind is the same, the place decides.
// A minimal combination the grammar refuses is a `hole` when the builder can still build it: some
// kind of the site has, in its node model, a slot for every atom (and admits the kind an atom
// names). The parser then refuses what the builder renders.
// Usage: tsx census.mts [checkout] — the checkout whose parsers (packages/<g>/.sittir/parser.wasm)
// and node models (packages/<g>/src/node-model.json5) are read.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { judges, removeScratch } from '../2026-10-15-grammar-over-acceptance/judges.mts';
import { sites, type Atom, type Site } from './sites.mts';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../../..');
const CHECKOUT = resolve(process.argv[2] ?? ROOT);
const MAX = 3;

const toolsRequire = createRequire(join(ROOT, 'packages/tools/package.json'));
const { Parser, Language } = toolsRequire('web-tree-sitter') as typeof import('web-tree-sitter');
await Parser.init();

async function parserFor(wasm: string) {
	const parser = new Parser();
	parser.setLanguage(await Language.load(wasm));
	return ({ source, at }: Rendered, kinds: readonly string[]): string | undefined => {
		const tree = parser.parse(source);
		if (!tree || tree.rootNode.hasError) return undefined;
		const covers = (n: import('web-tree-sitter').Node): boolean => n.startIndex <= at && at < n.endIndex;
		const holds = (n: import('web-tree-sitter').Node, kind: string): boolean =>
			covers(n) && (n.type === kind || n.children.some((c) => c !== null && holds(c, kind)));
		return kinds.find((kind) => holds(tree.rootNode, kind));
	};
}

function subsets(atoms: readonly Atom[]): Atom[][] {
	const out: Atom[][] = [[]];
	const grow = (from: number, current: Atom[]): void => {
		for (let i = from; i < atoms.length; i++) {
			const atom = atoms[i]!;
			if (atom.one !== undefined && current.some((a) => a.one === atom.one)) continue;
			if (current.some((a) => a.at === atom.at && a.at !== 'mods')) continue;
			const next = [...current, atom];
			out.push(next);
			if (next.length < MAX) grow(i + 1, next);
		}
	};
	grow(0, []);
	return out;
}

function permutations<T>(items: readonly T[]): T[][] {
	if (items.length <= 1) return [[...items]];
	return items.flatMap((item, i) => permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest]));
}

// `at` is where the template's first placeholder lands: a position inside the site's own construct, so the
// kind check looks there and not at the prelude's declarations of the same kind.
interface Rendered {
	readonly source: string;
	readonly at: number;
}

function render(site: Site, chosen: readonly Atom[], order: readonly string[]): Rendered {
	const fills: Record<string, string> = { ...site.defaults };
	for (const atom of chosen) Object.assign(fills, atom.fill ?? {});
	for (const atom of chosen) if (atom.at !== 'mods') fills[atom.at] = atom.text;
	fills.mods = order.map((m) => `${m} `).join('');
	const fill = (text: string): string => text.replace(/\{(\w+)\}/g, (_, key: string) => fills[key] ?? '');
	return { source: fill(site.template), at: fill(site.template.slice(0, site.template.search(/\{\w+\}/))).length };
}

// Only syntax and grammar errors count, as for the over-acceptance probe's tracker rows: a type error
// (TS2xxx) is the template's, never the combination's. TS2369, a parameter property outside a
// constructor, is a grammar rule the checker numbers among the type errors.
const GRAMMAR_ERRORS: Record<string, (verdict: string) => string> = {
	typescript: (verdict) => verdict.split(' | ').filter((e) => /^TS(1\d{3}|17\d{3}|18\d{3}|2369) /.test(e)).join(' | ') || 'accepted',
	rust: (verdict) => verdict,
	python: (verdict) => verdict
};

// A rejection that names a feature gate, at any site of the kind, is syntax the stable language lacks
// and nightly may accept: it is no exclusion.
const UNSTABLE: Record<string, (codes: string) => boolean> = {
	typescript: () => false,
	rust: (codes) => codes.includes('error[E0658]'),
	python: () => false
};

const ORDER_ONLY: Record<string, (codes: string) => boolean> = {
	typescript: (codes) => codes.split(' | ').every((c) => c.startsWith('TS1029 ')),
	rust: (codes) => codes.split(' | ').every((c) => c.startsWith('error: expected one of')),
	python: () => false
};

interface ModelNode {
	readonly kind: string;
	readonly slots: readonly { readonly name: string; readonly values?: readonly { readonly parseKind?: string }[] }[];
}

function builds(model: ReadonlyMap<string, ModelNode>, kinds: readonly string[], atoms: readonly Atom[]): string[] {
	return kinds.filter((kind) => {
		const slots = model.get(kind)?.slots ?? [];
		return (
			slots.length > 0 &&
			atoms.every((atom) => {
				const slot = slots.find((s) => s.name === atom.slot);
				return slot !== undefined && (atom.holds === undefined || (slot.values ?? []).some((v) => v.parseKind === atom.holds));
			})
		);
	});
}

interface Row {
	readonly site: string;
	readonly atoms: string;
	readonly verdict: 'grammar' | 'valid' | 'rejected' | 'order';
	readonly kind: string;
	readonly codes: string;
	readonly witness: string;
	minimal: boolean;
	line: string;
}

mkdirSync(join(HERE, 'results'), { recursive: true });
for (const [grammar, list] of Object.entries(sites)) {
	const parse = await parserFor(join(CHECKOUT, `packages/${grammar}/.sittir/parser.wasm`));
	const nodes = (JSON.parse(readFileSync(join(CHECKOUT, `packages/${grammar}/src/node-model.json5`), 'utf8')) as { nodes: ModelNode[] }).nodes;
	const model = new Map(nodes.map((n) => [n.kind, n]));
	const planned = list.flatMap((site) =>
		subsets(site.atoms).map((chosen) => {
			const mods = [...(site.fixed ?? []), ...chosen.filter((a) => a.at === 'mods').map((a) => a.text)];
			const clean = permutations(mods).flatMap((order) => {
				const rendered = render(site, chosen, order);
				const kind = parse(rendered, site.kinds);
				return kind === undefined ? [] : [{ source: rendered.source, kind }];
			});
			return { site, chosen, clean };
		})
	);
	const sources = [...new Set(planned.flatMap((p) => p.clean.map((c) => c.source)))];
	const judged = judges[grammar]!(sources);
	const verdicts = new Map(sources.map((s, i) => [s, GRAMMAR_ERRORS[grammar]!(judged[i]!)] as const));
	const rows: Row[] = planned.map(({ site, chosen, clean }) => {
		const atoms = chosen.map((a) => a.name).join(' + ') || '(none)';
		if (clean.length === 0) return { site: site.name, atoms, verdict: 'grammar', kind: '', codes: '', witness: render(site, chosen, [...(site.fixed ?? []), ...chosen.filter((a) => a.at === 'mods').map((a) => a.text)]).source, minimal: false, line: '' };
		const accepted = clean.find((c) => verdicts.get(c.source) === 'accepted');
		if (accepted !== undefined) return { site: site.name, atoms, verdict: 'valid', kind: accepted.kind, codes: '', witness: accepted.source, minimal: false, line: '' };
		const first = clean[0]!;
		const codes = verdicts.get(first.source)!;
		const verdict = clean.every((c) => ORDER_ONLY[grammar]!(verdicts.get(c.source)!)) ? 'order' : 'rejected';
		return { site: site.name, atoms, verdict, kind: first.kind, codes, witness: first.source, minimal: false, line: '' };
	});
	const at = (site: string, atoms: string): Row | undefined => rows.find((r) => r.site === site && r.atoms === atoms);
	const control = list.map((site) => at(site.name, '(none)')!);
	const broken = control.filter((r) => r.verdict !== 'valid');
	if (broken.length > 0) throw new Error(`${grammar}: a site's control does not compile: ${broken.map((r) => `${r.site} (${r.verdict} ${r.codes})`).join('; ')}`);
	for (const row of rows) {
		if (row.verdict !== 'rejected' && row.verdict !== 'grammar') continue;
		const site = list.find((s) => s.name === row.site)!;
		const names = row.atoms.split(' + ');
		const chosen = site.atoms.filter((a) => names.includes(a.name));
		const smaller = subsets(chosen).filter((s) => s.length < names.length);
		row.minimal = smaller.every((s) => at(row.site, s.map((a) => a.name).join(' + ') || '(none)')?.verdict !== row.verdict);
		if (!row.minimal) continue;
		if (row.verdict === 'grammar') {
			const holes = builds(model, site.kinds, chosen);
			row.line = holes.length === 0 ? 'grammar' : `hole (${holes.join(', ')})`;
			continue;
		}
		const kindsOf = (name: string): readonly string[] => list.find((s) => s.name === name)!.kinds;
		const elsewhere = rows.find((r) => r.site !== row.site && r.atoms === row.atoms && r.verdict === 'valid' && kindsOf(r.site).includes(row.kind));
		const gated = rows.some((r) => r.atoms === row.atoms && r.verdict === 'rejected' && kindsOf(r.site).includes(row.kind) && UNSTABLE[grammar]!(r.codes));
		row.line = gated ? 'unstable' : elsewhere === undefined ? 'exclusion' : `context (valid at ${elsewhere.site})`;
	}
	const tsv = ['site\tatoms\tverdict\tminimal\tline\tkind\tcodes\twitness', ...rows.map((r) => [r.site, r.atoms, r.verdict, r.minimal ? 'yes' : '', r.line, r.kind, r.codes, JSON.stringify(r.witness)].join('\t'))];
	writeFileSync(join(HERE, 'results', `${grammar}.tsv`), `${tsv.join('\n')}\n`);
	const count = (v: Row['verdict']): number => rows.filter((r) => r.verdict === v).length;
	const minimal = rows.filter((r) => r.minimal);
	const rejected = minimal.filter((r) => r.verdict === 'rejected');
	const holes = minimal.filter((r) => r.line.startsWith('hole'));
	console.log(`${grammar}: ${rows.length} combinations at ${list.length} sites: ${count('valid')} valid, ${count('grammar')} refused by the grammar (${holes.length} minimal holes), ${count('order')} order only, ${count('rejected')} rejected (${rejected.length} minimal)`);
	for (const r of [...rejected, ...holes]) console.log(`  ${r.line.padEnd(10)} ${r.kind}: ${r.atoms}  [${r.site}]  ${r.codes}`);
}
removeScratch();
