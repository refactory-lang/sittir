import type { ValidatorSkip } from './common.ts';
import { KindCases, type CasesByKind } from './kind-cases.ts';
import { surfaceLabel } from './surface-label.ts';

/** A built node's render-and-reparse failure or AST mismatch, by the kind built. */
export interface BuiltRenderFailure {
	readonly kind: string;
	readonly entry: string;
	readonly message: string;
	readonly input: string;
	readonly rendered?: string;
}

/**
 * Render-and-reparse of the nodes a storage run builds: `total` counts the
 * built nodes rendered, `pass` those whose reparse found their kind, and
 * `astMatchPass` those whose reparsed AST also matched the source's, of
 * which `separatorTolerated` matched only by taking another of a list's
 * separators (`AstTolerance`).
 */
export interface BuiltRenderResult {
	total: number;
	casesByKind: CasesByKind;
	pass: number;
	astMatchPass: number;
	separatorTolerated: number;
	errors: BuiltRenderFailure[];
	astMismatches: BuiltRenderFailure[];
	excluded: ValidatorSkip[];
}

export type BuiltRenderRun = Omit<BuiltRenderResult, 'total' | 'casesByKind'> & { readonly cases: KindCases };

export const emptyBuiltRenderRun = (): BuiltRenderRun => ({
	cases: new KindCases(),
	pass: 0,
	astMatchPass: 0,
	separatorTolerated: 0,
	errors: [],
	astMismatches: [],
	excluded: []
});

export function finishBuiltRender({ cases, ...run }: BuiltRenderRun): BuiltRenderResult {
	return { ...run, total: cases.total, casesByKind: cases.byKind() };
}

/** A render result with nothing counted. */
export const emptyBuiltRender = (): BuiltRenderResult => finishBuiltRender(emptyBuiltRenderRun());

/** One render result over several surfaces' runs, each failure's kind labeled `<surface>: <kind>`. */
export function combineBuiltRender(runs: Readonly<Record<string, BuiltRenderResult>>): BuiltRenderResult {
	const combined = emptyBuiltRenderRun();
	for (const [surface, run] of Object.entries(runs)) {
		const label = <T extends { readonly kind?: string }>(r: T): T => (r.kind === undefined ? r : { ...r, kind: surfaceLabel(surface, r.kind) });
		for (const [kind, count] of Object.entries(run.casesByKind)) combined.cases.add(kind, count);
		combined.pass += run.pass;
		combined.astMatchPass += run.astMatchPass;
		combined.separatorTolerated += run.separatorTolerated;
		combined.errors.push(...run.errors.map(label));
		combined.astMismatches.push(...run.astMismatches.map(label));
		combined.excluded.push(...run.excluded.map(label));
	}
	return finishBuiltRender(combined);
}

