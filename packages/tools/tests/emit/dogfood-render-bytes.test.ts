import { describe, expect, it } from 'vitest';
import type { AnyUntypedNode } from '@sittir/types';
import type { TypescriptAPI } from '@sittir/typescript';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createEngine } from '@sittir/common';
import { DOGFOOD_REBUILDS } from '../../src/emit/dogfood-targets.ts';
import { languageByName } from '../../src/languages.ts';

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url));

describe('dogfood rebuild render bytes', () => {
	for (const target of DOGFOOD_REBUILDS) {
		const { grammar, file, exportName, rendered: fixture } = target;
		it(`${grammar}: ${exportName} renders the committed fixture byte-for-byte`, async () => {
			const mod = (await import(pathToFileURL(ROOT + file).href)) as Record<string, () => unknown>;
			const node = mod[exportName]!();
			const anyGrammar: string = grammar;
			const rendered =
				target.grammar === 'typescript' && target.renderOptions !== undefined
					? (await createEngine(await languageByName('typescript'), { render: target.renderOptions }))
							.render(node as TypescriptAPI['node'])
							.toString()
					: (await createEngine(await languageByName(anyGrammar))).render(node as AnyUntypedNode).toString();
			await expect(rendered).toMatchFileSnapshot(ROOT + 'packages/tools/tests/emit/__fixtures__/' + fixture);
		});
	}
});

// The read path's byte axis: `validate:history` compares AST shape, never
// bytes, so a read that renders the wrong whitespace survives it. An
// untouched tree folds to the root's coordinate at either depth and renders
// the source byte for byte.
const READ_CASES = [
	['rust', 'rust/crates/sittir-core/src/render.rs'],
	['typescript', 'packages/common/src/transport-data.ts'],
	['python', 'tests/format-roundtrip/fixtures/python-4space.py']
] as const;

describe('read then render is byte-exact', () => {
	for (const [grammar, file] of READ_CASES) {
		it(`${grammar}: a shallow and a deep read of ${file} both render its bytes`, async () => {
			const source = readFileSync(ROOT + file, 'utf8');
			const engine = await createEngine(await languageByName(grammar));
			const read = (deep: boolean) => (engine.parse(source, { depth: deep ? Infinity : 1 }) as unknown as { $render(): string }).$render();
			expect(read(false)).toBe(source);
			expect(read(true)).toBe(source);
		});
	}
});
