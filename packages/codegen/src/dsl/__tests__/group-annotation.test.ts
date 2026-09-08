import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { transform } from '../transform/transform.ts';
import { group } from '../primitives/group.ts';
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
});
