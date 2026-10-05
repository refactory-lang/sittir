import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { languageByName } from '../src/languages.ts';

const cases: Record<string, { readonly renders: Record<string, string>; readonly refuses: readonly string[] }> = {
	rust: { renders: { FnKeyword: 'fn', Semi: ';', Indent: '', Tight: '' }, refuses: ['Identifier'] },
	typescript: { renders: { FunctionKeyword: 'function', Semi: ';', Indent: '', Tight: '' }, refuses: ['Identifier'] },
	python: { renders: { DefKeyword: 'def', Comma: ',', PassStatement: 'pass', Tight: '' }, refuses: ['Identifier', 'Indent'] },
	scm: { renders: { Lparen: '(', Star: '*', Indent: '', Tight: '' }, refuses: ['Identifier'] },
	regex: { renders: { Star: '*', Newline: '\n', Tight: '' }, refuses: ['PatternCharacter'] }
};

describe('engine.render by kind id', () => {
	for (const [grammar, { renders, refuses }] of Object.entries(cases)) {
		it(`${grammar}: a fixed-literal kind renders from its kind id; a kind whose node carries its text throws naming the kind`, async () => {
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
