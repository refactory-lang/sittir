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

const REMOVED: readonly (readonly [string, readonly string[]])[] = [
	['memberExpression', ['operator']],
	['usingDeclaration', ['kind']],
	['forHeaderUsingKind', ['kind']],
	['objectType', ['opening', 'closing']],
	['interfaceBody', ['opening', 'closing']]
];

describe.each(STORAGES)('a field a refine form pins has no $with setter, in %s', (name) => {
	const ts = engines.get(name)!;
	const { build } = ts;
	const k = ts.kinds;
	const object = build.identifier('a');
	const property = build.identifier('b');
	const declarators = [build.variableDeclaratorPlain({ name: build.identifier('x'), value: build.identifier('y') })] as const;
	const member = () => build.propertySignature({ name: 'x' });
	const content = () => build.objectType({ members: [member()] as any }).members();

	const built: Record<string, () => { readonly $with: Record<string, unknown> }> = {
		memberExpression: () => build.memberExpression({ object, property }),
		usingDeclaration: () => build.usingDeclaration({ variableDeclarators: declarators }),
		forHeaderUsingKind: () => build.forHeaderUsingKind({ left: build.identifier('x'), operator: k.OfKeyword, right: build.identifier('xs') }),
		objectType: () => build.objectType({ members: content() }),
		interfaceBody: () => build.interfaceBody({ members: content() })
	};

	it.each(REMOVED.flatMap(([kind, fields]) => fields.map((field) => [kind, field] as const)))('%s has no $with.%s on a built node', (kind, field) => {
		expect(field in built[kind]!().$with).toBe(false);
	});

	it('has none on a parsed node either', () => {
		const statement: any = ts.parse('type T = { a: 1 };\ninterface I { a: 1 }\nx.y;\nusing z = w;\n').statements();
		const [alias, declaration, expression, using] = [statement[0], statement[1], statement[2].expression(), statement[3]];
		const parsed = { objectType: alias.value(), interfaceBody: declaration.body(), memberExpression: expression, usingDeclaration: using };
		for (const [kind, node] of Object.entries(parsed)) {
			for (const field of REMOVED.find(([removed]) => removed === kind)![1]) expect(field in node.$with).toBe(false);
		}
	});

	it('keeps the other setters of the same kinds', () => {
		expect('members' in built.objectType!().$with).toBe(true);
		expect('members' in built.interfaceBody!().$with).toBe(true);
		expect('object' in built.memberExpression!().$with).toBe(true);
		expect('property' in built.memberExpression!().$with).toBe(true);
		expect('variableDeclarators' in built.usingDeclaration!().$with).toBe(true);
	});

	it.each([
		['curly', () => build.objectType({ members: content() }), '{', '}'],
		['flow', () => build.objectType.flow({ members: content() }), '{|', '|}']
	])('writes no mismatched pair through any setter of a %s object type', (_, make, open, close) => {
		const edited: any = (make().$with as any).members(...(content() as readonly unknown[]));
		const text: string = edited.$render();
		expect(text.startsWith(open)).toBe(true);
		expect(text.endsWith(close)).toBe(true);
		for (const setter of Object.keys(edited.$with)) expect(['opening', 'closing']).not.toContain(setter);
	});

	it('switches form by building with the other form builder', () => {
		expect(build.objectType.flow({ members: content() }).$render()).toBe('{|\n  x;\n|}');
		expect(build.memberExpression.optional({ object, property }).$render()).toBe('a?.b');
		expect(build.usingDeclaration.await({ variableDeclarators: declarators }).$render()).toBe('await using x = y;');
	});
});
