import { describe, it } from 'vitest';
import type { PatternRule, SeqRule, StringRule, SymbolRule } from '../../grammar-shapes/grammar-json.ts';
import { enrich, field, wire } from '../dsl-authoring.ts';

declare const base: {
	readonly name: 'fixture';
	readonly rules: {
		readonly program: SeqRule<[StringRule<'let'>, SymbolRule<'item'>]>;
		readonly item: PatternRule<'[a-z]+'>;
	};
};

describe('wire() checks its edits against the base enrich() gives it', () => {
	it('accepts a path the base kind has', () => {
		grammar(enrich(base), wire({ edits: { program: { 1: field('item') } } }));
	});

	it('rejects a path the base kind lacks', () => {
		// @ts-expect-error — program has no member 5
		grammar(enrich(base), wire({ edits: { program: { 5: field('item') } } }));
	});

	it('checks no path against a base that is a layer, whose type names no kind', () => {
		const below = grammar(enrich(base), wire({}));
		grammar(enrich(below), wire({ edits: { program: { 5: field('item') } } }));
	});
});
