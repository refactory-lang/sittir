import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { DOGFOOD_REBUILDS } from '../../src/emit/dogfood-targets.ts';

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url));

describe('dogfood rebuild render bytes', () => {
	for (const { grammar, file, exportName, rendered: fixture } of DOGFOOD_REBUILDS) {
		it(`${grammar}: ${exportName} renders the committed fixture byte-for-byte`, async () => {
			const absolute = ROOT + file;
			const mod = (await import(pathToFileURL(absolute).href)) as Record<string, () => { $render(): string }>;
			const rendered = mod[exportName]!().$render();
			const expected = readFileSync(ROOT + 'packages/tools/tests/emit/__fixtures__/' + fixture, 'utf8');
			expect(rendered).toBe(expected);
		});
	}
});

// The read path's byte axis: `validate:history` compares AST shape, never
// bytes, so a read that renders the wrong whitespace survives it. An
// untouched tree folds to the root's coordinate at either depth and renders
// the source byte for byte.
const READ_CASES = [
	['rust', '@sittir/rust', 'rust/crates/sittir-core/src/render.rs'],
	['typescript', '@sittir/typescript', 'packages/common/src/transport-data.ts'],
	['python', '@sittir/python', 'tests/format-roundtrip/fixtures/python-4space.py']
] as const;

describe('read then render is byte-exact', () => {
	for (const [grammar, pkg, file] of READ_CASES) {
		it(`${grammar}: a shallow and a deep read of ${file} both render its bytes`, async () => {
			const { createEngine } = (await import(pkg)) as {
				createEngine: () => { parse(source: string, options?: { deep?: boolean }): { $render(): string } };
			};
			const source = readFileSync(ROOT + file, 'utf8');
			const engine = createEngine();
			expect(engine.parse(source).$render()).toBe(source);
			expect(engine.parse(source, { deep: true }).$render()).toBe(source);
		});
	}
});
