import { describe, expect, it } from 'vitest';
import {
	readGrammarKind,
	listBranchKinds,
	type FieldMeta,
	type KindMeta,
} from '../../src/grammar-reader.ts';

describe('readGrammarKind', () => {
	it('reads struct_item from rust grammar', () => {
		const meta = readGrammarKind('rust', 'struct_item');

		expect(meta.kind).toBe('struct_item');

		// fields
		const fieldNames = meta.fields.map((f) => f.name);
		expect(fieldNames).toContain('name');
		expect(fieldNames).toContain('body');
		expect(fieldNames).toContain('type_parameters');

		// name is required
		const nameField = meta.fields.find((f) => f.name === 'name')!;
		expect(nameField.required).toBe(true);
		expect(nameField.multiple).toBe(false);
		expect(nameField.types).toContain('type_identifier');

		// body is optional
		const bodyField = meta.fields.find((f) => f.name === 'body')!;
		expect(bodyField.required).toBe(false);

		// type_parameters is optional
		const tpField = meta.fields.find((f) => f.name === 'type_parameters')!;
		expect(tpField.required).toBe(false);

		// has children
		expect(meta.hasChildren).toBe(true);
		expect(meta.children).toBeDefined();
	});

	it('reads function_item from rust grammar', () => {
		const meta = readGrammarKind('rust', 'function_item');

		expect(meta.kind).toBe('function_item');

		const fieldNames = meta.fields.map((f) => f.name);
		expect(fieldNames).toContain('name');
		expect(fieldNames).toContain('body');
		expect(fieldNames).toContain('parameters');
		expect(fieldNames).toContain('return_type');

		// name, body, parameters are required
		const nameField = meta.fields.find((f) => f.name === 'name')!;
		expect(nameField.required).toBe(true);

		const bodyField = meta.fields.find((f) => f.name === 'body')!;
		expect(bodyField.required).toBe(true);

		const paramsField = meta.fields.find((f) => f.name === 'parameters')!;
		expect(paramsField.required).toBe(true);

		// return_type is optional
		const retField = meta.fields.find((f) => f.name === 'return_type')!;
		expect(retField.required).toBe(false);
	});

	it('reads attribute_item from rust grammar (no fields, has children)', () => {
		const meta = readGrammarKind('rust', 'attribute_item');

		expect(meta.kind).toBe('attribute_item');
		expect(meta.fields).toHaveLength(0);
		expect(meta.hasChildren).toBe(true);
		expect(meta.children).toBeDefined();
		expect(meta.children!.required).toBe(true);
	});

	it('reads function_declaration from go grammar', () => {
		const meta = readGrammarKind('go', 'function_declaration');

		expect(meta.kind).toBe('function_declaration');

		const nameField = meta.fields.find((f) => f.name === 'name')!;
		expect(nameField).toBeDefined();
		expect(nameField.required).toBe(true);
	});

	it('throws for unknown node kind', () => {
		expect(() => readGrammarKind('rust', 'nonexistent_node')).toThrow();
	});
});

describe('listBranchKinds', () => {
	it('returns node kinds from rust grammar', () => {
		const kinds = listBranchKinds('rust');

		expect(kinds).toContain('struct_item');
		expect(kinds).toContain('function_item');
		expect(kinds).toContain('attribute_item');
		expect(Array.isArray(kinds)).toBe(true);
		expect(kinds.length).toBeGreaterThan(10);
	});

	it('filters out abstract types prefixed with _', () => {
		const kinds = listBranchKinds('rust');

		for (const kind of kinds) {
			expect(kind).not.toMatch(/^_/);
		}
	});

	it('filters out subtypes-only entries (no fields and no children)', () => {
		const kinds = listBranchKinds('rust');

		// Each returned kind should have fields or children
		for (const kind of kinds) {
			const meta = readGrammarKind('rust', kind);
			const hasFieldsOrChildren =
				meta.fields.length > 0 || meta.hasChildren;
			expect(hasFieldsOrChildren).toBe(true);
		}
	});
});
