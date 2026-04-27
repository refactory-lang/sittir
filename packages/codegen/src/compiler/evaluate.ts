/**
 * compiler/evaluate.ts — Phase 1: Evaluate
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
	SymbolRef,
} from "./rule.ts";
import type { RawGrammar } from "./types.ts";
import { withRoleScope } from "../dsl/primitives/role.ts";
import type { WireContext, RefineForm } from "../dsl/wire/wire.ts";
import type { PolymorphVariant } from "./types.ts";

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
		throw new Error("Undefined symbol");
	}

	if (typeof input === "string") {
		return { type: "string", value: input } satisfies StringRule;
	}

	if (input instanceof RegExp) {
		return { type: "pattern", value: input.source } satisfies PatternRule;
	}

	if (typeof input === "object" && "type" in input) {
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
	if (absorbed) return { type: "seq", members: absorbed };

	return { type: "seq", members: normalized };
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
			(cur.type === "repeat" || cur.type === "repeat1") &&
			cur.separator !== undefined &&
			!cur.trailing;
		const isOptionalSepLit = (r: Rule | undefined, sep: string): boolean =>
			!!r && r.type === "optional" && r.content.type === "string" && r.content.value === sep;
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
		r.type === "optional" && r.content.type === "string" && r.content.value === sep;

	// Case 1: [x, repeat(sep, x)]
	if (members.length === 2 && repeatIdx === 1 && matchesElem(members[0]!)) {
		return { type: "repeat1", content: elem, separator: sep };
	}

	// Case 2: [x, repeat(sep, x), optional(sep)] — trailing allowed.
	if (
		members.length === 3 &&
		repeatIdx === 1 &&
		matchesElem(members[0]!) &&
		matchesOptionalSep(members[2]!)
	) {
		return { type: "repeat1", content: elem, separator: sep, trailing: true };
	}

	// Case 3: [sep, x, repeat(sep, x)] — leading separator.
	if (
		members.length === 3 &&
		repeatIdx === 2 &&
		members[0]!.type === "string" &&
		members[0]!.value === sep &&
		matchesElem(members[1]!)
	) {
		return { type: "repeat1", content: elem, separator: sep, leading: true };
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
	return members.findIndex((m) => m.type === "repeat" && m.separator !== undefined);
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
		case "string":
			return a.value === (b as StringRule).value;
		case "pattern":
			return a.value === (b as PatternRule).value;
		case "symbol":
			return a.name === (b as SymbolRule).name;
		case "enum": {
			const bm = (b as EnumRule).members;
			return a.members.length === bm.length && a.members.every((m, i) => m.value === bm[i]!.value);
		}
		case "seq":
			return (
				a.members.length === (b as SeqRule).members.length &&
				a.members.every((m, i) => rulesEqual(m, (b as SeqRule).members[i]!))
			);
		case "choice":
			return (
				a.members.length === (b as ChoiceRule).members.length &&
				a.members.every((m, i) => rulesEqual(m, (b as ChoiceRule).members[i]!))
			);
		case "optional":
			return rulesEqual(a.content, (b as OptionalRule).content);
		case "repeat":
			return (
				a.separator === (b as RepeatRule).separator &&
				rulesEqual(a.content, (b as RepeatRule).content)
			);
		case "repeat1":
			return (
				a.separator === (b as Repeat1Rule).separator &&
				rulesEqual(a.content, (b as Repeat1Rule).content)
			);
		case "field":
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
		(r.type === "seq" && r.members.length === 0) || (r.type === "choice" && r.members.length === 0);
	const blankIdx = normalized.findIndex(isBlank);
	if (blankIdx !== -1 && normalized.length === 2) {
		const other = normalized[1 - blankIdx]!;
		// Recurse through optional() so `optional(optional(x))` keeps
		// collapsing per rule #5.
		return optional(other);
	}

	// Detect all-string choice → EnumRule
	if (normalized.length > 0 && normalized.every((m) => m.type === "string")) {
		return {
			type: "enum",
			members: normalized as StringRule[],
			source: "grammar",
		};
	}

	if (normalized.length >= 2 && normalized.every((m) => m.type === "field")) {
		return collapseAllFieldChoiceMembers(normalized as FieldRule[]);
	}

	return { type: "choice", members: normalized };
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
	const anyAlias = fieldMembers.some((f) => f.content.type === "alias");
	if (anyAlias) {
		return { type: "choice", members: fieldMembers };
	}
	const names = fieldMembers.map((f) => f.name);
	const allSameName = names.every((n) => n === names[0]);
	if (allSameName) {
		// Factor: choice(field(x, A), field(x, B)) → field(x, choice(A, B))
		const inner = choice(...fieldMembers.map((f) => f.content));
		return {
			type: "field",
			name: names[0]!,
			content: inner,
			source: "grammar",
		};
	}
	// Heterogeneous names → retype each field node as a variant node.
	// Same `name`, same `content`, only the discriminator changes.
	// Downstream (Link's `promotePolymorph`, walker, assemble) consumes
	// variants as polymorph-form markers when they appear at the top level.
	const retyped: Rule[] = fieldMembers.map((f) => ({
		type: "variant" as const,
		name: f.name,
		content: f.content,
	}));
	return { type: "choice", members: retyped };
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
	if (resolved.type === "optional") return resolved;
	if (resolved.type === "repeat") return resolved;
	if (resolved.type === "repeat1") {
		return {
			type: "repeat",
			content: resolved.content,
			separator: resolved.separator,
			trailing: resolved.trailing,
			leading: resolved.leading,
		};
	}
	return { type: "optional", content: resolved };
}

/**
 * Detect the `seq(STRING, x)` / `seq(x, STRING)` pattern inside a
 * repeat/repeat1 wrapper and lift the string into a `separator` (and
 * `trailing`) field on the repeat rule. Shared between `repeat` and
 * `repeat1` so both wrappers hoist separators uniformly.
 *
 * Returns `null` if no separator shape is present.
 */
