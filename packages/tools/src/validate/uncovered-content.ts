import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { allGrammars, assertGrammar, grammarPackage, sittirDirOf } from '@sittir/codegen/grammars';
import { invoke } from '../codegen-surface.ts';
import { spanOf } from '@sittir/common/utils';
import { loadCorpusEntries, loadKindNameFromId, loadNativeEngine, readNativeTree } from './common.ts';

interface Rule {
	readonly type: string;
	readonly name?: string;
	readonly value?: unknown;
	readonly content?: Rule;
	readonly members?: readonly Rule[];
}

interface GrammarRules {
	readonly rules: Readonly<Record<string, Rule>>;
	readonly externals: readonly Rule[];
	readonly inline?: readonly string[];
}

interface Span {
	readonly start: number;
	readonly end: number;
}

interface ReadNode {
	readonly $type: number;
	readonly $span?: Span;
}

export interface UncoveredContentRow {
	readonly kind: string;
	readonly nodes: number;
	readonly entries: readonly string[];
	readonly producers: readonly string[];
	readonly texts: readonly { readonly text: string; readonly count: number }[];
}

export interface UncoveredContentCensus {
	readonly grammar: string;
	readonly entries: number;
	readonly nodes: number;
	readonly rows: readonly UncoveredContentRow[];
}

const PREC = new Set(['PREC', 'PREC_LEFT', 'PREC_RIGHT', 'PREC_DYNAMIC']);

function isTerminalRule(rule: Rule): boolean {
	if (rule.type === 'TOKEN' || rule.type === 'IMMEDIATE_TOKEN' || rule.type === 'PATTERN' || rule.type === 'STRING') return true;
	return PREC.has(rule.type) && rule.content !== undefined && isTerminalRule(rule.content);
}

function hiddenProducers(grammar: GrammarRules): (symbol: string) => readonly string[] {
	const externals = new Set(grammar.externals.filter((rule) => rule.type === 'SYMBOL').map((rule) => rule.name!));
	const inline = new Set(grammar.inline ?? []);
	const cache = new Map<string, readonly string[]>();
	return (symbol) => {
		const cached = cache.get(symbol);
		if (cached !== undefined) return cached;
		const found = new Set<string>();
		const entered = new Set<string>();
		const walk = (rule: Rule | undefined, aliased: boolean): void => {
			if (rule === undefined) return;
			switch (rule.type) {
				case 'SYMBOL': {
					const name = rule.name!;
					if (aliased) return;
					if (externals.has(name)) {
						if (name.startsWith('_')) found.add(`external ${name}`);
						return;
					}
					const definition = grammar.rules[name];
					if (definition === undefined || !(name.startsWith('_') || inline.has(name))) return;
					if (isTerminalRule(definition)) {
						found.add(`hidden terminal rule ${name}`);
						return;
					}
					if (entered.has(name)) return;
					entered.add(name);
					walk(definition, false);
					return;
				}
				case 'PATTERN':
					found.add(`unnamed pattern /${String(rule.value)}/`);
					return;
				case 'TOKEN':
				case 'IMMEDIATE_TOKEN':
					if (rule.content?.type !== 'STRING') found.add(`unnamed ${rule.type.toLowerCase()} ${JSON.stringify(rule.content)}`);
					return;
				case 'STRING':
				case 'BLANK':
					return;
				case 'ALIAS':
					walk(rule.content, true);
					return;
				default:
					walk(rule.content, aliased);
					for (const member of rule.members ?? []) walk(member, aliased);
			}
		};
		walk(grammar.rules[symbol], false);
		const producers = [...found].sort();
		cache.set(symbol, producers);
		return producers;
	};
}

function readNodes(value: unknown, out: ReadNode[]): void {
	if (Array.isArray(value)) {
		for (const item of value) readNodes(item, out);
		return;
	}
	if (value === null || typeof value !== 'object') return;
	const node = value as Record<string, unknown>;
	if (typeof node.$type === 'number' && spanOf(node) !== undefined) out.push(node as unknown as ReadNode);
	for (const child of Object.values(node)) readNodes(child, out);
}

