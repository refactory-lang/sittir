import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import python from '../src/index.ts';

describe.each(['object', 'arena'] as const)('a built leaf written to a side, in %s storage', (nodeStorage) => {
	it('reads back as a built node of its kind that renders its bytes and is disposable', async () => {
		const py = await createEngine(python, { nodeStorage });
		const continuation = py.build.lineContinuation.newline('\\\n');
		const call = py.build.call({ function: 'f', arguments: py.build.argumentList() }).$trivia.trailing(continuation);
		const [item] = call.$trivia.trailing();
		const node = item as unknown as { $type: number; $text(): string; $render(): unknown; [Symbol.dispose](): void };
		expect(node.$type).toBe((continuation as unknown as { $type: number }).$type);
		expect(typeof node[Symbol.dispose]).toBe('function');
		expect(node.$text()).toBe('\\\n');
		expect(String(node.$render())).toBe('\\\n');
		expect(py.isFactoryNode(item)).toBe(true);
	});
});
