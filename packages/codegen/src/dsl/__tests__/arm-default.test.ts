import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { transform } from '../transform/transform.ts';
import { arm } from '../primitives/arm.ts';
import { installFakeDsl, restoreFakeDsl } from './_test-helpers.ts';
import type { RuntimeRule } from '../../types/runtime-shapes.ts';

type Annotated = { annotations?: { default?: true; variant?: string } };
type Members = { members: RuntimeRule[] };

function seqOverChoice(): RuntimeRule {
	return {
		type: 'SEQ',
		members: [
			{
				type: 'CHOICE',
				members: [
					{ type: 'SYMBOL', name: '_a' },
					{ type: 'SYMBOL', name: '_b' }
				]
			}
		]
	} as unknown as RuntimeRule;
}

function armsOf(out: RuntimeRule): RuntimeRule[] {
	return ((out as unknown as Members).members[0] as unknown as Members).members;
}

describe('arm.default', () => {
	beforeAll(() => {
		installFakeDsl();
	});
	afterAll(() => {
		restoreFakeDsl();
	});

	it('stamps the addressed arm and no other', () => {
		const arms = armsOf(transform(seqOverChoice(), { '0/0': arm.default }));

		expect((arms[0] as unknown as Annotated).annotations?.default).toBe(true);
		expect((arms[1] as unknown as Annotated).annotations?.default).toBeUndefined();
	});

	it('leaves the arm otherwise untouched', () => {
		const arms = armsOf(transform(seqOverChoice(), { '0/1': arm.default }));

		expect(arms[1]).toMatchObject({ type: 'SYMBOL', name: '_b' });
	});

	it('keeps an annotation the arm already carries', () => {
		const rule = {
			type: 'CHOICE',
			members: [{ type: 'SYMBOL', name: '_a', annotations: { variant: 'a', variantOf: 'p' } }]
		} as unknown as RuntimeRule;

		const out = transform(rule, { '0': arm.default });

		expect((out as unknown as Members).members[0]).toMatchObject({
			annotations: { variant: 'a', variantOf: 'p', default: true }
		});
	});

	it('rejects a path whose parent is not a choice', () => {
		expect(() => transform(seqOverChoice(), { '0': arm.default })).toThrow(
			/arm\.default: path '0' is not a choice arm/
		);
	});
});
