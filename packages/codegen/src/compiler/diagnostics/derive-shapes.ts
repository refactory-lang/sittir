import type { Diagnostic } from '../../types/diagnostics.ts';
import type { RuleId } from '../../types/rule.ts';

export type DeriveShapeCode =
	| 'alias-collision'
	| 'seq-with-nested-seq'
	| 'seq-member-collision'
	| 'choice-with-multiple-arm-shapes'
	| 'rule-unexpected'
	| 'polymorph-classification-gap';

export interface DeriveShapeDiagnostic extends Diagnostic {
	readonly code: DeriveShapeCode;
	readonly severity: 'error';
	readonly message: string;
	readonly canProceed: false;
	readonly ownerKind?: string;
	readonly ruleId?: RuleId;
	readonly proposal?: string;
	readonly details: {
		readonly rawShape: string;
		readonly ruleType: string;
		readonly context: string;
		readonly expected?: readonly string[];
	};
}

export function describeDeriveShape(input: {
	rawShape: string;
	ruleType: string;
	context: string;
	ownerKind?: string;
	ruleId?: RuleId;
	expected?: readonly string[];
}): DeriveShapeDiagnostic {
	if (input.rawShape === 'seq-with-nested-seq') {
		return {
			code: 'seq-with-nested-seq',
			severity: 'error',
			ownerKind: input.ownerKind,
			ruleId: input.ruleId,
			message:
				`Kind '${input.ownerKind ?? '(no-kind-context)'}' still contains a nested seq ` +
				`that should have been flattened, grouped, or normalized before derive.`,
			proposal: 'Introduce a visible group or normalize the nested seq earlier.',
			canProceed: false,
			details: {
				rawShape: input.rawShape,
				ruleType: input.ruleType,
				context: input.context,
				expected: input.expected
			}
		};
	}
	if (input.rawShape.startsWith('seq-member-')) {
		return {
			code: 'seq-member-collision',
			severity: 'error',
			ownerKind: input.ownerKind,
			ruleId: input.ruleId,
			message:
				`Kind '${input.ownerKind ?? '(no-kind-context)'}' has a seq member with a ` +
				`noncanonical structural shape that must be grouped, merged, or variantized.`,
			proposal: 'Normalize the offending seq member before derive.',
			canProceed: false,
			details: {
				rawShape: input.rawShape,
				ruleType: input.ruleType,
				context: input.context,
				expected: input.expected
			}
		};
	}
	if (input.rawShape.includes('choice-needs-variant-or-merge')) {
		return {
			code: 'choice-with-multiple-arm-shapes',
			severity: 'error',
			ownerKind: input.ownerKind,
			ruleId: input.ruleId,
			message:
				`Kind '${input.ownerKind ?? '(no-kind-context)'}' has a choice whose arms ` +
				`still carry multiple structural shapes at derive time.`,
			proposal: 'Adopt variant() or merge/hoist the choice arms before derive.',
			canProceed: false,
			details: {
				rawShape: input.rawShape,
				ruleType: input.ruleType,
				context: input.context,
				expected: input.expected
			}
		};
	}
	if (input.rawShape.includes('polymorph')) {
		return {
			code: 'polymorph-classification-gap',
			severity: 'error',
			ownerKind: input.ownerKind,
			ruleId: input.ruleId,
			message:
				`Kind '${input.ownerKind ?? '(no-kind-context)'}' reached derive in a shape ` +
				`that should have been classified as polymorph earlier.`,
			proposal: 'Fix variant()/polymorph classification before derive.',
			canProceed: false,
			details: {
				rawShape: input.rawShape,
				ruleType: input.ruleType,
				context: input.context,
				expected: input.expected
			}
		};
	}
	return {
		code: 'rule-unexpected',
		severity: 'error',
		ownerKind: input.ownerKind,
		ruleId: input.ruleId,
		message:
			`Kind '${input.ownerKind ?? '(no-kind-context)'}': we did not expect rule type ` +
			`${input.ruleType} inside ${input.context}.`,
		proposal: 'Normalize, group, merge, or classify the rule earlier in the pipeline.',
		canProceed: false,
		details: {
			rawShape: input.rawShape,
			ruleType: input.ruleType,
			context: input.context,
			expected: input.expected
		}
	};
}
