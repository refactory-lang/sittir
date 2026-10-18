import { describe, expect, it } from 'vitest';
import { evaluateTempGrammar } from './_temp-grammar.ts';
import { link } from '../link.ts';
import { normalizeGrammar, blanksDropped } from '../normalize.ts';
import { assemble, AssembleCtx } from '../assemble.ts';
import type { Rule } from '../../types/rule.ts';

const SYM = (name: string) => ({ type: 'SYMBOL', name }) as unknown as Rule<'link'>;
const SEQ = (...members: Rule<'link'>[]) => ({ type: 'SEQ', members }) as unknown as Rule<'link'>;
const CHOICE = (...members: Rule<'link'>[]) => ({ type: 'CHOICE', members }) as unknown as Rule<'link'>;
const BLANK = () => ({ type: 'BLANK' }) as unknown as Rule<'link'>;
const EOF = () => ({ type: 'EOF' }) as unknown as Rule<'link'>;

// Strip what normalize adds beside the structure, so two rules compare by shape only.
const shape = (value: unknown): unknown => {
	if (Array.isArray(value)) return value.map(shape);
	if (value !== null && typeof value === 'object') {
		const out: Record<string, unknown> = {};
		for (const [key, inner] of Object.entries(value)) {
			if (key === 'id' || key === 'metadata' || key === 'kindFacts') continue;
			out[key] = shape(inner);
		}
		return out;
	}
	return value;
};

const normalized = async (rules: string) => normalizeGrammar(link(await evaluateTempGrammar({ extras: '', rules }, '', { bindings: '' })));

describe('blanksDropped drops every blank member of a SEQ (item 1)', () => {
	it('drops CHOICE[], BLANK and SEQ[] members of a SEQ', () => {
		expect(shape(blanksDropped(SEQ(SYM('a'), CHOICE(), BLANK(), SEQ()))) as object).toEqual(shape(SEQ(SYM('a'))));
	});

	it('a SEQ whose members are all blank becomes blank, and its parent drops it', () => {
		expect(shape(blanksDropped(SEQ(SYM('a'), SEQ(CHOICE(), CHOICE()))))).toEqual(shape(SEQ(SYM('a'))));
	});

	it('keeps a CHOICE blank arm, since that arm is optional', () => {
		expect(shape(blanksDropped(CHOICE(SYM('a'), CHOICE())))).toEqual(shape(CHOICE(SYM('a'), CHOICE())));
	});

	it('turns EOF into an empty CHOICE and keeps its id', () => {
		const eof = { ...EOF(), id: 7 } as unknown as Rule<'link'>;
		expect(blanksDropped(eof)).toMatchObject({ type: 'CHOICE', members: [], id: 7 });
	});
});

describe('a blank member of a production is dropped before the model reads it (items 2–4)', () => {
	it('top: seq($.x, blank()) normalizes exactly as seq($.x)', async () => {
		const withBlank = await normalized("source: ($) => optional($.r), r: ($) => seq($.x, blank()), x: () => 'a'");
		const without = await normalized("source: ($) => optional($.r), r: ($) => seq($.x), x: () => 'a'");
		expect(Object.keys(withBlank.rules)).toEqual(Object.keys(without.rules));
		expect(withBlank.rules.r).toEqual(without.rules.r);
	}, 60_000);

	it('all-blank: seq(\'(\', optional(seq(blank(), blank())), $.x) normalizes as seq(\'(\', $.x)', async () => {
		const withBlank = await normalized("source: ($) => optional($.r), r: ($) => seq('(', optional(seq(blank(), blank())), $.x), x: () => 'a'");
		const without = await normalized("source: ($) => optional($.r), r: ($) => seq('(', $.x), x: () => 'a'");
		expect(withBlank.rules.r).toEqual(without.rules.r);
	}, 60_000);

	it.each([
		['seq(blank(), $.x)', "r: ($) => seq('(', optional(seq(blank(), $.x)))"],
		['seq($.x, blank())', "r: ($) => seq('(', optional(seq($.x, blank())))"]
	])('inside optional: %s keeps r as a node of the assembled map', async (_label, rule) => {
		const normalizedGrammar = await normalized(`source: ($) => optional($.r), ${rule}, x: () => 'a'`);
		const blankFree = await normalized("source: ($) => optional($.r), r: ($) => seq('(', optional(seq($.x))), x: () => 'a'");
		expect(normalizedGrammar.rules.r).toEqual(blankFree.rules.r);
		const map = assemble(AssembleCtx.from(normalizedGrammar));
		expect(map.nodes.has('r')).toBe(true);
	}, 60_000);
});
