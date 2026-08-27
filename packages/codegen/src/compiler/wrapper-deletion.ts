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
 * (compiler/simplify.ts) — the RuleBuilder strategy that implements every
 * constructor as attribute-push instead of node construction — not an edit
 * of the tree: `RuleWalker.map` rebuilds bottom-up so each `attributeBuilder`
 * call receives an already-finished input and looks exactly one level down.
 */

import { ALIAS, CHOICE, FIELD, GROUP, OPTIONAL, REPEAT, REPEAT1, SEQ, TOKEN, VARIANT } from '../types/rule-types.ts'; // @rule-type-consts
import type { AnyRule, Rule, RenderRule, RuleBase } from '../types/rule.ts';
import { fuseHeadRepeatLists } from '../dsl/rule-transforms.ts';
import { RuleWalker } from '../dsl/rule-walker.ts';
import { attributeBuilder, buildOptional } from './simplify.ts';

/**
 * Detects tree-sitter's prec.left self-referential-choice flattening: a
 * hidden CHOICE rule whose arms are all 3-member SEQs
 * `[field(base), STRING(separator), field(extension)]` with the SAME
 * (base, extension) field-name pair and separator literal across every
 * arm, where at least one arm's base field is a bare (non-alias-wrapped)
 * hidden SYMBOL reference to THIS rule's own name. Tree-sitter's LR table
 * collapses the recursion into ONE FLAT node at parse time (confirmed via
 * probe-kind): the base field stays singular — only the true base operand
 * carries it, since inner recursive occurrences dissolve into siblings and
 * the leftover separator tokens are anonymous so the reader drops them —
 * while the extension field repeats once per additional chained operand.
 * Neither the REPEAT/REPEAT1 cases above nor node-types.json (never
 * consulted for arity — see project convention) can see this: the
 * multiplicity is an emergent property of LR precedence-climbing over a
 * self-referential choice, not an authored wrapper shape. Confirmed case:
 * rust's `_let_chain` (`a && b && c && d` parses as one node with a single
 * `left` and a repeated `right`, not a nested binary tree).
 *
 * Only checked at the TOP of each named rule's own body (`ownName` is
 * threaded down from `applyWrapperDeletion`'s per-rule loop and never
 * forwarded into recursive calls) — a nested CHOICE encountered deep
 * inside some OTHER rule's body can never coincidentally match, since the
 * self-reference check requires the SYMBOL's name to equal the rule
 * currently being processed.
 */
function detectSelfReferentialFold(
	name: string,
	rule: Rule<'link'>
): { extensionFieldName: string; separator: Rule<'link'> } | undefined {
	if (rule.type !== CHOICE) return undefined;
	let baseFieldName: string | undefined;
	let extensionFieldName: string | undefined;
	let separator: Rule<'link'> | undefined;
	let sawSelfRef = false;
	const isSelfRef = (content: Rule<'link'>): boolean =>
		content.type === 'SYMBOL' &&
		content.name === name &&
		(content as { hidden?: boolean }).hidden === true &&
		(content as { aliasedFrom?: string }).aliasedFrom === undefined;
	for (const arm of rule.members) {
		if (arm.type !== SEQ || arm.members.length !== 3) return undefined;
		const m0 = arm.members[0];
		const sep = arm.members[1];
		const m2 = arm.members[2];
		if (m0 === undefined || sep === undefined || m2 === undefined) return undefined;
		if (m0.type !== FIELD || m2.type !== FIELD || sep.type !== 'STRING') return undefined;
		if (baseFieldName === undefined) {
			baseFieldName = m0.name;
			extensionFieldName = m2.name;
		} else if (m0.name !== baseFieldName || m2.name !== extensionFieldName) {
			return undefined;
		}
		if (separator === undefined) separator = sep;
		else if (separator.type !== 'STRING' || separator.value !== sep.value) return undefined;
		if (isSelfRef(m0.content)) sawSelfRef = true;
		else if (isSelfRef(m2.content)) return undefined; // self-ref on the extension side — bail, don't guess
	}
	if (!sawSelfRef || extensionFieldName === undefined || separator === undefined) return undefined;
	return { extensionFieldName, separator };
}

/**
 * Pre-step: when `ownName`'s own top-level body is a self-referential fold
 * (see `detectSelfReferentialFold`), rewrite each arm's extension member in
 * the RAW `Rule<'link'>` tree — `field(name, content)` becomes
 * `field(name, repeat(content, separator))` — so the ordinary bottom-up
 * rebuild below produces the array-with-separator slot uniformly, with no
 * special-casing anywhere else in the walk.
 */
function applySelfReferentialFold(ownName: string, rule: Rule<'link'>): Rule<'link'> {
	if (rule.type !== CHOICE) return rule;
	const fold = detectSelfReferentialFold(ownName, rule);
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

/**
 * Bottom-up rebuild: each case calls the matching `attributeBuilder` method
 * with the node's own parameters and its already-rebuilt content/members
 * (guaranteed by `RuleWalker.map`'s recursion order — every descendant is
 * visited before its parent). Leaves fall through the default arm
 * unchanged; the enclosing builder stamps them.
 */
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
			// rule-catalog.ts's `ruleChildren`.
			return attributeBuilder.repeat(node.content, node.separator as RuleBase<'normalize'>['separator'], node.id);
		case REPEAT1:
			return attributeBuilder.repeat1(node.content, node.separator as RuleBase<'normalize'>['separator'], node.id);
		case FIELD:
			return attributeBuilder.field(node.name, node.content, node.id);
		case ALIAS:
			return attributeBuilder.alias(node.content, node.value, node.named, node.id);
		case TOKEN:
			// TOKEN survives structurally (like VARIANT/GROUP), not via
			// attributeBuilder.token/tokenImmediate's attribute-push formula:
			// `collect-slots.ts`'s AssembledToken reads `.immediate` directly
			// off a surviving TOKEN node post-`deleteWrapper` — eliminating it
			// here would starve that reader. `node.content` is already
			// rebuilt (RuleWalker.map patches it before this case runs); an
			// enclosing wrapper (e.g. field) spreads over this node like any
			// other already-built value, stamping fieldName/nonterminal onto
			// it without disturbing `type`/`immediate`.
			return node;
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
