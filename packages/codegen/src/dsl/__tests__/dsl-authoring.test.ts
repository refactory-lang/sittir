import { describe, expect, it } from 'vitest';
import { prec, reserved, token } from '../dsl-authoring.ts';

function withRuntime<T>(runtime: Readonly<Record<string, unknown>>, run: () => T): T {
	const saved = new Map(Object.keys(runtime).map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
	for (const [name, value] of Object.entries(runtime)) {
		if (value === undefined) Reflect.deleteProperty(globalThis, name);
		else Reflect.set(globalThis, name, value);
	}
	try {
		return run();
	} finally {
		for (const [name, descriptor] of saved) {
			if (descriptor === undefined) Reflect.deleteProperty(globalThis, name);
			else Object.defineProperty(globalThis, name, descriptor);
		}
	}
}

const recording = (calls: unknown[][], name: string) =>
	function (this: unknown, ...args: unknown[]): string {
		calls.push([name, this === undefined ? 'none' : 'owner', ...args]);
		return name;
	};

describe('the authoring prec, token and reserved', () => {
	it('call the DSL runtime installed when they are called, with the member on its owner', () => {
		const calls: unknown[][] = [];
		const runtime = {
			prec: Object.assign(recording(calls, 'prec'), { left: recording(calls, 'prec.left'), right: recording(calls, 'prec.right'), dynamic: recording(calls, 'prec.dynamic') }),
			token: Object.assign(recording(calls, 'token'), { immediate: recording(calls, 'token.immediate') }),
			reserved: recording(calls, 'reserved')
		};
		const results = withRuntime(runtime, () => [prec(1, 'a'), prec.left('a'), prec.right(2, 'a'), prec.dynamic(3, 'a'), token('a'), token.immediate('a'), reserved('global', 'a')]);
		expect(results).toEqual(['prec', 'prec.left', 'prec.right', 'prec.dynamic', 'token', 'token.immediate', 'reserved']);
		expect(calls).toEqual([
			['prec', 'none', 1, 'a'],
			['prec.left', 'owner', 'a'],
			['prec.right', 'owner', 2, 'a'],
			['prec.dynamic', 'owner', 3, 'a'],
			['token', 'none', 'a'],
			['token.immediate', 'owner', 'a'],
			['reserved', 'none', 'global', 'a']
		]);
	});

	it('refuse a call while no DSL runtime is installed', () => {
		withRuntime({ prec: undefined, token: undefined, reserved: undefined }, () => {
			expect(() => token('a')).toThrow('no global token() — a DSL function runs only inside a DSL runtime');
			expect(() => token.immediate('a')).toThrow('no global token() — a DSL function runs only inside a DSL runtime');
			expect(() => prec.left('a')).toThrow('no global prec() — a DSL function runs only inside a DSL runtime');
			expect(() => reserved('global', 'a')).toThrow('no global reserved() — a DSL function runs only inside a DSL runtime');
		});
	});
});
