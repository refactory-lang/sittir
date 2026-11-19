import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { sharedEngine } from '@sittir/common/testing';
import type { NodeStorageOptions } from '@sittir/types';
import typescript from '../src/index.ts';

const STORAGES: readonly (readonly [string, NodeStorageOptions])[] = [
	['arena storage', {}],
	['object storage', { nodeStorage: 'object' }]
];

const engines = new Map(await Promise.all(STORAGES.map(async ([name, storage]) => [name, await sharedEngine(() => createEngine(typescript, storage))] as const)));

describe.each(STORAGES)('a refine site builds its default form bare and each named form by name, in %s', (name) => {
	const ts = engines.get(name)!;
	const { build } = ts;
	const k = ts.kinds;
	const object = build.identifier('a');
	const property = build.identifier('b');
	const declarators = [build.variableDeclaratorPlain({ name: build.identifier('x'), value: build.identifier('y') })] as const;
	const left = build.identifier('x');
	const right = build.identifier('xs');

	const statementOf = (source: string): any => ts.parse(`${source}\n`).statements()[0];

	describe('member_expression', () => {
		const readBack = (text: string) => statementOf(`${text};`).expression();

		it.each([
			['bare', () => build.memberExpression({ object, property }), 'a.b', k.Dot],
			['dot', () => build.memberExpression.dot({ object, property }), 'a.b', k.Dot],
			['optional', () => build.memberExpression.optional({ object, property }), 'a?.b', k.OptionalChain],
			['bare given the pinned operator', () => build.memberExpression({ object, operator: '?.', property }), 'a?.b', k.OptionalChain]
		])('%s renders its text and reads back as the same form', (_, make, text, operator) => {
			const built = make();
			expect(built.$render()).toBe(text);
			expect(built.operator()).toBe(operator);
			const parsed = readBack(text);
			expect(parsed.$type).toBe(built.$type);
			expect(parsed.operator()).toBe(built.operator());
		});
	});

	describe('using_declaration', () => {
		it.each([
			['bare', () => build.usingDeclaration({ variableDeclarators: declarators }), 'using x = y;'],
			['plain', () => build.usingDeclaration.plain({ variableDeclarators: declarators }), 'using x = y;'],
			['await', () => build.usingDeclaration.await({ variableDeclarators: declarators }), 'await using x = y;'],
			['bare given the pinned kind', () => build.usingDeclaration({ kind: 'await using', variableDeclarators: declarators }), 'await using x = y;']
		])('%s renders its text and reads back as the same form', (_, make, text) => {
			const built = make();
			expect(built.$render()).toBe(text);
			const parsed = statementOf(text);
			expect(parsed.$type).toBe(built.$type);
			expect(parsed.kind()).toBe(built.kind());
		});

		it('refuses a pinned kind that names no form', () => {
			// @ts-expect-error 'await' is not a form of the kind field
			expect(() => build.usingDeclaration({ kind: 'await', variableDeclarators: declarators })).toThrow('expected one of: using, await using');
		});
	});

	describe('for_header_using_kind', () => {
		const operator = k.OfKeyword;
		const headerOf = (text: string) => statementOf(`for ${text} {}`).header();

		it.each([
			['bare', () => build.forHeaderUsingKind({ left, operator, right }), '(using x of xs)'],
			['plain', () => build.forHeaderUsingKind.plain({ left, operator, right }), '(using x of xs)'],
			['await', () => build.forHeaderUsingKind.await({ left, operator, right }), '(await using x of xs)'],
			['bare given the pinned kind', () => build.forHeaderUsingKind({ kind: 'await using', left, operator, right }), '(await using x of xs)']
		])('%s renders its text and reads back as the same form', (_, make, text) => {
			const built = make();
			expect(built.$render()).toBe(text);
			const parsed = headerOf(text);
			expect(parsed.$type).toBe(built.$type);
			expect(parsed.kind()).toBe(built.kind());
		});
	});

	const members = build.objectType({ members: [build.propertySignature({ name: build.identifier('x') })] }).members();
	const bodies = [
		{
			name: 'object_type',
			prefix: 'type T = ',
			valueOf: (statement: any) => statement.value(),
			bare: () => build.objectType({ members }),
			curly: () => build.objectType.curly({ members }),
			flow: () => build.objectType.flow({ members }),
			pinned: () => build.objectType({ members, opening: '{|', closing: '|}' }),
			openingAlone: () =>
				// @ts-expect-error opening without closing
				build.objectType({ members, opening: '{|' }),
			closingAlone: () =>
				// @ts-expect-error closing without opening
				build.objectType({ members, closing: '|}' })
		},
		{
			name: 'interface_body',
			prefix: 'interface T ',
			valueOf: (statement: any) => statement.body(),
			bare: () => build.interfaceBody({ members }),
			curly: () => build.interfaceBody.curly({ members }),
			flow: () => build.interfaceBody.flow({ members }),
			pinned: () => build.interfaceBody({ members, opening: '{|', closing: '|}' }),
			openingAlone: () =>
				// @ts-expect-error opening without closing
				build.interfaceBody({ members, opening: '{|' }),
			closingAlone: () =>
				// @ts-expect-error closing without opening
				build.interfaceBody({ members, closing: '|}' })
		}
	];

	describe.each(bodies)('$name', (body) => {
		it('builds the curly form bare and by name, and the flow form by name, as the same text it reads back from', () => {
			expect(body.bare().$render()).toBe('{\n  x;\n}');
			expect(body.curly().$render()).toBe('{\n  x;\n}');
			const flow = body.flow();
			expect(flow.$render()).toBe('{|\n  x;\n|}');
			const parsed = body.valueOf(statementOf(`${body.prefix}${flow.$render()}`));
			expect(parsed.opening()).toBe(flow.opening());
			expect(parsed.closing()).toBe(flow.closing());
		});

		it('builds the flow form bare when both pinned fields are given', () => {
			const built = body.pinned();
			expect(built.$render()).toBe('{|\n  x;\n|}');
			expect(built.opening()).toBe(k.LbracePipe);
			expect(built.closing()).toBe(k.PipeRbrace);
		});

		it('refuses opening alone and closing alone', () => {
			expect(() => body.openingAlone()).toThrow(/give 'opening' and 'closing', or neither/);
			expect(() => body.closingAlone()).toThrow(/give 'opening' and 'closing', or neither/);
		});
	});
});
