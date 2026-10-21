import type { BaselineRun, LayoutWork, NativeEngineLike, StoredLayout } from '@sittir/common/engine';
import { treeOf } from '@sittir/common/utils';
import { loadCorpusEntries } from './common.ts';

/** A run of a corpus entry that no region's record reaches: at render it keeps its source class. */
export interface LayoutRunMiss {
	readonly entry: string;
	readonly side: string;
	readonly index: number;
	readonly start: number;
	readonly end: number;
	readonly context: string;
}

/** A corpus entry whose region render was refused: every run of it keeps its source class. */
export interface LayoutRefusal {
	readonly entry: string;
	readonly message: string;
}

export interface LayoutRunsResult {
	readonly total: number;
	/** What every entry stores of its layout apart from its read-time options, summed. */
	readonly stored: StoredLayout;
	readonly unreached: readonly LayoutRunMiss[];
	readonly refused: readonly LayoutRefusal[];
}

interface NativeBackend {
	readonly name: string;
	readonly native?: { readonly SittirEngine: new () => NativeEngineLike; disposeTree(treeId: number): void };
}

export async function nativeBackendOf(grammar: string): Promise<Required<NativeBackend>['native']> {
	const { getActiveBackend } = (await import(`../../../${grammar}/src/backend.ts`)) as { getActiveBackend: () => NativeBackend };
	const status = getActiveBackend();
	if (status.name !== 'native' || status.native === undefined) throw new Error(`the native backend of '${grammar}' is not active`);
	return status.native;
}

/** A function parsing a source with `grammar`'s native engine and handing its tree id to `use`, disposing the tree after. */
async function withTreeOf(grammar: string): Promise<<T>(source: string, use: (engine: NativeEngineLike, treeId: number) => T) => T> {
	const native = await nativeBackendOf(grammar);
	const engine = new native.SittirEngine();
	return (source, use) => {
		const { treeId } = JSON.parse(engine.parse(source)) as { treeId: number };
		try {
			return use(engine, treeId);
		} finally {
			native.disposeTree(treeId);
		}
	};
}

/** Every layout run of `source` with the breaks the read-time options write there, from each run's region or from the whole tree when `whole`. */
export async function layoutRunsOf(grammar: string): Promise<(source: string, whole?: boolean) => BaselineRun[]> {
	const withTree = await withTreeOf(grammar);
	return (source, whole = false) => withTree(source, (engine, treeId) => engine.layoutBaseline(treeId, whole));
}

/** A function reading the work done so far by the layout reads of the tree a parsed node belongs to (`NativeEngineLike.layoutWork`). */
export async function layoutWorkOf(grammar: string): Promise<(node: object) => LayoutWork> {
	const native = await nativeBackendOf(grammar);
	const engine = new native.SittirEngine();
	return (node) => {
		const treeId = treeOf(node)?.id;
		if (treeId === undefined) throw new Error('layout work: the node names no live tree');
		return engine.layoutWork(treeId);
	};
}

/** What `source` stores of its layout apart from its read-time options (`NativeEngineLike.storedLayout`). */
export async function storedLayoutOf(grammar: string): Promise<(source: string) => StoredLayout> {
	const withTree = await withTreeOf(grammar);
	return (source) => withTree(source, (engine, treeId) => engine.storedLayout(treeId));
}

/** The layout runs of every corpus entry of `grammar`: how many, which no record reaches, and the entries whose region render was refused. */
export async function runLayoutRuns(grammar: string): Promise<LayoutRunsResult> {
	const runsOf = await layoutRunsOf(grammar);
	const storedOf = await storedLayoutOf(grammar);
	let total = 0;
	const stored = { deviations: 0, slots: 0, separators: 0 };
	const unreached: LayoutRunMiss[] = [];
	const refused: LayoutRefusal[] = [];
	for (const { name, source } of loadCorpusEntries(grammar)) {
		let runs: BaselineRun[];
		try {
			runs = runsOf(source);
		} catch (error) {
			refused.push({ entry: name, message: error instanceof Error ? error.message : String(error) });
			continue;
		}
		total += runs.length;
		const { deviations, slots, separators } = storedOf(source);
		stored.deviations += deviations;
		stored.slots += slots;
		stored.separators += separators;
		for (const { side, index, start, end, breaks } of runs) {
			if (breaks !== undefined) continue;
			unreached.push({ entry: name, side, index, start, end, context: source.slice(Math.max(0, start - 12), end + 12) });
		}
	}
	return { total, stored, unreached, refused };
}
