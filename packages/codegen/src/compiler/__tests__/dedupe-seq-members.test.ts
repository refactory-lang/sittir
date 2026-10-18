import { describe, expect, it } from 'vitest';
import { evaluateTempGrammar } from './_temp-grammar.ts';
import { link } from '../link.ts';
import { normalizeGrammar } from '../normalize.ts';

const TAIL = ", a: () => 'a'";
const kRule = (body: string) => `source: ($) => repeat($.k), k: ($) => ${body}${TAIL}`;

const normalizedK = async (body: string) => {
	const raw = await evaluateTempGrammar({ extras: '', rules: kRule(body) }, '', { bindings: '' });
	return normalizeGrammar(link(raw));
};

const IGNORE = new Set(['id', 'absorbedIds']);
const plain = (value: unknown): unknown => {
	if (Array.isArray(value)) return value.map(plain);
	if (value && typeof value === 'object') {
		const out: Record<string, unknown> = {};
		for (const key of Object.keys(value).sort()) if (!IGNORE.has(key)) out[key] = plain((value as Record<string, unknown>)[key]);
		return out;
	}
	return value;
};

type Member = { type: string; value?: string; name?: string };
const membersOf = (rule: unknown): Member[] => (rule as { members: Member[] }).members;

describe('adjacent equal seq members are kept, not collapsed', () => {
	it("k: seq('k', 'k') renders two 'k' members", async () => {
		const normalized = await normalizedK("seq('k', 'k')");
		const members = membersOf(normalized.normalizedRules.k);
		expect(members).toHaveLength(2);
		expect(members.every((member) => member.type === 'STRING' && member.value === 'k')).toBe(true);
	}, 60_000);

	it("k: seq('k', 'k') simplifies to one STRING 'k k'", async () => {
		const normalized = await normalizedK("seq('k', 'k')");
		expect(normalized.rules.k).toMatchObject({ type: 'STRING', value: 'k k' });
	}, 60_000);

	it("seq('x', 'k', 'k') keeps all three members", async () => {
		const normalized = await normalizedK("seq('x', 'k', 'k')");
		expect(membersOf(normalized.normalizedRules.k).map((member) => member.value)).toEqual(['x', 'k', 'k']);
	}, 60_000);

	it('seq($.a, $.a) keeps both symbols', async () => {
		const normalized = await normalizedK('seq($.a, $.a)');
		const members = membersOf(normalized.normalizedRules.k);
		expect(members).toHaveLength(2);
		expect(members.every((member) => member.type === 'SYMBOL' && member.name === 'a')).toBe(true);
	}, 60_000);

	it("seq('k', seq('k')) does not equal seq('k', blank())", async () => {
		const nested = await normalizedK("seq('k', seq('k'))");
		const blank = await normalizedK("seq('k', blank())");
		expect(plain(nested.normalizedRules.k)).not.toEqual(plain(blank.normalizedRules.k));
	}, 60_000);
	it('seq(field(x, $.a), field(x, $.a)) keeps both fielded members', async () => {
		const normalized = await normalizedK("seq(field('x', $.a), field('x', $.a))");
		const members = membersOf(normalized.normalizedRules.k);
		expect(members).toHaveLength(2);
		expect(members.every((member) => JSON.stringify(member).includes('"x"') && JSON.stringify(member).includes('"a"'))).toBe(true);
	}, 60_000);
});
