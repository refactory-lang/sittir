import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { portable, vocabularyPaths } from '@sittir/common/portable';
import scm from '../../scm/src/index.ts';
import rust from '../src/index.ts';
import { rows } from '../src/portable.ts';

type Guard = (node: unknown) => boolean;
const guard = (path: string): Guard =>
	path
		.split('.')
		.reduce<Record<string, unknown>>(
			(node, segment) => node[segment] as Record<string, unknown>,
			portable.is as never
		) as unknown as Guard;

const engine = await createEngine(rust);
const item = engine.parse('fn f() {}').statements()[0];

describe('the shared portable guards read a rust node', () => {
	it('pass a function_item read from a rust engine', () => {
		expect(guard('declaration.function')(item)).toBe(true);
		expect(guard('declaration')(item)).toBe(true);
		expect(guard('declaration.struct')(item)).toBe(false);
	});

	it('refuse a bare kind id and a node no engine stamped', () => {
		expect(guard('declaration.function')(rust.kinds.FunctionItem)).toBe(false);
		expect(guard('declaration.function')({ $type: rust.kinds.FunctionItem })).toBe(false);
	});

	it('refuse a node of a grammar without bindings, without throwing', async () => {
		const query = (await createEngine(scm)).parse('(a)\n');
		expect(guard('declaration.function')(query)).toBe(false);
	});

	it('refuse a vocabulary path rust has no rows for', () => {
		const unread = vocabularyPaths.find((path) => rows.table.paths[path] === undefined);
		expect(unread).toBeDefined();
		expect(guard(unread!)(item)).toBe(false);
	});

	it('take the node alone', () => {
		expect(guard('declaration.function').length).toBe(1);
	});

	it('answer false where the classification depends on where the node sits, until placement is restated', () => {
		const method = engine
			.parse('impl S { fn m(&self) {} }')
			.$query()
			.$descendants.ofType(rust.kinds.FunctionItem)
			.find();
		expect(method).toBeDefined();
		expect(guard('declaration.method')(method)).toBe(false);
	});
});
