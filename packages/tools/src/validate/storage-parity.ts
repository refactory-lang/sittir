import { stableGrammars } from '@sittir/codegen/grammars';
import { ERROR_KIND_ID } from '@sittir/common/error-kind';
import type { BackerParity } from '@sittir/common/engine';
import { backerParityOf, type RunParity } from './backer-parity.ts';
import {
	loadCorpusEntries,
	loadKindNameFromId,
	loadSlotAccessorOf,
	storageEngineOf,
	type NativeEngine,
	type SlotAccessorOf
} from './common.ts';

export type StorageCheck = 'snapshots' | 'renders' | 'layoutRuns' | 'rebuilds' | 'writeBacks';

export interface SourceFacts {
	readonly errors: string;
	readonly snapshot: unknown;
	readonly nodes: readonly { readonly kind: string; readonly render: string; readonly rebuild?: string }[];
	readonly sides: readonly {
		readonly node: number;
		readonly kind: string;
		readonly side: string;
		readonly items: number;
		readonly holdsError: boolean;
		readonly written: string;
	}[];
}

export interface StorageDifference {
	readonly check: Exclude<StorageCheck, 'layoutRuns'>;
	readonly grammar: string;
	readonly entry: string;
	readonly node?: number;
	readonly kind?: string;
	readonly side?: string;
	readonly holdsError?: boolean;
	readonly object: string;
	readonly arena: string;
}

export interface BackerDifference {
	readonly check: 'layoutRuns';
	readonly grammar: string;
	readonly entry: string;
	readonly parity: (Omit<BackerParity, 'runs'> & RunParity) | { readonly refused: string };
}

export type Difference = StorageDifference | BackerDifference;

export interface StorageParityReport {
	readonly grammars: readonly string[];
	readonly compared: Readonly<Record<StorageCheck, number>>;
	readonly measuredRuns: number;
	readonly differences: readonly Difference[];
}

export interface AcceptedDifference {
	readonly name: string;
	readonly ceilings: Readonly<Record<string, number>>;
	readonly matches: (difference: Difference) => boolean;
}

export interface AcceptedCount {
	readonly name: string;
	readonly grammar: string;
	readonly count: number;
	readonly ceiling: number;
}

export interface StorageVerdict {
	readonly accepted: readonly AcceptedCount[];
	readonly unaccepted: readonly Difference[];
	readonly passes: boolean;
}

export interface StorageParityOptions {
	readonly grammars: readonly string[];
	readonly json: boolean;
}

const THROWS = 'throws: ';
const CHECKS: readonly StorageCheck[] = ['snapshots', 'renders', 'layoutRuns', 'rebuilds', 'writeBacks'];
const COMPARED: Readonly<Record<StorageCheck, string>> = {
	snapshots: 'sources',
	renders: 'nodes',
	layoutRuns: 'runs',
	rebuilds: 'lists',
	writeBacks: 'sides'
};

export const ACCEPTED_DIFFERENCES: readonly AcceptedDifference[] = [
	{
		name: "a written-back side holding an ERROR takes the ERROR's in-line whitespace from the render options",
		ceilings: { python: 1, typescript: 1 },
		matches: (difference) => difference.check === 'writeBacks' && difference.holdsError === true
	},
	{
		name: "a root's written-back inner side takes its gaps from the render options",
		ceilings: { rust: 6 },
		matches: (difference) =>
			difference.check === 'writeBacks' &&
			difference.node === 0 &&
			difference.side === 'inner' &&
			difference.holdsError === false
	}
];

type SideAccess = { (): readonly unknown[]; (...entries: unknown[]): WalkedNode };

interface WalkedNode {
	readonly $type: number;
	$render(): string;
	readonly $with?: Readonly<Record<string, ((...items: unknown[]) => WalkedNode) | undefined>>;
	readonly $trivia?: Readonly<Record<string, SideAccess | undefined>>;
}

interface WalkedRoot extends WalkedNode {
	readonly $errors: readonly unknown[];
	$snapshot(): unknown;
	$query(): { readonly $descendants: Iterable<unknown> };
}

interface FactLookups {
	readonly slotsOf: SlotAccessorOf;
	readonly kindNameOf: (id: number) => string;
}

function isWalked(value: unknown): value is WalkedNode {
	return typeof value === 'object' && value !== null && '$type' in value && typeof value.$type === 'number';
}

