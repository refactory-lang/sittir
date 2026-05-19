/**
 * compiler/evaluate.ts — Evaluate phase.
 *
 * Executes grammar.js DSL and produces a RawGrammar.
 * When overrides.ts exists, it uses tree-sitter's native grammar(base, { rules })
 * extension mechanism — each rule fn receives ($, original).
 */

import type {
	Rule,
	SeqRule,
	ChoiceRule,
	OptionalRule,
	RepeatRule,
	Repeat1Rule,
	FieldRule,
	TokenRule,
	StringRule,
	PatternRule,
	SymbolRule,
	AliasRule,
	EnumRule,
	SymbolRef
} from './rule.ts';
import { normalizeEnumMembers } from './rule.ts';
import type { RawGrammar } from './types.ts';
import type { RuleProvenance } from './types.ts';
import { attachReferenceRuleIds, buildRuleCatalog } from './rule-catalog.ts';
import { withRoleScope } from '../dsl/primitives/role.ts';
import type { WireContext, RefineForm } from '../dsl/wire/wire.ts';
import type { PolymorphVariant } from './types.ts';

// ---------------------------------------------------------------------------
// Input type — anything the DSL functions accept
// ---------------------------------------------------------------------------

type Input = string | RegExp | Rule;

// Augmented SymbolRule that carries a ref for in-place enrichment
interface SymbolRuleWithRef extends SymbolRule {
	readonly _ref?: SymbolRef;
}

// ---------------------------------------------------------------------------
// normalize — convert raw input to a Rule
// ---------------------------------------------------------------------------

export function normalize(input: Input): Rule {
	if (input === undefined || input === null) {
		throw new Error('Undefined symbol');
	}

	if (typeof input === 'string') {
		return { type: 'string', value: input } satisfies StringRule;
	}

	if (input instanceof RegExp) {
		return { type: 'pattern', value: input.source } satisfies PatternRule;
	}

	if (typeof input === 'object' && 'type' in input) {
		return input as Rule;
	}

	throw new TypeError(`Invalid rule: ${input}`);
}

// ---------------------------------------------------------------------------
// Structural grouping
// ---------------------------------------------------------------------------

/**
 * Sequence combinator — matches all members in order.
 *
 * @remarks
 * A single-member seq collapses to its sole member: the extra layer has
 * the same parse semantics but confuses walkers that count seq members
 * for positional hints.
 *
 * @remarks
 * commaSep1 patterns — `seq(x, repeat(seq(sep, x)))` and variants — are
 * lifted to a single `repeat1` node with a clean `separator` marker so
 * downstream passes see a canonical shape instead of five to six nested rules.
 *
 * @remarks
 * After liftCommaSep runs, trailing-sep optionals of the form
 * `seq('(', repeat1(x, sep), optional(sep), ')')` are absorbed into the
 * repeat1's `trailing: true` flag so no phantom `optional(',')` survives
 * into simplifyRule.
 */
export function seq(...members: Input[]): Rule {
	const normalized = members.map(normalize);

	if (normalized.length === 1) return normalized[0]!;

	const lifted = liftCommaSep(normalized);
	if (lifted) return lifted;

	const absorbed = absorbTrailingSeparator(normalized);
	if (absorbed) return { type: 'seq', members: absorbed };

	return { type: 'seq', members: normalized };
}

/**
 * Look for adjacent `repeat`/`repeat1` (with separator) + `optional(sepLit)`
 * pairs inside a seq and merge the trailing-sep optional into the
 * repeat by stamping `trailing: true` on it. Returns the new member
 * array if any absorption happened, else `null`.
 */
function absorbTrailingSeparator(members: Rule[]): Rule[] | null {
	let changed = false;
	const out: Rule[] = [];
	for (let i = 0; i < members.length; i++) {
		const cur = members[i]!;
		const next = members[i + 1];
		const isSepRepeat =
			(cur.type === 'repeat' || cur.type === 'repeat1') && cur.separator !== undefined && !cur.trailing;
		const isOptionalSepLit = (r: Rule | undefined, sep: string): boolean =>
			!!r && r.type === 'optional' && r.content.type === 'string' && r.content.value === sep;
		if (isSepRepeat && isOptionalSepLit(next, (cur as RepeatRule | Repeat1Rule).separator!)) {
			// Merge — stamp trailing on the repeat and skip the next member.
			const sepRule = cur as RepeatRule | Repeat1Rule;
			out.push({ ...sepRule, trailing: true });
			i++;
			changed = true;
			continue;
		}
		out.push(cur);
	}
	return changed ? out : null;
}

/**
 * Detect the `commaSep1` family inside a normalized seq body and lift
 * it to a single `repeat1` node with `separator` plus optional
 * `leading` / `trailing` markers. Returns `null` if no lift applies.
 *
 * Relies on `repeat(seq(sep, x))` already having been normalized to
 * `repeat(x, separator=sep)` by the `repeat()` helper.
 */
function liftCommaSep(members: Rule[]): Rule | null {
	if (members.length < 2 || members.length > 3) return null;

	const repeatIdx = findRepeatWithSeparator(members);
	if (repeatIdx === -1) return null;
	const repeatNode = members[repeatIdx] as RepeatRule;
	const sep = repeatNode.separator!;
	const elem = repeatNode.content;

	const matchesElem = (r: Rule): boolean => rulesEqual(r, elem);
	const matchesOptionalSep = (r: Rule): boolean =>
		r.type === 'optional' && r.content.type === 'string' && r.content.value === sep;

	// Case 1: [x, repeat(sep, x)]
	if (members.length === 2 && repeatIdx === 1 && matchesElem(members[0]!)) {
		return { type: 'repeat1', content: elem, separator: sep };
	}

	// Case 2: [x, repeat(sep, x), optional(sep)] — trailing allowed.
	if (members.length === 3 && repeatIdx === 1 && matchesElem(members[0]!) && matchesOptionalSep(members[2]!)) {
		return { type: 'repeat1', content: elem, separator: sep, trailing: true };
	}

	// Case 3: [sep, x, repeat(sep, x)] — leading separator.
	if (
		members.length === 3 &&
		repeatIdx === 2 &&
		members[0]!.type === 'string' &&
		members[0]!.value === sep &&
		matchesElem(members[1]!)
	) {
		return { type: 'repeat1', content: elem, separator: sep, leading: true };
	}

	return null;
}

/**
 * Locate the unique repeat-with-separator member inside a seq's member list.
 *
 * @param members - Normalized rule array from the enclosing seq.
 * @returns Index of the matching repeat node, or `-1` if none or more than one found.
 * @remarks
 * The commaSep1 shape has exactly one repeat node in the group; zero or
 * more than one means this isn't a commaSep shape.
 */
function findRepeatWithSeparator(members: Rule[]): number {
	return members.findIndex((m) => m.type === 'repeat' && m.separator !== undefined);
}

/**
 * Structural equality for rule trees — used by the commaSep1 lift to
 * verify the seq's standalone element matches the repeat's content.
 * Intentionally limited to the subset of rule shapes evaluate can
 * produce at DSL-call time (no polymorph/supertype/terminal — those
 * appear only after Link).
 */
function rulesEqual(a: Rule, b: Rule): boolean {
	if (a.type !== b.type) return false;
	switch (a.type) {
		case 'string':
			return a.value === (b as StringRule).value;
		case 'pattern':
			return a.value === (b as PatternRule).value;
		case 'symbol':
			return a.name === (b as SymbolRule).name;
		case 'enum': {
			const bm = (b as EnumRule).members;
			return a.members.length === bm.length && a.members.every((m, i) => m.value === bm[i]!.value);
		}
		case 'seq':
			return (
				a.members.length === (b as SeqRule).members.length &&
				a.members.every((m, i) => rulesEqual(m, (b as SeqRule).members[i]!))
			);
		case 'choice':
			return (
				a.members.length === (b as ChoiceRule).members.length &&
				a.members.every((m, i) => rulesEqual(m, (b as ChoiceRule).members[i]!))
			);
		case 'optional':
			return rulesEqual(a.content, (b as OptionalRule).content);
		case 'repeat':
			return a.separator === (b as RepeatRule).separator && rulesEqual(a.content, (b as RepeatRule).content);
		case 'repeat1':
			return a.separator === (b as Repeat1Rule).separator && rulesEqual(a.content, (b as Repeat1Rule).content);
		case 'field':
			return a.name === (b as FieldRule).name && rulesEqual(a.content, (b as FieldRule).content);
		default:
			return false;
	}
}

/**
 * Choice combinator — matches exactly one of the members.
 *
 * @remarks
 * A single-member choice collapses to its member — the wrapper has no
 * parse semantics.
 *
 * @remarks
 * `choice(x, blank())` is lowered to `optional(x)`. Tree-sitter encodes
 * blank() as either an empty seq (historical) or an empty choice; both
 * shapes mark "this branch matches nothing", so the outer choice is
 * "x or nothing" = `optional(x)`. Collapsing at DSL time means walkers
 * only ever see the optional shape.
 *
 * @remarks
 * An all-string choice is compacted to an `EnumRule` for fast downstream
 * handling.
 */
export function choice(...members: Input[]): Rule {
	const normalized = members.map(normalize);

	if (normalized.length === 1) return normalized[0]!;

	const isBlank = (r: Rule): boolean =>
		(r.type === 'seq' && r.members.length === 0) || (r.type === 'choice' && r.members.length === 0);
	const blankIdx = normalized.findIndex(isBlank);
	if (blankIdx !== -1 && normalized.length === 2) {
		const other = normalized[1 - blankIdx]!;
		// Recurse through optional() so `optional(optional(x))` keeps
		// collapsing per rule #5.
		return optional(other);
	}

	// Detect all-string choice → EnumRule
	if (normalized.length > 0 && normalized.every((m) => m.type === 'string')) {
		return normalizeEnumMembers(normalized as StringRule[], 'grammar');
	}

	if (normalized.length >= 2 && normalized.every((m) => m.type === 'field')) {
		return collapseAllFieldChoiceMembers(normalized as FieldRule[]);
	}

	return { type: 'choice', members: normalized };
}

/**
 * Collapse an all-field choice into a factored field or a choice-of-variants.
 *
 * @param fieldMembers - All members of the choice, already confirmed to be FieldRule.
 * @returns A factored `FieldRule`, a `choice` of variants, or a raw `choice` when
 *   any branch wraps an alias.
 * @remarks
 * Two sub-cases:
 *
 * 1. All branches wrap the SAME field name — factor the field outward to
 *    `field('x', choice(A, B))`. The choice content may itself simplify
 *    to an enum when all inners are strings.
 *
 * 2. All branches have DIFFERENT field names — retype each field node as
 *    a variant node. `FieldRule` and `VariantRule` share the same shape
 *    (`name` + `content`), so the rewrite is purely a discriminator
 *    change. This is the encoding overrides.ts uses for polymorphs:
 *    `choice(field('body', seq(...)), field('semi', seq(...)))` becomes
 *    `choice(variant('body', seq(...)), variant('semi', seq(...)))`.
 *    Link's `promotePolymorph` pass recognises that shape at the top
 *    level and wraps the whole rule in a `PolymorphRule`.
 *
 * Mixed branches (some fields, some not) fall through to the raw
 * choice — no clean single interpretation.
 *
 * @remarks
 * Skip variant retyping when any branch wraps an alias directly.
 * Aliases are structural rename markers; downstream passes (Link,
 * assemble) depend on the alias appearing inside a plain choice to route
 * the synthetic kind into the NodeMap. Tagging as a variant shifts
 * classification and leaves the alias target unregistered (observed on
 * rust `_line_doc_comment_marker` / `_block_doc_comment_marker`).
 */
