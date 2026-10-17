import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import typescript from '../src/index.ts';

const trusting = await createEngine(typescript);
const verifying = await createEngine(typescript, { verifyStructure: 'runtime' });

type Rebuildable = { $render(): string; $with: { declarators(...items: never[]): { $render(): string } } };
const declaration = (engine: typeof trusting): Rebuildable =>
	[...engine.parse('let a = 1;\n').$query().$descendants.ofType(engine.kinds.LexicalDeclaration)][0] as unknown as Rebuildable;

describe('verifyStructure', () => {
	it("refuses a strict build that leaves a required slot empty, in 'runtime' mode at the call", () => {
		expect(() => (verifying.build.expressionStatement.strict as unknown as () => unknown)()).toThrow("Missing required slot 'expression' on expression_statement");
	});

	it("refuses a $with that empties a non-empty list, in 'runtime' mode at the call", () => {
		expect(() => declaration(verifying).$with.declarators()).toThrow('lexical_declaration.declarators: requires at least one element');
	});

	it('trusts the types by default: the build and the rebuild stand, and the render refuses them natively', () => {
		expect(() => (trusting.build.expressionStatement.strict as unknown as () => { $render(): string })().$render()).toThrow('Missing field `_expression`');
		expect(() => declaration(trusting).$with.declarators().$render()).toThrow(/a repeat1 list holds no item on LexicalDeclarationNode\._declarators/);
	});
});
