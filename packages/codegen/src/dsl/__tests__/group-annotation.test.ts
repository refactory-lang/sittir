import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { transform } from '../transform/transform.ts';
import { group } from '../primitives/group.ts';
import { field } from '../primitives/field.ts';
import { withWireContext } from '../wire/wire.ts';
import { installFakeDsl, restoreFakeDsl } from './_test-helpers.ts';
import type { RuntimeRule } from '../../types/runtime-shapes.ts';

type Annotated = { annotations?: { hoisted?: true } };
type Members = { members: RuntimeRule[] };

describe('group()', () => {
	beforeAll(() => {
		installFakeDsl();
	});
	afterAll(() => {
		restoreFakeDsl();
	});

	it('stamps hoisted on the rule itself at the root path', () => {
		const rule = {
			type: 'SEQ',
			members: [
				{ type: 'STRING', value: 'x' },
				{ type: 'STRING', value: 'y' }
			]
		} as unknown as RuntimeRule;

		const out = transform(rule, { '.': group() });

		expect((out as unknown as Annotated).annotations?.hoisted).toBe(true);
		expect((out as unknown as Members).members).toHaveLength(2);
	});

	it('stamps hoisted on an addressed member', () => {
		const rule = {
			type: 'SEQ',
			members: [{ type: 'SEQ', members: [{ type: 'STRING', value: 'a' }] }]
		} as unknown as RuntimeRule;

		const out = transform(rule, { '0': group() });

		expect(((out as unknown as Members).members[0] as unknown as Annotated).annotations?.hoisted).toBe(true);
	});

	it('keeps an annotation the rule already carries', () => {
		const rule = { type: 'SEQ', members: [], annotations: { variant: 'a', variantOf: 'p' } } as unknown as RuntimeRule;

		const out = transform(rule, { '.': group() });

		expect(out).toMatchObject({ annotations: { variant: 'a', variantOf: 'p', hoisted: true } });
	});

	describe('a patch that rebuilds a container', () => {
		const container = (annotations: Record<string, unknown>): RuntimeRule =>
			({
				type: 'SEQ',
				members: [
					{ type: 'STRING', value: 'x' },
					{ type: 'CHOICE', members: [{ type: 'SYMBOL', name: 'a' }, { type: 'SYMBOL', name: 'b' }] }
				],
				annotations,
				metadata: { fieldSource: 'override' }
			}) as unknown as RuntimeRule;
		const patched = (rule: RuntimeRule): RuntimeRule[] => [
			withWireContext('clause', () => transform(rule, { 1: field('bindings') })).result,
			withWireContext('clause', () => transform(rule, { '1/0': field('first') })).result
		];

		it('keeps the container annotations and metadata', () => {
			for (const out of patched(container({ variant: 'a', variantOf: 'p' }))) {
				expect(out).toMatchObject({ annotations: { variant: 'a', variantOf: 'p' }, metadata: { fieldSource: 'override' } });
			}
		});

		it('drops hoisted and keeps the rest', () => {
			for (const out of patched(container({ hoisted: true, variantOf: 'p' }))) {
				expect((out as unknown as Annotated).annotations?.hoisted).toBeUndefined();
				expect(out).toMatchObject({ annotations: { variantOf: 'p' }, metadata: { fieldSource: 'override' } });
			}
		});
	});
});