function collapseAllFieldChoiceMembers(fieldMembers: FieldRule[]): Rule {
	const anyAlias = fieldMembers.some((f) => f.content.type === 'alias');
	if (anyAlias) {
		return { type: 'choice', members: fieldMembers };
	}
	const names = fieldMembers.map((f) => f.name);
	const allSameName = names.every((n) => n === names[0]);
	if (allSameName) {
		// Factor: choice(field(x, A), field(x, B)) → field(x, choice(A, B))
		const inner = choice(...fieldMembers.map((f) => f.content));
		return {
			type: 'field',
			name: names[0]!,
			content: inner,
			source: 'grammar'
		};
	}
	// Heterogeneous names → retype each field node as a variant node.
	// Same `name`, same `content`, only the discriminator changes.
	// Downstream (Link's `promotePolymorph`, walker, assemble) consumes
	// variants as polymorph-form markers when they appear at the top level.
	const retyped: Rule[] = fieldMembers.map((f) => ({
		type: 'variant' as const,
		name: f.name,
		content: f.content
	}));
	return { type: 'choice', members: retyped };
}

/**
 * Optional combinator — matches zero or one occurrence of the content.
 *
 * @remarks
 * `optional(optional(x))` collapses to `optional(x)` — two layers of
 * "zero or one" is the same as one layer.
 *
 * @remarks
 * `optional(repeat(x))` returns `repeat(x)` unchanged. `repeat` is
 * already optional in the config surface (`items?: T[]`, null-coalesced
 * to `[]` in the factory), so the wrapper adds no information.
 *
 * @remarks
 * `optional(repeat1(x))` is lowered to `repeat(x)`. The two are
 * parse-identical: tree-sitter surfaces "optional didn't fire" and
 * "repeat1 fired with zero items" identically (an empty children list).
 * The non-empty guarantee a bare `repeat1` carries only holds when there
 * is no `optional` wrapper to swallow the empty case.
 */
export function optional(content: Input): Rule {
	const resolved = normalize(content);
	walkRefs(resolved, (ref) => {
		ref.optional = true;
	});
	if (resolved.type === 'optional') return resolved;
	if (resolved.type === 'repeat') return resolved;
	if (resolved.type === 'repeat1') {
		return {
			type: 'repeat',
			content: resolved.content,
			separator: resolved.separator,
			trailing: resolved.trailing,
			leading: resolved.leading
		};
	}
	return { type: 'optional', content: resolved };
}

/**
 * Detect the `seq(STRING, x)` / `seq(x, STRING)` pattern inside a
 * repeat/repeat1 wrapper and lift the string into a `separator` (and
 * `trailing`) field on the repeat rule. Shared between `repeat` and
 * `repeat1` so both wrappers hoist separators uniformly.
 *
 * Returns `null` if no separator shape is present.
 */
function extractRepeatSeparator(resolved: Rule): { content: Rule; separator: string; trailing?: boolean } | null {
	if (resolved.type !== 'seq' || resolved.members.length !== 2) return null;
	const [first, second] = resolved.members as [Rule, Rule];
	// Canonical case: `repeat(seq(SEP, X))` or `repeat(seq(X, SEP))` with
	// SEP a string literal.
	if (first.type === 'string' && second.type !== 'string') {
		return { content: second, separator: first.value };
	}
	if (second.type === 'string' && first.type !== 'string') {
		return { content: first, separator: second.value, trailing: true };
	}
	const firstSepChoice = first.type === 'choice' ? extractFirstStringFromChoice(first) : null;
	const secondSepChoice = second.type === 'choice' ? extractFirstStringFromChoice(second) : null;
	if (firstSepChoice !== null && second.type !== 'string') {
		return { content: second, separator: firstSepChoice };
	}
	if (secondSepChoice !== null && first.type !== 'string') {
		return { content: first, separator: secondSepChoice, trailing: true };
	}
	return null;
}

/**
 * Extract the first string literal from a choice rule, if any.
 *
 * @param r - A choice rule whose members may include string literals.
 * @returns The string value of the first string member, or `null` if none.
 * @remarks
 * Handles the choice-of-separators pattern used in tree-sitter-typescript's
 * `sepBy1(choice(',', $._semicolon), X)`, which expands to a `repeat` whose
 * separator position is a `choice` of literals and an external symbol
 * (`_semicolon` = automatic semicolon insertion). The first string member
 * is the canonical render-side separator; parse still accepts either form.
 *
 * The separator-choice check mirrors the single-literal branches in
 * `extractRepeatSeparator`: a choice acts as the separator position when
 * its sibling is non-string (e.g. typescript's object_type
 * `sepBy1(choice(',', _semicolon), choice(property_signature, …))`).
 */
function extractFirstStringFromChoice(r: Rule): string | null {
	if (r.type !== 'choice') return null;
	const lit = r.members.find((m): m is StringRule => m.type === 'string');
	return lit ? lit.value : null;
}

/**
 * Zero-or-more repetition combinator.
 *
 * @remarks
 * `repeat(repeat(x))` collapses to `repeat(x)` when neither layer carries
 * a distinct separator — the outer loop is redundant.
 *
 * @remarks
 * `repeat(optional(x))` collapses to `repeat(x)` — repeat already handles
 * zero occurrences, so the optional wrapper is redundant.
 */
export function repeat(content: Input): Rule {
	const resolved = normalize(content);
	walkRefs(resolved, (ref) => {
		ref.repeated = true;
	});
	if (resolved.type === 'repeat' && !resolved.separator) return resolved;
	if (resolved.type === 'optional') {
		const inner = resolved.content;
		walkRefs(inner, (ref) => {
			ref.repeated = true;
		});
		const sep = extractRepeatSeparator(inner);
		if (sep) {
			return {
				type: 'repeat',
				content: sep.content,
				separator: sep.separator,
				trailing: sep.trailing
			};
		}
		return { type: 'repeat', content: inner };
	}
	const sep = extractRepeatSeparator(resolved);
	if (sep) {
		return {
			type: 'repeat',
			content: sep.content,
			separator: sep.separator,
			trailing: sep.trailing
		};
	}
	return { type: 'repeat', content: resolved };
}

/**
 * One-or-more repetition combinator.
 *
 * @remarks
 * `repeat1(repeat1(x))` collapses to `repeat1(x)` — the outer "one or
 * more" of "one or more" accepts the same strings as the inner.
 *
 * @remarks
 * `repeat1(repeat(x))` is NOT collapsed to `repeat1(x)`. The inner
 * `repeat(x)` can match empty, so `repeat1(repeat(x))` accepts
 * zero-or-more `x` (one outer iteration of zero inner matches), which
 * matches `repeat(x)`'s language — not `repeat1(x)`'s. The shape is
 * left alone to preserve grammar author intent.
 */
export function repeat1(content: Input): Rule {
	const resolved = normalize(content);
	walkRefs(resolved, (ref) => {
		ref.repeated = true;
	});
	if (resolved.type === 'repeat1' && !resolved.separator) return resolved;
	const sep = extractRepeatSeparator(resolved);
	if (sep) {
		return {
			type: 'repeat1',
			content: sep.content,
			separator: sep.separator,
			trailing: sep.trailing
		};
	}
	return { type: 'repeat1', content: resolved };
}

/**
 * Symbol reference constructor — baseline DSL shadow used by metadata
 * helpers that need a real runtime symbol without fabricating the object.
 */
export function symbol(name: string): SymbolRule {
	return { type: 'symbol', name, hidden: name.startsWith('_') };
}

// ---------------------------------------------------------------------------
// $ proxy — reference tracking
// ---------------------------------------------------------------------------

export function createProxy(currentRule: string, refs: SymbolRef[]): Record<string, SymbolRuleWithRef> {
	return new Proxy({} as Record<string, SymbolRuleWithRef>, {
		get(_target, name: string): SymbolRuleWithRef {
			const ref: SymbolRef = { refType: 'symbol', from: currentRule, to: name };
			refs.push(ref);
			return {
				type: 'symbol' as const,
				name,
				// `hidden` is a hint for downstream passes only — Link
				// recomputes the authoritative visibility decision via
				// `isHiddenKind()`, consulting both the leading-underscore
				// convention and tree-sitter's explicit `inline` list.
				hidden: name.startsWith('_'),
				_ref: ref
			};
		}
	});
}

/**
 * Authoritative "is this kind hidden?" check shared by Link and
 * downstream passes. Tree-sitter treats a rule as hidden when:
 *
 *   (a) its name begins with `_` (convention), OR
 *   (b) its name appears in the grammar's `inline:` array (explicit).
 *
 * Grammars that don't follow the leading-underscore convention can
 * still mark rules hidden via `inline`. Passing `undefined` for
 * `inlineList` falls back to convention-only, which is the safe
 * default when Link doesn't have grammar metadata at hand.
 */
export function isHiddenKind(name: string, inlineList?: readonly string[]): boolean {
	if (name.startsWith('_')) return true;
	if (inlineList && inlineList.includes(name)) return true;
	return false;
}

// ---------------------------------------------------------------------------
// Ref enrichment helpers
// ---------------------------------------------------------------------------

function getRef(rule: Rule): SymbolRef | undefined {
	return (rule as SymbolRuleWithRef)._ref;
}

/**
 * Walk a rule tree and call `visit` on every direct symbol reference
 * (`_ref`-bearing SymbolRule), including refs nested inside `seq`,
 * `choice`, `optional`, `repeat`, `repeat1`, and `prec` wrappers.
 *
 * Stops at nested `field` boundaries: a `field('y', $.foo)` inside a
 * `field('x', seq(..., field('y', $.foo)))` keeps its own field name
 * — `x` does not propagate over the inner `field`.
 *
 * Also stops at `alias` boundaries — an alias creates a distinct kind
 * with its own surface, so the inner reference doesn't inherit the
 * outer wrapper's modifiers.
 */
function walkRefs(rule: Rule, visit: (ref: SymbolRef) => void): void {
	const ref = getRef(rule);
	if (ref) visit(ref);
	switch (rule.type) {
		case 'seq':
		case 'choice':
			for (const m of (rule as { members: Rule[] }).members) walkRefs(m, visit);
			return;
		case 'optional':
		case 'repeat':
		case 'repeat1':
		case 'prec' as never: // prec wrappers are stripped by normalize but defensive
			walkRefs((rule as { content: Rule }).content, visit);
			return;
		case 'field':
		case 'alias':
			// Stop — inner refs belong to the inner wrapper.
			return;
		default:
			return;
	}
}

// ---------------------------------------------------------------------------
// Named patterns
// ---------------------------------------------------------------------------

/**
 * Field combinator — attaches a named field to a rule.
 *
 * @param name - The field name (snake_case, raw grammar name).
 * @param content - The rule occupying this field position. Omit to
 *   create a placeholder for `resolvePatch` in transform() patches.
 * @returns A FieldRule with the field name and resolved content.
 * @remarks
 * When `content` is omitted, a placeholder FieldRule is returned with
 * `_needsContent: true`, which `resolvePatch` swaps out with the
 * original member when applying transform() patches.
 * @remarks
 * Mirrors the bare `optional()` helper's canonical collapse:
 * `field('x', optional(repeat(...)))` → `field('x', repeat(...))` and
 * `field('x', optional(repeat1(...)))` → `field('x', repeat(...))`.
 * Both are parse-identical to `repeat(x)` — tree-sitter surfaces any
 * empty case as an empty children list. Collapsing both here keeps
 * evaluate output canonical across all the equivalent list encodings
 * grammar authors write.
 * @remarks
 * Propagates the field name to every nested symbol ref. Stops at inner
 * field/alias boundaries — those own their own field name. Does not
 * overwrite a field name already set by an inner wrapper.
 */
export function field(name: string, content?: Input): FieldRule {
	if (content === undefined) {
		return {
			type: 'field',
			name,
			content: { type: 'string', value: '' },
			_needsContent: true
		};
	}
	let resolved = normalize(content);
	resolved = collapseOptionalRepeatInField(resolved);
	walkRefs(resolved, (ref) => {
		if (ref.fieldName === undefined) ref.fieldName = name;
	});
	return { type: 'field', name, content: resolved };
}

/**
 * Collapse `optional(repeat(...))` and `optional(repeat1(...))` to
 * `repeat(...)` inside a field's content.
 *
 * @param resolved - The already-normalized field content rule.
 * @returns The canonicalized rule with the optional wrapper removed when
 *   the inner content is a repeat variant.
 * @remarks
 * Both `optional(repeat(x))` and `optional(repeat1(x))` are
 * parse-identical to `repeat(x)` — tree-sitter surfaces any empty case
 * as an empty children list. Collapsing here keeps evaluate output
 * canonical across all the equivalent list encodings grammar authors
 * write.
 */
