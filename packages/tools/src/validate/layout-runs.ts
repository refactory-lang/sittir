import type { BaselineRun, NativeEngineLike } from '@sittir/common/engine';
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
	readonly unreached: readonly LayoutRunMiss[];
	readonly refused: readonly LayoutRefusal[];
}

interface NativeBackend {
	readonly name: string;
	readonly native?: { readonly SittirEngine: new () => NativeEngineLike; disposeTree(treeId: number): void };
}

async function nativeBackendOf(grammar: string): Promise<Required<NativeBackend>['native']> {
	const { getActiveBackend } = (await import(`../../../${grammar}/src/backend.ts`)) as { getActiveBackend: () => NativeBackend };
	const status = getActiveBackend();
	if (status.name !== 'native' || status.native === undefined) throw new Error(`layout runs: the native backend of '${grammar}' is not active`);
	return status.native;
}

/** Every layout run of `source` with the breaks the read-time options write there, from each run's region or from the whole tree when `whole`. */
export async function layoutRunsOf(grammar: string): Promise<(source: string, whole?: boolean) => BaselineRun[]> {
	const native = await nativeBackendOf(grammar);
	const engine = new native.SittirEngine();
	return (source, whole = false) => {
		const { treeId } = JSON.parse(engine.parse(source)) as { treeId: number };
		try {
			return engine.layoutBaseline(treeId, whole);
		} finally {
			native.disposeTree(treeId);
		}
	};
}

/** The layout runs of every corpus entry of `grammar`: how many, which no record reaches, and the entries whose region render was refused. */
export async function runLayoutRuns(grammar: string): Promise<LayoutRunsResult> {
	const runsOf = await layoutRunsOf(grammar);
	let total = 0;
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
		for (const { side, index, start, end, breaks } of runs) {
			if (breaks !== undefined) continue;
			unreached.push({ entry: name, side, index, start, end, context: source.slice(Math.max(0, start - 12), end + 12) });
		}
	}
	return { total, unreached, refused };
}
