import { describe, it, expect } from 'vitest';
import { emitConsts } from '../consts.ts';
import type { NodeMap } from '../../compiler/types.ts';
import { CHOICE, PATTERN, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import {
	AssembledBranch,
	AssembledPattern,
	AssembledKeyword,
	AssembledPunctuation,
	AssembledEnum,
	AssembledNonterminal,
	type AssembledNode
} from '../../compiler/model/node-map.ts';

function makeNodeMap(nodes: [string, AssembledNode][]): NodeMap {
	return {
		name: 'test',
		nodes: new Map(nodes),
		nodeByRuleId: new Map(),
		nodeByKindId: new Map(),
		slotByRuleId: new Map(),
		signatures: { signatures: new Map() },
		derivations: { inferredFields: [], promotedRules: [], repeatedShapes: [] },
	};
}

// A field's structural role for consts.ts comes entirely from its
// fieldName + values (bitflag/keyword collapsing reads terminal values
// directly) — no owning node or rule is needed to back it.
function field(
	fieldName: string,
	values: readonly { value: string; multiplicity: 'array' | 'nonEmptyArray' }[] = []
): AssembledNonterminal {
	return new AssembledNonterminal({
		values,
		fieldName,
		hasTrailingDelimiter: false,
		hasLeadingDelimiter: false,
		sourceRuleIds: []
	});
}

describe('emitConsts', () => {
	it('emits no kind lists, value lists or id tables', () => {
		const nodeMap = makeNodeMap([
			['function_item', new AssembledBranch('function_item', { type: SYMBOL, name: 'x' }, { type: SYMBOL, name: 'x' }, { slots: [] })],
			['identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' })],
			['fn', new AssembledKeyword('fn', { type: STRING, value: 'fn' })],
			['+', new AssembledPunctuation('+', { type: STRING, value: '+' })],
			[
				'visibility',
				new AssembledEnum('visibility', { type: CHOICE, members: [{ type: STRING, value: 'pub' }, { type: STRING, value: 'crate' }] })
			]
		]);
		const output = emitConsts({ grammar: 'test', nodeMap });
		expect(output).not.toMatch(/KINDS|KEYWORDS|OPERATORS|VISIBILITYS|TREE_SITTER_|TSFieldId/);
	});

	it('emits an enum for a bitflag field (repeat1 of choice-of-literals)', () => {
		const modifiers = field('modifiers', [
			{ value: 'async', multiplicity: 'nonEmptyArray' },
			{ value: 'unsafe', multiplicity: 'nonEmptyArray' },
			{ value: 'const', multiplicity: 'nonEmptyArray' }
		]);
		const node = new AssembledBranch(
			'function_item',
			{ type: SYMBOL, name: 'x' },
			{ type: SYMBOL, name: 'x' },
			{ slots: [modifiers] }
		);
		const nodeMap = makeNodeMap([['function_item', node]]);
		const output = emitConsts({ grammar: 'test', nodeMap });
		expect(output).toContain('export enum Modifiers {');
		expect(output).toContain('Async = 1 << 0,');
		expect(output).toContain('Unsafe = 1 << 1,');
		expect(output).toContain('Const = 1 << 2,');
		// repeat1 → no None zero-flag member
		expect(output).not.toMatch(/export enum Modifiers \{\s+None = 0/);
	});

	it('includes None = 0 when repeat allows zero flags', () => {
		const modifiers = field('modifiers', [
			{ value: 'async', multiplicity: 'array' },
			{ value: 'unsafe', multiplicity: 'array' }
		]);
		const node = new AssembledBranch(
			'function_item',
			{ type: SYMBOL, name: 'x' },
			{ type: SYMBOL, name: 'x' },
			{ slots: [modifiers] }
		);
		const nodeMap = makeNodeMap([['function_item', node]]);
		const output = emitConsts({ grammar: 'test', nodeMap });
		expect(output).toContain('None = 0,');
	});

	it('disambiguates bitflag const names when two kinds share a field name', () => {
		const classNode = new AssembledBranch(
			'class_declaration',
			{ type: SYMBOL, name: 'x' },
			{ type: SYMBOL, name: 'x' },
			{
				slots: [
					field('modifiers', [
						{ value: 'public', multiplicity: 'nonEmptyArray' },
						{ value: 'abstract', multiplicity: 'nonEmptyArray' }
					])
				]
			}
		);
		const methodNode = new AssembledBranch(
			'method_definition',
			{ type: SYMBOL, name: 'x' },
			{ type: SYMBOL, name: 'x' },
			{
				slots: [
					field('modifiers', [
						{ value: 'async', multiplicity: 'nonEmptyArray' },
						{ value: 'static', multiplicity: 'nonEmptyArray' }
					])
				]
			}
		);
		const nodeMap = makeNodeMap([
			['class_declaration', classNode],
			['method_definition', methodNode]
		]);
		const output = emitConsts({ grammar: 'test', nodeMap });
		expect(output).toContain('export enum ClassDeclarationModifiers {');
		expect(output).toContain('export enum MethodDefinitionModifiers {');
		// Bare `Modifiers` should NOT appear when both are disambiguated.
		expect(output).not.toMatch(/export enum Modifiers \{/);
	});

	it('PascalCases keyword values with non-identifier characters', () => {
		const visibility = field('visibility', [
			{ value: 'pub', multiplicity: 'nonEmptyArray' },
			{ value: 'pub(crate)', multiplicity: 'nonEmptyArray' }
		]);
		const node = new AssembledBranch(
			'visibility_modifier',
			{ type: SYMBOL, name: 'x' },
			{ type: SYMBOL, name: 'x' },
			{ slots: [visibility] }
		);
		const nodeMap = makeNodeMap([['visibility_modifier', node]]);
		const output = emitConsts({ grammar: 'test', nodeMap });
		expect(output).toContain('Pub = 1 << 0,');
		expect(output).toContain('PubCrate = 1 << 1,');
	});

});