function collapseOptionalRepeatInField(resolved: Rule): Rule {
	if (resolved.type !== 'optional') return resolved;
	const inner = resolved.content;
	if (inner.type === 'repeat') {
		return inner;
	}
	if (inner.type === 'repeat1') {
		return {
			type: 'repeat',
			content: inner.content,
			separator: inner.separator,
			trailing: inner.trailing,
			leading: inner.leading
		};
	}
	return resolved;
}

// ---------------------------------------------------------------------------
// Override primitives — transform/insert/replace/role have moved to
// packages/codegen/src/dsl/. Override files import them explicitly
// from '@sittir/codegen/dsl'. They are no longer injected as globals
// here because they are sittir extensions, not tree-sitter baseline.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Token
// ---------------------------------------------------------------------------

interface TokenFn {
	(content: Input): TokenRule;
	immediate: (content: Input) => TokenRule;
}

export const token: TokenFn = Object.assign(
	function token(content: Input): TokenRule {
		return { type: 'token', content: normalize(content), immediate: false };
	},
	{
		immediate(content: Input): TokenRule {
			return { type: 'token', content: normalize(content), immediate: true };
		}
	}
);

// ---------------------------------------------------------------------------
// Precedence — stripped; returns the content Rule
// ---------------------------------------------------------------------------

interface PrecFn {
	(precedence: number, content: Input): Rule;
	left: (precedence: number, content: Input) => Rule;
	right: (precedence: number, content: Input) => Rule;
	dynamic: (precedence: number, content: Input) => Rule;
}

export const prec: PrecFn = Object.assign(
	function prec(precedenceOrContent: number | Input, content?: Input): Rule {
		if (content === undefined) return normalize(precedenceOrContent as Input);
		return normalize(content);
	},
	{
		left(precedenceOrContent: number | Input, content?: Input): Rule {
			if (content == null) return normalize(precedenceOrContent as Input);
			return normalize(content);
		},
		right(precedenceOrContent: number | Input, content?: Input): Rule {
			if (content == null) return normalize(precedenceOrContent as Input);
			return normalize(content);
		},
		dynamic(precedenceOrContent: number | Input, content?: Input): Rule {
			if (content == null) return normalize(precedenceOrContent as Input);
			return normalize(content);
		}
	}
);

// ---------------------------------------------------------------------------
// Alias + blank (needed for grammar.js compatibility)
// ---------------------------------------------------------------------------

export function alias(rule: Input, value: string | Rule): AliasRule {
	const content = normalize(rule);
	if (typeof value === 'string') {
		return { type: 'alias', content, named: false, value };
	}
	if (typeof value === 'object' && 'type' in value && value.type === 'symbol') {
		return {
			type: 'alias',
			content,
			named: true,
			value: (value as SymbolRule).name
		};
	}
	throw new Error(`Invalid alias value: ${value}`);
}

export function blank(): Rule {
	// BLANK is represented as choice() with no members — absorbed by choice()
	return { type: 'choice', members: [] };
}

/**
 * `string(value)` — mirror of tree-sitter's baseline DSL `string()` helper.
 *
 * Tree-sitter's grammar.js API accepts plain JS strings wherever string
 * rules are needed (e.g. `seq('(', $._expr, ')')`) AND also provides an
 * explicit `string(value)` form. Sittir's `normalize()` already handles
 * both: bare strings normalize to `{ type: 'string', value }`.
 *
 * This explicit form is injected as a DSL global so that `renderAs`
 * bodies can use `string('x')` syntax (as specified) without relying on
 * bare string literals, and so that any author rule body that calls
 * `string(...)` explicitly continues to work.
 */
export function string(value: string): StringRule {
	return { type: 'string', value };
}

// ---------------------------------------------------------------------------
// evaluate() — execute grammar.js and produce RawGrammar
// ---------------------------------------------------------------------------

interface GrammarOptions {
	name: string;
	// tree-sitter's DSL passes `($, previous)` to every rule / metadata
	// callback — `previous` is the base grammar's version in
	// extension mode. We type the second arg loosely so extension
	// callbacks that forward it (`previous.concat([...])`) compile.
	rules: Record<string, ($: Record<string, SymbolRuleWithRef>, previous?: unknown) => Input>;
	extras?: ($: Record<string, SymbolRuleWithRef>, previous?: unknown) => Input[];
	externals?: ($: Record<string, SymbolRuleWithRef>, previous?: unknown) => Input[];
	supertypes?: ($: Record<string, SymbolRuleWithRef>, previous?: unknown) => Input[];
	inline?: ($: Record<string, SymbolRuleWithRef>, previous?: unknown) => Input[];
	conflicts?: ($: Record<string, SymbolRuleWithRef>, previous?: unknown) => Input[][];
	word?: ($: Record<string, SymbolRuleWithRef>, previous?: unknown) => SymbolRuleWithRef;
	precedences?: ($: Record<string, SymbolRuleWithRef>, previous?: unknown) => Input[][];
}

/**
 * The `grammar()` function — mirrors tree-sitter's DSL entry point.
 * When called with one arg: fresh grammar.
 * When called with two args: grammar extension (base + overrides).
 */
function grammarFn(optionsOrBase: GrammarOptions | { grammar: any }, options?: GrammarOptions): { grammar: any } {
	let baseRules: Record<string, Rule> = {};
	let baseGrammar: any = null;
	let opts: GrammarOptions;

	if (options === undefined) {
		opts = optionsOrBase as GrammarOptions;
	} else {
		// Extension mode: first arg is a base grammar result
		baseGrammar = (optionsOrBase as { grammar: any }).grammar;
		baseRules = { ...baseGrammar.rules };
		opts = options;
	}

	mergeEnrichOverridesIntoOptions(optionsOrBase, opts);

	const refs: SymbolRef[] = seedRefsFromBaseGrammar(baseGrammar);
	const rules: Record<string, Rule> = { ...baseRules };
	const provenanceByKind = new Map<string, RuleProvenance>();

	// Extract metadata
	const extras: string[] = [];
	const externals: string[] = [];
	const supertypes: string[] = [];
	const inline: string[] = [];
	const conflicts: string[][] = [];
	let word: string | null = null;

	let patternReplacementKinds: ReadonlySet<string> = new Set();
	const { roles: collectedRoles } = withRoleScope(() => {
		patternReplacementKinds = evaluateRulesAndInjectSynthetics(opts, baseRules, refs, rules, provenanceByKind, baseGrammar !== null);
		evaluateMetadataCallbacksInScope(
			opts,
			baseGrammar,
			refs,
			{ extras, externals, supertypes, inline, conflicts },
			(w) => {
				word = w;
			}
		);
	});

	inheritBaseGrammarMetadata(opts, baseGrammar, { extras, externals, supertypes, inline, conflicts }, (w) => {
		word = w;
	});

	const polymorphVariants = drainPolymorphMetadata(opts);
	const refineForms = drainRefineMetadata(opts);
	const groups = drainGroupsMetadata(opts);
	const polymorphsConfig = drainPolymorphsConfigMetadata(opts);
	// renderAs must be drained BEFORE buildRuleCatalog so the synthesized
	// rule bodies appear in the catalog. It also strips any base-grammar
	// body for the same key (keeping the sittir-side def authoritative).
	// The DSL globals (string, etc.) are still injected at this point —
	// evaluate()'s try block is still active.
	const renderAs = drainRenderAsMetadata(opts, rules, refs, provenanceByKind);

	// Rules map mirrors tree-sitter's view: no synthesized top-level
	// entry for alias TARGETS. The source (`_X`) is the canonical
	// sittir-internal kind; the visible target is identity-only.
	//
	// One necessary accommodation: when an alias's source is an
	// INLINE expression (e.g. `alias(choice(...), $.primitive_type)`)
	// rather than a bare symbol, there's no existing `_X` rule for
	// downstream to point at. Synthesize `_${target}` with the inline
	// body so the `_X → X` invariant holds uniformly — every alias
	// target has a named hidden source in the rules map.
	synthesizeInlineAliasSources(rules, provenanceByKind, externals);
	synthesizeFieldEnumRules(rules, provenanceByKind);
	const identified = buildRuleCatalog(rules, provenanceByKind);
	const references = attachReferenceRuleIds(refs, identified.ruleCatalog);

	return {
		grammar: {
			name: opts.name,
			rules: identified.rules,
			extras,
			externals,
			supertypes,
			inline,
			conflicts,
			word,
			references,
			ruleCatalog: identified.ruleCatalog,
			// Per-grammar role bindings collected from inline `role()`
			// calls inside externals/rules. Empty when the grammar
			// declares no roles.
			externalRoles: collectedRoles.size > 0 ? collectedRoles : undefined,
			polymorphVariants: polymorphVariants.length > 0 ? polymorphVariants : undefined,
			refineForms,
			groups,
			polymorphsConfig,
			renderAs,
			patternReplacementKinds: patternReplacementKinds.size > 0 ? patternReplacementKinds : undefined
		} satisfies RawGrammar
	};
}

/**
 * For every `alias(inlineContent, $.target)` whose source isn't a
 * bare symbol reference to an existing rule or external token,
 * synthesize a hidden rule `_${target}` carrying the inline content
 * and rewrite the alias's source to point at it.
 *
 * Before:
 *    alias(choice('u8','u16',...), $.primitive_type)
 *
 * After:
 *    rules[_primitive_type] = choice('u8','u16',...)
 *    alias(symbol(_primitive_type), $.primitive_type)
 *
 * Why: downstream (link's `resolveNamedAliasWithProvenance`) produces
 * `symbol(target, aliasedFrom: source)` ONLY when the alias source is
 * a bare symbol. For inline content it can't stamp `aliasedFrom` and
 * drillAs loses the CST-visible target. By making every alias source
 * a named hidden rule here, we uniformly preserve alias-target
 * metadata through the pipeline.
 *
 * Also: the rules map now has a single named entry per alias target
 * (the `_${target}` source) without adding entries for visible-only
 * kinds — matching tree-sitter's declaration view.
 *
 * External scanner tokens (listed in `externals`) are treated the same
 * as declared rules: they already have parser-assigned symbol IDs and
 * need no synthetic source. `alias($._line_doc_content, $.doc_comment)`
 * must NOT produce `_doc_comment` — the source is an external with its
 * own parser identity; the visible target `doc_comment` is the alias
 * destination, not a hidden kind.
 */
function synthesizeInlineAliasSources(
	rules: Record<string, Rule>,
	provenanceByKind: Map<string, RuleProvenance>,
	externals: readonly string[]
): void {
	const externalSet = new Set(externals);
	const ruleEntries = Object.entries(rules);
	for (const [name, rule] of ruleEntries) {
		rules[name] = rewriteInlineAliases(rule, rules, provenanceByKind, externalSet);
	}
}

