/**
 * Per-modelType emit tests for the template emitter
 * (Task 2.4 of PR1 — rule-attributes-and-template-emitter refactor;
 *  updated Task 3.B3 of PR2 — authority flip + renderRule consumption).
 *
 * Each emit function (branch / group) is exercised with a
 * minimal in-memory fixture:
 *
 * - Branch and Group: mocks carry `renderRule` (RenderRule, wrapper-free)
 *   since emitBranchTemplate / emitGroupTemplate now consume renderRule.
 *   Fixtures use leaf-attribute symbols (fieldName / multiplicity) instead
 *   of FieldRule / OptionalRule / RepeatRule wrappers.
 *
 * `multi` nodes never reach the emitter (classifyTemplateEmission always
 * skips them), so there is no emit function to exercise for that modelType.
 */

import { SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import type { Rule, SeqRule, StringRule, SymbolRule } from '../../types/rule.ts';
import type {
	AssembledBranch,
	AssembledGroup,
	AssembledNonterminal,
	NodeOrTerminal
} from '../../compiler/model/node-map.ts';
import { emitBranchTemplate, emitGroupTemplate, type EmitCtx } from '../templates.ts';

function makeCtx(overrides: Partial<EmitCtx> = {}): EmitCtx {
	return {
		nodeMap: {
			slotByRuleId: new Map(),
			nodeByRuleId: new Map(),
			nodes: new Map()
		} as unknown as EmitCtx['nodeMap'],
		wordMatcher: /^\w+$/,
		externals: [],
		rules: {},
		visitingHelpers: new Set<string>(),
		...overrides
	};
}

/**
 * A minimal terminal value with `multiplicity: 'single'` so `isRequired`
 * returns `true`. Slots that represent required scalar fields need at least
 * one single-multiplicity value; otherwise `isRequired` conservatively
 * returns `false` (empty values array = no evidence of requiredness) and the
 * emitter wraps the slot in a `{% if ... | isPresent %}` guard.
 */
const SINGLE_REQUIRED_VALUE: NodeOrTerminal = {
	value: 'x',
	multiplicity: 'single'
};

function makeSlot(overrides: Partial<AssembledNonterminal>): AssembledNonterminal {
	return {
		name: 'value',
		propertyName: 'value',
		configKey: 'value',
		storageName: 'value',
		values: [SINGLE_REQUIRED_VALUE],
		paramName: 'value',
		hasTrailing: false,
		hasLeading: false,
		...overrides
	} as AssembledNonterminal;
}

// Minimal mock factories.
//
// Branch / Group: emitBranchTemplate / emitGroupTemplate consume `renderRule`
// (PR2 Task 3.B3). Mocks supply `renderRule` (RenderRule, wrapper-free shape).
function mockBranch(renderRule: Rule): AssembledBranch {
	return { modelType: 'branch', renderRule } as unknown as AssembledBranch;
}

function mockGroup(renderRule: Rule, name = 'g', kind = name): AssembledGroup {
	return { modelType: 'group', renderRule, name, kind } as unknown as AssembledGroup;
}

describe('emitBranchTemplate', () => {
	it('emits a single literal for a string-only rule', () => {
		// renderRule (wrapper-free): a plain string is unchanged from RawRule.
		const rule: StringRule = { type: STRING, value: 'fn' };
		expect(emitBranchTemplate(mockBranch(rule), makeCtx())).toBe('fn');
	});

	it('emits literal + slot for a seq with a leaf-attribute symbol (RenderRule field path)', () => {
		// RenderRule: no FieldRule wrapper — fieldName is a leaf attribute on the symbol.
		const sym: SymbolRule = { type: SYMBOL, name: 'identifier', id: 'r1', fieldName: 'name' };
		const rule: SeqRule = {
			type: SEQ,
			members: [{ type: STRING, value: 'fn ' }, sym]
		};
		const slot = makeSlot({ name: 'name', propertyName: 'name', storageName: 'name' });
		const ctx = makeCtx({
			nodeMap: {
				slotByRuleId: new Map([['r1', slot]]),
				nodeByRuleId: new Map(),
				nodes: new Map()
			} as unknown as EmitCtx['nodeMap']
		});
		expect(emitBranchTemplate(mockBranch(rule), ctx)).toBe('fn {{ name }}');
	});

	it('emits multiple slots interleaved with literals', () => {
		// RenderRule: both left/right symbols carry fieldName attributes.
		const left: SymbolRule = {
			type: SYMBOL,
			name: 'expression',
			id: 'rL',
			fieldName: 'left'
		};
		const right: SymbolRule = {
			type: SYMBOL,
			name: 'expression',
			id: 'rR',
			fieldName: 'right'
		};
		const rule: SeqRule = {
			type: SEQ,
			members: [left, { type: STRING, value: ' + ' }, right]
		};
		const slotL = makeSlot({ name: 'left', propertyName: 'left', storageName: 'left' });
		const slotR = makeSlot({ name: 'right', propertyName: 'right', storageName: 'right' });
		const ctx = makeCtx({
			nodeMap: {
				slotByRuleId: new Map([
					['rL', slotL],
					['rR', slotR]
				]),
				nodeByRuleId: new Map(),
				nodes: new Map()
			} as unknown as EmitCtx['nodeMap']
		});
		expect(emitBranchTemplate(mockBranch(rule), ctx)).toBe('{{ left }} + {{ right }}');
	});
});

describe('emitGroupTemplate', () => {
	it('emits a single literal for a string-only rule', () => {
		const rule: StringRule = { type: STRING, value: 'pub' };
		expect(emitGroupTemplate(mockGroup(rule), makeCtx())).toBe('pub');
	});

	it('emits literal + slot for a seq with a leaf-attribute symbol (RenderRule field path)', () => {
		// RenderRule: no FieldRule wrapper — fieldName is a leaf attribute on the symbol.
		const sym: SymbolRule = { type: SYMBOL, name: 'identifier', id: 'rg1', fieldName: 'name' };
		const rule: SeqRule = {
			type: SEQ,
			members: [{ type: STRING, value: 'mod ' }, sym]
		};
		const slot = makeSlot({ name: 'name', propertyName: 'name', storageName: 'name' });
		const ctx = makeCtx({
			nodeMap: {
				slotByRuleId: new Map([['rg1', slot]]),
				nodeByRuleId: new Map(),
				nodes: new Map()
			} as unknown as EmitCtx['nodeMap']
		});
		expect(emitGroupTemplate(mockGroup(rule), ctx)).toBe('mod {{ name }}');
	});
});
