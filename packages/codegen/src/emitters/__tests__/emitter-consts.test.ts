import { describe, it, expect } from 'vitest';
import { emitConsts } from '../consts.ts';
import type { NodeMap } from '../../compiler/types.ts';
import type {
	AssembledBranch,
	AssembledPattern,
	AssembledKeyword,
	AssembledToken,
	AssembledEnum
} from '../../compiler/model/node-map.ts';

function makeNodeMap(nodes: [string, any][]): NodeMap {
	return {
		name: 'test',
		nodes: new Map(nodes),
		signatures: { signatures: new Map() },
		derivations: { inferredFields: [], promotedRules: [], repeatedShapes: [] },
		polymorphFormKinds: new Set()
	};
}

describe('emitConsts', () => {
	it('emits NODE_KINDS for branch nodes', () => {
		const nodeMap = makeNodeMap([
			[
				'function_item',
				{
					kind: 'function_item',
					typeName: 'FunctionItem',
					factoryName: 'functionItem',
					modelType: 'branch',
					fields: []
				} as unknown as AssembledBranch
			]
		]);
		const output = emitConsts({ grammar: 'test', nodeMap });
		expect(output).toContain("'function_item'");
		expect(output).toContain('NODE_KINDS');
	});

	it('emits LEAF_KINDS for leaf and keyword nodes', () => {
		const nodeMap = makeNodeMap([
			[
				'identifier',
				{
					kind: 'identifier',
					typeName: 'Identifier',
					factoryName: 'identifier',
					modelType: 'pattern'
				} as unknown as AssembledPattern
			],
			[
				'true',
				{
					kind: 'true',
					typeName: 'True',
					factoryName: 'true_',
					modelType: 'keyword',
					text: 'true'
				} as unknown as AssembledKeyword
			]
		]);
		const output = emitConsts({ grammar: 'test', nodeMap });
		expect(output).toContain('LEAF_KINDS');
		expect(output).toContain("'identifier'");
		expect(output).toContain("'true'");
	});

	it('emits KEYWORDS and OPERATORS from token nodes', () => {
		const nodeMap = makeNodeMap([
			[
				'fn',
				{
					kind: 'fn',
					typeName: 'Fn',
					modelType: 'keyword',
					text: 'fn'
				} as unknown as AssembledKeyword
			],
			[
				'+',
				{
					kind: '+',
					typeName: 'Plus',
					modelType: 'token'
				} as unknown as AssembledToken
			]
		]);
		const output = emitConsts({ grammar: 'test', nodeMap });
		expect(output).toContain('KEYWORDS');
		expect(output).toContain("'fn'");
		expect(output).toContain('OPERATORS');
		// Operators are JSON-stringified to safely escape special chars,
		// so single chars use double quotes.
		expect(output).toContain('"+"');
	});

	it('emits FIELD_MAP for branch nodes', () => {
		const nodeMap = makeNodeMap([
			[
				'function_item',
				{
					kind: 'function_item',
					typeName: 'FunctionItem',
					factoryName: 'functionItem',
					modelType: 'branch',
					fields: [
						{
							name: 'name',
							propertyName: 'name',
							paramName: 'name',
							values: [
								{
									kind: 'node-ref',
									node: { kind: 'unresolved-ref', name: 'identifier' },
									multiplicity: 'single'
								}
							],
							source: 'grammar'
						},
						{
							name: 'body',
							propertyName: 'body',
							paramName: 'body',
							values: [
								{
									kind: 'node-ref',
									node: { kind: 'unresolved-ref', name: 'block' },
									multiplicity: 'single'
								}
							],
							source: 'grammar'
						}
					]
				} as unknown as AssembledBranch
			]
		]);
		const output = emitConsts({ grammar: 'test', nodeMap });
		expect(output).toContain('FIELD_MAP');
		expect(output).toContain("name: 'name'");
		expect(output).toContain("name: 'body'");
	});

	it('emits enum values', () => {
		const nodeMap = makeNodeMap([
			[
				'visibility',
				{
					kind: 'visibility',
					typeName: 'Visibility',
					modelType: 'enum',
					values: ['pub', 'crate']
				} as unknown as AssembledEnum
			]
		]);
		const output = emitConsts({ grammar: 'test', nodeMap });
		expect(output).toContain("'pub'");
		expect(output).toContain("'crate'");
	});

	// ADR-0012 — bitflag const enum emission
	it('emits a const enum for a bitflag field (repeat1 of choice-of-literals)', () => {
		const field = {
			name: 'modifiers',
			propertyName: 'modifiers',
			paramName: 'modifiers',
			source: 'grammar',
			values: [
				{ kind: 'terminal', value: 'async', multiplicity: 'nonEmptyArray' },
				{ kind: 'terminal', value: 'unsafe', multiplicity: 'nonEmptyArray' },
				{ kind: 'terminal', value: 'const', multiplicity: 'nonEmptyArray' }
			]
		};
		const nodeMap = makeNodeMap([
			[
				'function_item',
				{
					kind: 'function_item',
					typeName: 'FunctionItem',
					factoryName: 'functionItem',
					modelType: 'branch',
					fields: [field]
				} as unknown as AssembledBranch
			]
		]);
		const output = emitConsts({ grammar: 'test', nodeMap });
		expect(output).toContain('export const enum Modifiers {');
		expect(output).toContain('Async = 1 << 0,');
		expect(output).toContain('Unsafe = 1 << 1,');
		expect(output).toContain('Const = 1 << 2,');
		// repeat1 → no None zero-flag member
		expect(output).not.toMatch(/export const enum Modifiers \{\s+None = 0/);
	});

	it('includes None = 0 when repeat allows zero flags', () => {
		const field = {
			name: 'modifiers',
			propertyName: 'modifiers',
			paramName: 'modifiers',
			source: 'grammar',
			values: [
				{ kind: 'terminal', value: 'async', multiplicity: 'array' },
				{ kind: 'terminal', value: 'unsafe', multiplicity: 'array' }
			]
		};
		const nodeMap = makeNodeMap([
			[
				'function_item',
				{
					kind: 'function_item',
					typeName: 'FunctionItem',
					factoryName: 'functionItem',
					modelType: 'branch',
					fields: [field]
				} as unknown as AssembledBranch
			]
		]);
		const output = emitConsts({ grammar: 'test', nodeMap });
		expect(output).toContain('None = 0,');
	});

	it('disambiguates bitflag const names when two kinds share a field name', () => {
		const mkField = (values: string[]) => ({
			name: 'modifiers',
			propertyName: 'modifiers',
			paramName: 'modifiers',
			source: 'grammar',
			values: values.map((v) => ({
				kind: 'terminal',
				value: v,
				multiplicity: 'nonEmptyArray'
			}))
		});
		const nodeMap = makeNodeMap([
			[
				'class_declaration',
				{
					kind: 'class_declaration',
					typeName: 'ClassDeclaration',
					factoryName: 'classDeclaration',
					modelType: 'branch',
					fields: [mkField(['public', 'abstract'])]
				} as unknown as AssembledBranch
			],
			[
				'method_definition',
				{
					kind: 'method_definition',
					typeName: 'MethodDefinition',
					factoryName: 'methodDefinition',
					modelType: 'branch',
					fields: [mkField(['async', 'static'])]
				} as unknown as AssembledBranch
			]
		]);
		const output = emitConsts({ grammar: 'test', nodeMap });
		expect(output).toContain('export const enum ClassDeclarationModifiers {');
		expect(output).toContain('export const enum MethodDefinitionModifiers {');
		// Bare `Modifiers` should NOT appear when both are disambiguated.
		expect(output).not.toMatch(/export const enum Modifiers \{/);
	});

	it('PascalCases keyword values with non-identifier characters', () => {
		const field = {
			name: 'visibility',
			propertyName: 'visibility',
			paramName: 'visibility',
			source: 'grammar',
			values: [
				{ kind: 'terminal', value: 'pub', multiplicity: 'nonEmptyArray' },
				{ kind: 'terminal', value: 'pub(crate)', multiplicity: 'nonEmptyArray' }
			]
		};
		const nodeMap = makeNodeMap([
			[
				'visibility_modifier',
				{
					kind: 'visibility_modifier',
					typeName: 'VisibilityModifier',
					factoryName: 'visibilityModifier',
					modelType: 'branch',
					fields: [field]
				} as unknown as AssembledBranch
			]
		]);
		const output = emitConsts({ grammar: 'test', nodeMap });
		expect(output).toContain('Pub = 1 << 0,');
		expect(output).toContain('PubCrate = 1 << 1,');
	});

	it('emits tree-sitter numeric kind and field ID maps from generated metadata', () => {
		const nodeMap = makeNodeMap([
			[
				'source_file',
				{
					kind: 'source_file',
					typeName: 'SourceFile',
					factoryName: 'sourceFile',
					modelType: 'branch',
					fields: [
						{
							name: 'item',
							propertyName: 'item',
							paramName: 'item',
							values: [],
							source: 'grammar'
						}
					]
				} as unknown as AssembledBranch
			],
			[
				';',
				{
					kind: ';',
					typeName: 'Semi',
					modelType: 'token'
				} as unknown as AssembledToken
			]
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
		expect(output).not.toContain('missing');
		expect(output).toContain('export const enum TSFieldId {');
		expect(output).toContain('FieldItem = 7,');
		expect(output).toContain('"item": TSFieldId.FieldItem,');
		expect(output).toContain('export const TREE_SITTER_KIND_ID_JSON = [');
		expect(output).toContain('{ name: "source_file", id: 1, enumName: "SourceFile", cName: "sym_source_file" },');
		expect(output).toContain('export const TREE_SITTER_FIELD_ID_JSON = [');
		expect(output).toContain('{ name: "item", id: 7, enumName: "FieldItem", cName: "field_item" },');
	});
});
