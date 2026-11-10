import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { bindingGrammars } from '@sittir/codegen/bindings';
import { PORTABLE_NODE_MODEL_FILE, nodeModelPath } from '@sittir/codegen/grammars';

const CEILING: Readonly<Record<string, readonly string[]>> = {
	python: [],
	rust: [],
	typescript: []
};

interface PortableModel {
	readonly kinds: Readonly<Record<string, { readonly members?: readonly { readonly name: string; readonly route: string; readonly path: unknown; readonly spelled?: true }[] }>>;
}

const unbuildable = (grammar: string): string[] => {
	const model = JSON.parse(readFileSync(nodeModelPath(grammar, PORTABLE_NODE_MODEL_FILE), 'utf8')) as PortableModel;
	return Object.entries(model.kinds)
		.flatMap(([kind, { members = [] }]) => members.filter((m) => m.path === null && m.spelled !== true && m.route !== 'delimiter').map((m) => `${kind}.${m.name}`))
		.sort();
};

describe('members a portable build cannot reach', () => {
	for (const grammar of bindingGrammars()) {
		it(`are exactly ${grammar}'s recorded ones: a new one is a regression, a fixed one leaves the list`, () => {
			expect(unbuildable(grammar)).toEqual(CEILING[grammar] ?? []);
		});
	}
});
