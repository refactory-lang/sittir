import type { Rule } from '../../types/rule.ts';
import type { RawGrammar } from '../../compiler/types.ts';
import { assemblePredicted } from './linked.ts';
import type { NodeMapWithIdTables } from './node-map-fixtures.ts';

export function buildNodeMap(
	rules: Record<string, Rule<'evaluate'>>,
	lists: { readonly supertypes?: readonly string[]; readonly inline?: readonly string[]; readonly splitFrom?: Readonly<Record<string, string>> } = {}
): NodeMapWithIdTables {
	const raw: RawGrammar = {
		name: 'synth',
		fileTypes: [],
		rules,
		ruleCatalog: { byId: new Map(), rootsByKind: new Map(), classificationById: new Map() },
		evaluateSynthesized: new Set<string>(),
		extras: [],
		externals: [],
		supertypes: [...(lists.supertypes ?? [])],
		factoryInline: [],
		inline: [...(lists.inline ?? [])],
		conflicts: [],
		precedences: [],
		word: null,
		references: [],
		...(lists.splitFrom === undefined ? {} : { splitFrom: lists.splitFrom })
	};
	return assemblePredicted(raw);
}
