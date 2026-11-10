// Under arena storage, a read tree copied for a validator holds its root's
// tree on each object as the copy is made: the same objects, and only those,
// that a walk of the finished copy holds it on (`holdingTreeOf`), on every
// corpus entry of every grammar. That holds for the build input, for the
// shallow copy (one level, children as coordinates) and for the detached copy
// (no coordinate a render would slice), which also equals the copy detached
// after it was made.
import { describe, expect, it } from 'vitest';
import { detachCoordinates } from '@sittir/common';
import { TREE, treeTokenOf, type TreeToken } from '@sittir/common/utils';
import { FULL_PIPELINE_TIMEOUT } from '../../../codegen/src/__tests__/helpers/timeouts.ts';
import {
	buildReadHandle,
	holdingTreeOf,
	loadCorpusEntries,
	loadNativeEngine,
	loadSlotAccessorOf,
	materialize,
	materializeDetached,
	materializeHoldingTree,
	materializeShallow,
	readNodeOf,
	useValidationNodeStorage,
	walkWrappedTree,
	type TypedNode
} from '../../src/validate/common.ts';

useValidationNodeStorage('arena');

function holds(value: unknown, token: TreeToken, path = '', out: string[] = []): string[] {
	if (Array.isArray(value)) value.forEach((entry, at) => holds(entry, token, `${path}[${at}]`, out));
	else if (value !== null && typeof value === 'object') {
		const own = (value as { readonly [TREE]?: TreeToken | null })[TREE];
		out.push(`${path} ${own == null ? '-' : own === token ? 'root' : 'other'}`);
		for (const [key, entry] of Object.entries(value)) holds(entry, token, `${path}.${key}`, out);
	}
	return out;
}

type Walked = Record<string, unknown> & { [TREE]?: unknown; $_layout?: { trivia?: Record<'leading' | 'trailing' | 'inner', unknown[] | undefined> } };

function withoutWalkedHolds<T>(value: T): T {
	if (Array.isArray(value)) for (const entry of value) withoutWalkedHolds(entry);
	else if (value !== null && typeof value === 'object') {
		const node = value as Walked;
		if (typeof node.$type === 'number') delete node[TREE];
		for (const key of Object.keys(node)) if (key.startsWith('_')) withoutWalkedHolds(node[key]);
		const trivia = node.$_layout?.trivia;
		if (trivia != null) for (const side of [trivia.leading, trivia.trailing, trivia.inner]) if (side) withoutWalkedHolds(side);
	}
	return value;
}

describe.each(['rust', 'typescript', 'python', 'regex', 'scm'])('the %s corpus, read as records', (grammar) => {
	const corpus = async () => {
		await loadNativeEngine(grammar);
		const accessorOf = await loadSlotAccessorOf(grammar);
		const readNode = await readNodeOf(grammar);
		return {
			accessorOf,
			roots: async function* () {
				for (const entry of loadCorpusEntries(grammar)) {
					const root = readNode(await buildReadHandle(grammar, entry.source)) as TypedNode;
					const token = treeTokenOf(root);
					if (token === undefined) throw new Error(`${entry.name}: the read root holds no tree`);
					yield { name: entry.name, root, token };
				}
			}
		};
	};

	it(
		'the build input holds the root tree on each object of the copy that a walk of the finished copy holds it on',
		async () => {
			const { accessorOf, roots } = await corpus();
			let held = 0;
			for await (const { name, root, token } of roots()) {
				const made = holds(materializeHoldingTree(root, accessorOf), token);
				const walked = holds(holdingTreeOf(root, materialize(root, accessorOf)), token);
				expect(made, name).toEqual(walked);
				held += made.filter((line) => line.endsWith(' root')).length;
			}
			expect(held).toBeGreaterThan(0);
		},
		FULL_PIPELINE_TIMEOUT
	);

	it(
		'each node shallow-copied holds the root tree where a walk of the finished copy holds it',
		async () => {
			const { accessorOf, roots } = await corpus();
			let copies = 0;
			for await (const { name, root, token } of roots()) {
				walkWrappedTree(root, accessorOf, (node) => {
					const made = holds(materializeShallow(node, accessorOf), token);
					const walked = holds(holdingTreeOf(node, withoutWalkedHolds(materializeShallow(node, accessorOf))), token);
					expect(made, name).toEqual(walked);
					copies++;
				});
			}
			expect(copies).toBeGreaterThan(0);
		},
		FULL_PIPELINE_TIMEOUT
	);

	it(
		'the detached copy is the copy detached after it was made, holding the root tree where a walk holds it',
		async () => {
			const { accessorOf, roots } = await corpus();
			let held = 0;
			for await (const { name, root, token } of roots()) {
				const made = materializeDetached(root, accessorOf);
				const walked = holdingTreeOf(root, detachCoordinates(materialize(root, accessorOf)));
				expect(JSON.stringify(made), name).toBe(JSON.stringify(walked));
				const madeHolds = holds(made, token);
				expect(madeHolds, name).toEqual(holds(walked, token));
				held += madeHolds.filter((line) => line.endsWith(' root')).length;
			}
			expect(held).toBeGreaterThan(0);
		},
		FULL_PIPELINE_TIMEOUT
	);
});
