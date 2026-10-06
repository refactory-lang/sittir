import type { ValidatorSkip } from './common.ts';

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
 * `astMatchPass` those whose reparsed AST also matched the source's.
 */
export interface BuiltRenderResult {
	total: number;
	pass: number;
	astMatchPass: number;
	errors: BuiltRenderFailure[];
	astMismatches: BuiltRenderFailure[];
	excluded: ValidatorSkip[];
}

/** A render result with nothing counted. */
export const emptyBuiltRender = (): BuiltRenderResult => ({ total: 0, pass: 0, astMatchPass: 0, errors: [], astMismatches: [], excluded: [] });

/** One render result over several surfaces' runs, each failure's kind labeled `<surface>: <kind>`. */
export function combineBuiltRender(runs: Readonly<Record<string, BuiltRenderResult>>): BuiltRenderResult {
	const combined = emptyBuiltRender();
	for (const [surface, run] of Object.entries(runs)) {
		const label = <T extends { readonly kind?: string }>(r: T): T => ({ ...r, kind: `${surface}: ${r.kind}` });
		combined.total += run.total;
		combined.pass += run.pass;
		combined.astMatchPass += run.astMatchPass;
		combined.errors.push(...run.errors.map(label));
		combined.astMismatches.push(...run.astMismatches.map(label));
		combined.excluded.push(...run.excluded.map(label));
	}
	return combined;
}

