import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import python from '../src/index.ts';

type Rendered = { $render(): string };

describe.each(['arena', 'object'] as const)('a python float exponent is one branch to its setters, %s storage', (nodeStorage) => {
	it('clearing the exponent clears its sign and marker with it', async () => {
		using e = await createEngine(python, { nodeStorage });
		const built = e.build.float.point({ integer: '1', fraction: '5', exponentSign: '-', exponent: '3' }, { marker: 'E' });
		expect(built.$render()).toBe('1.5E-3');
		expect((built.$with as unknown as { exponent(): Rendered }).exponent().$render()).toBe('1.5');
		expect((built.$with as unknown as { exponentSign(): Rendered }).exponentSign().$render()).toBe('1.5E3');
	});

	it('setting the exponent of an absent branch writes the marker and the digits', async () => {
		using e = await createEngine(python, { nodeStorage });
		const built = e.build.float.point({ integer: '1', fraction: '5' });
		expect((built.$with as unknown as { exponent(v: string): Rendered }).exponent('2').$render()).toBe('1.5e2');
	});
});
