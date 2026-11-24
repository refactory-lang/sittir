import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { portableRuntime } from '@sittir/common/engine';
import { sharedEngine } from '@sittir/common/testing';
import typescript from '../src/index.ts';

const runtime = await portableRuntime(await sharedEngine(() => createEngine(typescript, { api: 'strict' })));
const render = (node: unknown): string => String(runtime.engine.render(node as never));
const build = (input: object): unknown => runtime.build(input as never);

describe('expression.binary is a family no build takes', () => {
	it.each([{ left: 'a', right: 'b' }, { left: 'a', operator: '+', right: 'b' }, { left: 'a', operator: 'in', right: 'b' }])('throws for %j', (input) => {
		expect(() => build({ $path: 'expression.binary', ...input })).toThrow(/does not build in typescript/);
	});

	it('still builds each refinement', () => {
		expect(render(build({ $path: 'expression.binary.arithmetic.add', left: 'a', right: 'b' }))).toBe('a + b');
		expect(render(build({ $path: 'expression.binary.membership.in', left: 'a', right: 'b' }))).toBe('a in b');
	});

	it('still reads and rebuilds a parse of each form', () => {
		for (const source of ['a + b;', 'a && b;', '#x in y;'])
			expect(render(runtime.build(runtime.read(runtime.engine.parse(source)) as never))).toBe(`${source}\n`);
	});
});
