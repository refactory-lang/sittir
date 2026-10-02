// A list view sizes its index from the stored element array, and iterates the
// items read through the element accessor. Over every list view of every parsed
// corpus entry, the two agree: the same length and the same item at each index.
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { allGrammars } from '@sittir/codegen/grammars';
import { loadCorpusEntries } from '../src/validate/common.ts';
import { languageByName } from '../src/languages.ts';

type Node = Record<string, unknown> & { readonly $type: number };

const isNode = (value: unknown): value is Node =>
	typeof value === 'object' && value !== null && typeof (value as { $type?: unknown }).$type === 'number';

const isListView = (node: Node): node is Node & ReadonlyArray<unknown> =>
	typeof node.length === 'number' && typeof (node as { [Symbol.iterator]?: unknown })[Symbol.iterator] === 'function';

function* childrenOf(node: Node): Generator<Node> {
	for (const key of Object.keys(node)) {
		if (key.startsWith('$') || key.startsWith('_')) continue;
		const accessor = node[key];
		if (typeof accessor !== 'function' || accessor.length !== 0) continue;
		let value: unknown;
		try {
			value = (accessor as () => unknown).call(node);
		} catch {
			continue;
		}
		for (const child of Array.isArray(value) ? value : [value]) if (isNode(child)) yield child;
	}
}

function* nodesOf(root: Node): Generator<Node> {
	const pending = [root];
	while (pending.length > 0) {
		const node = pending.pop()!;
		yield node;
		pending.push(...childrenOf(node));
	}
}

describe('a list view indexes exactly the items it iterates', () => {
	for (const grammar of allGrammars()) {
		it(`${grammar}: every list view of the parsed corpus has one length and one item per index`, async () => {
			const engine = await createEngine(await languageByName(grammar));
			let views = 0;
			for (const entry of loadCorpusEntries(grammar)) {
				let root: unknown;
				try {
					root = engine.parse(`${entry.source}\n`);
				} catch {
					continue;
				}
				if (!isNode(root)) continue;
				for (const node of nodesOf(root)) {
					if (!isListView(node)) continue;
					views++;
					const items = [...node];
					expect(node.length, `${grammar} ${entry.name}: length`).toBe(items.length);
					items.forEach((item, index) => expect(node[index], `${grammar} ${entry.name}: [${index}]`).toBe(item));
				}
			}
			if (['rust', 'python', 'typescript'].includes(grammar)) expect(views).toBeGreaterThan(0);
		}, 120_000);
	}
});
