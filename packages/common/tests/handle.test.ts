import { describe, expect, it } from 'vitest';
import { handleDispose, isHandle } from '../src/handle.ts';

describe('a handle', () => {
	it('is told from another object by one property question', () => {
		const asked: string[] = [];
		const watched = (target: object): object =>
			new Proxy(target, {
				get: (held, key, receiver) => (asked.push(`get ${String(key)}`), Reflect.get(held, key, receiver)),
				has: (held, key) => (asked.push(`has ${String(key)}`), Reflect.has(held, key)),
				getOwnPropertyDescriptor: (held, key) => (asked.push(`own ${String(key)}`), Reflect.getOwnPropertyDescriptor(held, key))
			});
		expect([isHandle(watched({ [Symbol.dispose]: handleDispose })), isHandle(watched({ $tree: {} }))]).toEqual([true, false]);
		expect(asked).toEqual(['get Symbol(Symbol.dispose)', 'get Symbol(Symbol.dispose)']);
	});

	it('stays one through a spread copy, and a copy by string keys or a different dispose is none', () => {
		const handle = { $tree: {}, $at: 4, [Symbol.dispose]: handleDispose };
		const byKeys = Object.fromEntries(Object.entries(handle));
		expect([isHandle(handle), isHandle({ ...handle }), isHandle(byKeys), isHandle({ ...handle, [Symbol.dispose]: () => undefined })]).toEqual([true, true, false, false]);
	});
});
