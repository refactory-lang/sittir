/**
 * compiler/wrapper-deletion.ts — PR1 Task 2.A2
 *
 * Pushes modifier wrappers (optional / field / repeat / repeat1 / alias /
 * token) down to leaf attributes (fieldName, multiplicity, separator, …) on
 * RuleBase. The result type is RenderRule: the Rule<'link'> union minus the
 * wrapper variants, so consumers that only see RenderRule cannot
 * accidentally re-wrap a leaf.
 *
 * `deleteWrapper` is a re-evaluation of the tree through `attributeBuilder`
 * (dsl/builders.ts) — the RuleBuilder strategy that implements every
 * constructor as attribute-push instead of node construction — not an edit
 * of the tree: `RuleWalker.map` rebuilds bottom-up so each `attributeBuilder`
 * call receives an already-finished input and looks exactly one level down.
 */

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
		// Re-check the SEQ discriminant here for TypeScript's narrowing, not
		// as a runtime safety net (the fold's own scan already proved this).
		if (m.type !== SEQ || m.members.length !== 3) return m;
		const ext = m.members[2]!;
		if (ext.type !== FIELD) return m;
		const rewrittenExt: Rule<'link'> = {
			type: FIELD,
			name: ext.name,
			content: { type: REPEAT, content: ext.content, separator: { value: fold.separator } } as Rule<'link'>
		};
		return { ...m, members: [m.members[0]!, m.members[1]!, rewrittenExt] };
	});
	return { ...rule, members };
}

const deleteWrapperWalker = new RuleWalker<AnyRule>();

function rebuild(node: AnyRule): AnyRule {
	switch (node.type) {
		// SEQ/CHOICE/VARIANT/GROUP survive as their OWN node (unlike the
		// wrapper cases below, which are consumed into their content) — the
		// original node's own stamped facts (id, metadata, …) must ride
		// along, so spread it under attributeBuilder's freshly-built shape.
		case SEQ: {
			// `attributeBuilder.seq` stamps `id` itself (id: node.id ??
			// input.id — here there's no single input, so it's just
			// `node.id`); the outer spread still carries any OTHER stamped
			// facts (metadata, …) attributeBuilder has no access to. `built`
			// may be a collapsed singleton survivor (buildSeq's own
			// singleton collapse) with no `members` of its own — a plain
			// `{...node, ...built}` spread would leave `node`'s stale
			// `members` array on it, so drop it when `built` doesn't own one.
			const built = attributeBuilder.seq(node.members, undefined, node.id);
			const merged = { ...node, ...built } as AnyRule & { members?: AnyRule[] };
			if (!('members' in (built as object))) delete merged.members;
			return merged;
		}
		case CHOICE:
			return { ...node, ...attributeBuilder.choice(node.members, node.id) } as AnyRule;
		case OPTIONAL:
			// `buildOptional`, not `attributeBuilder.optional`: the empty-match
			// fold (`foldOptionalEmptyMatch`) belongs to simplify's own later
			// construction, not RenderRule production — a raw OPTIONAL over a
			// bare literal here stays a leaf with `multiplicity: 'optional'`.
			return buildOptional({ content: node.content, id: node.id });
		case REPEAT:
			// Cast, not narrow: `node: AnyRule` distributes REPEAT across
			// every phase (its 'evaluate' view's `separator` is a bare
			// string, not yet lifted to the structured link-phase shape),
			// while wrapper-deletion always operates on the 'link' view —
			// same "narrow via AnyRule, cast back" convention as
			// rule-patterns.ts's `ruleChildren`.
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
			// string / pattern / symbol / supertype / indent / dedent / newline
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
		// Fuse separated-list head+repeat pairs into one multi slot AFTER
		// wrapper-deletion has pushed multiplicity/separator to leaves, so the
		// renderRule the emitter consumes already has the canonical single
		// multi slot (no head single + tail array split).
		result[name] = fuseHeadRepeatLists(deleteWrapper(rule, name)) as RenderRule;
	}
	return result;
}
