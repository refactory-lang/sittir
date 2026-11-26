import { describe, expect, it } from 'vitest';
import { handleDispose, isHandle } from '../src/handle.ts';

describe('a handle', () => {
	it('is told from another object by one property load, and asks whether the key is its own only of an object that holds handleDispose', () => {
		const asked: string[] = [];
		const watched = (target: object): object =>
			new Proxy(target, {
				get: (held, key, receiver) => (asked.push(`get ${String(key)}`), Reflect.get(held, key, receiver)),
				has: (held, key) => (asked.push(`has ${String(key)}`), Reflect.has(held, key)),
				getOwnPropertyDescriptor: (held, key) => (asked.push(`own ${String(key)}`), Reflect.getOwnPropertyDescriptor(held, key))
			});
		expect(isHandle(watched({ $tree: {} }))).toBe(false);
		expect(asked).toEqual(['get Symbol(Symbol.dispose)']);
		asked.length = 0;
		expect(isHandle(watched({ [Symbol.dispose]: handleDispose }))).toBe(true);
		expect(asked).toEqual(['get Symbol(Symbol.dispose)', 'own Symbol(Symbol.dispose)']);
	});

	it('stays one through a spread copy, and a copy by string keys, a different dispose or an object inheriting its dispose is none', () => {
		const handle = { $tree: {}, $at: 4, [Symbol.dispose]: handleDispose };
		const byKeys = Object.fromEntries(Object.entries(handle));
		expect([isHandle(handle), isHandle({ ...handle }), isHandle(byKeys), isHandle({ ...handle, [Symbol.dispose]: () => undefined }), isHandle(Object.create(handle) as object)]).toEqual([
			true,
			true,
			false,
			false,
			false
		]);
	});
});
