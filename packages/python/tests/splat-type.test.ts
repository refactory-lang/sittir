import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { portableRuntime } from '@sittir/common/engine';
import python from '../src/index.ts';

const runtime = await portableRuntime(await createEngine(python, { api: 'strict' }));
const readOf = (source: string): string => JSON.stringify(runtime.read(runtime.engine.parse(source, { errors: 'throw' })));

describe('a starred type is the rest type, and only * stars a type, as CPython requires', () => {
	it.each(['x: tuple[**P]\n', 'x: tuple[int, **P]\n', 'def f(**kw: **P): pass\n', 'x: Callable[**P, int]\n'])('refuses %j', (source) => {
		expect(() => runtime.engine.parse(source, { errors: 'throw' })).toThrow();
	});

	it('reads a starred type argument as type.rest', () => {
		expect(readOf('x: tuple[*Ts]\n')).toBe(
			'{"$path":"file","statements":[{"$path":"statement.expression","content":{"$path":"declaration.variable","name":"x","type":{"$path":"type","content":{"$path":"type.generic","name":"tuple","typeArguments":[{"$path":"type","content":{"$path":"type.rest","type":"Ts"}}]}}}}]}'
		);
	});

	it('reads a starred parameter annotation as type.rest', () => {
		expect(readOf('def f(*args: *Ts): pass\n')).toBe(
			'{"$path":"file","statements":[{"$path":"declaration.function","name":"f","parameters":[{"$path":"declaration.parameter.typed","name":{"$path":"pattern.rest","pattern":"args"},"type":{"$path":"type","content":{"$path":"type.rest","type":"Ts"}}}],"body":"pass"}]}'
		);
	});

	it('builds type.rest through the portable surface', () => {
		const built = runtime.build({
			$path: 'declaration.variable',
			name: 'x',
			type: { $path: 'type', content: { $path: 'type.generic', name: 'tuple', typeArguments: [{ $path: 'type', content: { $path: 'type.rest', type: 'Ts' } }] } }
		} as never);
		expect(String(runtime.engine.render(built as never))).toBe('x: tuple[*Ts]');
	});

	it.each(['x: tuple[*Ts]\n', 'x: tuple[* Ts]\n', 'def f(*args: *Ts): pass\n'])('round-trips %j', (source) => {
		expect(String(runtime.engine.render(runtime.engine.parse(source, { errors: 'throw' }) as never))).toBe(source);
	});
});
