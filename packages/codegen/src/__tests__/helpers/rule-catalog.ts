import {
	ALIAS,
	CHOICE,
	DEDENT,
	FIELD,
	GROUP,
	INDENT,
	NEWLINE,
	OPTIONAL,
	PATTERN,
	REPEAT,
	REPEAT1,
	SEQ,
	STRING,
	SUPERTYPE,
	SYMBOL,
	TOKEN,
	VARIANT
} from '../../types/rule-types.ts'; // @rule-type-consts
import { expect } from 'vitest';
import type { Rule, RuleId } from '../../types/rule.ts';
import type { RuleCatalog } from '../../compiler/types.ts';

export function collectRuleIds(rule: Rule<'evaluate'>): RuleId[] {
	const ids: RuleId[] = [];
	walkRule(rule, (node) => {
		expect(node.id).toBeTypeOf('string');
		ids.push(node.id!);
	});
	return ids;
}

export function expectCompleteCatalog(rules: Record<string, Rule<'evaluate'>>, catalog: RuleCatalog): void {
	const seen = new Set<RuleId>();
	for (const [kind, rule] of Object.entries(rules)) {
		const ids = collectRuleIds(rule);
		const rootId = ids[0];
		expect(rootId).toBe(catalog.rootsByKind.get(kind));
		for (const id of ids) {
			expect(seen.has(id), `duplicate RuleId ${id}`).toBe(false);
			seen.add(id);
			expect(catalog.byId.has(id), `missing catalog entry for ${id}`).toBe(true);
			expect(catalog.classificationById.has(id), `missing classification for ${id}`).toBe(true);
		}
	}
	expect(catalog.byId.size).toBe(seen.size);
	expect(catalog.classificationById.size).toBe(seen.size);
}

export function serializeCatalog(catalog: RuleCatalog): unknown {
	return {
		rootsByKind: [...catalog.rootsByKind.entries()],
		byId: [...catalog.byId.entries()],
		classificationById: [...catalog.classificationById.entries()]
	};
}

export function walkRule(rule: Rule<'evaluate'>, visit: (rule: Rule<'evaluate'>) => void): void {
	visit(rule);
	switch (rule.type) {
		case SEQ:
		case CHOICE:
			// PR-P: ENUM case removed — enum-shaped ChoiceRules handled by CHOICE arm.
			for (const member of rule.members) walkRule(member, visit);
			return;
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case FIELD:
		case VARIANT:
		case GROUP:
		case ALIAS:
		case TOKEN:
			walkRule(rule.content, visit);
			return;
		case SUPERTYPE:
		case STRING:
		case PATTERN:
		case INDENT:
		case DEDENT:
		case NEWLINE:
		case SYMBOL:
			return;
	}
}