function rewriteInlineAliases(
	rule: Rule,
	rules: Record<string, Rule>,
	provenanceByKind: Map<string, RuleProvenance>,
	externals: ReadonlySet<string>
): Rule {
	const recurse = (r: Rule): Rule => rewriteInlineAliases(r, rules, provenanceByKind, externals);
	switch (rule.type) {
		case 'alias':
			if (rule.named && rule.value) {
				const inner = rule.content;
				// Treat both declared rules AND external scanner tokens as
				// "existing" sources — externals already carry parser-assigned
				// symbol IDs and must not trigger `_${target}` synthesis.
				// Without this guard, `alias($._line_doc_content, $.doc_comment)`
				// would synthesize the fictitious hidden kind `_doc_comment`
				// because `_line_doc_content` is external (not in `rules`).
				const isBareSymbolToKnownSource =
					inner.type === 'symbol' && (rules[inner.name] !== undefined || externals.has(inner.name));
				// Also skip when the alias TARGET is already a declared
				// kind: `alias(inlineBody, $.existingKind)` just relabels
				// the inline body as that existing kind. Tree-sitter
				// surfaces instances with `$type: existingKind`, and
				// downstream uses the existing rule's factory/shape.
				// Synthesizing `_existingKind` would collide with /
				// over-ride the existing kind's meaning.
				const targetAlreadyExists = rules[rule.value] !== undefined;
				if (!targetAlreadyExists && !isBareSymbolToKnownSource) {
					const syntheticHiddenName = `_${rule.value}`;
					if (!rules[syntheticHiddenName]) {
						rules[syntheticHiddenName] = recurse(rule.content);
						provenanceByKind.set(syntheticHiddenName, 'evaluate-synthesized');
					}
					return {
						...rule,
						content: { type: 'symbol', name: syntheticHiddenName } as SymbolRule
					};
				}
			}
			return { ...rule, content: recurse(rule.content) };
		case 'seq':
		case 'choice':
			return { ...rule, members: rule.members.map(recurse) } as Rule;
		case 'optional':
		case 'repeat':
		case 'repeat1':
		case 'field':
		case 'token':
		case 'variant':
		case 'clause':
		case 'group':
			return {
				...rule,
				content: recurse((rule as { content: Rule }).content)
			} as Rule;
		default:
			return rule;
	}
}

// ---------------------------------------------------------------------------
// synthesizeFieldEnumRules — promote inline field-enums to named hidden rules
// ---------------------------------------------------------------------------

/**
 * Post-evaluation pass: detect `field(name, enum([...]))` patterns inside
 * every rule and synthesize a named hidden rule for each one. Replace the
 * field's inline enum content with a `SymbolRule` referencing the new rule.
 *
 * @remarks
 * A field whose content is a choice-of-literals (already collapsed to
 * `EnumRule` by `choice()`) represents a closed, compile-time-known set of
 * operator/punctuation tokens. Promoting these to named hidden rules enables
 * downstream emitters to generate a compact Rust enum with KindId-backed
 * discriminants rather than a heap-allocated `text: String` field.
 *
 * Also follows single-step symbol indirections: when a field's content is a
 * bare `SymbolRule` referencing a rule that resolves to a `StringRule` or
 * `EnumRule` (e.g. `field('mutability', $.mutable_specifier)` where
 * `mutable_specifier` = `'mut'`), the target rule's literals are collected
 * and a new enum kind is synthesized in the same way.
 *
 * Synthesized rules carry provenance `'evaluate-synthesized'` so emitters
 * recognize them as intentional codegen artifacts with no parser symbol.
 *
 * Deduplication: fields with identical member sets (across different parent
 * kinds) share a single synthesized enum kind. The canonical name is chosen
 * in priority order:
 *   1. An existing grammar rule with the same literal set → `_<ruleName>`.
 *   2. The field name, when shared across ≥2 parent kinds → `_<fieldName>`.
 *   3. Fall back: `_<firstParentKind>_<fieldName>` for the first occurrence.
 *
 * @param rules - Mutable rules map; synthesized rules are added in place.
 * @param provenanceByKind - Provenance map; entries are added for each new kind.
 */
function synthesizeFieldEnumRules(rules: Record<string, Rule>, provenanceByKind: Map<string, RuleProvenance>): void {
	// First pass: collect all (parentKind, fieldName, members) triples so we
	// can count how often each field name appears with the same member set and
	// build the canonical-name dedup map before any rewriting happens.
	const fieldOccurrences = collectFieldEnumOccurrences(rules);
	const conflictingSites = collectConflictingFieldEnumSites(fieldOccurrences);
	const memberKeyToCanonicalName = buildCanonicalEnumNames(fieldOccurrences, rules);

	// Second pass: rewrite rules using the pre-computed canonical names.
	const rewrites = new Map<string, Rule>();
	const newRules = new Map<string, Rule>();

	for (const [parentKind, rule] of Object.entries(rules)) {
		const rewritten = rewriteFieldEnums(
			rule,
			parentKind,
			rules,
			newRules,
			memberKeyToCanonicalName,
			conflictingSites
		);
		if (rewritten !== rule) rewrites.set(parentKind, rewritten);
	}

	// Apply rule rewrites.
	for (const [kind, newRule] of rewrites) {
		rules[kind] = newRule;
	}

	// Register synthesized enum rules.
	for (const [kindName, enumRule] of newRules) {
		if (!rules[kindName]) {
			rules[kindName] = enumRule;
			provenanceByKind.set(kindName, 'evaluate-synthesized');
		}
	}

	// Cleanup pass: remove pre-existing enum rules that are superseded by a
	// canonical name for the same member set. This handles the multi-pass
	// evaluation pattern where the base grammar's synthesized enum kinds
	// (e.g. `_update_expression_operator`) remain in the rules map when the
	// override grammar synthesizes a better canonical name (`_operator`) for
	// the same member set. Only remove rules whose provenance is
	// 'evaluate-synthesized' (i.e., created by a previous synthesis pass)
	// AND whose member set now has a different canonical name.
	purgeSupersededEnumRules(rules, provenanceByKind, memberKeyToCanonicalName);
}

/**
 * Remove pre-existing hidden enum rules that are superseded by the current
 * pass's canonical name for the same member set.
 *
 * For example: the base grammar synthesizes `_update_expression_operator` for
 * `["++","--"]`. The override pass assigns `_operator` as the canonical name
 * for the same member set (the wire-deposited `_operator` is already present).
 * The old `_update_expression_operator` is no longer needed and should be
 * removed so it doesn't pollute downstream emitters.
 *
 * Criteria for removal:
 * - Hidden rule (name starts with `_`).
 * - Is an EnumRule.
 * - Its sorted member set maps to a DIFFERENT canonical name in
 *   `memberKeyToCanonicalName` (i.e., this name is not the canonical one).
 *
 * We do NOT require the rule to be in the current pass's `provenanceByKind`
 * because it may have been synthesized in an earlier pass (base grammar) and
 * carried forward through the rules-merge path.
 *
 * @param rules - Mutable rules map; superseded entries are deleted in place.
 * @param provenanceByKind - Provenance map; entries for deleted kinds are removed.
 * @param memberKeyToCanonicalName - The current pass's canonical name map.
 */
function purgeSupersededEnumRules(
	rules: Record<string, Rule>,
	provenanceByKind: Map<string, RuleProvenance>,
	memberKeyToCanonicalName: Map<string, string>
): void {
	for (const [name, rule] of Object.entries(rules)) {
		// Only consider hidden enum rules — visible grammar rules and non-enum
		// rules must never be removed here.
		if (!name.startsWith('_')) continue;
		if (rule.type !== 'enum') continue;

		const memberKey = [...(rule.members as StringRule[])]
			.map((m) => m.value)
			.sort()
			.join(',');
		const canonicalName = memberKeyToCanonicalName.get(memberKey);
		if (canonicalName !== undefined && canonicalName !== name) {
			// This rule is superseded — remove it.
			delete rules[name];
			provenanceByKind.delete(name);
		}
	}
}

/** A field-enum candidate discovered during the first collection pass. */
interface FieldEnumOccurrence {
	/** The grammar kind that owns the field. */
	readonly parentKind: string;
	/** The field name (e.g. `'mutable_specifier'`). */
	readonly fieldName: string;
	/** The sorted, comma-joined literal values — used as the dedup key. */
	readonly memberKey: string;
	/** The actual member list for constructing the EnumRule. */
	readonly members: StringRule[];
}

/**
 * Scan all rules for `field(name, enumContent)` patterns and return every
 * qualifying (parentKind × fieldName × memberSet) triple.
 *
 * @param rules - The full grammar rules map after evaluate-time synthesis.
 * @returns Array of occurrence records, one per qualifying field position.
 */
function collectFieldEnumOccurrences(rules: Record<string, Rule>): FieldEnumOccurrence[] {
	const occurrences: FieldEnumOccurrence[] = [];
	for (const [parentKind, rule] of Object.entries(rules)) {
		walkFieldEnums(rule, parentKind, rules, occurrences);
	}
	return occurrences;
}

/**
 * Recursively walk a rule tree collecting qualifying field-enum positions.
 *
 * @param rule - Current rule node.
 * @param parentKind - Grammar kind that owns this subtree.
 * @param rules - Full rules map for symbol resolution.
 * @param out - Accumulator for discovered occurrences.
 */
function walkFieldEnums(rule: Rule, parentKind: string, rules: Record<string, Rule>, out: FieldEnumOccurrence[]): void {
	switch (rule.type) {
		case 'field': {
			// Peel one level of repeat/repeat1 wrapper so that
			// `field(name, repeat(choice('a','b')))` is treated the same as
			// `field(name, choice('a','b'))` for occurrence collection purposes.
			// The repeat wrapper is preserved in the rewrite pass below.
			const enumContent = peelRepeatWrapper(rule.content);
			const members = resolveToEnumMembers(enumContent, rules);
			if (members !== null && members.length > 0) {
				const memberKey = buildEnumMemberKey(members);
				out.push({ parentKind, fieldName: rule.name, memberKey, members });
			}
			// Always recurse into content — a field can nest other fields.
			walkFieldEnums(rule.content, parentKind, rules, out);
			return;
		}
		case 'seq':
		case 'choice':
			for (const m of rule.members) walkFieldEnums(m, parentKind, rules, out);
			return;
		case 'optional':
		case 'repeat':
		case 'repeat1':
		case 'variant':
		case 'clause':
		case 'group':
		case 'token':
			walkFieldEnums((rule as { content: Rule }).content, parentKind, rules, out);
			return;
		default:
			return;
	}
}

/**
 * Build a `Map<memberKey, canonicalKindName>` for all discovered field-enum
 * occurrences using the priority-order naming strategy:
 *
 *   1. The field name matches an existing grammar rule with the same members →
 *      `_<fieldName>`.
 *   2. Field name shared across ≥2 distinct parent kinds → `_<fieldName>`.
 *   3. First-occurrence fallback → `_<firstParentKind>_<fieldName>`.
 *
 * When two different member sets would produce the same candidate name, the
 * lower-priority group falls back to `_<firstParentKind>_<fieldName>` to
 * avoid silent name collisions.
 *
 * @param occurrences - All qualifying field-enum occurrences from the first pass.
 * @param rules - Full grammar rules map for checking existing rule names.
 * @returns Map from `memberKey` to the chosen canonical hidden kind name.
 */
function buildCanonicalEnumNames(occurrences: FieldEnumOccurrence[], rules: Record<string, Rule>): Map<string, string> {
	// Group occurrences by memberKey.
	const byKey = new Map<string, FieldEnumOccurrence[]>();
	for (const occ of occurrences) {
		let group = byKey.get(occ.memberKey);
		if (!group) {
			group = [];
			byKey.set(occ.memberKey, group);
		}
		group.push(occ);
	}

	const result = new Map<string, string>();
	const groups = Array.from(byKey.entries()).map(([memberKey, group], index) => {
		const first = group[0]!;
		const candidate = deriveCandidateName(group, first, rules);
		return { memberKey, group, first, index, ...candidate };
	});

	groups.sort((a, b) => a.priority - b.priority || a.index - b.index);

	const claimedNames = new Set<string>();
	for (const group of groups) {
		const chosenName = claimUniqueEnumName(
			group.name,
			group.memberKey,
			claimedNames,
			rules
		);
		claimedNames.add(chosenName);
		result.set(group.memberKey, chosenName);
	}

	return result;
}

/**
 * Compute the fallback canonical name for a field-enum occurrence when no
 * higher-priority name can be assigned: `_<firstParentKind>_<fieldName>`.
 */
function fallbackName(occ: FieldEnumOccurrence): string {
	return `_${occ.parentKind}_${occ.fieldName}`;
}

function fieldEnumSiteKey(parentKind: string, fieldName: string): string {
	return `${parentKind}\u0000${fieldName}`;
}

/**
 * Identify field sites that carry multiple distinct literal sets inside the
 * same parent rule.
 *
 * Those sites must stay inline through evaluate so simplify can merge the
 * enclosing choice into a single `field(name, choice(...))` surface before
 * any later enum-like storage classification runs.
 */
