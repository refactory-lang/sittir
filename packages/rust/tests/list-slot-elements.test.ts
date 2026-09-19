import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { Delimiter, ir } from '../src/index.ts';
import type { GenericType } from '../src/types.ts';

type TypeArgumentsSlot = NonNullable<GenericType.LooseConfig>['typeArguments'];

const field = () => ir.fieldDeclaration({ name: 'a', type: 'i32' });

describe('a list slot takes its elements bare, one or many', () => {
	it('builds the same envelope from one bare element, an array, and the built envelope', () => {
		const bare = ir.genericType({ type: 'Vec', typeArguments: 'Edit' });
		const array = ir.genericType({ type: 'Vec', typeArguments: ['Edit'] });
		const built = ir.genericType({ type: 'Vec', typeArguments: ir.typeArguments.strict(ir.identifier('Edit')) });
		expect(bare.$render()).toBe('Vec<Edit>');
		expect(array.$render()).toBe('Vec<Edit>');
		expect(built.$render()).toBe('Vec<Edit>');
	});

	it('builds a list held two envelopes down from one element', () => {
		const expected = 'V {\n    a: i32,\n}';
		expect(ir.enumVariant({ name: 'V', body: field() }).$render()).toBe(expected);
		expect(ir.enumVariant({ name: 'V', body: [field()] }).$render()).toBe(expected);
		expect(ir.enumVariant({ name: 'V', body: { kind: 'field_declaration', name: 'a', type: 'i32' } }).$render()).toBe(expected);
	});

	it('takes the options object first and optional', () => {
		expect(ir.fieldDeclarationListElements(field()).$render()).toBe('a: i32,');
		expect(ir.fieldDeclarationListElements({ delimiter: Delimiter.None }, field()).$render()).toBe('a: i32');
	});

	it('types the slot as the element, the elements, or the envelope', () => {
		const one: TypeArgumentsSlot = 'Edit';
		const many: TypeArgumentsSlot = ['Edit'];
		const built: TypeArgumentsSlot = ir.typeArguments.strict(ir.identifier('Edit'));
		expect([one, many, built]).toHaveLength(3);
	});

	it('rejects a trailing options object', () => {
		const loose = () =>
			// @ts-expect-error an options object is a spelling only as the first argument
			ir.fieldDeclarationListElements(field(), { delimiter: Delimiter.None });
		const strict = () =>
			// @ts-expect-error the strict wrapper takes its options first as well
			ir.fieldDeclarationListElements.strict(field(), { delimiter: Delimiter.None });
		expect([loose, strict]).toHaveLength(2);
	});

	it('records a transparent wrapper content as accepted bare by the list and its envelope', () => {
		const model = JSON.parse(readFileSync(new URL('../src/node-model.json5', import.meta.url), 'utf8')) as {
			nodes: { kind: string; bareAccepts?: string[] }[];
		};
		const accepts = (kind: string): string[] => model.nodes.find((n) => n.kind === kind)?.bareAccepts ?? [];
		expect(accepts('field_declaration_list_elements')).toContain('field_declaration');
		expect(accepts('field_declaration_list')).toContain('field_declaration');
	});
});
