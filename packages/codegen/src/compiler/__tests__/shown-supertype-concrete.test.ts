import { describe, expect, it } from 'vitest';
import { ALIAS, CHOICE, PATTERN, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import type { Rule } from '../../types/rule.ts';
import type { RawGrammar } from '../types.ts';
import { compileGrammar } from '../compile.ts';
import { linkPredicted } from '../../__tests__/helpers/linked.ts';
import { normalizeGrammar } from '../normalize.ts';
import { assemble, AssembleCtx } from '../assemble.ts';
import { loadPackageIdTables } from '../generated-metadata.ts';
import { AssembledSupertype } from '../model/node-map.ts';
import { grammarPackage } from '../../grammars.ts';

function rawOf(rules: Record<string, Rule<'evaluate'>>, supertypes: string[]): RawGrammar {
	return {
		name: 'synth',
		fileTypes: [],
		rules,
		ruleCatalog: { byId: new Map(), rootsByKind: new Map(), classificationById: new Map() },
		evaluateSynthesized: new Set<string>(),
		extras: [],
		externals: [],
		supertypes,
		factoryInline: [],
		inline: [],
		conflicts: [],
		precedences: [],
		word: null,
		references: []
	};
}

describe('a declared supertype the parser shows as a visible node', () => {
	it('python: the suite supertype stays a supertype', async () => {
		const pkg = grammarPackage('python');
		const { nodeMap } = await compileGrammar({ package: pkg, generatedIdTables: await loadPackageIdTables(pkg) });
		expect(nodeMap.nodes.get('_suite') ?? nodeMap.nodes.get('suite')).toBeInstanceOf(AssembledSupertype);
	}, 180_000);

	function aliasedParentRaw(supertypes: string[]): RawGrammar {
		return rawOf(
			{
				source: { type: SEQ, members: [{ type: SYMBOL, name: 'other' }] },
				other: { type: ALIAS, content: { type: SYMBOL, name: 'parent' }, named: true, value: 'shown' },
				parent: {
					type: CHOICE,
					members: [
						{ type: SYMBOL, name: 'a_kind' },
						{ type: SYMBOL, name: 'b_kind' }
					]
				},
				a_kind: { type: SEQ, members: [{ type: STRING, value: 'a' }] },
				b_kind: { type: SEQ, members: [{ type: PATTERN, value: 'b' }] }
			},
			supertypes
		);
	}

	it('a declared supertype referenced only under its own named alias stays concrete', () => {
		const nodeMap = assemble(AssembleCtx.from(normalizeGrammar(linkPredicted(aliasedParentRaw(['parent'])))));
		expect(nodeMap.nodes.get('shown')).toBeDefined();
		expect(nodeMap.nodes.get('shown')).not.toBeInstanceOf(AssembledSupertype);
	});

	it('a choice of kinds referenced only under its own named alias, not declared a supertype, stays concrete', () => {
		const nodeMap = assemble(AssembleCtx.from(normalizeGrammar(linkPredicted(aliasedParentRaw([])))));
		expect(nodeMap.nodes.get('shown')).toBeDefined();
		expect(nodeMap.nodes.get('shown')).not.toBeInstanceOf(AssembledSupertype);
	});
});