function collectConflictingFieldEnumSites(
	occurrences: readonly FieldEnumOccurrence[]
): ReadonlySet<string> {
	const memberKeysBySite = new Map<string, Set<string>>();
	for (const occ of occurrences) {
		const siteKey = fieldEnumSiteKey(occ.parentKind, occ.fieldName);
		let keys = memberKeysBySite.get(siteKey);
		if (!keys) {
			keys = new Set<string>();
			memberKeysBySite.set(siteKey, keys);
		}
		keys.add(occ.memberKey);
	}
	const conflicting = new Set<string>();
	for (const [siteKey, keys] of memberKeysBySite) {
		if (keys.size > 1) conflicting.add(siteKey);
	}
	return conflicting;
}

/**
 * Claim a unique hidden enum kind name for a member set.
 *
 * Prefer the requested base name when it is still free. When that name has
 * already been claimed for a different member set, append a stable slug derived
 * from the literal set so different `parentKind + fieldName` collisions do not
 * all collapse onto the first synthesized rule.
 */
function claimUniqueEnumName(
	baseName: string,
	memberKey: string,
	claimedNames: ReadonlySet<string>,
	rules: Readonly<Record<string, Rule>>
): string {
	if (!claimedNames.has(baseName) && canReuseExistingEnumName(baseName, memberKey, rules)) {
		return baseName;
	}
	const slug = enumMemberKeySlug(memberKey);
	let candidate = `${baseName}__${slug}`;
	let attempt = 2;
	while (
		claimedNames.has(candidate) ||
		(!canReuseExistingEnumName(candidate, memberKey, rules) &&
			Object.prototype.hasOwnProperty.call(rules, candidate))
	) {
		candidate = `${baseName}__${slug}_${attempt}`;
		attempt++;
	}
	return candidate;
}

/**
 * Return `true` when an existing rule name can safely be reused for this member
 * set: either the name is currently unused, or the existing rule resolves to
 * the exact same literal members.
 */
function canReuseExistingEnumName(
	name: string,
	memberKey: string,
	rules: Readonly<Record<string, Rule>>
): boolean {
	const existing = rules[name];
	if (existing === undefined) return true;
	const members = resolveToEnumMembersOneLevelDeep(existing);
	if (members === null) return false;
	return buildEnumMemberKey(members) === memberKey;
}

/**
 * Build the stable key used for enum-member deduplication.
 */
function buildEnumMemberKey(members: readonly StringRule[]): string {
	return [...members]
		.map((m) => m.value)
		.sort()
		.join(',');
}

/**
 * Encode a member key into an identifier-safe, deterministic suffix.
 *
 * Each literal contributes lowercase alphanumerics directly; every other code
 * point is encoded as `xNN`. Commas separating members become `__`.
 */
function enumMemberKeySlug(memberKey: string): string {
	return memberKey
		.split(',')
		.map((member) => {
			const encoded = Array.from(member)
				.map((ch) =>
					/[A-Za-z0-9]/.test(ch) ? ch.toLowerCase() : `x${ch.codePointAt(0)!.toString(16)}`
				)
				.join('');
			return encoded.length > 0 ? encoded : 'empty';
		})
		.join('__');
}

/**
 * Derive a candidate canonical hidden kind name (with priority) for a group
 * of occurrences that share the same member set.
 *
 * Priority values (lower number = higher priority):
 *   1. Field name matches an existing grammar rule with the same literal set →
 *      `_<fieldName>`. Handles `mutable_specifier = 'mut'` cases.
 *   2. All occurrences share the same field name AND ≥2 distinct parents →
 *      `_<fieldName>`.
 *   3. Fallback → `_<firstParentKind>_<fieldName>`.
 *
 * @param group - All occurrences sharing this member set.
 * @param first - The first occurrence (used for naming).
 * @param rules - Grammar rules map for existing-rule lookup.
 * @returns The candidate name and its priority level (1 = highest).
 */
function deriveCandidateName(
	group: FieldEnumOccurrence[],
	first: FieldEnumOccurrence,
	rules: Record<string, Rule>
): { name: string; priority: number } {
	const allSameFieldName = group.every((o) => o.fieldName === first.fieldName);

	if (allSameFieldName) {
		// Priority 1: field name matches an existing grammar rule with same members.
		const existingMatch = fieldNameMatchesGrammarRule(first.fieldName, first.members, rules);
		if (existingMatch) {
			return { name: `_${first.fieldName}`, priority: 1 };
		}

		// Priority 2: shared field name across ≥2 distinct parent kinds.
		const distinctParents = new Set(group.map((o) => o.parentKind)).size;
		if (distinctParents >= 2) {
			return { name: `_${first.fieldName}`, priority: 2 };
		}
	}

	// Priority 3: fallback — first parent + field name.
	return { name: fallbackName(first), priority: 3 };
}

/**
 * Check whether a grammar rule named `fieldName` exists and resolves to the
 * same literal set as `members`. Used by `deriveCanonicalName` for priority-1
 * matching: if `field('mutable_specifier', ...)` and `rules['mutable_specifier']
 * = 'mut'`, the field name is itself the canonical name.
 *
 * @param fieldName - The field name to look up in `rules`.
 * @param members - The expected literal members for comparison.
 * @param rules - Full grammar rules map.
 * @returns `true` when `rules[fieldName]` resolves to the same member set.
 */
function fieldNameMatchesGrammarRule(fieldName: string, members: StringRule[], rules: Record<string, Rule>): boolean {
	const rule = rules[fieldName];
	if (rule === undefined) return false;

	const resolved = resolveToEnumMembersOneLevelDeep(rule);
	if (resolved === null) return false;

	const targetKey = [...members]
		.map((m) => m.value)
		.sort()
		.join(',');
	const ruleKey = buildEnumMemberKey(resolved);
	return ruleKey === targetKey;
}

/**
 * Walk a rule tree and rewrite every `field(name, inlineEnum)` to
 * `field(name, symbol(<canonicalEnumKindName>))`, collecting the synthesized
 * enum rules into `newRules`.
 *
 * @param rule - The rule tree to walk and potentially rewrite.
 * @param parentKind - The grammar kind that owns this rule (for naming).
 * @param rules - The full rules map for symbol-reference resolution.
 * @param newRules - Accumulator for synthesized literal-set rule entries.
 * @param memberKeyToCanonicalName - Pre-computed dedup map from the first pass.
 * @returns The rewritten rule (may be structurally identical if no change was needed).
 */
function rewriteFieldEnums(
	rule: Rule,
	parentKind: string,
	rules: Record<string, Rule>,
	newRules: Map<string, Rule>,
	memberKeyToCanonicalName: Map<string, string>,
	conflictingSites: ReadonlySet<string>
): Rule {
	const recurse = (r: Rule): Rule =>
		rewriteFieldEnums(
			r,
			parentKind,
			rules,
			newRules,
			memberKeyToCanonicalName,
			conflictingSites
		);

	switch (rule.type) {
		case 'field': {
			const synthesized =
				conflictingSites.has(fieldEnumSiteKey(parentKind, rule.name))
					? null
					: tryExtractFieldEnum(rule.content, rules, memberKeyToCanonicalName);
			if (synthesized !== null) {
				const { enumKindName, synthesizedRule, replacementContent } = synthesized;
				if (!newRules.has(enumKindName)) {
					newRules.set(enumKindName, synthesizedRule);
				}
				// Replace the field's inline content with the replacement content rule.
				// For bare enum: symbol(enumKindName).
				// For repeat/repeat1(enum): repeat/repeat1(symbol(enumKindName)).
				return {
					type: 'field',
					name: rule.name,
					content: replacementContent,
					source: rule.source,
					nameFrom: rule.nameFrom,
					blockBearer: rule.blockBearer
				} satisfies FieldRule;
			}
			// Content isn't an enum candidate — recurse to find nested fields.
			const newContent = recurse(rule.content);
			if (newContent === rule.content) return rule;
			return { ...rule, content: newContent } as FieldRule;
		}
		case 'seq':
		case 'choice': {
			const newMembers = rule.members.map(recurse);
			if (newMembers.every((m, i) => m === rule.members[i])) return rule;
			return { ...rule, members: newMembers } as Rule;
		}
		case 'optional':
		case 'repeat':
		case 'repeat1':
		case 'variant':
		case 'clause':
		case 'group':
		case 'token': {
			const newContent = recurse((rule as { content: Rule }).content);
			if (newContent === (rule as { content: Rule }).content) return rule;
			return { ...rule, content: newContent } as Rule;
		}
		default:
			return rule;
	}
}

/**
 * Try to extract an enum definition from a field's content.
 *
 * Returns `{ enumKindName, synthesizedRule, replacementContent }` when the content
 * resolves to a closed set of string literals, or `null` when it does not
 * qualify.
 *
 * Qualifying shapes:
 *
 * 1. `EnumRule` (inline `choice('+', '-', ...)` already collapsed) — use
 *    its members directly. `replacementContent` is `symbol(enumKindName)`.
 *
 * 2. `StringRule` (single literal inline in the field position) — wrap in
 *    a 1-member enum. `replacementContent` is `symbol(enumKindName)`.
 *
 * 3. `SymbolRule` whose referent in `rules` resolves to a `StringRule` or
 *    `EnumRule` — use that rule's literals. Follows exactly one level of
 *    indirection (symbol → literal | enum).
 *    `replacementContent` is `symbol(enumKindName)`.
 *
 * 4. `repeat(X)` or `repeat1(X)` where `X` resolves to one of the above —
 *    the repeat wrapper is preserved in `replacementContent`:
 *    `repeat(symbol(enumKindName))` or `repeat1(symbol(enumKindName))`.
 *
 * The canonical kind name is looked up from `memberKeyToCanonicalName` rather
 * than derived from the parent/field context — ensuring all identical member
 * sets share one synthesized rule regardless of where they appear.
 *
 * @param content - The field's current content rule.
 * @param rules - Full rules map for symbol resolution.
 * @param memberKeyToCanonicalName - Pre-computed dedup map (first pass).
 * @returns Synthesized kind name, normalized literal-set rule, and the replacement content rule,
 *   or `null` when the content does not qualify.
 */
function tryExtractFieldEnum(
	content: Rule,
	rules: Record<string, Rule>,
	memberKeyToCanonicalName: Map<string, string>
): { enumKindName: string; synthesizedRule: Rule; replacementContent: Rule } | null {
	// Peel one level of repeat/repeat1 wrapper so `field(name, repeat(enum))`
	// is handled alongside `field(name, enum)`. The wrapper type is remembered
	// so the rewrite can restore it around the synthesized symbol reference.
	const repeatWrapperType = content.type === 'repeat' || content.type === 'repeat1' ? content.type : null;
	const innerContent = repeatWrapperType !== null ? (content as RepeatRule | Repeat1Rule).content : content;

	const members = resolveToEnumMembers(innerContent, rules);
	if (members === null || members.length === 0) return null;

	const memberKey = buildEnumMemberKey(members);
	const enumKindName = memberKeyToCanonicalName.get(memberKey);
	if (enumKindName === undefined) return null;

	const synthesizedRule = normalizeEnumMembers(members, 'grammar');

	const symRule: SymbolRule = { type: 'symbol', name: enumKindName, hidden: true };
	const replacementContent: Rule =
		repeatWrapperType === null
			? symRule
			: repeatWrapperType === 'repeat'
				? { ...(content as RepeatRule), content: symRule }
				: { ...(content as Repeat1Rule), content: symRule };

	return { enumKindName, synthesizedRule, replacementContent };
}

/**
 * Peel one level of `repeat` or `repeat1` wrapper from a rule, returning
 * the inner content. Returns the rule unchanged when it is not a repeat
 * wrapper. Used by occurrence-collection and field-extraction passes to
 * treat `field(name, repeat(enum))` the same as `field(name, enum)`.
 *
 * @param rule - The rule to inspect.
 * @returns The inner content when `rule` is a `repeat` or `repeat1`,
 *   otherwise `rule` itself.
 */
