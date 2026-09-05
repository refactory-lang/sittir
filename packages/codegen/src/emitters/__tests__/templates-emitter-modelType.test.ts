/**
 * Per-modelType emit tests for the template emitter.
 *
 * Each fixture is exercised through `emitBranchTemplate`, which consumes
 * `renderRule` (RenderRule, wrapper-free) for both plain branches and
 * link-minted compounds (the former "group" shape, now `hoisted: true`
 * on the same compound classes). Fixtures use leaf-attribute symbols
 * (fieldName / multiplicity) instead of FieldRule / OptionalRule / RepeatRule
 * wrappers.
 */

import { CHOICE, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import type { ChoiceRule, Rule, SeqRule, StringRule, SymbolRule } from '../../types/rule.ts';
import type { AssembledBranch, AssembledNonterminal, NodeOrTerminal } from '../../compiler/model/node-map.ts';
import { emitBranchTemplate, type EmitCtx } from '../templates.ts';
import { showBody } from './support/show-body.ts';

const shown = (node: Parameters<typeof emitBranchTemplate>[0], ctx: EmitCtx): string => showBody(emitBranchTemplate(node, ctx));

function makeCtx(overrides: Partial<EmitCtx> = {}): EmitCtx {
	return {
		nodeMap: {
			slotByRuleId: new Map(),
			nodeByRuleId: new Map(),
			nodes: new Map()
		} as unknown as EmitCtx['nodeMap'],
		wordMatcher: /^\w+$/,
		isWordChar: (c: string) => /\w/.test(c),
		isLiteralMergePair: () => false,
		externals: [],
		rules: {},
		visitingHelpers: new Set<string>(),
		emittedSlotNames: new Set(),
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
		hasTrailingDelimiter: false,
		hasLeadingDelimiter: false,
		...overrides
	} as AssembledNonterminal;
}

// Minimal mock factories. `emitBranchTemplate` consumes `renderRule`
// (RenderRule, wrapper-free shape) for both plain branches and link-minted
// compounds; mocks supply it directly.
function mockBranch(renderRule: Rule): AssembledBranch {
	return { modelType: 'branch', renderRule } as unknown as AssembledBranch;
}

function mockGroup(renderRule: Rule, name = 'g', kind = name): AssembledBranch {
	return { modelType: 'branch', hoisted: true, renderRule, name, kind } as unknown as AssembledBranch;
}

describe('emitBranchTemplate', () => {
	it('emits a single literal for a string-only rule', () => {
		// renderRule (wrapper-free): a plain string is unchanged from RawRule.
		const rule: StringRule = { type: STRING, value: 'fn' };
		expect(shown(mockBranch(rule), makeCtx())).toBe('fn');
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
		expect(shown(mockBranch(rule), ctx)).toBe('fn ⟨name⟩');
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
		expect(shown(mockBranch(rule), ctx)).toBe('⟨left⟩ + ⟨right⟩');
	});
});

describe('emitBranchTemplate — separatedList nonterminal separator', () => {
	it("references the transport struct's own `.separator` field instead of a hardcoded literal when the separator is nonterminal", () => {
		// Mirrors the real shape AssembledList.renderRule carries for
		// a rule like `object_type_content: seq(optional(choice(',', ';')),
		// seq(member, repeat(seq(choice(',', ';'), member))), optional(choice(',', ';')))`
		// after link.ts's liftCommaSep + wrapper-deletion: a CHOICE-of-members
		// rule stamped with `multiplicity: 'nonEmptyArray'` and a nonterminal
		// `separator.value` (itself a CHOICE of STRING literals), leading+trailing.
		const sepChoice: ChoiceRule = {
			type: CHOICE,
			members: [
				{ type: STRING, value: ',' },
				{ type: STRING, value: ';' }
			]
		};
		const member: SymbolRule = { type: SYMBOL, name: 'property_signature', id: 'rMember' };
		const rule: ChoiceRule = {
			type: CHOICE,
			id: 'rContent',
			members: [member],
			multiplicity: 'nonEmptyArray',
			separator: { value: sepChoice, trailing: true, leading: true }
		} as unknown as ChoiceRule;
		const slot = makeSlot({
			name: 'content',
			propertyName: 'contents',
			storageName: '_content',
			hasTrailingDelimiter: true,
			hasLeadingDelimiter: true
		});
		const ctx = makeCtx({
			nodeMap: {
				slotByRuleId: new Map([['rContent', slot]]),
				nodeByRuleId: new Map(),
				nodes: new Map()
			} as unknown as EmitCtx['nodeMap']
		});
		expect(shown(mockBranch(rule), ctx)).toBe('⟨content⟩');
	});

	it('still falls back to a compile-time literal when the separator is a plain STRING (not nonterminal)', () => {
		const member: SymbolRule = { type: SYMBOL, name: 'property_signature', id: 'rMember2' };
		const rule: ChoiceRule = {
			type: CHOICE,
			id: 'rContent2',
			members: [member],
			multiplicity: 'nonEmptyArray',
			separator: { value: { type: STRING, value: ',' } }
		} as unknown as ChoiceRule;
		const slot = makeSlot({
			name: 'content',
			propertyName: 'contents',
			storageName: '_content'
		});
		const ctx = makeCtx({
			nodeMap: {
				slotByRuleId: new Map([['rContent2', slot]]),
				nodeByRuleId: new Map(),
				nodes: new Map()
			} as unknown as EmitCtx['nodeMap']
		});
		expect(shown(mockBranch(rule), ctx)).toBe('⟨content⟩');
	});
});

describe('emitBranchTemplate — link-minted (formerly group) node', () => {
	it('emits a single literal for a string-only rule', () => {
		const rule: StringRule = { type: STRING, value: 'pub' };
		expect(shown(mockGroup(rule), makeCtx())).toBe('pub');
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
		expect(shown(mockGroup(rule), ctx)).toBe('mod ⟨name⟩');
	});
});
