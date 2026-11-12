import { describe, expect, it } from 'vitest';
import { sharedEngine } from '@sittir/common/testing';
import rust from '../src/index.ts';

const source =
	'struct A { a: u8, pub b: u8, #[x] c: u8 }\n\n// note\nfn f(x: u8) -> u8 {\n    g(x, "héllo") // tail\n}\n';

const engines = {
	object: await sharedEngine(() => rust.createEngine({ nodeStorage: 'object' })),
	arena: await sharedEngine(() => rust.createEngine({ nodeStorage: 'arena' }))
};
const storages = ['object', 'arena'] as const;

function nodesOf(storage: (typeof storages)[number]) {
	const engine = engines[storage];
	const root = engine.parse(source);
	const [struct, fn] = root.statements();
	if (fn === undefined || !engine.is.functionItem(fn)) throw new Error('expected a function');
	const body = fn.body();
	return [root, struct, fn, fn.parameters(), body, body.trailingExpression()].map((node) => {
		if (typeof node !== 'object') throw new Error('expected a node');
		return node;
	});
}

describe('a render from templates', () => {
	it('renders each node of a parsed tree alike in both storages', () => {
		const arena = nodesOf('arena');
		const rendered = nodesOf('object').map(
			(node, at) =>
				[
					engines.object.diagnostics.renderTemplates(node),
					engines.arena.diagnostics.renderTemplates(arena[at]!)
				] as const
		);
		for (const [object, record] of rendered) expect(record).toBe(object);
		expect(rendered[0]![0]).toContain('g(x, "héllo") // tail');
	});
});

describe.each(storages)('a render from templates in %s storage', (storage) => {
	const engine = engines[storage];

	it('refuses a built node', () => {
		expect(() => engine.diagnostics.renderTemplates(engine.build.identifier('a'))).toThrow(/as a read gave it/);
	});

	it('refuses an edited node', () => {
		const [, fn] = engine.parse(source).statements();
		if (fn === undefined || !engine.is.functionItem(fn)) throw new Error('expected a function');
		expect(() => engine.diagnostics.renderTemplates(fn.$with.name(engine.build.identifier('h')))).toThrow(
			/as a read gave it/
		);
	});
});
