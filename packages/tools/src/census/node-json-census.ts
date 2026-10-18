import { stableGrammars, assertGrammar } from '@sittir/codegen/grammars';
import { buildNodeMap, invoke, load } from '../codegen-surface.ts';
import { requireGrammarModule } from '../grammar-internals.ts';
import { loadCorpusEntries, loadNativeEngine } from '../validate/common.ts';

export type SlotShape = 'node' | 'list' | 'kind-id' | 'boolean' | 'string' | 'undefined' | 'throws' | 'no-member';

export interface TextLeafRow {
	readonly kind: string;
	readonly instances: number;
	readonly rendering: number;
}

export interface NodeJsonCensus {
	readonly grammar: string;
	readonly entries: number;
	readonly skipped: number;
	readonly readFailures: readonly { readonly message: string; readonly count: number }[];
	readonly textLeaves: readonly TextLeafRow[];
	readonly unbuildable: readonly string[];
	readonly unitsProduced: number;
	readonly slotShapes: Readonly<Record<string, Readonly<Record<string, Readonly<Partial<Record<SlotShape, number>>>>>>>;
	readonly commentKinds: readonly string[];
}

interface Walked {
	readonly $type: number;
	readonly $render?: unknown;
	readonly $query: () => { readonly $descendants: Iterable<Walked> };
}

const isObject = (value: unknown): value is object => typeof value === 'object' && value !== null;

export function slotShapeOf(value: unknown): SlotShape {
	if (value === undefined) return 'undefined';
	if (typeof value === 'boolean') return 'boolean';
	if (typeof value === 'string') return 'string';
	if (typeof value === 'number') return 'kind-id';
	if (Array.isArray(value)) return 'list';
	if (isObject(value) && '$type' in value) return 'node';
	return isObject(value) && Symbol.iterator in value ? 'list' : 'undefined';
}

function readShape(node: Walked, accessor: string): SlotShape {
	const member = (node as unknown as Record<string, unknown>)[accessor];
	if (typeof member !== 'function') return 'no-member';
	try {
		return slotShapeOf(member.call(node));
	} catch {
		return 'throws';
	}
}

export async function nodeJsonCensus(grammar: string): Promise<NodeJsonCensus> {
	const nodeMap = await buildNodeMap(grammar);
	const tables = await invoke('generatedMetadata', 'loadGeneratedIdTables', grammar);
	if (tables === undefined) throw new Error(`node-json-census: no generated id tables for grammar '${grammar}'; run gen first`);
	const { collectKindEntries, collectCatalogKinds } = await load('kindDiscriminant');
	const { leafTextChecks } = await load('from');
	const { unitKindIds } = await load('wrap');
	const leafKinds = leafTextChecks(nodeMap, collectKindEntries(collectCatalogKinds(tables), nodeMap, tables))
		.filter((check) => check.pattern !== undefined)
		.map((check) => check.kind);

	const { KIND_NAMES, kindIdFromName } = await requireGrammarModule(grammar, 'types.ts');
	const { _fromMap } = await requireGrammarModule(grammar, 'factories/coerce.ts');
	const { triviaFacts, querySlots } = await requireGrammarModule(grammar, 'utils.ts');
	const nameOf = (id: number): string => KIND_NAMES.get(id) ?? String(id);
	const units = new Set(unitKindIds(nodeMap).map(nameOf));

	const engine = await loadNativeEngine(grammar);
	const leaves = new Map<string, { instances: number; rendering: number }>(leafKinds.map((kind) => [kind, { instances: 0, rendering: 0 }]));
	const produced = new Set<string>();
	const shapes = new Map<string, Map<string, Map<SlotShape, number>>>();
	const readFailures = new Map<string, number>();
	let [entries, skipped] = [0, 0];
	for (const entry of loadCorpusEntries(grammar)) {
		let items: (Walked | number)[];
		try {
			const root = engine.parse(entry.source) as unknown as Walked;
			items = [root, ...root.$query().$descendants];
		} catch (error) {
			skipped += 1;
			const message = String(error instanceof Error ? error.message : error);
			readFailures.set(message, (readFailures.get(message) ?? 0) + 1);
			continue;
		}
		entries += 1;
		for (const item of items) {
			if (typeof item === 'number') {
				produced.add(nameOf(item));
				continue;
			}
			const node = item;
			const kind = nameOf(node.$type);
			produced.add(kind);
			const leaf = leaves.get(kind);
			if (leaf !== undefined) {
				leaf.instances += 1;
				if (typeof node.$render === 'function') leaf.rendering += 1;
			}
			for (const [accessor] of querySlots[node.$type] ?? []) {
				const byAccessor = shapes.get(kind) ?? new Map<string, Map<SlotShape, number>>();
				const counts = byAccessor.get(accessor) ?? new Map<SlotShape, number>();
				const shape = readShape(node, accessor);
				counts.set(shape, (counts.get(shape) ?? 0) + 1);
				byAccessor.set(accessor, counts);
				shapes.set(kind, byAccessor);
			}
		}
	}

	const layout = new Set([...triviaFacts.layout].map(nameOf));
	const known = (name: string): boolean => {
		try {
			return kindIdFromName(name) !== undefined;
		} catch {
			return false;
		}
	};
	return {
		grammar,
		entries,
		skipped,
		readFailures: [...readFailures].map(([message, count]) => ({ message, count })).sort((a, b) => b.count - a.count || a.message.localeCompare(b.message)),
		textLeaves: [...leaves].map(([kind, row]) => ({ kind, ...row })).sort((a, b) => a.kind.localeCompare(b.kind)),
		unbuildable: [...produced].filter((kind) => !(kind in _fromMap) && !units.has(kind)).sort(),
		unitsProduced: [...produced].filter((kind) => units.has(kind)).length,
		slotShapes: Object.fromEntries(
			[...shapes].sort(([a], [b]) => a.localeCompare(b)).map(([kind, byAccessor]) => [
				kind,
				Object.fromEntries([...byAccessor].map(([accessor, counts]) => [accessor, Object.fromEntries(counts)]))
			])
		),
		commentKinds: [...triviaFacts.kinds].filter((name) => known(name) && !layout.has(name)).sort()
	};
}

