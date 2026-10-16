import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import python from '../src/index.ts';

const trusting = await createEngine(python);
const verifying = await createEngine(python, { verifyStructure: 'runtime' });

type Rebuildable = { $render(): string; $with: { decorators(...items: never[]): { $render(): string } } };
const decorated = (engine: typeof trusting): Rebuildable =>
	[...engine.parse('@x\ndef f(): pass\n').$query().$descendants.ofType(engine.kinds.DecoratedDefinition)][0] as unknown as Rebuildable;

describe('verifyStructure', () => {
	it("refuses a strict build that leaves a required slot empty, in 'runtime' mode at the call", () => {
		expect(() => (verifying.build.expressionStatement.strict as unknown as () => unknown)()).toThrow("Missing required slot 'content' on expression_statement");
	});

	it("refuses a loose build that leaves a required slot empty, in 'runtime' mode at the call", () => {
		const assign = verifying.build.assignment.eq as unknown as (config: unknown) => unknown;
		expect(() => assign({})).toThrow(/Missing required slot 'name' on \w*assignment\w*/);
	});

	it("refuses a $with that empties a non-empty list, in 'runtime' mode at the call", () => {
		expect(() => decorated(verifying).$with.decorators()).toThrow('decorated_definition.decorators: requires at least one element');
	});

	it('trusts the types by default: the build and the rebuild stand, and the render refuses them natively', () => {
		expect(() => (trusting.build.expressionStatement.strict as unknown as () => { $render(): string })().$render()).toThrow('Missing field `_content`');
		expect(() => decorated(trusting).$with.decorators().$render()).toThrow(/a repeat1 list holds no item on DecoratedDefinitionTransport\._decorator/);
	});

	it("refuses a parent that holds a rebuild another engine let through, and trusts an untouched read, in 'runtime' mode", () => {
		const module = verifying.build.module as unknown as (...statements: unknown[]) => unknown;
		expect(() => module(decorated(trusting).$with.decorators())).toThrow('decorated_definition.decorators: requires at least one element');
		expect(() => module(decorated(trusting))).not.toThrow();
	});

	it('renders an untouched parse the same in either mode', () => {
		expect(decorated(verifying).$render()).toBe(decorated(trusting).$render());
	});
});