function peelRepeatWrapper(rule: Rule): Rule {
	if (rule.type === 'repeat' || rule.type === 'repeat1') return rule.content;
	return rule;
}

/**
 * Resolve a rule to an ordered list of string members if it represents a
 * closed set of literals. Returns `null` when the rule cannot be reduced to
 * an all-literal set.
 *
 * @param rule - The rule to inspect.
 * @param rules - Full rules map for one-level symbol indirection.
 * @returns An array of `StringRule` members, or `null`.
 * @remarks
 * Only one level of symbol indirection is followed. Chains like
 * `symbol → symbol → enum` are intentionally NOT followed — deeper
 * resolution belongs in Link, and multi-level chains are uncommon for
 * operator fields.
 */
function resolveToEnumMembers(rule: Rule, rules: Record<string, Rule>): StringRule[] | null {
	switch (rule.type) {
		case 'enum':
			// Already a collapsed choice-of-strings.
			return rule.members as StringRule[];
		case 'string':
			// Single inline literal — wrap as a 1-member enum.
			return [rule];
		case 'symbol': {
			// Follow one level of symbol indirection.
			const target = rules[rule.name];
			if (target === undefined) return null;
			return resolveToEnumMembersOneLevelDeep(target);
		}
		default:
			return null;
	}
}

/**
 * Resolve a target rule to enum members without further symbol indirection.
 *
 * @param target - The resolved rule (one hop from a symbol reference).
 * @returns An array of `StringRule` members, or `null` when the target is
 *   not a literal or all-literal choice/enum.
 * @remarks
 * Kept separate from {@link resolveToEnumMembers} to make the "one-level
 * indirection" constraint explicit and prevent accidental chain following.
 * A `ChoiceRule` reaching here is the raw evaluate-time form — all-string
 * choices should already have been collapsed to `EnumRule` by `choice()`,
 * but handle the raw form defensively.
 */
function resolveToEnumMembersOneLevelDeep(target: Rule): StringRule[] | null {
	switch (target.type) {
		case 'string':
			return [target];
		case 'enum':
			return target.members as StringRule[];
		case 'choice': {
			// Defensive: all-string choice not yet collapsed (should not occur
			// in normal evaluate output, but handle gracefully).
			if (target.members.length === 0) return null;
			const allStrings = target.members.every((m): m is StringRule => m.type === 'string');
			return allStrings ? target.members : null;
		}
		default:
			return null;
	}
}

/**
 * Read the polymorph-variant metadata produced by the DSL during rule
 * evaluation.
 *
 * @param opts - The options object passed to `grammar()`. When wrapped
 *   by `wire()`, opts carries a non-enumerable `__wireContext__`
 *   property whose `polymorphVariants` list is the canonical source.
 * @returns Flat `PolymorphVariant[]` for `RawGrammar.polymorphVariants`.
 * @remarks
 * All grammars now use wire() — the authoritative list is always the
 * wire context's `polymorphVariants` array.
 */
function drainPolymorphMetadata(opts: GrammarOptions): PolymorphVariant[] {
	const wireCtx = (opts as unknown as { __wireContext__?: WireContext }).__wireContext__;
	return wireCtx ? [...wireCtx.polymorphVariants] : [];
}

/**
 * Read the refine() form metadata produced by the DSL during rule
 * evaluation. Returns `undefined` when no refine() calls fired (keeps
 * the `RawGrammar.refineForms` field absent rather than an empty map
 * for downstream consumers that check presence).
 */
function drainRefineMetadata(opts: GrammarOptions): Map<string, RefineForm[]> | undefined {
	const wireCtx = (opts as unknown as { __wireContext__?: WireContext }).__wireContext__;
	if (!wireCtx || wireCtx.refineForms.size === 0) return undefined;
	return new Map(wireCtx.refineForms);
}

/**
 * Read the groups config from the wire context. Returns `undefined` when
 * no `groups:` block was supplied (keeps `RawGrammar.groups` absent for
 * downstream consumers that check presence).
 */
function drainGroupsMetadata(opts: GrammarOptions): Record<string, Record<string, string> | undefined> | undefined {
	const wireCtx = (opts as unknown as { __wireContext__?: WireContext }).__wireContext__;
	if (!wireCtx || !wireCtx.groups) return undefined;
	const raw = wireCtx.groups as Record<string, unknown>;
	// Filter out body-pattern entries (function values) — those are
	// consumed by applyPatternReplacement and produce alias() rewrites,
	// not lift-based synthesis. Only path-map entries reach link's
	// applyGroupOverrides.
	const g: Record<string, Record<string, string> | undefined> = {};
	for (const [k, v] of Object.entries(raw)) {
		if (v === undefined || typeof v === 'function') continue;
		g[k] = v as Record<string, string>;
	}
	if (Object.keys(g).length === 0) return undefined;
	return g;
}

/**
 * Read the raw polymorphs path→variant-name config from the wire context.
 * Returns `undefined` when no `polymorphs:` block was supplied.
 */
function drainPolymorphsConfigMetadata(opts: GrammarOptions): Record<string, Record<string, string> | undefined> | undefined {
	const wireCtx = (opts as unknown as { __wireContext__?: WireContext }).__wireContext__;
	if (!wireCtx || !wireCtx.polymorphsConfig) return undefined;
	const p = wireCtx.polymorphsConfig as Record<string, Record<string, string> | undefined>;
	if (Object.keys(p).length === 0) return undefined;
	return { ...p };
}

/**
 * Evaluate the `renderAs:` fn from the wire context and inject the
 * resulting rule bodies into the rules map as 'evaluate-synthesized' entries.
 *
 * @remarks
 * Called AFTER `evaluateRulesAndInjectSynthetics` so the DSL globals are
 * still injected and a real `$` proxy is available. The fn is evaluated
 * with a fresh proxy so any `$.name` refs inside the fn body resolve
 * correctly (current support: `string(...)` literals and `blank()` —
 * neither needs the proxy, but we keep the proxy for forward
 * compatibility).
 *
 * The keys returned by the fn are ALSO removed from `rules` (stripping the
 * tree-sitter-side body when the base grammar had one). This is safe: the
 * external scanner produces these symbols; the grammar rule body is
 * redundant for tree-sitter and harmful for sittir (sittir would pick up
 * the base IMMEDIATE_TOKEN body and use it instead of the sittir-side
 * render body).
 *
 * @returns A Record<string, Rule> for `RawGrammar.renderAs`, or
 * `undefined` when no `renderAs:` was declared.
 */
function drainRenderAsMetadata(
	opts: GrammarOptions,
	rules: Record<string, Rule>,
	refs: SymbolRef[],
	provenanceByKind: Map<string, RuleProvenance>
): Record<string, Rule> | undefined {
	const wireCtx = (opts as unknown as { __wireContext__?: WireContext }).__wireContext__;
	if (!wireCtx || !wireCtx.renderAs) return undefined;

	const $ = createProxy('_renderAs_', refs);
	const rawEntries = wireCtx.renderAs($ as unknown as Record<string, unknown>);
	if (!rawEntries || Object.keys(rawEntries).length === 0) return undefined;

	const result: Record<string, Rule> = {};
	for (const [name, rawBody] of Object.entries(rawEntries)) {
		const rule = normalize(rawBody as Input);
		result[name] = rule;
		// Inject into the rules map as a sittir-side synthesized rule so
		// downstream pipeline phases (link, template-walker, etc.) treat
		// it like any regular rule.
		rules[name] = rule;
		provenanceByKind.set(name, 'evaluate-synthesized');
		// Strip any pre-existing tree-sitter-side body for this symbol.
		// The assignment above already overwrites it; this comment documents
		// the intentional overwrite: renderAs wins over base-grammar body.
	}
	return result;
}

/**
 * Merge enrich-generated override callbacks from the base grammar's
 * `__enrichOverrides__` side-channel into `opts.rules`.
 *
 * @param optionsOrBase - The first argument passed to `grammarFn`, which may
 *   carry the `__enrichOverrides__` property when the base was produced by
 *   `enrich()` in `dsl/enrich.ts`.
 * @param opts - The resolved `GrammarOptions` for the current grammar. User
 *   overrides already in `opts.rules` win on name collisions.
 * @remarks
 * Mirrors what `wrappedGrammar` does under tree-sitter CLI so both
 * runtimes process enrich identically.
 * @remarks
 * Known limitation: when a user override exists for a rule, enrich is
 * skipped entirely for that rule. The optional-keyword-prefix and
 * bare-keyword-prefix passes therefore don't auto-wrap tokens the user
 * would otherwise need to add via `field()` overrides (see rust's
 * `impl_item`/`async_block` unsafe/move overrides for the duplicated
 * pattern). Straight composition (enrich first, then user) was tried and
 * regressed several python rules — enrich's bare-keyword pass interferes
 * with user field/variant paths. Proper fix needs path-aware composition;
 * deferred.
 */
function mergeEnrichOverridesIntoOptions(optionsOrBase: GrammarOptions | { grammar: any }, opts: GrammarOptions): void {
	const enrichOverrides = (
		optionsOrBase as {
			__enrichOverrides__?: Record<string, (...a: any[]) => any>;
		}
	).__enrichOverrides__;
	if (enrichOverrides && opts) {
		if (!opts.rules) opts.rules = {} as Record<string, (...a: any[]) => any>;
		for (const [name, fn] of Object.entries(enrichOverrides)) {
			if (!(name in opts.rules)) opts.rules[name] = fn;
		}
	}
}

/**
 * Seed the initial refs array from the base grammar's stored references.
 *
 * @param baseGrammar - The evaluated base grammar object, or `null` for a
 *   fresh grammar with no base.
 * @returns A new mutable array seeded with the base grammar's references, or
 *   an empty array when there is no base.
 * @remarks
 * Seeding with the base references ensures the diagnostic derivations in
 * Link can see the full reference graph, not just the handful of refs
 * introduced by override callbacks. Refs from rules the override replaces
 * are filtered by downstream passes.
 */
function seedRefsFromBaseGrammar(baseGrammar: any): SymbolRef[] {
	return baseGrammar?.references ? [...baseGrammar.references] : [];
}

/**
 * Evaluate all rule functions and inject wire-produced synthetic rules into
 * the shared rules map in a single step.
 *
 * @remarks
 * `wire()` populates its per-invocation context with synthetic-rule bodies
 * as each rule fn runs (variant/alias placeholder resolution deposits content
 * into `wireCtx.deposits`). Injecting immediately after rule evaluation
 * ensures synthetic rules are present before metadata callbacks run — those
 * callbacks may reference hidden rules by symbol in conflict or inline lists.
 *
 * @param opts - Grammar options containing the rule callbacks and optional
 *   `__wireContext__` carrying synthetic rule deposits.
 * @param baseRules - The base grammar's already-evaluated rules, forwarded as
 *   `previous` to each override callback.
 * @param refs - Mutable symbol-reference accumulator shared across rule evaluations.
 * @param rules - Mutable output map where evaluated and synthetic rules are stored.
 */
function evaluateRulesAndInjectSynthetics(
	opts: GrammarOptions,
	baseRules: Record<string, Rule>,
	refs: SymbolRef[],
	rules: Record<string, Rule>,
	provenanceByKind: Map<string, RuleProvenance>,
	isExtension: boolean
): ReadonlySet<string> {
	evaluateRuleFunctions(opts, baseRules, refs, rules, provenanceByKind, isExtension);
	const wireCtx = (opts as unknown as { __wireContext__?: WireContext }).__wireContext__;
	if (wireCtx) {
		injectSyntheticRules(wireCtx.deposits, rules, provenanceByKind);
		const patternKinds = applyPatternReplacement(wireCtx.authoredRuleNames, baseRules, rules, provenanceByKind, wireCtx);
		prunePlaceholderOrphans(wireCtx, rules);
		return patternKinds;
	}
	return new Set();
}

