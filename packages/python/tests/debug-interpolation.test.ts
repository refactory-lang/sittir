import { describe, expect, it } from 'vitest';
import python from '../src/index.ts';
import { createEngine } from '@sittir/common';
import { portableRuntime } from '@sittir/common/engine';
import { sharedEngine } from '@sittir/common/testing';

const withDebug = (value: unknown): unknown => {
	if (Array.isArray(value)) return value.map(withDebug);
	if (value === null || typeof value !== 'object' || typeof (value as { $type?: unknown }).$type === 'number') return value;
	const copy = Object.fromEntries(Object.entries(value).map(([key, item]) => [key, withDebug(item)]));
	return copy.$path === 'expression.interpolation' ? { ...copy, $flags: ['debug'] } : copy;
};

describe.each(['object', 'arena'] as const)('the portable read of an interpolation on %s storage', async (nodeStorage) => {
	const engine = await sharedEngine(() => createEngine(python, { api: 'strict', nodeStorage }));
	const runtime = await portableRuntime(engine);
	const built = (read: unknown): string => String(engine.render(runtime.build(read as never) as never)).trimEnd();
	const rebuilt = (source: string): string => built(runtime.read(engine.parse(source)));

	it.each(['x = f"{a+b=}"\n', 'x = f"{a = }"\n', 'x = f"{ a+b = :>3}"\n', 'x = f"{a+b=!r}"\n'])('keeps the source of %j, which is its value', (source) => {
		expect(rebuilt(source)).toBe(source.trimEnd());
	});

	it('reads one without = as its structure', () => {
		expect(rebuilt('x = f"{a+b}"\n')).toBe('x = f"{a + b}"');
	});

	it('still builds the debug flag from a structure', () => {
		expect(built(withDebug(runtime.read(engine.parse('x = f"{a}"\n'))))).toBe('x = f"{a=}"');
	});
});
