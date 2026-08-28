import { ALIAS, CHOICE, FIELD, GROUP, OPTIONAL, REPEAT, REPEAT1, SEQ, TOKEN, VARIANT } from '../types/rule-types.ts'; // @rule-type-consts
import type { AnyRule, Rule, RenderRule, RuleBase } from '../types/rule.ts';
import { fuseHeadRepeatLists } from '../dsl/rule-transforms.ts';
import { RuleWalker } from '../dsl/rule-walker.ts';
import { selfReferentialFoldOf } from '../dsl/rule-patterns.ts';
import { attributeBuilder, buildOptional } from '../dsl/builders.ts';

function applySelfReferentialFold(ownName: string, rule: Rule<'link'>): Rule<'link'> {
	if (rule.type !== CHOICE) return rule;
	const fold = selfReferentialFoldOf(ownName, rule);
	if (fold === undefined) return rule;
	const members = rule.members.map((m) => {
		if (m.type !== SEQ || m.members.length !== 3) return m;
		const ext = m.members[2]!;
		if (ext.type !== FIELD) return m;
		const rewrittenExt: Rule<'link'> = {
			...ext,
			content: { type: REPEAT, content: ext.content, separator: { value: fold.separator } } as Rule<'link'>
		};
		return { ...m, members: [m.members[0]!, m.members[1]!, rewrittenExt] };
	});
	return { ...rule, members };
}

const deleteWrapperWalker = new RuleWalker<AnyRule>();

function rebuild(node: AnyRule): AnyRule {
	switch (node.type) {
		case SEQ: {
			const built = attributeBuilder.seq(node.members, undefined, node.id);
			const merged = { ...node, ...built } as AnyRule & { members?: AnyRule[] };
			if (!('members' in (built as object))) delete merged.members;
			return merged;
		}
		case CHOICE:
			return { ...node, ...attributeBuilder.choice(node.members, node.id) } as AnyRule;
		case OPTIONAL:
			return buildOptional({ content: node.content, id: node.id });
		case REPEAT:
			return attributeBuilder.repeat(node.content, node.separator as RuleBase<'normalize'>['separator'], node.id);
		case REPEAT1:
			return attributeBuilder.repeat1(node.content, node.separator as RuleBase<'normalize'>['separator'], node.id);
		case FIELD:
			return attributeBuilder.field(node.name, node.content, node.id);
		case ALIAS:
			return attributeBuilder.alias(node.content, node.value, node.named, node.id);
		case TOKEN:
			return node.immediate
				? attributeBuilder.tokenImmediate(node.content, node.id)
				: attributeBuilder.token(node.content, node.id);
		case VARIANT:
			return { ...node, ...attributeBuilder.variant(node.name, node.content, node.id) } as AnyRule;
		case GROUP:
			return { ...node, ...attributeBuilder.group(node.name, node.content, node.id) } as AnyRule;
		default:
			return node;
	}
}

export function deleteWrapper(rule: Rule<'link'>, ownName?: string): RenderRule {
	const folded = ownName !== undefined ? applySelfReferentialFold(ownName, rule) : rule;
	return rebuild(deleteWrapperWalker.map(folded as AnyRule, rebuild)) as RenderRule;
}

export function applyWrapperDeletion(rules: Record<string, Rule<'link'>>): Record<string, RenderRule> {
	const result: Record<string, RenderRule> = {};
	for (const [name, rule] of Object.entries(rules)) {
		result[name] = fuseHeadRepeatLists(deleteWrapper(rule, name)) as RenderRule;
	}
	return result;
}