/**
 * Remove `_kw_*` / `_<parent>_<suffix>` placeholder rules that were
 * pre-registered by wire() at setup time but never actually
 * deposited-into at rule-evaluation time.
 *
 * @remarks
 * `injectTransformHiddenRulePlaceholders` blindly registers a deferred
 * rule fn for every `field()` / `alias()` / `variant()` placeholder it
 * sees, even though only some placeholders will actually synthesize at
 * resolve time (`field('x')` with non-string content, e.g. the rust
 * `self_parameter.lifetime_name` field wrapping `optional($.lifetime)`,
 * never feeds `maybeKeywordSymbol`). The pre-registration is required
 * under tree-sitter's native `grammar()` because tree-sitter walks
 * rules in dependency order and errors on any unknown SYMBOL the
 * parent rule references — so the safe move at wire time is to register
 * every potentially-used name. But when the placeholder never actually
 * deposits, the registered deferred fn returns `blank()` and the
 * resulting empty rule lingers in the grammar as orphan leaf noise.
 * This pass deletes those orphans: for every `_`-prefixed rule whose
 * body is the empty-choice sentinel `blank()` emits AND which has no
 * matching deposit, drop the entry.
 *
 * Skips rules that DID receive a deposit (they're real synthesized
 * content). Skips rules whose body is non-blank (author-declared hidden
 * helpers are legitimate and can have any body).
 */
function prunePlaceholderOrphans(ctx: WireContext, rules: Record<string, Rule>): void {
	for (const name of Object.keys(rules)) {
		if (!name.startsWith('_')) continue;
		if (ctx.deposits.has(name)) continue;
		const rule = rules[name];
		if (!rule) continue;
		if (isBlankRule(rule)) delete rules[name];
	}
}

/**
 * True when `rule` is the empty-choice sentinel returned by `blank()`.
 */
function isBlankRule(rule: Rule): boolean {
	return rule.type === 'choice' && rule.members.length === 0;
}

// ---------------------------------------------------------------------------
// Wire-phase pattern find-and-replace
// ---------------------------------------------------------------------------

/**
 * A pattern candidate: an author-declared `_`-prefixed rule whose body is
 * complex enough to serve as a structural replacement target.
 *
 * When `aliasAs` is set, replacement sites emit
 * `alias($._<name>, $.<aliasAs>)` so tree-sitter exposes a visible CST
 * node at each match. This is the body-pattern-groups path. Without
 * `aliasAs`, replacement emits a bare hidden `symbol(<name>)` reference
 * (the legacy `_`-prefix path).
 */
interface PatternCandidate {
	readonly name: string;
	readonly body: Rule;
	readonly aliasAs?: string;
}

/**
 * Detect author-declared pattern rules and replace every matching sub-tree
 * in the grammar with `symbol(<pattern-name>)`.
 *
 * A rule is a pattern candidate when ALL of:
 *   1. Its name is in `authoredRuleNames` (explicitly declared in WireConfig.rules).
 *   2. Its name starts with `_` (hidden — signals "synthesized/internal pattern").
 *   3. Its name is NOT in `baseRules` (it's a NEW rule, not an override of a
 *      base-grammar rule). Overrides are intentional replacements, not patterns.
 *   4. Its body is complex: SEQ with ≥2 members, CHOICE with ≥2 members, or
 *      REPEAT/REPEAT1 wrapping non-trivial content (not a bare string/pattern).
 *      Single STRING / SYMBOL / PATTERN bodies are excluded to prevent false
 *      positives like `_wildcard_pattern: ($) => '_'` matching every `'_'`
 *      literal in the grammar.
 *
 * Replacement walks every rule in the merged grammar (skipping the pattern
 * candidates themselves to prevent self-substitution) and replaces matching
 * sub-trees with `symbol(<pattern-name>)`. The new symbol reference is plain
 * sittir-lowercase like every other symbol produced by `createProxy`.
 *
 * @remarks
 * This runs after `injectSyntheticRules` so the full merged rule set is
 * available, and before `prunePlaceholderOrphans` so that any pattern-rule
 * body that would have been pruned is instead preserved because it has real
 * content.
 */
function applyPatternReplacement(
	authoredRuleNames: ReadonlySet<string>,
	baseRules: Record<string, Rule>,
	rules: Record<string, Rule>,
	provenanceByKind: Map<string, RuleProvenance>,
	wireCtx?: WireContext
): ReadonlySet<string> {
	// Step 1: identify pattern candidates.
	// Path A — legacy `_`-prefix candidates declared in `rules:`.
	const candidates: PatternCandidate[] = [];
	for (const name of authoredRuleNames) {
		if (!name.startsWith('_')) continue;
		if (name in baseRules) continue; // override, not a new pattern
		const body = rules[name];
		if (!body) continue;
		if (!isComplexBody(body)) continue;
		candidates.push({ name, body });
	}
	// Path B — body-pattern entries in `groups:` whose value is a RuleFn.
	// The author declares the VISIBLE kind name (no `_`); codegen synthesizes
	// the hidden `_<key>` body and rewrites match sites as
	// `alias($._<key>, $.<key>)` so tree-sitter exposes the visible kind as
	// a CST node. The hidden body was already injected into `rules` by
	// wire's `applyWirePatternReplacement` (so the body-pattern fn ran).
	if (wireCtx?.groups) {
		for (const [key, value] of Object.entries(wireCtx.groups)) {
			if (typeof value !== 'function') continue;
			const hiddenName = `_${key}`;
			const body = rules[hiddenName];
			if (!body) continue;
			if (!isComplexBody(body)) continue;
			candidates.push({ name: hiddenName, body, aliasAs: key });
		}
	}
	if (candidates.length === 0) return new Set();

	// Step 2: walk all rules and replace matching sub-trees.
	// Skip the candidate rules themselves to avoid self-substitution.
	const candidateNames = new Set(candidates.map((c) => c.name));
	for (const [name, body] of Object.entries(rules)) {
		if (candidateNames.has(name)) continue;
		const rewritten = replacePatterns(body, candidates);
		if (rewritten !== body) {
			rules[name] = rewritten;
			// Preserve existing provenance — rewriting doesn't change authorship.
		}
	}
	// Ensure pattern candidates themselves have provenance recorded.
	for (const c of candidates) {
		if (!provenanceByKind.has(c.name)) {
			provenanceByKind.set(c.name, 'override-authored-or-replaced');
		}
	}
	return candidateNames;
}

/**
 * Returns true when `rule` is complex enough to be a meaningful structural
 * pattern. Excludes trivial single-terminal bodies that would match too
 * broadly (every bare string, every symbol reference, every pattern).
 */
function isComplexBody(rule: Rule): boolean {
	switch (rule.type) {
		case 'seq':
			return (rule as SeqRule).members.length >= 2;
		case 'choice':
			return (rule as ChoiceRule).members.length >= 2;
		case 'repeat':
		case 'repeat1': {
			// A REPEAT is complex only when its content is itself non-trivial
			// (not a bare string or symbol).
			const content = (rule as RepeatRule).content;
			return content.type !== 'string' && content.type !== 'symbol' && content.type !== 'pattern';
		}
		default:
			return false;
	}
}

/**
 * Recursively walk `rule`, replacing any sub-tree that structurally matches
 * a pattern candidate with `symbol(<candidate.name>)`. Returns the same
 * object reference when no replacement occurs (allows cheap change-detection
 * by reference equality in the caller).
 */
function replacePatterns(rule: Rule, candidates: PatternCandidate[]): Rule {
	// Check if this node itself matches any candidate.
	for (const c of candidates) {
		if (patternRulesEqual(rule, c.body)) {
			const symRef: SymbolRule = { type: 'symbol', name: c.name, hidden: true };
			// Body-pattern groups path: wrap the hidden symbol in an
			// alias() so tree-sitter emits the visible kind as a CST node.
			if (c.aliasAs !== undefined) {
				return { type: 'alias', content: symRef, named: true, value: c.aliasAs } satisfies AliasRule;
			}
			return symRef;
		}
	}
	// Otherwise recurse into children.
	switch (rule.type) {
		case 'seq': {
			const r = rule as SeqRule;
			const members = replaceInArray(r.members, candidates);
			return members === r.members ? rule : ({ ...r, members } as Rule);
		}
		case 'choice': {
			const r = rule as ChoiceRule;
			const members = replaceInArray(r.members, candidates);
			return members === r.members ? rule : ({ ...r, members } as Rule);
		}
		case 'optional': {
			const r = rule as OptionalRule;
			const content = replacePatterns(r.content, candidates);
			return content === r.content ? rule : ({ ...r, content } as Rule);
		}
		case 'repeat': {
			const r = rule as RepeatRule;
			const content = replacePatterns(r.content, candidates);
			return content === r.content ? rule : ({ ...r, content } as Rule);
		}
		case 'repeat1': {
			const r = rule as Repeat1Rule;
			const content = replacePatterns(r.content, candidates);
			return content === r.content ? rule : ({ ...r, content } as Rule);
		}
		case 'field': {
			const r = rule as FieldRule;
			const content = replacePatterns(r.content, candidates);
			return content === r.content ? rule : ({ ...r, content } as Rule);
		}
		default:
			return rule;
	}
}

/**
 * Map `replacePatterns` over an array, returning the original array when no
 * element changed (cheap reference-equality check for the parent node).
 */
function replaceInArray(members: Rule[], candidates: PatternCandidate[]): Rule[] {
	let changed = false;
	const out: Rule[] = members.map((m) => {
		const r = replacePatterns(m, candidates);
		if (r !== m) changed = true;
		return r;
	});
	return changed ? out : members;
}

/**
 * Structural equality for pattern matching. Compares two Rule trees
 * recursively. Intentionally ignores the `id` field (assigned later by
 * `buildRuleCatalog`) and provenance/source annotations — only shape matters.
 *
 * Key design choices:
 * - PREC/PREC_LEFT/PREC_RIGHT wrappers: these are stripped by evaluate's
 *   `normalize()` in the sittir runtime, so by the time we see the evaluated
 *   rule body they won't be present. No special handling needed.
 * - ALIAS: not handled — aliases are specific and a pattern wouldn't
 *   meaningfully match an alias target.
 * - ENUM: compared member-by-member on `.value` (identical to rulesEqual).
 * - FIELD: name AND content must match. A field wrapper carrying the same
 *   content but a different name is a different structural pattern.
 */
function patternRulesEqual(a: Rule, b: Rule): boolean {
	if (a.type !== b.type) return false;
	switch (a.type) {
		case 'string':
			return a.value === (b as StringRule).value;
		case 'pattern':
			return a.value === (b as PatternRule).value;
		case 'symbol':
			return a.name === (b as SymbolRule).name;
		case 'enum': {
			const bm = (b as EnumRule).members;
			return a.members.length === bm.length && a.members.every((m, i) => m.value === bm[i]!.value);
		}
		case 'seq': {
			const bSeq = b as SeqRule;
			return (
				a.members.length === bSeq.members.length &&
				a.members.every((m, i) => patternRulesEqual(m, bSeq.members[i]!))
			);
		}
		case 'choice': {
			const bCh = b as ChoiceRule;
			return (
				a.members.length === bCh.members.length &&
				a.members.every((m, i) => patternRulesEqual(m, bCh.members[i]!))
			);
		}
		case 'optional':
			return patternRulesEqual(a.content, (b as OptionalRule).content);
		case 'repeat': {
			const bRep = b as RepeatRule;
			return a.separator === bRep.separator && patternRulesEqual(a.content, bRep.content);
		}
		case 'repeat1': {
			const bRep = b as Repeat1Rule;
			return a.separator === bRep.separator && patternRulesEqual(a.content, bRep.content);
		}
		case 'field': {
			const bFld = b as FieldRule;
			return a.name === bFld.name && patternRulesEqual(a.content, bFld.content);
		}
		default:
			return false;
	}
}

/**
 * Evaluate all metadata callbacks (extras, externals, supertypes, inline,
 * conflicts, word) inside the current role scope.
 *
 * @remarks
 * The metadata callbacks must run inside the same `withRoleScope` closure as
 * the rule functions so any `role()` calls they contain attach to this
 * grammar's accumulator rather than a parent or sibling scope.
 *
 * @param opts - Grammar options containing the metadata callbacks.
 * @param baseGrammar - The evaluated base grammar object, or `null`.
 * @param refs - Mutable symbol-reference accumulator.
 * @param sinks - Mutable accumulators for each metadata list.
 * @param setWord - Callback to record the `word` rule name.
 */
