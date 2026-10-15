import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bindingGrammars } from '@sittir/codegen/bindings';
import { grammarPackageDir } from '@sittir/codegen/grammars';

const CEILING: Readonly<Record<string, readonly string[]>> = {
	python: [
		'class_definition.doc',
		'function_definition.doc'
	],
	rust: ['impl_item_body.implements'],
	typescript: []
};

interface PortableModel {
	readonly kinds: Readonly<Record<string, { readonly members?: readonly { readonly name: string; readonly path: unknown; readonly spelled?: true }[] }>>;
}

const unbuildable = (grammar: string): string[] => {
	const model = JSON.parse(readFileSync(join(grammarPackageDir(grammar), 'src', 'node-model-portable.json5'), 'utf8')) as PortableModel;
	return Object.entries(model.kinds)
		.flatMap(([kind, { members = [] }]) => members.filter((m) => m.path === null && m.spelled !== true).map((m) => `${kind}.${m.name}`))
		.sort();
};

describe('members a portable build cannot reach', () => {
	for (const grammar of bindingGrammars()) {
		it(`are exactly ${grammar}'s recorded ones: a new one is a regression, a fixed one leaves the list`, () => {
			expect(unbuildable(grammar)).toEqual(CEILING[grammar] ?? []);
		});
	}
});
