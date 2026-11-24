import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { portableRuntime } from '@sittir/common/engine';
import { sharedEngine } from '@sittir/common/testing';
import rust from '../src/index.ts';

const runtime = await portableRuntime(await sharedEngine(() => createEngine(rust, { api: 'strict' })));
const render = (node: unknown): string => String(runtime.engine.render(node as never));

describe('expression.range keeps the arms whose slots tell the forms apart', () => {
	it.each([
		[{}, '..'],
		[{ start: 'a' }, 'a..'],
		[{ end: 'b' }, '..b']
	])('builds %j', (input, text) => {
		expect(render(runtime.build({ $path: 'expression.range', ...input } as never))).toBe(text);
	});

	it('refuses a start and an end together, the form its refinement builds', () => {
		expect(() => runtime.build({ $path: 'expression.range', start: 'a', end: 'b' } as never)).toThrow(/no rust form of expression.range builds this structure/);
	});

	it('still reads and rebuilds a parse of each form', () => {
		for (const range of ['a..b', '..b', 'a..', '..']) {
			const source = `fn f() {\n    let r = ${range};\n}\n`;
			expect(render(runtime.build(runtime.read(runtime.engine.parse(source)) as never))).toBe(source);
		}
	});
});
