import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { portableRuntime } from '@sittir/common/engine';
import { sharedEngine } from '@sittir/common/testing';
import typescript from '../src/index.ts';

const runtime = await portableRuntime(await sharedEngine(() => createEngine(typescript, { api: 'strict' })));
const render = (node: unknown): string => String(runtime.engine.render(node as never));
const roundTrip = (source: string): string => render(runtime.build(runtime.read(runtime.engine.parse(source)) as never));

describe('an empty list builds through the form whose list can be empty', () => {
	it.each(['const f = () => x;', 'const f = async () => x;', 'const f = (a) => x;', 'const f = a => x;'])('rebuilds %s as written', (source) => {
		expect(roundTrip(source)).toBe(`${source}\n`);
	});

	it('builds a lambda with no parameters in parentheses, and one bare parameter without them', () => {
		expect(render(runtime.build({ $path: 'expression.lambda', parameters: [], body: 'x' } as never))).toBe('() => x');
		expect(render(runtime.build({ $path: 'expression.lambda', parameters: 'a', body: 'x' } as never))).toBe('a => x');
	});
});