export function formatNodeJsonCensus(census: NodeJsonCensus): string {
	const unwrapped = census.textLeaves.filter((row) => row.rendering < row.instances || row.instances === 0);
	const lines = [`# ${census.grammar}: ${census.entries} corpus entries parsed, ${census.skipped} skipped`];
	lines.push(`## 1. text-leaf kinds with no wrap (${unwrapped.length} of ${census.textLeaves.length}; instances = corpus nodes, rendering = those already carrying $render)`);
	for (const row of unwrapped) lines.push(`  ${row.kind}\tinstances ${row.instances}\trendering ${row.rendering}`);
	lines.push(`## 2. corpus kinds that are not keys of _fromMap and not units (${census.unbuildable.length}; ${census.unitsProduced} unit kinds revive to their kind id)`);
	for (const kind of census.unbuildable) lines.push(`  ${kind}`);
	lines.push('## 3. slot value shapes by kind and accessor (corpus instance counts)');
	for (const [kind, byAccessor] of Object.entries(census.slotShapes)) {
		for (const [accessor, counts] of Object.entries(byAccessor)) {
			const shown = Object.entries(counts)
				.sort(([a], [b]) => a.localeCompare(b))
				.map(([shape, count]) => `${shape} ${count}`)
				.join(', ');
			lines.push(`  ${kind}.${accessor}\t${shown}`);
		}
	}
	lines.push(`## 4. comment kinds (trivia kinds minus layout) (${census.commentKinds.length})`);
	for (const kind of census.commentKinds) lines.push(`  ${kind}`);
	lines.push(`## 5. corpus entries whose read threw while enumerating nodes (${census.skipped})`);
	for (const { message, count } of census.readFailures) lines.push(`  ${count}\t${message}`);
	return lines.join('\n') + '\n';
}

export interface NodeJsonCensusOptions {
	readonly grammar: string;
	readonly allGrammars: boolean;
}

export async function run(opts: NodeJsonCensusOptions): Promise<number> {
	const grammars = opts.allGrammars ? stableGrammars() : [assertGrammar(opts.grammar)];
	for (const grammar of grammars) process.stdout.write(formatNodeJsonCensus(await nodeJsonCensus(grammar)));
	return 0;
}
