import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { portableRuntime } from '@sittir/common/engine';
import { sharedEngine } from '@sittir/common/testing';
import rust from '../src/index.ts';

const runtime = await portableRuntime(await sharedEngine(() => createEngine(rust, { api: 'strict' })));
const render = (node: unknown): string => String(runtime.engine.render(node as never));

describe('expression.range is a family no build takes', () => {
	it('throws for the family path', () => {
		expect(() => runtime.build({ $path: 'expression.range', start: 'a', end: 'b' } as never)).toThrow(/does not build in rust/);
	});

	it('still reads and rebuilds a parse of each form', () => {
		for (const range of ['a..b', '..b', 'a..', '..']) {
			const source = `fn f() {\n    let r = ${range};\n}\n`;
			expect(render(runtime.build(runtime.read(runtime.engine.parse(source)) as never))).toBe(source);
		}
	});
});
