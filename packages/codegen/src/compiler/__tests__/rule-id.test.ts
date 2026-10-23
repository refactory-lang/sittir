import { beforeAll, describe, expect, it } from 'vitest';
import { buildRuleCatalog, createRuleId, ruleIdPath } from '../rule-catalog.ts';
import { collapseRenamedRules } from '../link.ts';
import { kindCatalogOf, stampVisibleExternals } from '../../dsl/symbol-table.ts';
import { loadGeneratedIdTables } from '../generated-metadata.ts';
import { rebaseRuleIds } from '../../dsl/rule-attrs.ts';
import type { Rule } from '../../types/rule.ts';
import { evaluatePackage } from '../../dsl/evaluate-package.ts';
import { grammarPackage } from '../../grammars.ts';

describe('rule ids', () => {
	let rust: Awaited<ReturnType<typeof evaluatePackage>>;

	beforeAll(async () => {
		rust = await evaluatePackage(grammarPackage('rust'));
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
		const raw = rust;
		const collapsed = collapseRenamedRules(raw, {
			kindEntries: kindCatalogOf(stampVisibleExternals(await loadGeneratedIdTables('rust'), raw), raw)
		});
		expect(collapsed.rules['_non_special_token']).toBeUndefined();
		expect(collapsed.ruleCatalog.rootsByKind.get('non_special_token')).toBe('rule:_non_special_token:root');
	});

	it('a kind the catalog renames owns its variants under its new name', async () => {
		const raw = rust;
		const collapsed = collapseRenamedRules(raw, {
			kindEntries: kindCatalogOf(stampVisibleExternals(await loadGeneratedIdTables('rust'), raw), raw)
		});
		const arms = (collapsed.rules['non_special_token'] as { members: readonly Rule<'evaluate'>[] }).members;
		expect(arms.map((arm) => arm.annotations?.variantOf)).toEqual(Array(9).fill('non_special_token'));
	});

	it('a synthesized kind the catalog renames is recorded under its new name', async () => {
		const evaluated = rust;
		const raw = { ...evaluated, evaluateSynthesized: new Set([...evaluated.evaluateSynthesized, '_non_special_token']) };
		const collapsed = collapseRenamedRules(raw, {
			kindEntries: kindCatalogOf(stampVisibleExternals(await loadGeneratedIdTables('rust'), raw), raw)
		});
		expect(collapsed.evaluateSynthesized.has('non_special_token')).toBe(true);
		expect(collapsed.evaluateSynthesized.has('_non_special_token')).toBe(false);
	});
});
