import { describe, expect, it } from 'vitest';
import { checkRule } from '../template-coverage.ts';
import type { RawNodeEntry } from '../../codegen-surface.ts';
import type { TemplateRule } from '@sittir/types';

// checkRule's union-slot-routing exemption (see the `unionSlotRoutedByKind`
// comment in checkRule) only skips a `missing-field` issue when BOTH:
//   1. the stamped fact says this exact field's arm was folded into the
//      union slot (`unionSlotRouted.fields.has(fname)`), and
//   2. the template actually references that slot's placeholder
//      (`unionPlaceholders.has(unionSlotRouted.unionSlot)`).
// These three cases pin that AND, not an OR — a template that dropped the
// placeholder, or a field the stamped fact never mentions, must still
// surface as a real `missing-field` defect.
describe('checkRule — union-slot-routed field exemption', () => {
	const entry: RawNodeEntry = {
		type: 'test_kind',
		named: true,
		fields: { from_clause: { required: false, multiple: false, types: [] } }
	};

	it('exempts a field whose stamped union-slot placeholder is present in the template', () => {
		const rule: TemplateRule = { template: 'import $$$FROM_CLAUSE_SLOT' };
		const unionSlotRouted = { unionSlot: 'from_clause_slot', fields: new Set(['from_clause']) };
		const issues = checkRule(entry, rule, new Set(), unionSlotRouted, undefined, undefined, 'test.jinja');
		expect(issues).toEqual([]);
	});

	it('still reports missing-field when the stamped field is routed but the template dropped the slot placeholder', () => {
		const rule: TemplateRule = { template: 'import x' };
		const unionSlotRouted = { unionSlot: 'from_clause_slot', fields: new Set(['from_clause']) };
		const issues = checkRule(entry, rule, new Set(), unionSlotRouted, undefined, undefined, 'test.jinja');
		expect(issues).toEqual([
			expect.objectContaining({
				type: 'missing-field',
				message: expect.stringContaining("field 'from_clause' declared but not referenced")
			})
		]);
	});

	it('still reports missing-field when the placeholder is present but the field is not the stamped union-slot member', () => {
		const rule: TemplateRule = { template: 'import $$$FROM_CLAUSE_SLOT' };
		// Union-slot routing exists for this kind but names a DIFFERENT field —
		// `from_clause` itself was never stamped as routed through the slot.
		const unionSlotRouted = { unionSlot: 'from_clause_slot', fields: new Set(['other_field']) };
		const issues = checkRule(entry, rule, new Set(), unionSlotRouted, undefined, undefined, 'test.jinja');
		expect(issues).toEqual([
			expect.objectContaining({
				type: 'missing-field',
				message: expect.stringContaining("field 'from_clause' declared but not referenced")
			})
		]);
	});

	it('still reports missing-field when there is no union-slot routing at all for the kind', () => {
		const rule: TemplateRule = { template: 'import $$$FROM_CLAUSE_SLOT' };
		const issues = checkRule(entry, rule, new Set(), undefined, undefined, undefined, 'test.jinja');
		expect(issues).toEqual([
			expect.objectContaining({
				type: 'missing-field',
				message: expect.stringContaining("field 'from_clause' declared but not referenced")
			})
		]);
	});
});

// checkRule's child-delegated-field exemption (computeChildDelegatedFields)
// pins the same AND condition as union-slot routing: a field only counts
// as covered by a polymorph parent's `content` dispatch (e.g.
// `call_expression.jinja`: `{{ content }}`) when BOTH the field is a
// member of the child-delegated set AND the template still references
// `content` itself — a template that dropped `content` too renders
// nothing for this kind, a real bug, not exempt.
describe('checkRule — child-delegated (polymorph) field exemption', () => {
	const entry: RawNodeEntry = {
		type: 'call_expression',
		named: true,
		fields: { function: { required: false, multiple: false, types: [] } }
	};

	it('exempts a field hoisted from a children.types variant kind when the content slot is referenced', () => {
		const rule: TemplateRule = { template: '$CONTENT' };
		const childDelegated = { contentSlot: 'content', fields: new Set(['function']) };
		const issues = checkRule(entry, rule, new Set(), undefined, childDelegated, undefined, 'test.jinja');
		expect(issues).toEqual([]);
	});

	it('still reports missing-field when the content slot placeholder is dropped from the template', () => {
		const rule: TemplateRule = { template: 'plain text, no dispatch' };
		const childDelegated = { contentSlot: 'content', fields: new Set(['function']) };
		const issues = checkRule(entry, rule, new Set(), undefined, childDelegated, undefined, 'test.jinja');
		expect(issues).toEqual([
			expect.objectContaining({
				type: 'missing-field',
				message: expect.stringContaining("field 'function' declared but not referenced")
			})
		]);
	});

	it('still reports missing-field when the field is not in the child-delegated set', () => {
		const rule: TemplateRule = { template: '$CONTENT' };
		const childDelegated = { contentSlot: 'content', fields: new Set(['other_field']) };
		const issues = checkRule(entry, rule, new Set(), undefined, childDelegated, undefined, 'test.jinja');
		expect(issues).toEqual([
			expect.objectContaining({
				type: 'missing-field',
				message: expect.stringContaining("field 'function' declared but not referenced")
			})
		]);
	});

	it('still reports missing-field when there is no child-delegation fact at all for the kind', () => {
		const rule: TemplateRule = { template: '$CONTENT' };
		const issues = checkRule(entry, rule, new Set(), undefined, undefined, undefined, 'test.jinja');
		expect(issues).toEqual([
			expect.objectContaining({
				type: 'missing-field',
				message: expect.stringContaining("field 'function' declared but not referenced")
			})
		]);
	});
});
