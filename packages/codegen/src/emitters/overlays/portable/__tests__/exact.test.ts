import { beforeAll, describe, expect, it } from 'vitest';
import { generate } from '../../../../compiler/generate.ts';
import { rawGroupOf, type ExactSlots } from '../exact.ts';

let exact: ExactSlots;

beforeAll(async () => {
	const generated = await generate({ grammar: 'rust', outputDir: '/tmp/sittir-portable-exact-rust/src' });
	if (generated.portableTyped === undefined) throw new Error('rust emitted no typed module');
	exact = generated.portableTyped.exact;
}, 120_000);

const setAt = (path: string, member: string) => {
	const set = exact.get(path)?.get(member);
	if (set === undefined) throw new Error(`no exact set at ${path}.${member}`);
	return set;
};

describe('exactSlotsOf', () => {
	it('keeps the paths a slot holds uncollapsed, where the role they share would admit the whole namespace', () => {
		expect(setAt('clause.else', 'body').kinds).toEqual(['statement.block', 'statement.if']);
	});

	it('puts an unclaimed kind in unmapped and never in raw', () => {
		const set = setAt('declaration.extension', 'traitClause');
		expect(set.unmapped).toContain('rust:impl_item_negative_clause');
		expect(set.raw.map((arm) => arm.kind)).not.toContain('impl_item_negative_clause');
	});

	it('makes a kind with a flag no arm builds a raw arm with reason flags, in the per-kind group', () => {
		const arm = setAt('type.array', 'length').raw.find((candidate) => candidate.kind === 'char_literal_plain');
		expect(arm?.reasons).toContain('flags');
		expect(rawGroupOf(['flags'])).toBe('kind');
	});

	it('puts a raw arm whose reasons are all decided per value in the per-value group', () => {
		expect(rawGroupOf(['preset', 'scalar'])).toBe('value');
		expect(rawGroupOf(['opaque', 'unread'])).toBe('kind');
	});
});
