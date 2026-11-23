import { FIELD, REPEAT, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { enrich } from '../enrich.ts';
import type { Rule } from '../../types/rule.ts';
import { installFakeDsl, restoreFakeDsl } from './_test-helpers.ts';

const sym = (name: string) => ({ type: SYMBOL, name }) as unknown as Rule;
const str = (value: string) => ({ type: STRING, value }) as unknown as Rule;
const seq = (...members: Rule[]) => ({ type: SEQ, members }) as unknown as Rule;
const repeat = (content: Rule) => ({ type: REPEAT, content }) as unknown as Rule;
const field = (name: string, content: Rule) => ({ type: FIELD, name, content }) as unknown as Rule;

const grammarOf = (owner: Rule) => ({ grammar: { name: 'test', rules: { owner, term: str('t'), other: str('o') } } });
const ownerOf = (enriched: unknown): { members: Rule[] } =>
	(enriched as { grammar: { rules: { owner: { members: Rule[] } } } }).grammar.rules.owner;
const tailElementOf = (list: Rule): Rule => (list as unknown as { content: { members: Rule[] } }).content.members[1]!;

describe('enrich — a separated list whose later elements carry a field', () => {
	beforeAll(() => {
		installFakeDsl();
	});
	afterAll(() => {
		restoreFakeDsl();
	});

	const list = seq(str('with'), sym('term'), repeat(seq(str(','), field('provider', sym('term')))));

	it('gives the head position that field', () => {
		const { members } = ownerOf(enrich(grammarOf(list)));
		expect(members[1]).toMatchObject({ type: FIELD, name: 'provider', content: { type: SYMBOL, name: 'term' } });
		expect(tailElementOf(members[2]!)).toMatchObject({ type: FIELD, name: 'provider' });
	});

	it('changes nothing on a second enrich', () => {
		const once = enrich(grammarOf(list));
		const twice = enrich(structuredClone(once) as never);
		expect(JSON.stringify(ownerOf(twice))).toBe(JSON.stringify(ownerOf(once)));
	});

	it('leaves a head that carries another field', () => {
		const { members } = ownerOf(enrich(grammarOf(seq(str('with'), field('first', sym('term')), repeat(seq(str(','), field('rest', sym('term'))))))));
		expect(members[1]).toMatchObject({ type: FIELD, name: 'first' });
		expect(tailElementOf(members[2]!)).toMatchObject({ type: FIELD, name: 'rest' });
	});

	it('does not give the field to a head of another shape', () => {
		const { members } = ownerOf(enrich(grammarOf(seq(str('with'), sym('other'), repeat(seq(str(','), field('provider', sym('term'))))))));
		expect(members[1]).not.toMatchObject({ type: FIELD, name: 'provider' });
	});
});
