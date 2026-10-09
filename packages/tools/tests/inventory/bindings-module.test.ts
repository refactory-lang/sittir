import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { bindingGrammars, bindingsModulePath } from '@sittir/codegen/bindings';
import { bindingsModule } from '../../src/inventory/index.ts';

describe('the committed grammar.bindings.ts', () => {
	for (const grammar of bindingGrammars()) {
		it(`is what the inventory writes for ${grammar}`, async () => {
			const { text } = await bindingsModule(grammar);
			expect(text).toBe(readFileSync(bindingsModulePath(grammar), 'utf8'));
		}, 120_000);
	}
});
