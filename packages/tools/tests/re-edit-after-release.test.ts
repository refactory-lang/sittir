import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { stableGrammars } from '@sittir/codegen/grammars';
import { languageByName } from '../src/languages.ts';
import { readFileSync } from 'node:fs';

type Edited = { $render(): unknown; [Symbol.dispose]?(): void };

const { editPhase } = (await import(
	new URL('../../../scripts/ci/paired-refs/corpus-batch.mjs', import.meta.url).href
)) as {
	editPhase(roots: readonly object[]): Edited[];
};

function fixtureSources(grammar: string): string[] {
	const fixtures: readonly { readonly kind: string; readonly sourceIn?: string }[] = JSON.parse(
		readFileSync(new URL(`../../../rust/crates/sittir-${grammar}/test-fixtures.json`, import.meta.url), 'utf8')
	);
	return [
		...new Set(
			fixtures.flatMap((fixture) =>
				fixture.kind === 'roundtrip' && fixture.sourceIn !== undefined ? [fixture.sourceIn] : []
			)
		)
	];
}

describe.each(stableGrammars())('the %s fixture sources, arena storage', (grammar) => {
	it('edits its parsed roots again, as before, once the first edits are released', async () => {
		using engine = await createEngine(await languageByName(grammar), { nodeStorage: 'arena' });
		const sources = fixtureSources(grammar);
		expect(sources.length).toBeGreaterThan(0);
		const refused: string[] = [];
		for (const source of sources) {
			const root = engine.parse(source) as unknown as Edited;
			const rendered = String(root.$render());
			const edits = editPhase([root]);
			const first = edits.map((node) => String(node.$render()));
			for (const node of edits) node[Symbol.dispose]?.();
			try {
				expect(editPhase([root]).map((node) => String(node.$render()))).toEqual(first);
				expect(String(root.$render())).toBe(rendered);
			} catch (refusal) {
				refused.push(`${JSON.stringify(source.slice(0, 60))}: ${(refusal as Error).message.split('\n')[0]}`);
			}
			root[Symbol.dispose]?.();
		}
		expect(refused.slice(0, 8), `${refused.length} of ${sources.length} sources`).toEqual([]);
	});
});
