import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { languageByName } from '../src/languages.ts';

const cases: Record<string, { readonly renders: Record<string, string>; readonly refuses: readonly string[] }> = {
	rust: { renders: { FnKeyword: 'fn', Semi: ';' }, refuses: ['Identifier', 'Indent'] },
	typescript: { renders: { FunctionKeyword: 'function', Semi: ';' }, refuses: ['Identifier', 'Indent'] },
	python: { renders: { DefKeyword: 'def', Comma: ',', PassStatement: 'pass' }, refuses: ['Identifier', 'Indent'] },
	scm: { renders: { Lparen: '(', Star: '*' }, refuses: ['Identifier', 'Indent'] },
	regex: { renders: { Star: '*', Newline: '\n' }, refuses: ['Tight'] }
};

describe('engine.render by kind id', () => {
	for (const [grammar, { renders, refuses }] of Object.entries(cases)) {
		it(`${grammar}: a fixed-text kind renders its text; any other kind id throws naming the kind`, async () => {
			const engine = await createEngine(await languageByName(grammar));
			const kinds = engine.kinds as Readonly<Record<string, number>>;
			for (const [kind, text] of Object.entries(renders)) {
				expect(engine.render(kinds[kind] as never).toString()).toBe(text);
			}
			for (const kind of refuses) {
				expect(() => engine.render(kinds[kind] as never).toString()).toThrow(`kind id ${kinds[kind]} (`);
			}
		});
	}
});
