import { describe, expect, it } from 'vitest';
import { buildRuleCatalog, createRuleId, ruleIdPath } from '../rule-catalog.ts';
import { evaluate } from '../evaluate.ts';
import { resolveOverridesPath } from '../resolve-grammar.ts';
import { collapseRenamedRules } from '../link.ts';
import { kindCatalogOf, stampVisibleExternals } from '../../dsl/symbol-table.ts';
import { loadGeneratedIdTables } from '../generated-metadata.ts';
import { rebaseRuleIds } from '../../dsl/rule-attrs.ts';
import type { Rule } from '../../types/rule.ts';
import { NO_FILE_TYPES } from '../upstream-file-types.ts';

describe('rule ids', () => {
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
		const raw = await evaluate(resolveOverridesPath('python'), NO_FILE_TYPES);
		const collapsed = collapseRenamedRules(raw, {
			kindEntries: kindCatalogOf(stampVisibleExternals(await loadGeneratedIdTables('python'), raw), raw)
		});
		expect(collapsed.rules['_match_block']).toBeUndefined();
		expect(collapsed.ruleCatalog.rootsByKind.get('match_block')).toBe('rule:_match_block:root');
	}, 60_000);
});
