import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import typescript from '../src/index.ts';

describe.each(['arena', 'object'] as const)('a float exponent is one branch to its setters, %s storage', (nodeStorage) => {
	const open = async () => createEngine(typescript, { nodeStorage });

	it('clearing the exponent of a built float clears its sign and marker with it', async () => {
		using e = await open();
		const built = e.build.number.floatPoint({ integer: '1', fraction: '5', exponentSign: '-', exponent: '3' }, { marker: 'E' });
		expect(built.$render()).toBe('1.5E-3');
		expect((built.$with as { exponent(): { $render(): string } }).exponent().$render()).toBe('1.5');
	});

	it('clearing the sign or the marker keeps the branch', async () => {
		using e = await open();
		const built = e.build.number.floatPoint({ integer: '1', fraction: '5', exponentSign: '-', exponent: '3' }, { marker: 'E' });
		expect((built.$with as { exponentSign(): { $render(): string } }).exponentSign().$render()).toBe('1.5E3');
		expect((built.$with as { marker(): { $render(): string } }).marker().$render()).toBe('1.5e-3');
	});

	it('setting the exponent of an absent branch writes the marker and the digits', async () => {
		using e = await open();
		const built = e.build.number.floatPoint({ integer: '1', fraction: '5' });
		const present = (built.$with as { exponent(v: string): { $render(): string; $with: { exponentSign(v: string): { $render(): string } } } }).exponent('2');
		expect(present.$render()).toBe('1.5e2');
		expect(present.$with.exponentSign('+').$render()).toBe('1.5e+2');
	});

	it('a leading-point float clears the same way', async () => {
		using e = await open();
		const built = e.build.number.floatLeadingPoint({ fraction: '5', exponentSign: '+', exponent: '2' }, { marker: 'E' });
		expect(built.$render()).toBe('.5E+2');
		expect((built.$with as { exponent(): { $render(): string } }).exponent().$render()).toBe('.5');
	});

	it('clearing the exponent of a parsed float clears its sign and marker with it', async () => {
		using e = await open();
		const float = (e.parse('1.5E-3;') as unknown as { statements(): readonly { expression(): unknown }[] }).statements()[0]!.expression() as {
			$with: { exponent(): unknown };
		};
		expect(String(e.render(float.$with.exponent() as never))).toBe('1.5');
	});

	it('setting the exponent of a parsed float with none writes the marker and the digits', async () => {
		using e = await open();
		const float = (e.parse('1.5;') as unknown as { statements(): readonly { expression(): unknown }[] }).statements()[0]!.expression() as {
			$with: { exponent(v: string): unknown };
		};
		expect(String(e.render(float.$with.exponent('2') as never))).toBe('1.5e2');
	});

	it('clearing the marker of a parsed float restores its default', async () => {
		using e = await open();
		const float = (e.parse('1.5E-3;') as unknown as { statements(): readonly { expression(): unknown }[] }).statements()[0]!.expression() as {
			$with: { marker(): unknown };
		};
		expect(String(e.render(float.$with.marker() as never))).toBe('1.5e-3');
	});
});