function extractRepeatSeparator(
	resolved: Rule,
): { content: Rule; separator: string; trailing?: boolean } | null {
	if (resolved.type !== "seq" || resolved.members.length !== 2) return null;
	const [first, second] = resolved.members as [Rule, Rule];
	// Canonical case: `repeat(seq(SEP, X))` or `repeat(seq(X, SEP))` with
	// SEP a string literal.
	if (first.type === "string" && second.type !== "string") {
		return { content: second, separator: first.value };
	}
	if (second.type === "string" && first.type !== "string") {
		return { content: first, separator: second.value, trailing: true };
	}
	const firstSepChoice = first.type === "choice" ? extractFirstStringFromChoice(first) : null;
	const secondSepChoice = second.type === "choice" ? extractFirstStringFromChoice(second) : null;
	if (firstSepChoice !== null && second.type !== "string") {
		return { content: second, separator: firstSepChoice };
	}
	if (secondSepChoice !== null && first.type !== "string") {
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
	if (r.type !== "choice") return null;
	const lit = r.members.find((m): m is StringRule => m.type === "string");
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
	if (resolved.type === "repeat" && !resolved.separator) return resolved;
	if (resolved.type === "optional") {
		const inner = resolved.content;
		walkRefs(inner, (ref) => {
			ref.repeated = true;
		});
		const sep = extractRepeatSeparator(inner);
		if (sep) {
			return {
				type: "repeat",
				content: sep.content,
				separator: sep.separator,
				trailing: sep.trailing,
			};
		}
		return { type: "repeat", content: inner };
	}
	const sep = extractRepeatSeparator(resolved);
	if (sep) {
		return {
			type: "repeat",
			content: sep.content,
			separator: sep.separator,
			trailing: sep.trailing,
		};
	}
	return { type: "repeat", content: resolved };
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
	if (resolved.type === "repeat1" && !resolved.separator) return resolved;
	const sep = extractRepeatSeparator(resolved);
	if (sep) {
		return {
			type: "repeat1",
			content: sep.content,
			separator: sep.separator,
			trailing: sep.trailing,
		};
	}
	return { type: "repeat1", content: resolved };
}

// ---------------------------------------------------------------------------
// $ proxy — reference tracking
// ---------------------------------------------------------------------------

export function createProxy(
	currentRule: string,
	refs: SymbolRef[],
): Record<string, SymbolRuleWithRef> {
	return new Proxy({} as Record<string, SymbolRuleWithRef>, {
		get(_target, name: string): SymbolRuleWithRef {
			const ref: SymbolRef = { refType: "symbol", from: currentRule, to: name };
			refs.push(ref);
			return {
				type: "symbol" as const,
				name,
				// `hidden` is a hint for downstream passes only — Link
				// recomputes the authoritative visibility decision via
				// `isHiddenKind()`, consulting both the leading-underscore
				// convention and tree-sitter's explicit `inline` list.
				hidden: name.startsWith("_"),
				_ref: ref,
			};
		},
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
	if (name.startsWith("_")) return true;
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
		case "seq":
		case "choice":
			for (const m of (rule as { members: Rule[] }).members) walkRefs(m, visit);
			return;
		case "optional":
		case "repeat":
		case "repeat1":
		case "prec" as never: // prec wrappers are stripped by normalize but defensive
			walkRefs((rule as { content: Rule }).content, visit);
			return;
		case "field":
		case "alias":
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
		return { type: "field", name, content: { type: "string", value: "" }, _needsContent: true };
	}
	let resolved = normalize(content);
	resolved = collapseOptionalRepeatInField(resolved);
	walkRefs(resolved, (ref) => {
		if (ref.fieldName === undefined) ref.fieldName = name;
	});
	return { type: "field", name, content: resolved };
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
	if (resolved.type !== "optional") return resolved;
	const inner = resolved.content;
	if (inner.type === "repeat") {
		return inner;
	}
	if (inner.type === "repeat1") {
		return {
			type: "repeat",
			content: inner.content,
			separator: inner.separator,
			trailing: inner.trailing,
			leading: inner.leading,
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
		return { type: "token", content: normalize(content), immediate: false };
	},
	{
		immediate(content: Input): TokenRule {
			return { type: "token", content: normalize(content), immediate: true };
		},
	},
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
		},
	},
);

// ---------------------------------------------------------------------------
// Alias + blank (needed for grammar.js compatibility)
// ---------------------------------------------------------------------------

export function alias(rule: Input, value: string | Rule): AliasRule {
	const content = normalize(rule);
	if (typeof value === "string") {
		return { type: "alias", content, named: false, value };
	}
	if (typeof value === "object" && "type" in value && value.type === "symbol") {
		return { type: "alias", content, named: true, value: (value as SymbolRule).name };
	}
	throw new Error(`Invalid alias value: ${value}`);
}

export function blank(): Rule {
	// BLANK is represented as choice() with no members — absorbed by choice()
	return { type: "choice", members: [] };
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
function grammarFn(
	optionsOrBase: GrammarOptions | { grammar: any },
	options?: GrammarOptions,
): { grammar: any } {
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

	// Extract metadata
	const extras: string[] = [];
	const externals: string[] = [];
	const supertypes: string[] = [];
	const inline: string[] = [];
	const conflicts: string[][] = [];
	let word: string | null = null;

	const { roles: collectedRoles } = withRoleScope(() => {
		evaluateRulesAndInjectSynthetics(opts, baseRules, refs, rules);
		evaluateMetadataCallbacksInScope(
			opts,
			baseGrammar,
			refs,
			{ extras, externals, supertypes, inline, conflicts },
			(w) => {
				word = w;
			},
		);
	});

	inheritBaseGrammarMetadata(
		opts,
		baseGrammar,
		{ extras, externals, supertypes, inline, conflicts },
		(w) => {
			word = w;
		},
	);

	const polymorphVariants = drainPolymorphMetadata(opts);
	const refineForms = drainRefineMetadata(opts);

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
	synthesizeInlineAliasSources(rules);

	return {
		grammar: {
			name: opts.name,
			rules,
			extras,
			externals,
			supertypes,
			inline,
			conflicts,
			word,
			references: refs,
			// Per-grammar role bindings collected from inline `role()`
			// calls inside externals/rules. Empty when the grammar
			// declares no roles.
			externalRoles: collectedRoles.size > 0 ? collectedRoles : undefined,
			polymorphVariants: polymorphVariants.length > 0 ? polymorphVariants : undefined,
			refineForms,
		} satisfies RawGrammar,
	};
}

/**
 * For every `alias(inlineContent, $.target)` whose source isn't a
 * bare symbol reference to an existing rule, synthesize a hidden
 * rule `_${target}` carrying the inline content and rewrite the
 * alias's source to point at it.
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
 */
function synthesizeInlineAliasSources(rules: Record<string, Rule>): void {
	const ruleEntries = Object.entries(rules);
	for (const [name, rule] of ruleEntries) {
		rules[name] = rewriteInlineAliases(rule, rules);
	}
}

function rewriteInlineAliases(rule: Rule, rules: Record<string, Rule>): Rule {
	const recurse = (r: Rule): Rule => rewriteInlineAliases(r, rules);
	switch (rule.type) {
		case "alias":
			if (rule.named && rule.value) {
				const inner = rule.content;
				const isBareSymbolToExistingRule =
					inner.type === "symbol" && rules[inner.name] !== undefined;
				// Also skip when the alias TARGET is already a declared
				// kind: `alias(inlineBody, $.existingKind)` just relabels
				// the inline body as that existing kind. Tree-sitter
				// surfaces instances with `$type: existingKind`, and
				// downstream uses the existing rule's factory/shape.
				// Synthesizing `_existingKind` would collide with /
				// over-ride the existing kind's meaning.
				const targetAlreadyExists = rules[rule.value] !== undefined;
				if (!targetAlreadyExists) {
					const syntheticHiddenName = `_${rule.value}`;
					if (!rules[syntheticHiddenName]) {
						rules[syntheticHiddenName] = isBareSymbolToExistingRule
							? inner
							: recurse(rule.content);
					}
					return {
						...rule,
						content: { type: "symbol", name: syntheticHiddenName } as SymbolRule,
					};
				}
			}
			return { ...rule, content: recurse(rule.content) };
		case "seq":
		case "choice":
			return { ...rule, members: rule.members.map(recurse) } as Rule;
		case "optional":
		case "repeat":
		case "repeat1":
		case "field":
		case "token":
		case "variant":
		case "clause":
		case "group":
			return { ...rule, content: recurse((rule as { content: Rule }).content) } as Rule;
		default:
			return rule;
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
function mergeEnrichOverridesIntoOptions(
	optionsOrBase: GrammarOptions | { grammar: any },
	opts: GrammarOptions,
): void {
	const enrichOverrides = (
		optionsOrBase as { __enrichOverrides__?: Record<string, (...a: any[]) => any> }
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
): void {
	evaluateRuleFunctions(opts, baseRules, refs, rules);
	const wireCtx = (opts as unknown as { __wireContext__?: WireContext }).__wireContext__;
	if (wireCtx) {
		injectSyntheticRules(wireCtx.deposits, rules);
		prunePlaceholderOrphans(wireCtx, rules);
	}
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
		if (!name.startsWith("_")) continue;
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
	return rule.type === "choice" && rule.members.length === 0;
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
	setWord: (w: string) => void,
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
): void {
	for (const [name, ruleFn] of Object.entries(opts.rules)) {
		const $ = createProxy(name, refs);
		const baseRule = baseRules[name];
		const result = ruleFn.call($, $, baseRule);
		rules[name] = normalize(result);
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
): void {
	for (const [name, content] of syntheticRules) {
		if (name in rules) continue;
		rules[name] = content as Rule;
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
	setWord: (w: string) => void,
): void {
	const inherited = baseGrammar?.grammar ?? baseGrammar;
	if (inherited) {
		if (!opts.externals && Array.isArray(inherited.externals))
			sinks.externals.push(...inherited.externals);
		if (!opts.extras && Array.isArray(inherited.extras)) sinks.extras.push(...inherited.extras);
		if (!opts.supertypes && Array.isArray(inherited.supertypes))
			sinks.supertypes.push(...inherited.supertypes);
		if (!opts.inline && Array.isArray(inherited.inline)) sinks.inline.push(...inherited.inline);
		if (!opts.conflicts && Array.isArray(inherited.conflicts))
			sinks.conflicts.push(...inherited.conflicts);
		if (!opts.word && inherited.word) setWord(inherited.word);
	}
}

/**
 * Append `value` to `sink` only when it is not already present.
 *
 * @remarks
 * Spec FR-019a: when an override callback does `[...prev, $._foo]` and
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
	setWord: (w: string) => void,
): void {
	if (opts.extras) {
		const $ = createProxy("_extras_", refs);
		const baseExtras = baseGrammar?.extras ?? [];
		const result = opts.extras.call($, $, baseExtras);
		if (Array.isArray(result)) {
			for (const e of result) {
				const n = normalize(e);
				if (n.type === "symbol") appendDedup(sinks.extras, n.name);
				else if (n.type === "pattern") appendDedup(sinks.extras, n.value);
			}
		}
	}

	if (opts.externals) {
		const $ = createProxy("_externals_", refs);
		const baseExternals = baseGrammar?.externals ?? [];
		const result = opts.externals.call($, $, baseExternals);
		if (Array.isArray(result)) {
			for (const e of result) {
				const n = normalize(e);
				if (n.type === "symbol") appendDedup(sinks.externals, n.name);
				else if (n.type === "string") appendDedup(sinks.externals, n.value);
			}
		}
	}

	if (opts.supertypes) {
		const $ = createProxy("_supertypes_", refs);
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
				if (typeof s === "string") {
					appendDedup(sinks.supertypes, s);
					continue;
				}
				const n = normalize(s);
				if (n.type === "symbol") appendDedup(sinks.supertypes, n.name);
			}
		}
	}

	if (opts.inline) {
		const $ = createProxy("_inline_", refs);
		const baseInline = baseGrammar?.inline ?? [];
		const result = opts.inline.call($, $, baseInline);
		if (Array.isArray(result)) {
			for (const i of result) {
				const n = normalize(i);
				if (n.type === "symbol") appendDedup(sinks.inline, n.name);
			}
		}
	}

	if (opts.conflicts) {
		const $ = createProxy("_conflicts_", refs);
		const baseConflicts = baseGrammar?.conflicts ?? [];
		const result = opts.conflicts.call($, $, baseConflicts);
		if (Array.isArray(result)) {
			for (const c of result) {
				if (Array.isArray(c)) {
					sinks.conflicts.push(
						c
							.map((r) => {
								const n = normalize(r);
								return n.type === "symbol" ? n.name : "";
							})
							.filter(Boolean),
					);
				}
			}
		}
	}

	if (opts.word) {
		const $ = createProxy("_word_", refs);
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
		field,
		token,
		prec,
		alias,
		blank,
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
	const mod = (await import(entryPath)) as { default?: unknown; grammar?: unknown };
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
function restoreSavedGlobals(
	g: Record<string, unknown>,
	savedGlobals: Record<string, unknown>,
): void {
	for (const [name, original] of Object.entries(savedGlobals)) {
		if (original === undefined) {
			delete g[name];
		} else {
			g[name] = original;
		}
	}
}
