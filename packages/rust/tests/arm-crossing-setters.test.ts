import { afterAll, describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

const engines = {
	object: await createEngine(rust, { nodeStorage: 'object' }),
	arena: await createEngine(rust, { nodeStorage: 'arena' })
};
afterAll(() => {
	for (const engine of Object.values(engines)) engine.dispose();
});

describe.each(Object.entries(engines))('a setter crosses arms (%s storage)', (_, engine) => {
	const input = (source: string): any => (engine.parse(source, { errors: 'throw' }).statements()[0] as any).attribute().input();
	const text = (node: { $render(): string }) => String(node.$render());
	const valueArm = () => input('#[a = 1]\n');
	const argumentsArm = () => input('#[a(b)]\n');
	const built = (): any => engine.build.attribute.input({ path: 'a', value: 'x' }).input();

	it('gives the other arm and clears the slots only the old arm held, on a parsed node', () => {
		const crossed = valueArm().$with.arguments(argumentsArm().arguments()!);
		expect(text(crossed)).toBe('(b)');
		expect(crossed.value()).toBeUndefined();
		expect(text(argumentsArm().$with.value(valueArm().value()!))).toBe('= 1');
		expect(argumentsArm().$with.value(valueArm().value()!).arguments()).toBeUndefined();
	});

	it('gives the other arm on a built node', () => {
		const crossed = built().$with.arguments(argumentsArm().arguments()!);
		expect(text(crossed)).toBe('(b)');
		expect(crossed.value()).toBeUndefined();
	});

	it('keeps the arm when a slot of the node’s own arm is set', () => {
		expect(text(valueArm().$with.value(valueArm().value()!))).toBe('= 1');
		expect(text(argumentsArm().$with.arguments(argumentsArm().arguments()!))).toBe('(b)');
	});

	it('clears only the slot it names when given undefined', () => {
		expect(text((valueArm().$with as any).value(undefined))).toBe('');
	});
});
