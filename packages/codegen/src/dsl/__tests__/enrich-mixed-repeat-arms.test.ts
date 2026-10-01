import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { enrich } from '../enrich.ts';
import { readRuleMetadata } from '../rule-metadata.ts';
import { installFakeDsl, restoreFakeDsl } from './_test-helpers.ts';

beforeAll(() => installFakeDsl());
afterAll(() => restoreFakeDsl());

const sym = (name: string) => ({ type: 'SYMBOL', name });
const str = (value: string) => ({ type: 'STRING', value });
const seq = (...members: unknown[]) => ({ type: 'SEQ', members });
const choice = (...members: unknown[]) => ({ type: 'CHOICE', members });
const repeat = (content: unknown) => ({ type: 'REPEAT', content });
const field = (name: string, content: unknown) => ({ type: 'FIELD', name, content });

const suffix = () => repeat(choice(sym('capture'), field('quantifier', sym('quantifier'))));
const base = { capture: str('@c'), quantifier: str('*') };

function run(rules: Record<string, unknown>) {
	return (enrich({ grammar: { name: 'test', rules } } as never) as unknown as { grammar: { rules: Record<string, unknown> } }).grammar.rules;
}

function liftRefs(rule: unknown, out: string[] = []): string[] {
	if (!rule || typeof rule !== 'object') return out;
	const r = rule as { type?: string; name?: string; metadata?: unknown; members?: unknown[]; content?: unknown };
	if (r.type === 'SYMBOL' && readRuleMetadata(r.metadata as never)?.symbolSource === 'group-lift') out.push(r.name!);
	for (const m of r.members ?? []) liftRefs(m, out);
	liftRefs(r.content, out);
	return out;
}

describe('topology-mixed repeat arms', () => {
	it('mints the field arm of a mixed repeated choice as its own kind and leaves the union arm in place', () => {
		const rules = run({ ...base, list: seq(str('('), str(')'), suffix()) });
		expect(liftRefs(rules['list'])).toEqual(['list_quantifier']);
		expect(rules['list_quantifier']).toMatchObject({ type: 'FIELD', name: 'quantifier', content: { type: 'SYMBOL', name: 'quantifier' } });
	});

	it('shares one kind across owners of an identical arm body', () => {
		const rules = run({ ...base, list: seq(str('('), str(')'), suffix()), grouping: seq(str('['), str(']'), suffix()) });
		expect(liftRefs(rules['list'])).toEqual(['list_quantifier']);
		expect(liftRefs(rules['grouping'])).toEqual(['list_quantifier']);
		expect(rules['grouping_quantifier']).toBeUndefined();
	});

	it('leaves a repeat of one topology alone', () => {
		const rules = run({ ...base, list: seq(str('('), str(')'), repeat(choice(sym('capture'), sym('quantifier')))) });
		expect(liftRefs(rules['list'])).toEqual([]);
	});
});
