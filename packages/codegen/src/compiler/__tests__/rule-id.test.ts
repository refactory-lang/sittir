import { beforeAll, describe, expect, it } from 'vitest';
import { buildRuleCatalog, createRuleId, ruleIdPath } from '../rule-catalog.ts';
import { collapseRenamedRules } from '../link.ts';
import { kindCatalogOf, stampVisibleExternals } from '../../dsl/symbol-table.ts';
import { loadGeneratedIdTables } from '../generated-metadata.ts';
import { rebaseRuleIds } from '../../dsl/rule-attrs.ts';
import type { Rule } from '../../types/rule.ts';
import { evaluatePackage } from '../evaluate-package.ts';
import { grammarPackage } from '../../grammars.ts';

describe('rule ids', () => {
	let python: Awaited<ReturnType<typeof evaluatePackage>>;

	beforeAll(async () => {
		python = await evaluatePackage(grammarPackage('python'));
	});

	it('ruleIdPath reads back the path createRuleId wrote, whatever the owner name holds', () => {
		expect(ruleIdPath(createRuleId('host', { path: [] }))).toBe('root');
		expect(ruleIdPath(createRuleId('a:b', { path: [{ edge: 'content' }, { edge: 'members', index: 2 }] }))).toBe(
			'content/members.2'
		);
	});

	it('rebaseRuleIds re-roots a body under the host id', () => {
		const body: Rule<'evaluate'> = { type: 'SYMBOL', name: 'x', id: createRuleId('other', { path: [{ edge: 'content' }] }) };
		expect(rebaseRuleIds(body, 'rule:host:members.0').id).toBe('rule:host:members.0/content');
	});

	it('buildRuleCatalog mints a kind under its source name when one is given', () => {
		const rules: Record<string, Rule<'evaluate'>> = {
			host: { type: 'SEQ', members: [{ type: 'SYMBOL', name: 'renamed' }] },
			renamed: { type: 'PATTERN', value: 'x' }
		};
		const { ruleCatalog } = buildRuleCatalog(rules, { sourceKindOf: new Map([['renamed', '_source']]) });
		expect(ruleCatalog.rootsByKind.get('renamed')).toBe('rule:_source:root');
		expect(ruleCatalog.rootsByKind.get('host')).toBe('rule:host:root');
	});

	it('a kind the catalog renames keeps its source rule id', async () => {
		const raw = python;
		const collapsed = collapseRenamedRules(raw, {
			kindEntries: kindCatalogOf(stampVisibleExternals(await loadGeneratedIdTables('python'), raw), raw)
		});
		expect(collapsed.rules['_match_block']).toBeUndefined();
		expect(collapsed.ruleCatalog.rootsByKind.get('match_block')).toBe('rule:_match_block:root');
	});

	it('a kind the catalog renames owns its variants under its new name', async () => {
		const raw = python;
		const collapsed = collapseRenamedRules(raw, {
			kindEntries: kindCatalogOf(stampVisibleExternals(await loadGeneratedIdTables('python'), raw), raw)
		});
		const arms = (collapsed.rules['match_block'] as { members: readonly Rule<'evaluate'>[] }).members;
		expect(arms.map((arm) => arm.annotations?.variantOf)).toEqual(['match_block', 'match_block']);
	});

	it('a synthesized kind the catalog renames is recorded under its new name', async () => {
		const evaluated = python;
		const raw = { ...evaluated, evaluateSynthesized: new Set([...evaluated.evaluateSynthesized, '_match_block']) };
		const collapsed = collapseRenamedRules(raw, {
			kindEntries: kindCatalogOf(stampVisibleExternals(await loadGeneratedIdTables('python'), raw), raw)
		});
		expect(collapsed.evaluateSynthesized.has('match_block')).toBe(true);
		expect(collapsed.evaluateSynthesized.has('_match_block')).toBe(false);
	});
});
