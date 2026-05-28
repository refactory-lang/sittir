import { describe, expect, it } from 'vitest';
import { describeDeriveShape } from './diagnose-derive-shapes.ts';

describe('describeDeriveShape', () => {
	it('maps seq-with-nested-seq directly', () => {
		expect(
			describeDeriveShape({
				rawShape: 'seq-with-nested-seq',
				ruleType: 'seq',
				context: 'derive-values',
				ownerKind: 'host',
			}),
		).toEqual(
			expect.objectContaining({
				code: 'seq-with-nested-seq',
				ownerKind: 'host',
				details: expect.objectContaining({ rawShape: 'seq-with-nested-seq' }),
			}),
		);
	});

	it('maps seq-member-* shapes to seq-member-collision', () => {
		expect(
			describeDeriveShape({
				rawShape: 'seq-member-choice-needs-variant-or-merge',
				ruleType: 'choice',
				context: 'derive-values',
				ownerKind: 'host',
			}),
		).toEqual(expect.objectContaining({ code: 'seq-member-collision' }));
	});

	it('maps heterogeneous choices to choice-with-multiple-arm-shapes', () => {
		expect(
			describeDeriveShape({
				rawShape: 'choice-needs-variant-or-merge',
				ruleType: 'choice',
				context: 'derive-values',
				ownerKind: 'host',
			}),
		).toEqual(expect.objectContaining({ code: 'choice-with-multiple-arm-shapes' }));
	});

	it('builds rule-unexpected messages from containment context', () => {
		expect(
			describeDeriveShape({
				rawShape: 'optional-wrapping-group-wrapping-alias',
				ruleType: 'alias',
				context: 'optional -> seq member',
				ownerKind: 'host',
				expected: ['field', 'symbol', 'string'],
			}),
		).toEqual(
			expect.objectContaining({
				code: 'rule-unexpected',
				message: expect.stringContaining(
					'we did not expect rule type alias inside optional -> seq member',
				),
			}),
		);
	});
});