function isWalkedRoot(value: unknown): value is WalkedRoot {
	return (
		isWalked(value) &&
		'$query' in value &&
		typeof value.$query === 'function' &&
		'$snapshot' in value &&
		typeof value.$snapshot === 'function'
	);
}

function isList(node: WalkedNode): node is WalkedNode & Iterable<unknown> {
	return Symbol.iterator in node && typeof node[Symbol.iterator] === 'function';
}

function walkedNodesOf(
	engine: NativeEngine,
	source: string
): { readonly root: WalkedRoot; readonly nodes: readonly WalkedNode[] } {
	const root: unknown = engine.parse(source);
	if (!isWalkedRoot(root)) throw new Error('storage-parity: a parsed root has no $query or $snapshot');
	return { root, nodes: [root, ...[...root.$query().$descendants].filter(isWalked)] };
}

function thrown(error: unknown): string {
	return `${THROWS}${(error instanceof Error ? error.message : String(error)).split('\n')[0]}`;
}

function attempt(read: () => unknown): string {
	try {
		const value = read();
		return typeof value === 'string' ? value : JSON.stringify(value);
	} catch (error) {
		return thrown(error);
	}
}

function listSetterOf({ slotsOf, kindNameOf }: FactLookups, node: WalkedNode): string {
	const setters = slotsOf(node.$type)
		.slots.map(([accessor]) => accessor)
		.filter((accessor) => typeof node.$with?.[accessor] === 'function');
	const [setter] = setters;
	if (setter === undefined || setters.length !== 1)
		throw new Error(`storage-parity: list kind ${kindNameOf(node.$type)} has ${setters.length} slot setters, not one`);
	return setter;
}

function rebuildOf(lookups: FactLookups, node: WalkedNode): string | undefined {
	if (node.$with === undefined || !isList(node)) return undefined;
	const setter = listSetterOf(lookups, node);
	return attempt(() => node.$with?.[setter]?.(...node).$render());
}

function sidesOf(
	engine: NativeEngine,
	{ kindNameOf }: FactLookups,
	source: string,
	nodes: readonly WalkedNode[]
): SourceFacts['sides'] {
	return nodes.flatMap((node, at) =>
		Object.keys(node.$trivia ?? {}).flatMap((side) => {
			let entries: readonly unknown[] | undefined;
			try {
				entries = node.$trivia?.[side]?.();
			} catch {
				entries = undefined;
			}
			if (entries === undefined || entries.length === 0) return [];
			const fresh = walkedNodesOf(engine, source).nodes[at];
			const written = attempt(() => {
				const trivia = fresh?.$trivia;
				return trivia?.[side]?.(...(trivia[side]?.() ?? [])).$render();
			});
			const holdsError = entries.some((entry) => isWalked(entry) && entry.$type === ERROR_KIND_ID);
			return [{ node: at, kind: kindNameOf(node.$type), side, items: entries.length, holdsError, written }];
		})
	);
}

export function storageFactsOf(engine: NativeEngine, lookups: FactLookups, source: string): SourceFacts {
	const { root, nodes } = walkedNodesOf(engine, source);
	let snapshot: unknown;
	try {
		snapshot = root.$snapshot();
	} catch (error) {
		snapshot = thrown(error);
	}
	return {
		errors: attempt(() => root.$errors.length),
		snapshot,
		nodes: nodes.map((node) => {
			const rebuild = rebuildOf(lookups, node);
			return {
				kind: lookups.kindNameOf(node.$type),
				render: attempt(() => node.$render()),
				...(rebuild === undefined ? {} : { rebuild })
			};
		}),
		sides: sidesOf(engine, lookups, source, nodes)
	};
}

function firstDifference(
	object: unknown,
	arena: unknown,
	path: string
): { readonly path: string; readonly object: unknown; readonly arena: unknown } | undefined {
	if (object === arena) return undefined;
	if (
		typeof object !== 'object' ||
		typeof arena !== 'object' ||
		object === null ||
		arena === null ||
		Array.isArray(object) !== Array.isArray(arena)
	) {
		return { path, object, arena };
	}
	const left: Readonly<Record<string, unknown>> = { ...object };
	const right: Readonly<Record<string, unknown>> = { ...arena };
	for (const key of new Set([...Object.keys(left), ...Object.keys(right)])) {
		const found = firstDifference(left[key], right[key], `${path}.${key}`);
		if (found !== undefined) return found;
	}
	return undefined;
}

function sideText(side: SourceFacts['sides'][number] | undefined): string {
	if (side === undefined) return 'no side';
	return `${side.items} entries${side.holdsError ? ' holding an ERROR' : ''}, written back: ${side.written}`;
}