function uncoveredRuns(source: Buffer, node: ReadNode, descendants: readonly ReadNode[]): string[] {
	const span = spanOf(node)!;
	const covered = new Uint8Array(span.end - span.start);
	for (const descendant of descendants) {
		const inner = spanOf(descendant)!;
		const start = Math.max(inner.start, span.start);
		const end = Math.min(inner.end, span.end);
		if (end > start) covered.fill(1, start - span.start, end - span.start);
	}
	const runs: string[] = [];
	let from = -1;
	for (let i = 0; i <= covered.length; i++) {
		if (i < covered.length && covered[i] === 0) {
			if (from < 0) from = i;
			continue;
		}
		if (from >= 0) {
			const text = source.subarray(span.start + from, span.start + i).toString('utf8').trim();
			if (text !== '') runs.push(text);
			from = -1;
		}
	}
	return runs;
}

export async function computeUncoveredContentCensus(name: string): Promise<UncoveredContentCensus> {
	const grammar = assertGrammar(name);
	const rules = JSON.parse(readFileSync(join(sittirDirOf(grammarPackage(grammar)), 'src', 'grammar.json'), 'utf8')) as GrammarRules;
	const producersOf = hiddenProducers(rules);
	const kindName = (await loadKindNameFromId(grammar))!;
	const tables = (await invoke('generatedMetadata', 'loadGeneratedIdTables', grammar)) as {
		readonly kindIds?: ReadonlyMap<string, unknown> | Readonly<Record<string, unknown>>;
	};
	const parserNames = new Map<number, string>();
	const kindIds = tables.kindIds ?? {};
	for (const [, value] of kindIds instanceof Map ? kindIds.entries() : Object.entries(kindIds)) {
		const entry = value as { readonly id?: number; readonly parser?: { readonly parserName?: string } };
		if (entry.id !== undefined && entry.parser?.parserName !== undefined) parserNames.set(entry.id, entry.parser.parserName);
	}
	const engine = await loadNativeEngine(grammar);
	const entries = loadCorpusEntries(grammar);
	const byKind = new Map<string, { nodes: number; entries: Set<string>; producers: readonly string[]; texts: Map<string, number> }>();
	let nodes = 0;
	for (const entry of entries) {
		const source = Buffer.from(entry.source, 'utf8');
		const all: ReadNode[] = [];
		readNodes(readNativeTree(engine, entry.source, { depth: Infinity }).root, all);
		for (const node of all) {
			const nested: ReadNode[] = [];
			for (const [key, value] of Object.entries(node)) if (key !== '$span') readNodes(value, nested);
			const span = spanOf(node)!;
			const descendants = nested.filter((nestedNode) => {
				const inner = spanOf(nestedNode)!;
				return inner.start < span.end && inner.end > span.start;
			});
			if (descendants.length === 0) continue;
			const runs = uncoveredRuns(source, node, descendants);
			if (runs.length === 0) continue;
			nodes++;
			const kind = kindName(node.$type) ?? String(node.$type);
			let row = byKind.get(kind);
			if (row === undefined) {
				row = { nodes: 0, entries: new Set(), producers: producersOf(parserNames.get(node.$type) ?? kind), texts: new Map() };
				byKind.set(kind, row);
			}
			row.nodes++;
			row.entries.add(entry.name);
			for (const text of runs) row.texts.set(text, (row.texts.get(text) ?? 0) + 1);
		}
	}
	const rows = [...byKind.entries()]
		.map(([kind, row]) => ({
			kind,
			nodes: row.nodes,
			entries: [...row.entries].sort(),
			producers: row.producers,
			texts: [...row.texts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([text, count]) => ({ text, count }))
		}))
		.sort((a, b) => b.nodes - a.nodes || a.kind.localeCompare(b.kind));
	return { grammar, entries: entries.length, nodes, rows };
}

export interface UncoveredContentOptions {
	readonly grammar: string;
	readonly allGrammars: boolean;
	readonly json: boolean;
}

export async function run(opts: UncoveredContentOptions): Promise<number> {
	const grammars = opts.allGrammars ? allGrammars() : [assertGrammar(opts.grammar)];
	const censuses: UncoveredContentCensus[] = [];
	for (const grammar of grammars) censuses.push(await computeUncoveredContentCensus(grammar));
	if (opts.json) {
		console.log(JSON.stringify(opts.allGrammars ? censuses : censuses[0], null, 2));
	} else {
		for (const census of censuses) {
			console.log(`# ${census.grammar}: ${census.nodes} node(s) over ${census.entries} corpus entries`);
			for (const row of census.rows) {
				console.log(`${row.kind}\tnodes=${row.nodes}\tentries=${row.entries.length}\t${row.producers.join('; ') || '-'}`);
				for (const { text, count } of row.texts) console.log(`\t${JSON.stringify(text)}\t×${count}`);
			}
		}
	}
	return censuses.some((census) => census.nodes > 0) ? 1 : 0;
}
