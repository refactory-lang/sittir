import { describe, it, expect } from 'vitest';
import { emitConsts } from '../consts.ts';
import type { NodeMap } from '../../compiler/types.ts';
import { CHOICE, PATTERN, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import {
	AssembledBranch,
	AssembledPattern,
	AssembledKeyword,
	AssembledToken,
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
	it('emits NODE_KINDS for branch nodes', () => {
		const node = new AssembledBranch(
			'function_item',
			{ type: SYMBOL, name: 'identifier' },
			{ type: SYMBOL, name: 'identifier' },
			{ slots: [] }
		);
		const nodeMap = makeNodeMap([['function_item', node]]);
		const output = emitConsts({ grammar: 'test', nodeMap });
		expect(output).toContain("'function_item'");
		expect(output).toContain('NODE_KINDS');
	});

	it('emits LEAF_KINDS for leaf and keyword nodes', () => {
		const nodeMap = makeNodeMap([
			['identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' })],
			['true', new AssembledKeyword('true', { type: STRING, value: 'true' })]
		]);
		const output = emitConsts({ grammar: 'test', nodeMap });
		expect(output).toContain('LEAF_KINDS');
		expect(output).toContain("'identifier'");
		expect(output).toContain("'true'");
	});

	it('emits KEYWORDS and OPERATORS from token nodes', () => {
		const nodeMap = makeNodeMap([
			['fn', new AssembledKeyword('fn', { type: STRING, value: 'fn' })],
			['+', new AssembledToken('+', { type: STRING, value: '+' })]
		]);
		const output = emitConsts({ grammar: 'test', nodeMap });
		expect(output).toContain('KEYWORDS');
		expect(output).toContain("'fn'");
		expect(output).toContain('OPERATORS');
		// Operators are JSON-stringified to safely escape special chars,
		// so single chars use double quotes.
		expect(output).toContain('"+"');
	});

	it('emits enum values', () => {
		const nodeMap = makeNodeMap([
			[
				'visibility',
				new AssembledEnum('visibility', {
					type: CHOICE,
					members: [
						{ type: STRING, value: 'pub' },
						{ type: STRING, value: 'crate' }
					]
				})
			]
		]);
		const output = emitConsts({ grammar: 'test', nodeMap });
		// escForSource (not a bare `'/g` replace) — a bare replace only
		// escaped single quotes, breaking on values containing a literal
		// newline (the automatic-semicolon marker).
		expect(output).toContain("'pub'");
		expect(output).toContain("'crate'");
	});

	// ADR-0012 — bitflag const enum emission
	it('emits a const enum for a bitflag field (repeat1 of choice-of-literals)', () => {
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
		expect(output).toContain('export const enum Modifiers {');
		expect(output).toContain('Async = 1 << 0,');
		expect(output).toContain('Unsafe = 1 << 1,');
		expect(output).toContain('Const = 1 << 2,');
		// repeat1 → no None zero-flag member
		expect(output).not.toMatch(/export const enum Modifiers \{\s+None = 0/);
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
		expect(output).toContain('export const enum ClassDeclarationModifiers {');
		expect(output).toContain('export const enum MethodDefinitionModifiers {');
		// Bare `Modifiers` should NOT appear when both are disambiguated.
		expect(output).not.toMatch(/export const enum Modifiers \{/);
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

	it('emits tree-sitter numeric kind and field ID maps from generated metadata', () => {
		const sourceFile = new AssembledBranch(
			'source_file',
			{ type: SYMBOL, name: 'x' },
			{ type: SYMBOL, name: 'x' },
			{ slots: [field('item')] }
		);
		const nodeMap = makeNodeMap([
			['source_file', sourceFile],
			[';', new AssembledToken(';', { type: STRING, value: ';' })]
		]);

		const output = emitConsts({
			grammar: 'test',
			nodeMap,
			generatedIdTables: {
				kindIds: {
					source_file: {
						id: 1,
						parser: {
							cSymbol: 'sym_source_file',
							parserName: 'source_file',
							anon: false,
							aux: false,
							alias: false,
							hidden: false
						}
					},
					';': {
						id: 2,
						parser: {
							cSymbol: 'anon_sym_SEMI',
							parserName: 'SEMI',
							anon: true,
							aux: false,
							alias: false,
							hidden: false
						}
					},
					missing: {
						id: 99,
						parser: {
							cSymbol: 'sym_missing',
							parserName: 'missing',
							anon: false,
							aux: false,
							alias: false,
							hidden: false
						}
					}
				},
				fieldIds: {
					item: {
						id: 7,
						parser: { cSymbol: 'field_item', parserName: 'item', anon: false, aux: false, alias: false, hidden: false }
					},
					missing: {
						id: 99,
						parser: {
							cSymbol: 'field_missing',
							parserName: 'missing',
							anon: false,
							aux: false,
							alias: false,
							hidden: false
						}
					}
				},
				sourceArtifact: 'parser.wasm'
			}
		});

		expect(output).toContain('export const TREE_SITTER_ID_SOURCE = "parser.wasm";');
		expect(output).toContain('export const TREE_SITTER_KIND_ID_BY_KIND = {');
		expect(output).toContain('"source_file": 1,');
		expect(output).toContain('";": 2,');
		expect(output).not.toContain('export const enum TSKindId {');
		// KIND rows come from the FULL parser-symbol catalog now (#129: the
		// old nodeMap-name filtering could never include collision-
		// disambiguated catalog keys like rust's `anon_block`, so emitters
		// resolving those entries referenced ids these tables never carried).
		// A catalog row absent from the nodeMap ('missing') is therefore
		// INCLUDED on the kind side...
		expect(output).toContain('"missing": 99,');
		// ...while FIELD rows keep the nodeMap-derived universe: the same
		// name in the fieldIds table stays excluded.
		expect(output).not.toContain('FieldMissing');
		expect(output).toContain('export const enum TSFieldId {');
		expect(output).toContain('FieldItem = 7,');
		expect(output).toContain('"item": TSFieldId.FieldItem,');
		expect(output).toContain('export const TREE_SITTER_KIND_ID_JSON = [');
		expect(output).toContain('{ name: "source_file", id: 1, enumName: "SourceFile", cName: "sym_source_file" },');
		expect(output).toContain('export const TREE_SITTER_FIELD_ID_JSON = [');
		expect(output).toContain('{ name: "item", id: 7, enumName: "FieldItem", cName: "field_item" },');
	});
});