function evaluateMetadataCallbacksInScope(
	opts: GrammarOptions,
	baseGrammar: any,
	refs: SymbolRef[],
	sinks: {
		extras: string[];
		externals: string[];
		supertypes: string[];
		inline: string[];
		conflicts: string[][];
	},
	setWord: (w: string) => void
): void {
	evaluateMetadataCallbacks(opts, baseGrammar, refs, sinks, setWord);
}

/**
 * Evaluate each rule function in `opts.rules` and write the normalised
 * result into the shared `rules` map.
 *
 * @param opts - Grammar options containing the rule callbacks to evaluate.
 * @param baseRules - The base grammar's already-evaluated rules, passed as
 *   `previous` to each override callback.
 * @param refs - Mutable symbol-reference accumulator shared across all rule
 *   evaluations in this grammar invocation.
 * @param rules - Mutable output map where evaluated rules are stored.
 * @remarks
 * Each rule callback receives a fresh `$` proxy and, as its second
 * argument, the base grammar's version of that rule (if any).
 * wire()'s wrapped rule fns own their own context management
 * (currentRuleKind) per invocation — no try/finally needed here.
 */
function evaluateRuleFunctions(
	opts: GrammarOptions,
	baseRules: Record<string, Rule>,
	refs: SymbolRef[],
	rules: Record<string, Rule>,
	provenanceByKind: Map<string, RuleProvenance>,
	isExtension: boolean
): void {
	for (const [name, ruleFn] of Object.entries(opts.rules)) {
		const $ = createProxy(name, refs);
		const baseRule = baseRules[name];
		const result = ruleFn.call($, $, baseRule);
		rules[name] = normalize(result);
		provenanceByKind.set(name, isExtension ? 'override-authored-or-replaced' : 'grammar-authored');
	}
}

/**
 * Inject synthetic rules created by alias() placeholders in transform patches
 * into the shared rules map.
 *
 * @param syntheticRules - Map of synthetic rule name → rule content produced
 *   by wire()'s rule-fn wrapper.
 * @param rules - Mutable output map to receive the synthetic rules.
 * @remarks
 * Synthetic rules are hidden variant rules for nested-alias polymorphs,
 * created when transform patches use alias() placeholders.
 *
 * Only fills keys not already populated by `evaluateRuleFunctions`. A
 * deferred-content fn registered by `wire/injectHiddenRulePlaceholders`
 * already ran and wrote the deposited body to `rules[name]` — re-writing
 * from `syntheticRules` would be a no-op for that case but a REGRESSION
 * for a nested-polymorph parent where compose's fn ran at that key and
 * further transformed the deposited body (e.g. `_visibility_modifier_pub`
 * — the outer's deposit + an inner variant split). Skipping preserves
 * the transform; the raw deposit is still correct when no compose ran.
 */
function injectSyntheticRules(
	syntheticRules: Map<string, unknown>,
	rules: Record<string, Rule>,
	provenanceByKind: Map<string, RuleProvenance>
): void {
	for (const [name, content] of syntheticRules) {
		if (name in rules) continue;
		rules[name] = content as Rule;
		provenanceByKind.set(name, 'evaluate-synthesized');
	}
}

/**
 * Inherit metadata lists from the base grammar when the override did not
 * explicitly re-declare them.
 *
 * @param opts - Grammar options for the current (override) grammar.
 * @param baseGrammar - The evaluated base grammar object, or `null` for a
 *   fresh grammar.
 * @param sinks - Mutable accumulators for each metadata list.
 * @param setWord - Callback to set the `word` rule name when inherited from
 *   the base.
 * @remarks
 * Tree-sitter CLI inherits externals, extras, supertypes, inline,
 * conflicts, and word implicitly when extending a base grammar. This
 * function models the same behaviour so downstream phases see the full
 * declaration set instead of an empty list.
 */
function inheritBaseGrammarMetadata(
	opts: GrammarOptions,
	baseGrammar: any,
	sinks: {
		extras: string[];
		externals: string[];
		supertypes: string[];
		inline: string[];
		conflicts: string[][];
	},
	setWord: (w: string) => void
): void {
	const inherited = baseGrammar?.grammar ?? baseGrammar;
	if (inherited) {
		if (!opts.externals && Array.isArray(inherited.externals)) sinks.externals.push(...inherited.externals);
		if (!opts.extras && Array.isArray(inherited.extras)) sinks.extras.push(...inherited.extras);
		if (!opts.supertypes && Array.isArray(inherited.supertypes)) sinks.supertypes.push(...inherited.supertypes);
		if (!opts.inline && Array.isArray(inherited.inline)) sinks.inline.push(...inherited.inline);
		if (!opts.conflicts && Array.isArray(inherited.conflicts)) sinks.conflicts.push(...inherited.conflicts);
		if (!opts.word && inherited.word) setWord(inherited.word);
	}
}

/**
 * Append `value` to `sink` only when it is not already present.
 *
 * @remarks
 * When an override callback does `[...prev, $._foo]` and
 * the base grammar already has `$._foo`, we must collapse to a single
 * entry. Symbol refs from `$.foo` are fresh objects on every proxy access
 * (`createProxy` does not cache), so reference equality always fails —
 * deduplication must compare by string value instead.
 *
 * @param sink - The mutable accumulator array to append into.
 * @param value - The string value to append if not already in `sink`.
 */
function appendDedup(sink: string[], value: string): void {
	if (!sink.includes(value)) sink.push(value);
}

/**
 * Run all the metadata callbacks (extras, externals, supertypes,
 * inline, conflicts, word) and write their results into the supplied
 * accumulators. Pulled out of grammarFn so the call site can wrap it
 * in `withRoleScope` cleanly.
 *
 * tree-sitter's pattern: each callback receives `($, baseValue)`
 * where `$` is a fresh proxy and `baseValue` is the base grammar's
 * version of that property.
 */
function evaluateMetadataCallbacks(
	opts: GrammarOptions,
	baseGrammar: any,
	refs: SymbolRef[],
	sinks: {
		extras: string[];
		externals: string[];
		supertypes: string[];
		inline: string[];
		conflicts: string[][];
	},
	setWord: (w: string) => void
): void {
	if (opts.extras) {
		const $ = createProxy('_extras_', refs);
		const baseExtras = baseGrammar?.extras ?? [];
		const result = opts.extras.call($, $, baseExtras);
		if (Array.isArray(result)) {
			for (const e of result) {
				const n = normalize(e);
				if (n.type === 'symbol') appendDedup(sinks.extras, n.name);
				else if (n.type === 'pattern') appendDedup(sinks.extras, n.value);
			}
		}
	}

	if (opts.externals) {
		const $ = createProxy('_externals_', refs);
		const baseExternals = baseGrammar?.externals ?? [];
		const result = opts.externals.call($, $, baseExternals);
		if (Array.isArray(result)) {
			for (const e of result) {
				const n = normalize(e);
				if (n.type === 'symbol') appendDedup(sinks.externals, n.name);
				else if (n.type === 'string') appendDedup(sinks.externals, n.value);
			}
		}
	}

	if (opts.supertypes) {
		const $ = createProxy('_supertypes_', refs);
		const baseSupertypes = baseGrammar?.supertypes ?? [];
		const result = opts.supertypes.call($, $, baseSupertypes);
		if (Array.isArray(result)) {
			for (const s of result) {
				// Accept BOTH shapes — the callback's `previous` param
				// carries already-normalized string names from the base
				// grammar, while `$.foo` references added in the override
				// normalize to `{ type: 'symbol', name: 'foo' }`. An
				// override body like `previous.concat([$.foo])` produces
				// a mixed array; without the string branch the base-
				// inherited supertypes silently drop.
				if (typeof s === 'string') {
					appendDedup(sinks.supertypes, s);
					continue;
				}
				const n = normalize(s);
				if (n.type === 'symbol') appendDedup(sinks.supertypes, n.name);
			}
		}
	}

	if (opts.inline) {
		const $ = createProxy('_inline_', refs);
		const baseInline = baseGrammar?.inline ?? [];
		const result = opts.inline.call($, $, baseInline);
		if (Array.isArray(result)) {
			for (const i of result) {
				const n = normalize(i);
				if (n.type === 'symbol') appendDedup(sinks.inline, n.name);
			}
		}
	}

	if (opts.conflicts) {
		const $ = createProxy('_conflicts_', refs);
		const baseConflicts = baseGrammar?.conflicts ?? [];
		const result = opts.conflicts.call($, $, baseConflicts);
		if (Array.isArray(result)) {
			for (const c of result) {
				if (Array.isArray(c)) {
					sinks.conflicts.push(
						c
							.map((r) => {
								const n = normalize(r);
								return n.type === 'symbol' ? n.name : '';
							})
							.filter(Boolean)
					);
				}
			}
		}
	}

	if (opts.word) {
		const $ = createProxy('_word_', refs);
		const w = opts.word.call($, $);
		setWord(w.name);
	}
}

/**
 * Evaluate a grammar.js (or overrides.ts) file and return a RawGrammar.
 *
 * Injects DSL functions as globals, then imports the module.
 * Tree-sitter's grammar(base, { rules }) handles extension merging natively.
 */
export async function evaluate(entryPath: string): Promise<RawGrammar> {
	const g = globalThis as unknown as Record<string, unknown>;
	const savedGlobals = saveAndInjectDslGlobals(g);

	try {
		return await importAndExtractGrammar(entryPath);
	} finally {
		restoreSavedGlobals(g, savedGlobals);
	}
}

/**
 * Build the tree-sitter baseline DSL function map, save any pre-existing
 * globals under the same names, inject the DSL functions into `globalThis`,
 * and return the saved values for later restoration.
 *
 * @param g - `globalThis` cast to a mutable string-keyed record.
 * @returns A snapshot of the globals that were overwritten, keyed by name.
 * @remarks
 * Only tree-sitter baseline DSL shadows are injected as globals.
 * Sittir extensions (transform/insert/replace/role/enrich) are explicitly
 * imported from `@sittir/codegen/dsl` by override files and must not be
 * injected here.
 * @remarks
 * `globalThis` is typed as `typeof globalThis`, which doesn't include
 * our DSL props — `Record<string, unknown>` is the honest shape for the
 * bag we mutate inside this scope.
 */
function saveAndInjectDslGlobals(g: Record<string, unknown>): Record<string, unknown> {
	const dslFunctions: Record<string, unknown> = {
		grammar: grammarFn,
		seq,
		choice,
		optional,
		repeat,
		repeat1,
		symbol,
		string,
		field,
		token,
		prec,
		alias,
		blank
	};
	const savedGlobals: Record<string, unknown> = {};
	for (const [name, fn] of Object.entries(dslFunctions)) {
		savedGlobals[name] = g[name];
		g[name] = fn;
	}
	return savedGlobals;
}

/**
 * Import the grammar module at the given path and extract the RawGrammar
 * from its default or named export.
 *
 * @param entryPath - Absolute path to the grammar.js or overrides.ts file.
 * @returns The RawGrammar produced by the module's top-level `grammar()` call.
 */
async function importAndExtractGrammar(entryPath: string): Promise<RawGrammar> {
	const mod = (await import(entryPath)) as {
		default?: unknown;
		grammar?: unknown;
	};
	const result = (mod.default ?? mod) as { grammar?: unknown };
	const grammarObj = result.grammar ?? result;
	return grammarObj as RawGrammar;
}

/**
 * Restore previously saved global values, deleting entries that were
 * `undefined` before injection.
 *
 * @param g - `globalThis` cast to a mutable string-keyed record.
 * @param savedGlobals - The snapshot returned by `saveAndInjectDslGlobals`.
 */
function restoreSavedGlobals(g: Record<string, unknown>, savedGlobals: Record<string, unknown>): void {
	for (const [name, original] of Object.entries(savedGlobals)) {
		if (original === undefined) {
			delete g[name];
		} else {
			g[name] = original;
		}
	}
}
