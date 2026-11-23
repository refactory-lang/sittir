import { afterAll, describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import typescript from '../src/index.ts';

const engines = {
	object: await createEngine(typescript, { nodeStorage: 'object' }),
	arena: await createEngine(typescript, { nodeStorage: 'arena' })
};
afterAll(() => {
	for (const engine of Object.values(engines)) engine.dispose();
});

describe.each(Object.entries(engines))('a setter crosses arms (%s storage)', (_, engine) => {
	const binary = (source: string): any => {
		const found: any[] = [];
		const seen = new Set<unknown>();
		const walk = (node: any): void => {
			if (node === null || typeof node !== 'object' || seen.has(node)) return;
			seen.add(node);
			if (typeof node.binaryExpressionIn === 'function' && typeof node.operator === 'function') found.push(node);
			for (const key of Object.keys(node)) {
				if (key.startsWith('$') || key === 'toString' || key === 'toJSON' || typeof node[key] !== 'function') continue;
				let value: any;
				try {
					value = node[key]();
				} catch {
					continue;
				}
				for (const child of Array.isArray(value) ? value : [value]) walk(child);
			}
		};
		walk(engine.parse(source, { errors: 'throw' }));
		return found[0];
	};
	const text = (node: { $render(): string }) => String(node.$render());
	const operands = () => binary('a + b;');
	const inArm = () => binary('x in y;');

	it('gives the other arm and clears the slots only the old arm held, on a parsed node', () => {
		const crossed = operands().$with.binaryExpressionIn(inArm().binaryExpressionIn());
		expect(text(crossed)).toBe('x in y');
		expect(crossed.left()).toBeUndefined();
		expect(crossed.operator()).toBeUndefined();
		const back = inArm().$with.left(operands().left());
		expect(back.binaryExpressionIn()).toBeUndefined();
	});

	it('gives the other arm on a built node', () => {
		const built: any = engine.build.binaryExpression({ left: 'a', operator: '+', right: 'b' });
		const crossed = built.$with.binaryExpressionIn(inArm().binaryExpressionIn());
		expect(text(crossed)).toBe('x in y');
		expect(crossed.left()).toBeUndefined();
	});

	it('keeps the arm when a slot of the node’s own arm is set', () => {
		const replaced = operands().$with.right(operands().left());
		expect(text(replaced)).toBe('a + a');
		expect(replaced.binaryExpressionIn()).toBeUndefined();
	});
});