export function differencesOf(
	grammar: string,
	entry: string,
	object: SourceFacts,
	arena: SourceFacts
): StorageDifference[] {
	const differences: StorageDifference[] = [];
	const at = { grammar, entry };
	if (object.errors !== arena.errors)
		differences.push({ check: 'snapshots', ...at, object: `errors ${object.errors}`, arena: `errors ${arena.errors}` });
	const snapshot = firstDifference(object.snapshot, arena.snapshot, '$snapshot');
	if (snapshot !== undefined) {
		differences.push({
			check: 'snapshots',
			...at,
			object: `${snapshot.path} = ${JSON.stringify(snapshot.object)}`,
			arena: `${snapshot.path} = ${JSON.stringify(snapshot.arena)}`
		});
	}
	if (object.nodes.length !== arena.nodes.length) {
		differences.push({
			check: 'snapshots',
			...at,
			object: `${object.nodes.length} nodes`,
			arena: `${arena.nodes.length} nodes`
		});
	}
	for (let node = 0; node < Math.min(object.nodes.length, arena.nodes.length); node++) {
		const [left, right] = [object.nodes[node]!, arena.nodes[node]!];
		const placed = { ...at, node, kind: left.kind };
		if (left.kind !== right.kind)
			differences.push({ check: 'snapshots', ...placed, object: left.kind, arena: right.kind });
		if (left.render !== right.render)
			differences.push({ check: 'renders', ...placed, object: left.render, arena: right.render });
		if (left.rebuild !== right.rebuild)
			differences.push({
				check: 'rebuilds',
				...placed,
				object: left.rebuild ?? 'no list',
				arena: right.rebuild ?? 'no list'
			});
	}
	const keyed = (facts: SourceFacts) => new Map(facts.sides.map((side) => [`${side.node}.${side.side}`, side]));
	const [left, right] = [keyed(object), keyed(arena)];
	for (const key of new Set([...left.keys(), ...right.keys()])) {
		const [objectSide, arenaSide] = [left.get(key), right.get(key)];
		const [objectText, arenaText] = [sideText(objectSide), sideText(arenaSide)];
		if (objectText === arenaText) continue;
		const side = (objectSide ?? arenaSide)!;
		differences.push({
			check: 'writeBacks',
			...at,
			node: side.node,
			kind: side.kind,
			side: side.side,
			holdsError: (objectSide?.holdsError ?? false) || (arenaSide?.holdsError ?? false),
			object: objectText,
			arena: arenaText
		});
	}
	return differences;
}

export function verdictOf(
	report: StorageParityReport,
	accepted: readonly AcceptedDifference[] = ACCEPTED_DIFFERENCES
): StorageVerdict {
	const counts = new Map<AcceptedDifference, Map<string, number>>(accepted.map((entry) => [entry, new Map()]));
	const unaccepted: Difference[] = [];
	for (const difference of report.differences) {
		const entry = accepted.find((candidate) => candidate.matches(difference));
		if (entry === undefined) {
			unaccepted.push(difference);
			continue;
		}
		const byGrammar = counts.get(entry)!;
		byGrammar.set(difference.grammar, (byGrammar.get(difference.grammar) ?? 0) + 1);
	}
	const tallies = accepted.flatMap((entry) =>
		report.grammars.flatMap((grammar) => {
			const count = counts.get(entry)!.get(grammar) ?? 0;
			const ceiling = entry.ceilings[grammar] ?? 0;
			return count === 0 && ceiling === 0 ? [] : [{ name: entry.name, grammar, count, ceiling }];
		})
	);
	const passes =
		unaccepted.length === 0 &&
		tallies.every(({ count, ceiling }) => count <= ceiling) &&
		report.compared.snapshots > 0 &&
		report.measuredRuns > 0;
	return { accepted: tallies, unaccepted, passes };
}

