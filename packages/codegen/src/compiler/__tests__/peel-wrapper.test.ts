import { describe, expect, it } from 'vitest';
import { peelWrapper } from '../canonical-rules.ts';
import type { Rule } from '../../types/rule.ts';

const seq = (extra: object = {}): Rule<'evaluate'> =>
	({ type: 'SEQ', members: [{ type: 'STRING', value: '[' }], ...extra }) as unknown as Rule<'evaluate'>;
const prec = (content: Rule<'evaluate'>, extra: object = {}): Rule<'evaluate'> =>
	({ type: 'PREC', value: 22, content, ...extra }) as unknown as Rule<'evaluate'>;

describe('peelWrapper', () => {
	it('moves a PREC wrapper annotation onto its content', () => {
		const out = peelWrapper(prec(seq(), { annotations: { hoisted: true } }));
		expect(out).toMatchObject({ type: 'SEQ', annotations: { hoisted: true } });
	});

	it('unions wrapper and content facts', () => {
		const out = peelWrapper(
			prec(seq({ annotations: { variant: 'a' } }), {
				annotations: { hoisted: true },
				metadata: { symbolSource: 'group-lift' }
			})
		);
		expect(out).toMatchObject({
			annotations: { hoisted: true, variant: 'a' },
			metadata: { symbolSource: 'group-lift' }
		});
	});

	it('accepts an equal fact on both sides', () => {
		const out = peelWrapper(prec(seq({ annotations: { hoisted: true } }), { annotations: { hoisted: true } }));
		expect(out).toMatchObject({ annotations: { hoisted: true } });
	});

	it('rejects a conflicting fact', () => {
		expect(() => peelWrapper(prec(seq({ annotations: { variant: 'b' } }), { annotations: { variant: 'a' } }))).toThrow(
			/annotations\.variant conflicts/
		);
	});

	it('returns the content untouched when the wrapper carries no facts', () => {
		const content = seq();
		expect(peelWrapper(prec(content))).toBe(content);
	});

	it('peels a single-member sequence onto its member', () => {
		const member = seq();
		const single = { type: 'SEQ', members: [member], annotations: { hoisted: true } } as unknown as Rule<'evaluate'>;
		expect(peelWrapper(single)).toMatchObject({
			type: 'SEQ',
			members: [{ type: 'STRING', value: '[' }],
			annotations: { hoisted: true }
		});
	});
});
