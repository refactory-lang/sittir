import { ALIAS, CHOICE, DEDENT, ENUM, FIELD, GROUP, INDENT, NEWLINE, OPTIONAL, PATTERN, REPEAT, REPEAT1, SEQ, STRING, SUPERTYPE, SYMBOL, TERMINAL, TOKEN, VARIANT } from '../../compiler/rule-types.ts'; // @rule-type-consts
import { expect } from 'vitest';
import type { Rule, RuleId } from '../../compiler/rule.ts';
import type { RuleCatalog } from '../../compiler/types.ts';

export function collectRuleIds(rule: Rule): RuleId[] {
	const ids: RuleId[] = [];
	walkRule(rule, (node) => {
		expect(node.id).toBeTypeOf('string');
		ids.push(node.id!);
	});
	return ids;
}

export function expectCompleteCatalog(rules: Record<string, Rule>, catalog: RuleCatalog): void {
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

export function walkRule(rule: Rule, visit: (rule: Rule) => void): void {
	visit(rule);
	switch (rule.type) {
		case SEQ:
		case CHOICE:
		case ENUM:
			for (const member of rule.members) walkRule(member, visit);
			return;
		case OPTIONAL:
		case REPEAT:
		case REPEAT1:
		case FIELD:
		case VARIANT:
		case GROUP:
		case TERMINAL:
		case ALIAS:
		case TOKEN:
			walkRule(rule.content, visit);
			return;
		case 'polymorph':
			for (const form of rule.forms) walkRule(form.content, visit);
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
