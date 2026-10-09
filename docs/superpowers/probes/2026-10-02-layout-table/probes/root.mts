/**
 * Shared by the render probes. The checkout to measure is the current
 * directory; its fixtures (make-fixtures.sh) and the probes' outputs live in
 * <root>/scratchpad/layout/.
 */
import { existsSync, mkdirSync } from 'node:fs';

process.env.NODE_ENV ??= 'production';

export const ROOT = `${process.cwd()}/`;
if (!existsSync(`${ROOT}packages/common/src/index.ts`)) throw new Error('run this from the root of the checkout to measure');
export const WORK = `${ROOT}scratchpad/layout/`;
mkdirSync(WORK, { recursive: true });

export const { createEngine } = await import(`${ROOT}packages/common/src/index.ts`);

export type Grammar = 'rust' | 'typescript' | 'python';

export async function language(grammar: Grammar): Promise<unknown> {
	return (await import(`${ROOT}packages/${grammar}/src/index.ts`)).default;
}

/** The tree a fixture module builds; the fixtures are generated into the measured checkout by make-fixtures.sh. */
export async function fixture(file: string, exportName: string): Promise<unknown> {
	const path = `${WORK}${file}`;
	if (!existsSync(path)) throw new Error(`missing ${path}: run make-fixtures.sh from this checkout first`);
	return ((await import(path)) as Record<string, () => unknown>)[exportName]!();
}

/** An engine for a grammar with the given render options (none: the grammar's defaults). */
export async function engineFor(grammar: Grammar, render: Record<string, unknown> = {}): Promise<{ render(node: never): unknown; parse(text: string, options?: unknown): unknown }> {
	return createEngine(await language(grammar), Object.keys(render).length > 0 ? { render: render as never } : undefined);
}

/** The four real files every figure in the note is quoted for. */
export const FILES = [
	['rust', 'engine.rs', 'rebuild-engine-rs.ts', 'rebuildEngine', {}],
	['rust', 'splice.rs', 'rebuild-splice-rs.ts', 'rebuildSplice', {}],
	['typescript', 'format.ts', 'rebuild-format-ts.ts', 'rebuildFormat', { indent: '\t' }],
	['typescript', 'transport-data.ts', 'rebuild-transport-data-ts.ts', 'rebuildTransportData', { indent: '\t' }]
] as const;
