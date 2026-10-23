import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { scopeBuilders } from '@sittir/common/engine';
import { _factoryMap } from '../src/factories/raw.ts';
import python from '../src/index.ts';

type Built = { $render(): string };
type Read = Built & Record<string, () => unknown>;

const engines = {
	trusting: await createEngine(python),
	verifying: await createEngine(python, { verifyStructure: 'runtime' })
};
type Engine = (typeof engines)['trusting'];
const builders = (engine: Engine) => scopeBuilders(engine, _factoryMap) as unknown as Record<string, (...args: unknown[]) => Built>;
const read = (engine: Engine): Read =>
	[...engine.parse('@x\n@y\ndef f(): pass\n').$query().$descendants.ofType(engine.kinds.DecoratedDefinition)][0] as unknown as Read;
const items = (engine: Engine): unknown[] => [...(read(engine).decorators!() as unknown[])];
const build = (engine: Engine, list: unknown[]): Built => builders(engine).decorated_definition!({ decorators: list, definition: read(engine).definition!() });

describe('a built node owns its stored lists', () => {
	it.each(['trusting', 'verifying'] as const)("%s: mutating the caller's array after the build changes neither the node nor its render", (mode) => {
		const list = items(engines[mode]);
		const node = build(engines[mode], list);
		list.pop();
		expect(node.$render()).toBe('@x\n@y\ndef f(): pass');
		if (mode === 'verifying') expect(() => builders(engines.verifying).module!(node)).not.toThrow();
	});

	it("'runtime' refuses an empty list built from a non-empty one", () => {
		const list = items(engines.verifying);
		list.length = 0;
		expect(() => build(engines.verifying, list)).toThrow('decorated_definition.decorators: requires at least one element');
	});
});
