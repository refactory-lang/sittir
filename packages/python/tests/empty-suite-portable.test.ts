import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { portableRuntime } from '@sittir/common/engine';
import python from '../src/index.ts';

const runtime = await portableRuntime(await createEngine(python, { api: 'strict' }));
const bodyOf = (statements?: readonly unknown[]) => runtime.build({ $path: 'declaration.function', name: 'f', parameters: [], body: { $path: 'statement.block', ...(statements === undefined ? {} : { statements }) } } as never) as unknown as {
	$render(): string;
	body(): { $type: number };
};

describe('an empty suite reads as a block with no statements, and builds back', () => {
	it('reads an empty function body as a block with no statements', () => {
		expect(JSON.stringify(runtime.read(runtime.engine.parse('def f():\n')))).toBe(
			'{"$path":"file","statements":[{"$path":"declaration.function","name":"f","parameters":[],"body":{"$path":"statement.block","statements":[]}}]}'
		);
	});

	it.each(['def f():\n', 'class A:\n', 'while x:\n', 'try:\nexcept:\n', 'class A:\n    def f():\n'])('round-trips %j byte for byte, and reads it back the same', (source) => {
		const read = runtime.read(runtime.engine.parse(source));
		const rendered = String(runtime.engine.render(runtime.build(read as never) as never));
		expect(rendered).toBe(source);
		expect(runtime.read(runtime.engine.parse(rendered))).toEqual(read);
	});

	it('builds a block with a statement as the indented block, and one with no statements or none stated as the empty suite', () => {
		const passing = bodyOf(['pass']);
		expect(passing.body().$type).toBe(python.kinds.SuiteBlock);
		expect(passing.$render()).toBe('def f():\n    pass\n');
		expect(bodyOf([]).body().$type).toBe(python.kinds.SuiteEmpty);
		expect(bodyOf().body().$type).toBe(python.kinds.SuiteEmpty);
	});
});
