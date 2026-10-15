import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

const trusting = await createEngine(rust);
const verifying = await createEngine(rust, { verifyStructure: 'runtime' });

describe('verifyStructure', () => {
	it("refuses a strict build that leaves a required slot empty, in 'runtime' mode at the call", () => {
		expect(() => (verifying.build.expressionStatement.strict as unknown as () => unknown)()).toThrow("Missing required slot 'content' on expression_statement");
	});

	it('trusts the types by default: the build stands, and the render refuses it natively', () => {
		const built = (trusting.build.expressionStatement.strict as unknown as () => { $render(): string })();
		expect(() => built.$render()).toThrow('Missing field `_content`');
	});

	it('passes a well-formed rebuild in either mode', () => {
		type Renamable = { $with: { name(value: unknown): { $render(): string } } };
		const renamed = (engine: typeof trusting) => {
			const [fn] = [...engine.parse('fn f() { g(); }').$query().$descendants.ofType(engine.kinds.FunctionItem)] as unknown as Renamable[];
			return fn!.$with.name(engine.build.identifier('h')).$render();
		};
		expect(renamed(verifying)).toBe('fn h() { g(); }');
		expect(renamed(trusting)).toBe('fn h() { g(); }');
	});
});
