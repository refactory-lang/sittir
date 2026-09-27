import { describe, expect, it } from 'vitest';
import { peelPrecWrapper } from '../evaluate.ts';
import type { Rule } from '../../types/rule.ts';

const seq = (extra: object = {}): Rule<'evaluate'> =>
	({ type: 'SEQ', members: [{ type: 'STRING', value: '[' }], ...extra }) as unknown as Rule<'evaluate'>;
const prec = (content: Rule<'evaluate'>, extra: object = {}): Rule<'evaluate'> =>
	({ type: 'PREC', value: 22, content, ...extra }) as unknown as Rule<'evaluate'>;

describe('peelPrecWrapper', () => {
	it('moves a PREC wrapper annotation onto its content', () => {
		const out = peelPrecWrapper(prec(seq(), { annotations: { hoisted: true } }));
		expect(out).toMatchObject({ type: 'SEQ', annotations: { hoisted: true } });
	});

	it('unions wrapper and content facts', () => {
		const out = peelPrecWrapper(
			prec(seq({ annotations: { variant: 'a' } }), { annotations: { hoisted: true }, metadata: { symbolSource: 'group-lift' } })
		);
		expect(out).toMatchObject({
			annotations: { hoisted: true, variant: 'a' },
			metadata: { symbolSource: 'group-lift' }
		});
	});

	it('accepts an equal fact on both sides', () => {
		const out = peelPrecWrapper(prec(seq({ annotations: { hoisted: true } }), { annotations: { hoisted: true } }));
		expect(out).toMatchObject({ annotations: { hoisted: true } });
	});

	it('rejects a conflicting fact', () => {
		expect(() =>
			peelPrecWrapper(prec(seq({ annotations: { variant: 'b' } }), { annotations: { variant: 'a' } }))
		).toThrow(/annotations\.variant conflicts/);
	});

	it('returns the content untouched when the wrapper carries no facts', () => {
		const content = seq();
		expect(peelPrecWrapper(prec(content))).toBe(content);
	});
});
