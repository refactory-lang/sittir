import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { Delimiter } from '@sittir/common/utils';
import type { GenericType } from '../src/types.ts';
import rust from '../src/index.ts';
import { createEngine } from '@sittir/common';

const rs = await createEngine(rust);

type TypeArgumentsSlot = NonNullable<GenericType.LooseConfig>['typeArguments'];

const field = () => rs.build.fieldDeclaration({ name: 'a', type: 'i32' });

describe('a list slot takes its elements bare, one or many', () => {
	it('builds the same envelope from one bare element, an array, and the built envelope', () => {
		const bare = rs.build.genericType({ type: 'Vec', typeArguments: 'Edit' });
		const array = rs.build.genericType({ type: 'Vec', typeArguments: ['Edit'] });
		const built = rs.build.genericType({ type: 'Vec', typeArguments: rs.build.typeArguments.strict(rs.build.identifier('Edit')) });
		expect(bare.$render()).toBe('Vec<Edit>');
		expect(array.$render()).toBe('Vec<Edit>');
		expect(built.$render()).toBe('Vec<Edit>');
	});

	it('builds a list held two envelopes down from one element', () => {
		const expected = 'V {\n    a: i32,\n}';
		expect(rs.build.enumVariant({ name: 'V', body: field() }).$render()).toBe(expected);
		expect(rs.build.enumVariant({ name: 'V', body: [field()] }).$render()).toBe(expected);
		expect(rs.build.enumVariant({ name: 'V', body: { kind: rs.kinds.FieldDeclaration, name: 'a', type: 'i32' } }).$render()).toBe(
			expected
		);
	});

	it('resolves a bare number, one or many, at a list slot and at a single slot alike', () => {
		expect(rs.build.callExpression({ function: 'f', arguments: [1] }).$render()).toBe('f(1)');
		expect(rs.build.callExpression({ function: 'f', arguments: ['a', 2.5] }).$render()).toBe('f(a, 2.5)');
		expect(rs.build.letDeclaration({ pattern: 'x', value: 1 }).$render()).toBe('let x = 1;');
	});

	it('resolves a bare boolean to the boolean literal, one or many, at a list slot and at a single slot alike', () => {
		expect(rs.build.callExpression({ function: 'f', arguments: [true, false] }).$render()).toBe('f(true, false)');
		expect(rs.build.letDeclaration({ pattern: 'x', value: true }).$render()).toBe('let x = true;');
	});

	it('takes the options object first and optional', () => {
		expect(rs.build.fieldDeclarationListElements(field()).$render()).toBe('a: i32,');
		expect(rs.build.fieldDeclarationListElements({ delimiter: Delimiter.None }, field()).$render()).toBe('a: i32');
	});

	it('types the slot as the element, the elements, or the envelope', () => {
		const one: TypeArgumentsSlot = 'Edit';
		const many: TypeArgumentsSlot = ['Edit'];
		const built: TypeArgumentsSlot = rs.build.typeArguments.strict(rs.build.identifier('Edit'));
		expect([one, many, built]).toHaveLength(3);
	});

	it('rejects a trailing options object', () => {
		const loose = () =>
			// @ts-expect-error an options object is a spelling only as the first argument
			rs.build.fieldDeclarationListElements(field(), { delimiter: Delimiter.None });
		const strict = () =>
			// @ts-expect-error the strict wrapper takes its options first as well
			rs.build.fieldDeclarationListElements.strict(field(), { delimiter: Delimiter.None });
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

	it('requires an element from a non-empty list, with or without options', () => {
		const empty = () =>
			// @ts-expect-error a non-empty list takes at least one element
			rs.build.fieldDeclarationListElements();
		const optionsOnly = () =>
			// @ts-expect-error options alone are not an element
			rs.build.fieldDeclarationListElements({ delimiter: Delimiter.None });
		const strictEmpty = () =>
			// @ts-expect-error the strict wrapper takes at least one element as well
			rs.build.fieldDeclarationListElements.strict();
		expect([empty, optionsOnly, strictEmpty]).toHaveLength(3);
		expect(rs.build.fieldDeclarationListElements(field()).$render()).toBe('a: i32,');
		expect(rs.build.fieldDeclarationListElements({ delimiter: Delimiter.None }, field()).$render()).toBe('a: i32');
		expect(rs.build.fieldDeclarationListElements.strict({ delimiter: Delimiter.None }, field()).$render()).toBe('a: i32');
	});
});
