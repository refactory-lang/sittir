import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const EXAMPLES = fileURLToPath(new URL('../../examples/', import.meta.url));

const RUST_SOURCE = 'fn main() {}\n';

const SAMPLE_INPUTS: Readonly<Record<string, (scratch: string) => readonly unknown[]>> = {
	'02-render-round-trip:renderUntouched': () => [RUST_SOURCE],
	'02-render-round-trip:roundTrip': () => [RUST_SOURCE],
	'07-read-source:readSource': () => [RUST_SOURCE],
	'07-read-source:readFirstFunction': () => [RUST_SOURCE],
	'07-read-source:wrappedLazyAccess': () => [RUST_SOURCE],
	'09-type-guards:summarizeTopLevelItems': () => [`${RUST_SOURCE}struct Config;\n`],
	'12-cross-language-migration:interfaceToPythonDataclass': () => ['interface User { name: string; age: number }\n'],
	'15-generate-file:saveCacheModule': (scratch) => [join(scratch, 'cache.rs')],
	'16-dogfooding:emitIsModule': () => [{ kinds: ['identifier', 'call_expression'] }]
};

function compileCheckedModules(): string[] {
	const config = JSON.parse(readFileSync(join(EXAMPLES, 'tsconfig.json'), 'utf8')) as { include: string[] };
	return config.include
		.map((file) => file.replace(/^\.\//, '').replace(/\.ts$/, ''))
		.filter((name) => name !== 'helpers' && name !== 'index');
}

function hasRender(value: unknown): boolean {
	return value !== null && typeof value === 'object' && typeof (value as { $render?: unknown }).$render === 'function';
}

function renderedNodes(result: unknown): unknown[] {
	if (result === null || typeof result !== 'object') return [];
	if (hasRender(result)) return [result];
	return Object.values(result).filter(hasRender);
}

describe('the compile-checked examples run', () => {
	const scratch = mkdtempSync(join(tmpdir(), 'sittir-examples-'));

	for (const name of compileCheckedModules()) {
		it(`${name}: every exported function runs, and every node it returns renders`, async () => {
			const mod = (await import(`../../examples/${name}.ts`)) as Record<string, unknown>;
			const functions = Object.entries(mod).filter(([, value]) => typeof value === 'function') as [
				string,
				(...args: unknown[]) => unknown
			][];
			expect(functions.length, `${name} exports no function to run`).toBeGreaterThan(0);
			for (const [fn, run] of functions) {
				const sample = SAMPLE_INPUTS[`${name}:${fn}`];
				if (run.length > 0 && sample === undefined) {
					throw new Error(`${name}:${fn} takes ${run.length} argument(s); give it a sample input in SAMPLE_INPUTS`);
				}
				const result = run(...(sample?.(scratch) ?? []));
				for (const node of renderedNodes(result)) {
					expect(typeof (node as { $render(): unknown }).$render(), `${name}:${fn}`).toBe('string');
				}
			}
		});
	}

	it('renders the first example to the source it constructs', async () => {
		const { explicitMainFunction } = await import('../../examples/01-construct-nodes.ts');
		expect(explicitMainFunction().source).toBe('pub fn main() {}');
	});

	it('cleans up', () => {
		rmSync(scratch, { recursive: true, force: true });
	});
});