async function grammarParity(grammar: string): Promise<Omit<StorageParityReport, 'grammars'>> {
	const [object, arena] = [await storageEngineOf(grammar, 'object'), await storageEngineOf(grammar, 'arena')];
	const lookups: FactLookups = {
		slotsOf: await loadSlotAccessorOf(grammar),
		kindNameOf: await loadKindNameFromId(grammar)
	};
	const parityOf = await backerParityOf(grammar);
	const compared: Record<StorageCheck, number> = {
		snapshots: 0,
		renders: 0,
		layoutRuns: 0,
		rebuilds: 0,
		writeBacks: 0
	};
	const differences: Difference[] = [];
	let measuredRuns = 0;
	try {
		for (const { name: entry, source } of loadCorpusEntries(grammar)) {
			compared.snapshots++;
			const read = (engine: NativeEngine): SourceFacts | string => {
				try {
					return storageFactsOf(engine, lookups, source);
				} catch (error) {
					return thrown(error);
				}
			};
			const [objectFacts, arenaFacts] = [read(object), read(arena)];
			if (typeof objectFacts === 'string' || typeof arenaFacts === 'string') {
				differences.push({
					check: 'snapshots',
					grammar,
					entry,
					object: typeof objectFacts === 'string' ? objectFacts : 'read',
					arena: typeof arenaFacts === 'string' ? arenaFacts : 'read'
				});
			} else {
				compared.renders += objectFacts.nodes.length;
				compared.rebuilds += objectFacts.nodes.filter((node) => node.rebuild !== undefined).length;
				compared.writeBacks += objectFacts.sides.length;
				differences.push(...differencesOf(grammar, entry, objectFacts, arenaFacts));
			}
			try {
				const parity = parityOf(source);
				compared.layoutRuns += parity.runs;
				measuredRuns += parity.measuredRuns;
				if (parity.differing > 0 || parity.differingRuns > 0)
					differences.push({ check: 'layoutRuns', grammar, entry, parity });
			} catch (error) {
				differences.push({ check: 'layoutRuns', grammar, entry, parity: { refused: thrown(error) } });
			}
		}
	} finally {
		object.dispose();
		arena.dispose();
	}
	return { compared, measuredRuns, differences };
}

async function computeStorageParity(grammars: readonly string[]): Promise<StorageParityReport> {
	const compared: Record<StorageCheck, number> = {
		snapshots: 0,
		renders: 0,
		layoutRuns: 0,
		rebuilds: 0,
		writeBacks: 0
	};
	const differences: Difference[] = [];
	let measuredRuns = 0;
	for (const grammar of grammars) {
		const parity = await grammarParity(grammar);
		for (const check of CHECKS) compared[check] += parity.compared[check];
		measuredRuns += parity.measuredRuns;
		differences.push(...parity.differences);
	}
	return { grammars, compared, measuredRuns, differences };
}

function differenceLines(difference: Difference): string[] {
	const head = `${difference.check} ${difference.grammar} ${JSON.stringify(difference.entry)}`;
	if (difference.check === 'layoutRuns') return [`${head}: ${JSON.stringify(difference.parity)}`];
	const place = [
		difference.node === undefined ? '' : ` node ${difference.node}`,
		difference.kind === undefined ? '' : ` ${difference.kind}`,
		difference.side === undefined ? '' : `.${difference.side}`
	].join('');
	return [
		`${head}${place}`,
		`    object: ${JSON.stringify(difference.object)}`,
		`    arena:  ${JSON.stringify(difference.arena)}`
	];
}

function printReport(report: StorageParityReport, verdict: StorageVerdict): void {
	console.log(`storage-parity: ${report.grammars.join(', ')}`);
	for (const check of CHECKS) {
		const apart = report.differences.filter((difference) => difference.check === check).length;
		const measured = check === 'layoutRuns' ? `, ${report.measuredRuns} measured alike` : '';
		console.log(
			`  ${check.padEnd(10)} ${String(apart).padStart(5)} of ${report.compared[check]} ${COMPARED[check]} apart${measured}`
		);
	}
	for (const { name, grammar, count, ceiling } of verdict.accepted) {
		const note =
			count > ceiling ? ': above its ceiling' : count < ceiling ? `: below its ceiling, lower it to ${count}` : '';
		console.log(`  accepted ${grammar} ${count} of ceiling ${ceiling}${note}: ${name}`);
	}
	for (const difference of verdict.unaccepted) for (const line of differenceLines(difference)) console.log(`  ${line}`);
	console.log(
		verdict.passes ? 'storage-parity: passes' : `storage-parity: fails, ${verdict.unaccepted.length} not accepted`
	);
}

export async function run(opts: StorageParityOptions): Promise<number> {
	const report = await computeStorageParity(opts.grammars.length > 0 ? opts.grammars : stableGrammars());
	const verdict = verdictOf(report);
	if (opts.json) console.log(JSON.stringify({ ...report, verdict }, null, 2));
	else printReport(report, verdict);
	return verdict.passes ? 0 : 1;
}
