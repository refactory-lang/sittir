// Under arena storage, a read tree copied as build input holds its root's tree
// on each object as the copy is made: the same objects, and only those, that a
// walk of the finished copy holds it on (`holdingTreeOf`), on every corpus
// entry of every grammar.
import { describe, expect, it } from 'vitest';
import { TREE, treeTokenOf, type TreeToken } from '@sittir/common/utils';
import { FULL_PIPELINE_TIMEOUT } from '../../../codegen/src/__tests__/helpers/timeouts.ts';
import {
	buildReadHandle,
	holdingTreeOf,
	loadCorpusEntries,
	loadNativeEngine,
	loadSlotAccessorOf,
	materialize,
	materializeHoldingTree,
	readNodeOf,
	useValidationNodeStorage
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

describe.each(['rust', 'typescript', 'python', 'regex', 'scm'])('the %s corpus, read as records', (grammar) => {
	it(
		'holds the root tree on each object of the copy that a walk of the finished copy holds it on',
		async () => {
			await loadNativeEngine(grammar);
			const accessorOf = await loadSlotAccessorOf(grammar);
			const readNode = await readNodeOf(grammar);
			let held = 0;
			for (const entry of loadCorpusEntries(grammar)) {
				const root = readNode(await buildReadHandle(grammar, entry.source)) as object;
				const token = treeTokenOf(root);
				if (token === undefined) throw new Error(`${entry.name}: the read root holds no tree`);
				const made = holds(materializeHoldingTree(root, accessorOf), token);
				const walked = holds(holdingTreeOf(root, materialize(root, accessorOf)), token);
				expect(made, entry.name).toEqual(walked);
				held += made.filter((line) => line.endsWith(' root')).length;
			}
			expect(held).toBeGreaterThan(0);
		},
		FULL_PIPELINE_TIMEOUT
	);
});
