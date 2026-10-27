import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { portableRuntime } from '@sittir/common/engine';
import typescript from '../src/index.ts';

const runtime = await portableRuntime(await createEngine(typescript, { api: 'strict' }));
const render = (node: unknown): string => String(runtime.engine.render(node as never));

describe('the portable build through the strict table', () => {
	it("builds an arrow function's single parameter through the mount that seats it at the function's key", () => {
		expect(render(runtime.build({ $path: 'expression.lambda', parameters: 'a', body: 'x' }))).toBe('a => x');
	});

	it("routes an in expression's operands through the form its operator preset mounts, not the holder's own operand slots", () => {
		expect(render(runtime.build({ $path: 'expression.binary.membership.in', left: 'a', right: 'b' }))).toBe('a in b');
	});

	it('builds a default export of a value through the nested mount, and of a declaration through the default form', () => {
		expect(render(runtime.build({ $path: 'statement.export.default', value: 'x' }))).toBe('export default x');
		const declaration = { $path: 'declaration.function', name: 'f', parameters: [], body: { $path: 'statement.block', statements: [] } };
		expect(render(runtime.build({ $path: 'statement.export.default', declaration }))).toBe('export default function f() {}');
	});
});
