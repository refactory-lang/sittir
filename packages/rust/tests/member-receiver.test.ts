import { describe, expect, it } from 'vitest';
import rust from '../src/index.ts';
import { createEngine } from '@sittir/common';

type Members = Record<string, (...args: unknown[]) => unknown>;

describe.each(['arena', 'object'] as const)('a member called without its node, on %s storage', (nodeStorage) => {
	const nodes = async () => {
		const rs = await createEngine(rust, { nodeStorage });
		return [
			['read', rs.parse('fn f() {}\n')],
			['built', rs.build.block({ statements: [] })]
		] as const;
	};

	it.each(['$with', '$trivia'] as const)('%s refuses by name and says how to call it', async (member) => {
		for (const [label, node] of await nodes()) {
			const members = (node as unknown as Record<string, Members>)[member]!;
			const name = Object.keys(members)[0]!;
			const detached = members[name]!;
			expect(() => detached(), `${label} ${member}.${name}`).toThrow(new TypeError(`${member}.${name} was called without its node; call it on its node: node.${member}.${name}(…)`));
			expect(() => members[name]!(), `${label} ${member}.${name} on its node`).not.toThrow(/without its node/);
		}
	});
});
