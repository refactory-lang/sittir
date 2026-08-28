import { ALIAS, CHOICE, FIELD, GROUP, OPTIONAL, REPEAT, REPEAT1, SEQ, TOKEN, VARIANT } from '../types/rule-types.ts'; // @rule-type-consts
import type { RenderRule, Rule, RuleSeparator, SeqRule } from '../types/rule.ts';
import { fuseHeadRepeatLists } from '../dsl/rule-transforms.ts';
import { selfReferentialFoldOf } from '../dsl/rule-patterns.ts';
import { attributeBuilder, buildOptional, overlaySeq } from '../dsl/builders.ts';
import { withId } from '../dsl/rule-attrs.ts';

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
			content: { type: REPEAT, content: ext.content, separator: { value: fold.separator } }
		};
		return { ...m, members: [m.members[0]!, m.members[1]!, rewrittenExt] };
	});
	return { ...rule, members };
}

type Input = Rule<'link' | 'normalize'>;
type Output = Rule<'normalize'>;

const b = attributeBuilder;

function withSeparator(content: Output, separator: RuleSeparator<Input> | undefined): Output {
	return separator === undefined
		? content
		: { ...content, separator: { ...separator, value: rebuild(separator.value) } };
}

function construct(node: Input): Output {
	switch (node.type) {
		case SEQ: {
			const members = node.members.map(rebuild);
			const rebuilt: SeqRule<'normalize'> = { ...node, members };
			return overlaySeq(rebuilt, b.seq(...members));
		}
		case CHOICE:
			return { ...node, ...b.choice(...node.members.map(rebuild)) };
		case OPTIONAL:
			return buildOptional(rebuild(node.content));
		case REPEAT:
			return b.repeat(withSeparator(rebuild(node.content), node.separator));
		case REPEAT1:
			return b.repeat1(withSeparator(rebuild(node.content), node.separator));
		case FIELD:
			return b.field(node.name, rebuild(node.content));
		case ALIAS:
			return b.alias(rebuild(node.content), node.named ? b.symbol(node.value) : node.value);
		case TOKEN:
			return node.immediate ? b.token.immediate(rebuild(node.content)) : b.token(rebuild(node.content));
		case VARIANT:
			return { ...node, ...b.variant(node.name, rebuild(node.content)) };
		case GROUP:
			return { ...node, ...b.group(node.name, rebuild(node.content)) };
		default:
			return node;
	}
}

function rebuild(node: Input): Output {
	const built = construct(node);
	return withId(built, node.id ?? built.id);
}

export function flatten(rule: Input): Output {
	return rebuild(rule);
}

export function flattenRules(rules: Record<string, Rule<'link'>>): Record<string, RenderRule> {
	const result: Record<string, RenderRule> = {};
	for (const [name, rule] of Object.entries(rules)) {
		result[name] = fuseHeadRepeatLists(flatten(applySelfReferentialFold(name, rule)));
	}
	return result;
}
