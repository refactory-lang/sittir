/**
 * Emits per-rule `.jinja` files for the render pipeline (feature 011).
 *
 * The YAML template format (`templates directory`) was retired in favor of
 * per-rule `.jinja` files — see ADR-0013 / spec 011 for design notes.
 * This file owns the functions that drive that emission:
 *
 *   - `runTemplateEmitter(config)` — runs the authoritative TemplateEmitter
 *     class introduced in PR2. Walks the NodeMap, dispatches each node by
 *     its modelType, and returns a Map keyed by rule kind (values include
 *     the `@generated` header).
 *   - `writeJinjaTemplates(emitted, outputDir)` — writes the Map to
 *     disk and removes any stale `.jinja` files whose rule kinds are
 *     no longer present.
 *
 * All template generation happens inside the `AssembledNode` class
 * hierarchy in `compiler/node-map.ts`. Each `renderTemplate()` method
 * returns Jinja-shaped output directly — clause / variant inlining,
 * `$VAR` → `{{ var }}` translation, and separator-filter selection are
 * all collapsed into that one chokepoint.
 *
 * These emitted files are the canonical authored templates under
 * `packages/{lang}/templates/`. The native Askama copies under
 * `rust/crates/sittir-{lang}/templates/` are derived later by
 * `cli.ts` from this source of truth; never edit those copies by hand.
 */

import {
	CHOICE,
	DEDENT,
	GROUP,
	INDENT,
	NEWLINE,
	PATTERN,
	SEQ,
	STRING,
	SUPERTYPE,
	SYMBOL,
	VARIANT
} from '../types/rule-types.ts'; // @rule-type-consts
import { isNonterminalRuleType } from '../compiler/rule-catalog.ts';
import * as fs from 'node:fs';
import { join } from 'node:path';
import type { NodeMap } from '../compiler/types.ts';
import {
	AssembledGroup,
	allSlotsOf,
	isMultiple,
	isRequired,
	kindsOf,
	isTerminalValue
} from '../compiler/model/node-map.ts';
import type {
	AssembledBranch,
	AssembledNode,
	AssembledNonterminal,
	AssembledSeparatedList,
	NodeOrTerminal
} from '../compiler/model/node-map.ts';
import type { Rule, RuleBase, RenderRule, Multiplicity } from '../types/rule.ts';
import type { CodegenEmitter } from './emitter.ts';
import { classifyTemplateEmission } from './shared.ts';

export interface EmitTemplatesConfig {
	grammar: string;
	nodeMap: NodeMap;
	grammarSha?: string;
}

export interface EmittedTemplates {
	bodies: Map<string, string>;
}

export interface EmitCtx {
	readonly nodeMap: NodeMap;
	readonly wordMatcher: RegExp;
	readonly externals: readonly string[];
	/**
	 * PR-137: `normalizedRules` (wrapper-deleted `RenderRule` view), not
	 * `linkRules` — `emitSymbol`'s hidden-helper fallback (the only
	 * consumer) used to bridge `linkRules[name]` through a per-call
	 * `deleteWrapper()`; verified byte-identical to reading
	 * `normalizedRules[name]` directly for every hidden ref the fallback
	 * actually reaches, across all 3 grammars, so the bridge is gone.
	 */
	readonly rules: Record<string, RenderRule>;
	/**
	 * Cycle guard for hidden-helper recursion in `emitSymbol`. A flat mutable
	 * Set tracks visited helper names, keyed by `@${name}`, passed down via
	 * this field. Each call to `emitOne()` resets it.
	 */
	readonly visitingHelpers: Set<string>;
	/**
	 * Owner-level slots for the current node being emitted, keyed by
	 * `storageName` (snake_case, matches `rule.fieldName.toLowerCase()`).
	 * Used as a fallback when `slotByRuleId` lookup fails because the
	 * symbol's rule `id` doesn't match any of the slot's `sourceRuleIds` — a gap
	 * that occurs when `simplifyRule` creates new rule objects without
	 * preserving the original ID. Set by `emitBranchTemplate` and
	 * `emitGroupTemplate` before recursing into the node's `renderRule`.
	 */
	readonly ownerSlots?: Readonly<Record<string, AssembledNonterminal>>;
	/**
	 * DIAGNOSTIC (`DBG_SLOT_MISS=1`): the kind currently being emitted, threaded
	 * by `emitOne` so `lookupSlot` can attribute a `slotByRuleId` miss to a kind.
	 */
	readonly currentKind?: string;
}

// ---------------------------------------------------------------------------
// DIAGNOSTIC: slotByRuleId-miss inventory (env-gated via `DBG_SLOT_MISS=1`).
//
// Records every rule where the primary O(1) `slotByRuleId.get(rule.id)` lookup
// FAILED (no id, or id not registered), plus whether a name-based fallback
// recovered it. `recoveredBy: 'none'` is the bug class — the emitter then falls
// back to the arm/symbol name (e.g. choice `parameter` instead of slot
// `content`), producing a `.jinja` var with no matching transport field.
// Surfaces the rule-ID-not-preserved gap so it can be fixed at the source.
// ---------------------------------------------------------------------------
interface SlotLookupMiss {
	readonly kind: string | undefined;
	readonly ruleType: string;
	readonly ruleId: string | undefined;
	readonly name: string | undefined;
	readonly fieldName: string | undefined;
	readonly recoveredBy: 'fieldName' | 'symbol-name' | 'none';
}
const DBG_SLOT_MISS = process.env.DBG_SLOT_MISS === '1';
const SLOT_MISS_LOG: SlotLookupMiss[] = [];
function dumpSlotMissLog(grammar: string): void {
	if (!DBG_SLOT_MISS || SLOT_MISS_LOG.length === 0) return;
	const tally = { fieldName: 0, 'symbol-name': 0, none: 0 } as Record<string, number>;
	for (const m of SLOT_MISS_LOG) tally[m.recoveredBy] = (tally[m.recoveredBy] ?? 0) + 1;
	process.stderr.write(
		`\n=== slotByRuleId MISS inventory [${grammar}] — ${SLOT_MISS_LOG.length} total ` +
			`(recovered fieldName=${tally.fieldName} symbol-name=${tally['symbol-name']} UNRESOLVED=${tally.none}) ===\n`
	);
	for (const m of SLOT_MISS_LOG) {
		const tag = m.recoveredBy === 'none' ? 'UNRESOLVED ' : `recov:${m.recoveredBy} `;
		const label = m.name ? `${m.ruleType}(${m.name})` : m.ruleType;
		process.stderr.write(
			`  ${tag} kind=${m.kind ?? '?'} ${label}${m.fieldName ? ` field=${m.fieldName}` : ''} id=${m.ruleId ?? '<none>'}\n`
		);
	}
	SLOT_MISS_LOG.length = 0;
}

// Nunjucks whitespace control (`{#- ... -#}`) strips whitespace
// flanking the comment — crucial when a template is rendered as a
// nested child, where the outer `.trim()` doesn't apply. Without the
// trim, every nested render picks up a leading `\n` from the line
// break between this header and the body. See core/render.ts for the
// top-level `.trim()` that handles the outermost render.
const GENERATED_HEADER =
	'{#- @generated by @sittir/codegen — do not edit. Source: packages/codegen/src/emitters/templates.ts -#}';

export function escapeLiteral(value: string): string {
	return value.replaceAll('{', '{ ').replaceAll('}', ' }').replaceAll('{  }', '{ }');
}

export function escapeJinjaString(value: string): string {
	return value.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
}

/**
 * Statically render a rule to its fixed literal text — only meaningful for
 * a rule classified `terminal` by Table 1 (`isNonterminalRuleType`,
 * rule-catalog.ts): every reachable descendant is compile-time-known text,
 * so there's nothing to capture at read-time. Callers gate on that
 * classification (e.g. `separatorToString` below); this function mirrors
 * Table 1's own recursive structure for the shapes actually reachable in a
 * `RenderRule` (GROUP/VARIANT survive wrapper-deletion; TOKEN is preserved
 * by the mechanism but excluded from `RenderRule`'s type — see
 * `RenderRule`'s doc comment — so it falls to `default` like any other
 * unreachable/nonterminal shape).
 */
export function stringifyRule(rule: RenderRule): string {
	switch (rule.type) {
		case STRING:
			return rule.value;
		case SEQ:
			return rule.members.map(stringifyRule).join('');
		case GROUP:
		case VARIANT:
			return stringifyRule(rule.content);
		default:
			return '';
	}
}

export class TemplateEmitter implements CodegenEmitter<EmittedTemplates> {
	readonly #config: EmitTemplatesConfig;
	readonly #wordMatcher: RegExp;
	readonly #ctx: EmitCtx;
	#bodies = new Map<string, string>();

	constructor(config: EmitTemplatesConfig) {
		this.#config = config;
		// Link-time-pinned, carried on `nodeMap.wordMatcher` — NOT recompiled
		// here. See `LinkedGrammar.wordMatcher`'s doc comment (compiler/types.ts)
		// for why a post-link recompile (this used to compile from
		// `config.nodeMap.linkRules`, the wrapper-bearing view) is unsound in
		// general. `?? /\w/` preserves the pre-existing no-word-rule fallback.
		this.#wordMatcher = config.nodeMap.wordMatcher ?? /\w/;
		// EmitCtx for the modelType-dispatching emitter: `rules` (for
		// hidden-helper inlining — the normalized/wrapper-deleted view, PR-137),
		// `wordMatcher` (currently unused by emitRule but kept for parity),
		// `externals` (token-shape detection), and `nodeMap` (slot
		// back-pointer lookup via `slotByRuleId`).
		this.#ctx = {
			nodeMap: config.nodeMap,
			wordMatcher: this.#wordMatcher,
			externals: [...(config.nodeMap.externals ?? [])],
			rules: config.nodeMap.normalizedRules ?? {},
			visitingHelpers: new Set<string>()
		};
	}

	emitLeaf(node: AssembledNode): void {
		this.#emitNode(node);
	}

	emitBranch(node: AssembledNode): void {
		this.#emitNode(node);
	}

	emitGroup(node: AssembledNode): void {
		this.#emitNode(node);
	}

	finalize(): EmittedTemplates {
		dumpSlotMissLog(this.#config.grammar);
		return { bodies: new Map(this.#bodies) };
	}

	#emitNode(node: AssembledNode): void {
		// Skip-emit gate: classifyTemplateEmission skips non-user-facing
		// nodes, polymorph-form groups, and all leaf modelTypes
		// (pattern/keyword/token/supertype/enum/multi), none of which get a
		// template file.
		if (classifyTemplateEmission(node) !== 'emit') return;

		this.#ctx.visitingHelpers.clear();
		const newBody = emitOne(node, this.#ctx);

		if (newBody === undefined) {
			// emitOne returns undefined for modelTypes that don't get templates
			// (supertype / pattern / keyword / token / enum); emit an empty body
			// to preserve file presence.
			this.#bodies.set(node.kind, `${GENERATED_HEADER}\n`);
			return;
		}
		// Slot-preservation gate (PR2 Task 3.B4): assert every declared slot
		// appears at least once in the emitted body. Replaces the deleted
		// byte-equivalence diff gate. Set SITTIR_SLOT_PRESERVATION=0 to bypass.
		if (process.env['SITTIR_SLOT_PRESERVATION'] !== '0') {
			assertSlotPreservation(node, newBody);
		}
		this.#bodies.set(node.kind, `${GENERATED_HEADER}\n${newBody}`);
	}
}

function emitOne(node: AssembledNode, ctx: EmitCtx): string | undefined {
	const ctxK: EmitCtx = DBG_SLOT_MISS ? { ...ctx, currentKind: node.kind } : ctx;
	switch (node.modelType) {
		case 'branch':
			return emitBranchTemplate(node, ctxK);
		case 'group':
			return emitGroupTemplate(node, ctxK);
		case 'supertype':
		case 'pattern':
		case 'keyword':
		case 'token':
		case 'enum':
			return undefined;
		case 'multi':
			// classifyTemplateEmission always skips 'multi' nodes before emitOne
			// is reached — this arm is an unreachable safety fallback.
			throw new Error(
				`emitOne: 'multi' node reached emitOne (should be skipped by classifyTemplateEmission): ${node.kind}`
			);
		// TEMPORARY (separator-as-slot Task 2 follow-up — see
		// isSlotBearingCompound's doc comment, shared.ts): 'separatedList'
		// shares 'branch's template emission for byte-identical output pending
		// Tasks 4-6's real per-instance capture.
		case 'separatedList':
			return emitBranchTemplate(node, ctxK);
		default: {
			const _exhaustive: never = node;
			throw new Error(`emitOne: unhandled modelType ${(_exhaustive as AssembledNode).modelType}`);
		}
	}
}

// ---------------------------------------------------------------------------
// Per-modelType emit functions
//
// Each structural modelType (`branch`, `group`, `multi`) carries a single
// `rule` whose Jinja shape is fully captured by `emitRule`.
//
// Exported so the modelType-emit test suite can exercise each function in
// isolation against minimal in-memory fixtures (no NodeMap construction
// required).
// ---------------------------------------------------------------------------

// TEMPORARY: 'separatedList' widened in alongside 'branch' — see
// isSlotBearingCompound's doc comment (shared.ts).
export function emitBranchTemplate(node: AssembledBranch | AssembledSeparatedList, ctx: EmitCtx): string {
	// PR2 Task 3.B3: consume renderRule (RenderRule, wrapper-free) instead
	// of rule (RawRule, wrapper-bearing). Wrapper attributes (fieldName,
	// multiplicity, separator) are now on the leaf rules themselves.
	//
	// Populate ownerSlots so emitSymbol can fall back to name-based slot
	// lookup when slotByRuleId lookup fails (gap: simplifyRule may create
	// new rule objects without preserving IDs, breaking slotByRuleId).
	const ctxWithSlots: EmitCtx = { ...ctx, ownerSlots: node.slots };
	return emitRule(node.renderRule, ctxWithSlots);
}

export function emitGroupTemplate(node: AssembledGroup, ctx: EmitCtx): string {
	// PR2 Task 3.B3: consume renderRule (RenderRule, wrapper-free).
	// Populate ownerSlots for the same reason as emitBranchTemplate.
	const ctxWithSlots: EmitCtx = { ...ctx, ownerSlots: node.slots };
	return emitRule(node.renderRule, ctxWithSlots);
}

// ---------------------------------------------------------------------------
// emitRule — RenderRule.type dispatcher
//
// Walks a RenderRule subtree producing Jinja directly, in a single pass.
//
// Per PR1 design:
// - Reads PR0-enriched attributes (`fieldName`, `multiplicity`, `nonterminal`,
//   `separator`) directly from the rule.
// - Looks up slot facts (propertyName / storageName / paramName) via
//   `ctx.nodeMap.slotByRuleId.get(rule.id)` rather than re-deriving from
//   names.
// - Returns Jinja text (`{{ name }}`, `{% if name | isPresent %}…{% endif %}`,
//   `{{ items | join("…") }}`) — no `$NAME` placeholders, no translation
//   pass downstream.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Bug 6 (replaces Bug 1): seq inter-member spacing via grammar-derived
// word-regex boundary check on rule-tree literals.
//
// The old Bug 1 approach used ad-hoc character classes on emitted Jinja
// strings (seqEffectiveFirstChar / seqEffectiveLastChar). Bug 6 replaces
// those helpers with rule-tree walkers that find the rightmost/leftmost
// literal text at each adjacent boundary, then tests `leftText + rightFirstChar`
// against the grammar's compiled word regex. This is authoritative because
// the grammar's word rule governs how tree-sitter's lexer tokenises word
// boundaries.
//
// Key decisions:
// - Walk left/right subtrees through structural containers to find
//   rightmost/leftmost StringRenderRule text.
// - Honor `immediate: true` on right-side token rules as authoritative
//   no-space override (tree-sitter token.immediate construct).
// - Test `leftLiteralText + rightFirstChar` against wordMatcher. If the
//   regex extends past the boundary (match length > leftText.length), a
//   space is needed.
// - Conservative fallback for unresolvable boundaries (symbol refs,
//   patterns, opaque terminals, choice with no literals) → insert space
//   (round-trip safe: extra spaces are always accepted by the parser).
// - When a space IS needed and the next emission is a conditional, absorb
//   the space INSIDE the conditional body (leading absorption). This
//   prevents trailing spaces when the optional part is absent.
// - When a space IS needed and the CURRENT emission is a conditional and
//   the next token is word-like, absorb the space as a TRAILING space
//   inside the conditional body (trailing absorption). This keeps spaces
//   adjacent to visible content (e.g. `pub fn` not `pub  fn` nor `pubfn`).
// ---------------------------------------------------------------------------

/** Full Jinja conditional: `{% if ... %}...{% endif %}` (incl. whitespace-strip variants). */
const JINJA_COND_FULL_RE = /^(\{%-? if [^%]+-?%\})([\s\S]*)(\{%-? endif -?%\})$/;

/**
 * Boundary classification at one edge of a rule subtree.
 *
 *  - `{ kind: 'literal', text }` — concrete string literal text (`let`, `:`,
 *    `=>`, …). Used by the word-regex check to test whether the boundary
 *    extends into a single lexeme.
 *  - `{ kind: 'slot' }` — boundary resolves to a Jinja `{{ name }}` slot whose
 *    runtime value is unknown but typically word-like (identifier, literal
 *    body, kind-named nested rendering). Treated as word-like by the
 *    boundary check.
 *  - `{ kind: 'unknown' }` — boundary is opaque (pattern, supertype with no
 *    literal anchor, etc.). Triggers the conservative space fallback.
 */
type BoundaryEnd =
	| { readonly kind: 'literal'; readonly text: string }
	| { readonly kind: 'slot' }
	| { readonly kind: 'unknown' };

const SLOT_END: BoundaryEnd = { kind: 'slot' };
const UNKNOWN_END: BoundaryEnd = { kind: 'unknown' };

function literalEnd(text: string): BoundaryEnd {
	return { kind: 'literal', text };
}

/**
 * Walk a RenderRule subtree rightward to classify the rightmost boundary.
 * Returns:
 *   - `literal(text)` when a concrete string literal anchors the right edge.
 *   - `slot` when the right edge is a slot-emitting symbol or field (the slot
 *     renders to user content, treated as word-like at the boundary).
 *   - `unknown` when nothing about the boundary can be determined (patterns,
 *     etc.) — caller falls back to inserting a space.
 *
 * Does NOT follow symbol refs into other kinds (conservative — that would
 * require cross-rule resolution and cycle handling).
 */
function rightmostBoundary(rule: RenderRule): BoundaryEnd {
	// §D-2a spacing stopgap: a `seq` with the declared `splicedBody` flag was
	// an opaque `symbol(_x)` ref before the normalize inline hoist spliced it
	// in (`compiler/normalize.ts`'s `materializeInlinedBody` — see
	// `RuleBase.splicedBody`'s doc comment). At its OUTER boundaries it must
	// keep spacing like the opaque unit it replaced (`for await (`, not
	// `for await(`) — so report it as slot-like (word-like) rather than
	// walking into its first/last literal. (Strategic render-time spacing
	// supersedes this — see the deferred follow-up in the plan.)
	if (rule.type === SEQ && rule.splicedBody === true) return SLOT_END;
	switch (rule.type) {
		case STRING:
			// Named field-wrapped string — it becomes a slot, not a literal.
			if ((rule as { fieldName?: string }).fieldName !== undefined) return SLOT_END;
			return literalEnd(rule.value);
		case SEQ: {
			for (let i = rule.members.length - 1; i >= 0; i--) {
				const end = rightmostBoundary(rule.members[i]!);
				if (end.kind !== 'unknown') return end;
			}
			return UNKNOWN_END;
		}
		case CHOICE: {
			// All arms must agree; conservative on disagreement.
			let acc: BoundaryEnd | undefined;
			for (const m of rule.members) {
				const end = rightmostBoundary(m);
				if (end.kind === 'unknown') return UNKNOWN_END;
				if (acc === undefined) acc = end;
				else if (acc.kind !== end.kind) return UNKNOWN_END;
				else if (acc.kind === 'literal' && end.kind === 'literal' && acc.text !== end.text) {
					return UNKNOWN_END;
				}
			}
			return acc ?? UNKNOWN_END;
		}
		case VARIANT:
		case GROUP:
			return rightmostBoundary(rule.content);
		// PR-P: ENUM case removed — enum-shaped ChoiceRules fall through to CHOICE/default.
		case SYMBOL:
			// Symbol refs become slot emissions in the template — word-like at boundary.
			return SLOT_END;
		case PATTERN:
		case SUPERTYPE:
		case INDENT:
		case DEDENT:
		case NEWLINE:
		default:
			return UNKNOWN_END;
	}
}

/**
 * Walk a RenderRule subtree leftward to classify the leftmost boundary.
 * Symmetric to {@link rightmostBoundary}.
 */
function leftmostBoundary(rule: RenderRule): BoundaryEnd {
	// §D-2a spacing stopgap (symmetric to rightmostBoundary): a spliced-body
	// seq (declared `splicedBody` flag) keeps opaque-symbol spacing at its
	// outer boundaries.
	if (rule.type === SEQ && rule.splicedBody === true) return SLOT_END;
	switch (rule.type) {
		case STRING:
			if ((rule as { fieldName?: string }).fieldName !== undefined) return SLOT_END;
			return literalEnd(rule.value);
		case SEQ: {
			for (let i = 0; i < rule.members.length; i++) {
				const end = leftmostBoundary(rule.members[i]!);
				if (end.kind !== 'unknown') return end;
			}
			return UNKNOWN_END;
		}
		case CHOICE: {
			let acc: BoundaryEnd | undefined;
			for (const m of rule.members) {
				const end = leftmostBoundary(m);
				if (end.kind === 'unknown') return UNKNOWN_END;
				if (acc === undefined) acc = end;
				else if (acc.kind !== end.kind) return UNKNOWN_END;
				else if (acc.kind === 'literal' && end.kind === 'literal' && acc.text !== end.text) {
					return UNKNOWN_END;
				}
			}
			return acc ?? UNKNOWN_END;
		}
		case VARIANT:
		case GROUP:
			return leftmostBoundary(rule.content);
		// PR-P: ENUM case removed — enum-shaped ChoiceRules fall through to CHOICE/default.
		case SYMBOL:
			return SLOT_END;
		case PATTERN:
		case SUPERTYPE:
		case INDENT:
		case DEDENT:
		case NEWLINE:
		default:
			return UNKNOWN_END;
	}
}

/**
 * Return true if the leftmost terminal in the rule subtree is a
 * `token.immediate(...)` wrapper — meaning tree-sitter requires it to
 * immediately follow the preceding token with no whitespace.
 */
function isLeftmostTerminalImmediate(rule: RenderRule): boolean {
	switch (rule.type) {
		// NOTE (phase-visibility-tightening finding, see project_preserve_token_wrappers;
		// wording corrected per PR-136 review): `applyWrapperDeletion`'s TOKEN
		// case PRESERVES the node (`{...rule, content}` — `immediate` included,
		// NOT lost), so TokenRule→never under `RenderRule` is a type-level
		// assertion backed only by the EMPIRICAL fact that no top-level
		// token(...) rule survives into normalizedRules on any current grammar
		// (0 hits ×3). The former `case TOKEN: return rule.immediate` arm was
		// deleted on that basis; if a surviving TOKEN ever appears, the type
		// lies and this walker silently loses its `immediate` signal — that
		// reconciliation (either wrapper-deletion stamps an `immediate` leaf
		// attribute, or Rule<'normalize'> admits TokenRule) is the
		// preserve-token-wrappers debt, out of scope for this type-only pass.
		case SEQ: {
			for (const m of rule.members) {
				// Only recurse into the first non-empty member.
				const result = isLeftmostTerminalImmediate(m);
				// A string member is not immediate (it's a bare literal, not token.immediate)
				if (m.type === STRING || m.type === PATTERN) return false;
				return result;
			}
			return false;
		}
		case CHOICE: {
			// Immediate only if ALL arms are immediate.
			return rule.members.length > 0 && rule.members.every((m) => isLeftmostTerminalImmediate(m));
		}
		case VARIANT:
		case GROUP:
			return isLeftmostTerminalImmediate(rule.content);
		default:
			return false;
	}
}

/**
 * A virtual word-like character used to stand in for slot emissions
 * (`{{ name }}`) and other dynamic content whose runtime first/last char
 * is unknown but typically an identifier / literal head. Using a real
 * word character lets the grammar's wordMatcher decide consistently
 * (matches `\w`, `[a-zA-Z_]`, identifier-shaped patterns).
 */
const SLOT_WORDLIKE_CHAR = 'a';

function probeChar(end: BoundaryEnd, side: 'left' | 'right'): string | undefined {
	if (end.kind === 'literal') {
		return side === 'right' ? end.text[end.text.length - 1] : end.text[0];
	}
	if (end.kind === 'slot') return SLOT_WORDLIKE_CHAR;
	return undefined;
}

/**
 * Extract the first non-Jinja-tag character from a template fragment, used
 * to probe the inner-present leftmost char of a conditional body. The body
 * lies between `{%- if ... %}` and `{%- endif %}` (with optional whitespace-
 * strip markers). Returns `undefined` if the body is empty / all tags / all
 * slots.
 *
 * For slot-only bodies (`{{ name }}`), returns the word-like stand-in
 * character so the wordMatcher boundary check still fires when the slot
 * sits next to an identifier-shaped literal.
 */
function firstBoundaryCharOfCondBody(condText: string): string | undefined {
	const m = condText.match(JINJA_COND_FULL_RE);
	if (!m) return undefined;
	const body = m[2] ?? '';
	return firstBoundaryCharOfFragment(body);
}

function lastBoundaryCharOfCondBody(condText: string): string | undefined {
	const m = condText.match(JINJA_COND_FULL_RE);
	if (!m) return undefined;
	const body = m[2] ?? '';
	return lastBoundaryCharOfFragment(body);
}

/**
 * Extract the leftmost meaningful character from a template fragment:
 * the first real text char or, if the fragment opens with a `{{ slot }}`
 * expression, the word-like stand-in character.
 */
function firstBoundaryCharOfFragment(fragment: string): string | undefined {
	if (fragment.length === 0) return undefined;
	// Slot at start → word-like.
	if (fragment.startsWith('{{')) return SLOT_WORDLIKE_CHAR;
	// Otherwise the first character IS the boundary (after any whitespace).
	const trimmed = fragment.replace(/^\s+/, '');
	if (trimmed.length === 0) return undefined;
	if (trimmed.startsWith('{{')) return SLOT_WORDLIKE_CHAR;
	if (trimmed.startsWith('{%')) return undefined; // nested tag — opaque
	return trimmed[0];
}

function lastBoundaryCharOfFragment(fragment: string): string | undefined {
	if (fragment.length === 0) return undefined;
	if (fragment.endsWith('}}')) return SLOT_WORDLIKE_CHAR;
	const trimmed = fragment.replace(/\s+$/, '');
	if (trimmed.length === 0) return undefined;
	if (trimmed.endsWith('}}')) return SLOT_WORDLIKE_CHAR;
	if (trimmed.endsWith('%}')) return undefined;
	return trimmed[trimmed.length - 1];
}

/**
 * Core word-boundary check: do `leftChar` and `rightChar` form a single
 * lexeme under `wordMatcher`? Returns true when the regex extends past
 * the boundary (covering both chars) — meaning a separator is required.
 *
 * Examples (wordMatcher = identifier regex):
 *   `t` + `a` → `ta` matches both → space ✓
 *   `:` + `a` → match starts at `:` → no match → no space ✓
 *   `n` + `(` → match `n` only     → no space ✓
 *   `b` + `f` → `bf` matches both  → space ✓
 */
function charsRequireSpace(leftChar: string, rightChar: string, wordMatcher: RegExp): boolean {
	if (leftChar === '' || rightChar === '') return false;
	const combined = leftChar + rightChar;
	try {
		const src = wordMatcher.source.replace(/\$$/, '');
		const flags = wordMatcher.flags.replace(/[gm]/g, '');
		const anchoredRe = new RegExp(`^(?:${src})`, flags);
		const m = combined.match(anchoredRe);
		return !!(m && m[0] !== undefined && m[0].length > 1);
	} catch {
		return true;
	}
}

/**
 * Decide if a space is needed between two adjacent seq-member RenderRule nodes,
 * given their emitted text fragments.
 *
 * Algorithm (Bug 6):
 * 1. Authoritative no-space: if right's leftmost terminal is `token.immediate`,
 *    return false (no space).
 * 2. Boundary classification: find rightmost-end of left and leftmost-end of
 *    right via rule-tree walks (concrete literal / slot / unknown).
 *    When a side is a conditional `{% if %}body{% endif %}`, use the body's
 *    actual first/last char so the inner-present boundary reflects what
 *    really sits adjacent when the conditional fires — not the symbol's
 *    abstract slot category.
 * 3. Word-regex extension check via {@link charsRequireSpace}.
 * 4. Conservative fallback: unknown side → return true (round-trip safe).
 */
function needsSeqSpace(
	left: RenderRule,
	right: RenderRule,
	wordMatcher: RegExp,
	leftText?: string,
	rightText?: string
): boolean {
	if (isLeftmostTerminalImmediate(right)) return false;

	// Derive boundary chars. When the emitted text is a conditional, the body's
	// real first/last char is the inner-present boundary; otherwise consult
	// the rule walker.
	let leftChar: string | undefined;
	if (leftText !== undefined && JINJA_COND_FULL_RE.test(leftText)) {
		leftChar = lastBoundaryCharOfCondBody(leftText);
	} else {
		const leftEnd = rightmostBoundary(left);
		if (leftEnd.kind === 'unknown') return true;
		leftChar = probeChar(leftEnd, 'right');
	}
	let rightChar: string | undefined;
	if (rightText !== undefined && JINJA_COND_FULL_RE.test(rightText)) {
		rightChar = firstBoundaryCharOfCondBody(rightText);
	} else {
		const rightEnd = leftmostBoundary(right);
		if (rightEnd.kind === 'unknown') return true;
		rightChar = probeChar(rightEnd, 'left');
	}

	if (leftChar === undefined || rightChar === undefined) return true;
	return charsRequireSpace(leftChar, rightChar, wordMatcher);
}

/**
 * Detect whether a template string is a "pure top-level multi-conditional" —
 * two or more `{% if %}...{% endif %}` segments that are IMMEDIATELY ADJACENT
 * (no non-tag, non-whitespace content between `{% endif %}` and the next `{% if %}`).
 *
 * Example → true:
 *   `{% if A %}body_A{% endif %}{% if B %}body_B{% endif %}`
 *   `{% if A %}body_A{% endif %}{% if B %}body_B{% endif %}{% if C %}body_C{% endif %}`
 *
 * Example → false (nested):
 *   `{% if outer %}{% if A %}...{% endif %}{% if B %}...{% endif %}{% endif %}`
 *   (inner conditionals are at depth 1, not top-level)
 *
 * Example → false (interleaved non-tag content):
 *   `{% if type_params %}...{% endif %}{{ params }}{% if return_type %}...{% endif %}`
 *   (`{{ params }}` is non-tag content between the top-level segments)
 *
 * This distinction is critical: seq templates for nonterminals often have multiple
 * top-level conditionals separated by non-conditional content (slots, literals).
 * Only synthetic exclusive-arm choices produce PURE adjacent multi-conditionals.
 *
 * Algorithm: scan depth-tracking; when a top-level `{% endif %}` is found, check
 * if the immediately-following non-whitespace content is another `{% if %}` or
 * `{%-`. If YES: increment adjacentRun. If NO: reset to 0 (broken by non-tag).
 * Return true iff adjacentRun ever reaches ≥ 1 (meaning ≥ 2 adjacent segments).
 */
function isTopLevelMultiConditional(cond: string): boolean {
	let depth = 0;
	let adjacentRun = 0; // count of consecutive adjacent top-level segments seen so far
	const TAG_RE = /\{%-? (?:if [^%]+|endif) -?%\}/g;
	let m: RegExpExecArray | null;
	while ((m = TAG_RE.exec(cond)) !== null) {
		const isEndif = m[0]!.includes('endif');
		if (!isEndif) {
			depth++;
		} else {
			depth--;
			if (depth === 0) {
				// Check adjacency: is the next non-whitespace content another `{% if %}`?
				const afterEnd = TAG_RE.lastIndex;
				const restTrimmed = cond.slice(afterEnd).trimStart();
				if (restTrimmed.startsWith('{%-') || restTrimmed.startsWith('{%')) {
					// Potentially adjacent — will be confirmed when the next `{% if %}` is found
					adjacentRun++;
					if (adjacentRun >= 1) return true; // ≥ 2 segments adjacent
				} else {
					// Non-tag content follows (slot, literal, or end) → reset
					adjacentRun = 0;
				}
			}
		}
	}
	return false;
}

/**
 * Absorb a leading space INTO a Jinja conditional body so the space only
 * renders when the conditional fires. Converts
 * `{% if x | isPresent %}body{% endif %}` →
 * `{% if x | isPresent %} body{% endif %}`.
 *
 * For top-level multi-conditional strings (synthetic exclusive choices from
 * `buildBranchRenderRuleFromForms`), each arm is a top-level segment:
 * `{% if A %}body_A{% endif %}{% if B %}body_B{% endif %}`. Each segment's
 * opening `{% if %}` needs a space absorbed so that whichever arm fires, the
 * preceding prefix gets a space.
 *
 * Uses `isTopLevelMultiConditional` to distinguish top-level multi-conditionals
 * from nested conditionals (where inner `{% if %}` tags must NOT get spaces).
 *
 * Falls back to unconditional space prepend if no tag matches.
 */
function absorbLeadingSpaceIntoConditional(cond: string): string {
	if (isTopLevelMultiConditional(cond)) {
		// Insert space after each TOP-LEVEL `{% if %}` opening tag, using
		// string-scan with depth tracking to identify the correct positions.
		return _insertAfterTopLevelIfTags(cond, ' ');
	}
	return cond.replace(/^(\{%-? if [^%]+-?%\})/, '$1 ');
}

/**
 * Absorb a trailing space INTO a Jinja conditional body so the space only
 * renders when the conditional fires. Converts
 * `{% if x | isPresent %}body{% endif %}` →
 * `{% if x | isPresent %}body {% endif %}`.
 *
 * For top-level multi-conditional strings (exclusive-arms synthetic choices,
 * produced by `buildBranchRenderRuleFromForms`), absorbs trailing space into
 * EVERY TOP-LEVEL `{% endif %}` tag so that whichever arm fires, the following
 * suffix gets a space:
 * `{% if A %}{{ a }}{% endif %}{% if B %}{{ b }}{% endif %}` →
 * `{% if A %}{{ a }} {% endif %}{% if B %}{{ b }} {% endif %}`.
 *
 * Single-conditional strings use `$` anchor (original behaviour).
 */
function absorbTrailingSpaceIntoConditional(cond: string): string {
	if (isTopLevelMultiConditional(cond)) {
		return _insertBeforeTopLevelEndifTags(cond, ' ');
	}
	return cond.replace(/(\{%-? endif -?%\})$/, ' $1');
}

/**
 * Insert `insert` immediately AFTER each top-level `{% if ... %}` opening tag
 * in `str`. "Top-level" means at depth 0 in the if/endif nesting.
 */
function _insertAfterTopLevelIfTags(str: string, insert: string): string {
	const TAG_RE = /(\{%-? if [^%]+-?%\}|\{%-? endif -?%\})/g;
	let depth = 0;
	let result = '';
	let lastEnd = 0;
	let m: RegExpExecArray | null;
	while ((m = TAG_RE.exec(str)) !== null) {
		const tag = m[1]!;
		const isIf = !tag.includes('endif');
		result += str.slice(lastEnd, m.index);
		result += tag;
		lastEnd = TAG_RE.lastIndex;
		if (isIf) {
			if (depth === 0) {
				// Top-level `{% if %}` — insert after it
				result += insert;
			}
			depth++;
		} else {
			depth--;
		}
	}
	result += str.slice(lastEnd);
	return result;
}

/**
 * Insert `insert` immediately BEFORE each top-level `{% endif %}` closing tag
 * in `str`. "Top-level" means the tag transitions from depth 1 to depth 0.
 */
function _insertBeforeTopLevelEndifTags(str: string, insert: string): string {
	const TAG_RE = /(\{%-? if [^%]+-?%\}|\{%-? endif -?%\})/g;
	let depth = 0;
	let result = '';
	let lastEnd = 0;
	let m: RegExpExecArray | null;
	while ((m = TAG_RE.exec(str)) !== null) {
		const tag = m[1]!;
		const isIf = !tag.includes('endif');
		result += str.slice(lastEnd, m.index);
		if (!isIf) {
			depth--;
			if (depth === 0) {
				// Top-level `{% endif %}` — insert before it
				result += insert;
			}
			result += tag;
		} else {
			result += tag;
			depth++;
		}
		lastEnd = TAG_RE.lastIndex;
	}
	result += str.slice(lastEnd);
	return result;
}

export function emitRule(rule: RenderRule, ctx: EmitCtx): string {
	switch (rule.type) {
		case STRING:
			// If a string literal carries `fieldName` (stamped by deleteWrapper
			// when peeling a field() wrapper), emit it as a slot reference rather
			// than the literal value. This makes
			// `field('operator', string('&&'))` emit `{{ operator }}` instead of
			// `&&` for field-wrapped operator strings.
			//
			// The original code also required `nonterminal: true`, but that
			// attribute is only stamped by the DSL enrich pass (dsl/enrich.ts)
			// and is NOT propagated by deleteWrapper at emitter time. Since
			// `fieldName` on a string can only come from deleteWrapper peeling a
			// `field()` wrapper, the `nonterminal` check is redundant and
			// incorrect — the presence of `fieldName` is sufficient.
			const stringFieldName = (rule as { fieldName?: string }).fieldName;
			if (stringFieldName !== undefined) {
				return emitScalarSlot(stringFieldName.toLowerCase());
			}
			// An optional anonymous separator literal (e.g. the trailing
			// `optional(',')` in a comma-list, stamped `multiplicity:'optional'`
			// by deleteWrapper) has no slot to gate on. Canonical render omits
			// it — emitting it unconditionally produces a spurious trailing
			// token (`f(a,b,)` instead of `f(a,b)`).
			if ((rule as { multiplicity?: Multiplicity }).multiplicity === 'optional') {
				return '';
			}
			return escapeLiteral(rule.value);

		case PATTERN: {
			// Patterns are NONTERMINAL slots (classifyByType), so they
			// emit a slot REFERENCE — not inline text. Previously pattern→'' and
			// enum→first-literal dropped the slot; once collectSlots makes them real
			// slots that fails slot-preservation. Prefer the registered slot (named
			// via field() → `{{ operator }}`, else the deterministic unnamed
			// `content` fallback). emitSlotReference handles multiplicity.
			const slot = lookupSlot(rule, ctx);
			if (slot !== undefined) return emitSlotReference(rule, slot);
			const patternFieldName = (rule as { fieldName?: string }).fieldName;
			if (patternFieldName !== undefined) return emitFieldNameSlot(patternFieldName.toLowerCase(), rule);
			return emitScalarSlot('content');
		}
		// PR-P: ENUM handled as CHOICE below via isEnumChoiceRule guard.

		case SEQ: {
			// Bug 6 fix (replaces Bug 1): insert spaces between consecutive seq
			// members that would merge into a single lexeme at render time. Uses
			// rule-tree literal walks + grammar wordMatcher to detect word
			// boundaries — grammar-derived rather than ad-hoc character classes.
			//
			// Emit each member, retaining a parallel [rule, emission] pair so the
			// boundary check can walk the original RenderRule subtrees for literal text,
			// while the output array holds the (possibly space-absorbed) strings.
			//
			// Absorb-into-conditional refinement (Bug 6 follow-up): when a
			// conditional sits between two literals, the inner-present space
			// (between conditional content and its outer neighbour) and the
			// outer-absent space (between the conditional's two non-conditional
			// neighbours, when the conditional is absent at runtime) are
			// INDEPENDENT decisions. To avoid double-emitting the outer-absent
			// space, we anchor it to the AFTER-conditional boundary only:
			//
			//   for `A {% if c %}…{% endif %} B`:
			//     - boundary (A, cond): inner-present check decides absorb-leading
			//     - boundary (cond, B): inner-present check decides absorb-trailing
			//       AND outer-absent check (A vs B) decides literal space between
			//       `{% endif %}` and B
			//
			// This produces master's canonical pattern:
			//   `A{% if c %} … {% endif %} B`  (inner-leading absorbed + outer
			//                                     space after endif)
			const emitted: Array<{ rule: RenderRule; text: string }> = [];
			for (const m of rule.members) {
				const text = emitRule(m, ctx);
				if (text !== '') emitted.push({ rule: m, text });
			}
			if (emitted.length === 0) return '';
			const out: string[] = [emitted[0]!.text];
			for (let i = 1; i < emitted.length; i++) {
				const prevRule = emitted[i - 1]!.rule;
				const currRule = emitted[i]!.rule;
				const currText = emitted[i]!.text;
				const prevText = out[out.length - 1]!;
				const currIsCond = JINJA_COND_FULL_RE.test(currText);
				const prevIsCond = JINJA_COND_FULL_RE.test(prevText);

				// Inner-present check: the boundary as written between prev and curr
				// when any conditional fires. Pass texts so conditional bodies
				// contribute their real first/last chars instead of being treated
				// as opaque slot emissions.
				const needsInnerSpace = needsSeqSpace(
					prevRule,
					currRule,
					ctx.wordMatcher,
					prevIsCond ? prevText : undefined,
					currIsCond ? currText : undefined
				);

				if (prevIsCond && !currIsCond) {
					// AFTER-conditional boundary: own the outer-absent space for prev.
					// If prev is absent at runtime, emitted[i-2] meets currRule. Use
					// rule-only check (no text) since the absent case has no
					// conditional body to consult.
					const beforePrev = emitted[i - 2]?.rule;
					const needsOuterSpace = beforePrev !== undefined && needsSeqSpace(beforePrev, currRule, ctx.wordMatcher);

					if (needsOuterSpace) {
						// Outer space handles BOTH the absent case (prev=empty,
						// beforePrev meets curr) AND the present case (prev's content
						// followed by space then curr). No need to also absorb-trailing.
						out.push(' ');
					} else if (needsInnerSpace) {
						// No outer space — must absorb-trailing so the inner-present
						// boundary still has a separator when prev fires.
						out[out.length - 1] = absorbTrailingSpaceIntoConditional(prevText);
					}
					out.push(currText);
				} else if (!prevIsCond && currIsCond) {
					// BEFORE-conditional boundary: handle inner-present absorb-leading
					// only. The outer-absent space (prev vs whatever comes after curr)
					// is owned by the AFTER-conditional boundary at the next iteration.
					if (needsInnerSpace) {
						out.push(absorbLeadingSpaceIntoConditional(currText));
					} else {
						out.push(currText);
					}
				} else if (prevIsCond && currIsCond) {
					// Both conditionals: absorb-leading into curr to handle the
					// inner-present boundary where both fire. This matches master's
					// pattern (no inter-conditional space; leading absorption on each
					// conditional handles its own internal needs).
					if (needsInnerSpace) {
						out.push(absorbLeadingSpaceIntoConditional(currText));
					} else {
						out.push(currText);
					}
				} else {
					// Neither is a conditional — simple literal boundary.
					if (needsInnerSpace) {
						out.push(' ');
					}
					out.push(currText);
				}
			}
			const seqBody = out.join('');
			// §D-2a seq-unit multiplicity (normalize inline hoist): a `seq` that
			// carries its OWN `multiplicity` is an inlined group body whose
			// optionality belongs to the sequence as a UNIT — its literals (`=`,
			// `->`, `extends`, …) must ride with, and be gated on, the seq's single
			// internal slot rather than being individually leaf-stamped (the BLOCKED
			// v2 regression). Gate the whole body on the seq's gating slot, reusing
			// the EXISTING optional-group machinery (`pickConditionalKey`).
			if ((rule as { multiplicity?: Multiplicity }).multiplicity === 'optional' && seqBody !== '') {
				// DRY: the gating-slot resolver is the single source of slot-count
				// truth (the inline hoist does NOT pre-count). A seq-unit multiplicity
				// group with >1 internal slot cannot be gated on one slot — it should
				// have stayed a VISIBLE group; warn (§2d).
				warnMultiSlotMultiplicityGroup(rule, ctx);
				const condKey = pickConditionalKey(rule, ctx);
				if (condKey) return `{% if ${condKey} | isPresent %}${seqBody}{% endif %}`;
			}
			return seqBody;
		}

		// Transparent wrappers — recurse into content. Variant / group have no
		// template-level surface of their own; the inner rule's emission is
		// what the renderer sees.
		// PR-P Task 2: TERMINAL case removed — TerminalRule deleted from RenderRule union.
		// phase-visibility-tightening: TOKEN and ALIAS cases deleted — both
		// collapse to `never` under RenderRule (WrapperPhase-only,
		// types/rule.ts). ALIAS is genuinely eliminated by
		// `applyWrapperDeletion` (pushes aliasedFrom/aliasNamed onto a leaf
		// attribute, returns content). TOKEN is NOT mechanically eliminated —
		// wrapper-deletion's TOKEN case PRESERVES the node (`{...rule,
		// content}`, wrapper-deletion.ts) — so the TokenRule→never assertion
		// is type-level + EMPIRICAL, not a code guarantee: 0 TOKEN hits
		// walking every AssembledNode.renderRule and every
		// deleteWrapper(linkRules[name]) hidden-helper target across all 3
		// grammars. If a top-level token(...) rule ever survives into
		// normalizedRules, the type lies — tracked with the preserve-token-
		// wrappers debt. Post-normalize aliasing is fully represented via the
		// `fieldName`/`aliasedFrom` leaf attributes other cases here already
		// read (see `pickConditionalKey`'s `contentFieldName` check).
		case VARIANT:
		case GROUP:
			return emitRule(rule.content, ctx);

		// PR2 Task 3.B3 / phase-visibility-tightening: wrapper rule types
		// (field / optional / repeat / repeat1) must not appear in RenderRule
		// input — they have been pushed down to leaf attributes.
		// FieldRule/OptionalRule/RepeatRule/Repeat1Rule collapse to `never`
		// under RenderRule (types/rule.ts), so the former defensive
		// `case FIELD: case OPTIONAL: ...: throw` arms are unreachable at the
		// type level and have been deleted — the exhaustiveness check in the
		// `default` branch below still catches any future non-conforming Rule
		// variant.

		case SYMBOL:
			return emitSymbol(rule, ctx);

		case CHOICE:
			return emitChoice(rule, ctx);

		case INDENT:
			return '\n  ';
		case DEDENT:
			return '\n';
		case NEWLINE:
			return '\n';

		case SUPERTYPE:
			// Supertype rules are dispatched at the modelType boundary
			// (supertype short-circuit in `emitOne`), not inside nested rule
			// walks. Reaching here means we're emitting an inline supertype
			// reference; defer to per-modelType emit by returning empty.
			return '';

		default: {
			const _exhaustive: never = rule;
			throw new Error(`emitRule: unhandled RenderRule.type ${(_exhaustive as RenderRule).type}`);
		}
	}
}

// ---------------------------------------------------------------------------
// Slot emission helpers
// ---------------------------------------------------------------------------

/**
 * Look up an `AssembledNonterminal` for a rule from two sources:
 *
 * 1. `slotByRuleId` — registered during assembly via `slot.sourceRuleIds`.
 *    Fast O(1) lookup. Fails when `simplifyRule` creates new rule objects
 *    without preserving the original ID, or when the FieldRule ID doesn't
 *    match the renderRule's symbol ID.
 *
 * 2. `ctx.ownerSlots` fallback — keyed by `storageName` (which equals
 *    `rule.fieldName.toLowerCase()` for named fields). Used when the
 *    slotByRuleId lookup fails. Safe because `storageName` is unique within
 *    a node's slot set.
 *
 * Returns `undefined` when neither source finds a slot (test fixtures,
 * transient sub-rules without a registered slot).
 */
function lookupSlot(rule: RenderRule, ctx: EmitCtx): AssembledNonterminal | undefined {
	// Primary: slotByRuleId (by registered rule ID)
	if (rule.id) {
		const byId = ctx.nodeMap.slotByRuleId.get(rule.id);
		if (byId) return byId;
	}
	// PRIMARY MISSED (no id, or id not registered — the rule-ID-not-preserved
	// gap). Try the name-based fallbacks and record the miss for the diagnostic.
	let recovered: AssembledNonterminal | undefined;
	let recoveredBy: SlotLookupMiss['recoveredBy'] = 'none';
	if (ctx.ownerSlots) {
		// Fallback A: fieldName → storageName. For grammar-named fields whose
		// FieldRule ID doesn't match the renderRule symbol's ID (because
		// simplifyRule created new objects without preserving the original ID),
		// look up the slot by the field name the symbol carries.
		const boundaryFieldName = (rule as { fieldName?: string }).fieldName;
		if (boundaryFieldName !== undefined) {
			const byFieldName = ctx.ownerSlots[boundaryFieldName.toLowerCase()];
			if (byFieldName) {
				recovered = byFieldName;
				recoveredBy = 'fieldName';
			}
		}
		// Fallback B: symbol name (exact, no underscore-stripping) → storageName.
		// For inferred slots derived from tree-sitter's node-types.json children,
		// the slot's storageName equals the dominant choice-arm kind name. When
		// a symbol in the renderRule has the same name as the slot's storageName,
		// map it. Only fires for symbols without fieldName (fieldName symbols are
		// handled by Fallback A). Uses the EXACT name (no leading-_ stripping) to
		// avoid false positives where `_hidden_rule` would match slot `hidden_rule`.
		if (
			recovered === undefined &&
			rule.type === SYMBOL &&
			(rule as { fieldName?: string }).fieldName === undefined &&
			!rule.name.startsWith('_')
		) {
			const exactName = rule.name.toLowerCase();
			const byExactName = ctx.ownerSlots[exactName];
			if (byExactName) {
				recovered = byExactName;
				recoveredBy = 'symbol-name';
			}
		}
	}
	if (DBG_SLOT_MISS) {
		SLOT_MISS_LOG.push({
			kind: ctx.currentKind,
			ruleType: rule.type,
			ruleId: rule.id,
			name: (rule as { name?: string }).name,
			fieldName: (rule as { fieldName?: string }).fieldName,
			recoveredBy
		});
	}
	return recovered;
}

/**
 * Project a rule's separator metadata onto a primitive `string`. The
 * shared `RuleBase.separator` is the nested `{value, trailing?, leading?}`
 * fact (PR-S); the rendering layer only needs the primitive textual
 * separator. Gates on Table 1 (`isNonterminalRuleType`) rather than a bare
 * `StringRule` check — ANY terminal-classified shape (a plain literal, a
 * sequence of literals, a group/variant wrapping one) has fixed,
 * compile-time-known text and can be embedded directly via `stringifyRule`.
 * A genuinely nonterminal shape (choice/repeat/symbol/pattern) has no fixed
 * text — returns `undefined` (NOT `stringifyRule`'s `''`) so the caller
 * falls back to the slot's per-value separator / `DEFAULT_JOIN_SEPARATOR`
 * instead of silently treating "unknown" as "empty" (the previous
 * behavior: a choice-shaped separator like `choice(',', ';')` would render
 * with NO separator character at all, since `''` short-circuits the `??`
 * fallback chain in `emitListSlot` just as effectively as a real value).
 * `isNonterminalRuleType` is typed over `Rule<'evaluate'>` but classifies
 * purely by `.type` + child shape — phase-agnostic in practice, same cast
 * pattern used throughout PR-S (e.g. wrapper-deletion.ts's OPTIONAL case).
 */
export function separatorToString(rule: RenderRule): string | undefined {
	const sep = (rule as { separator?: RuleBase<'normalize'>['separator'] }).separator;
	if (sep === undefined) return undefined;
	if (isNonterminalRuleType(sep.value as Rule<'evaluate'>)) return undefined;
	return stringifyRule(sep.value as RenderRule);
}

/**
 * True when `rule` carries a genuinely nonterminal separator (Table 1,
 * `isNonterminalRuleType`) — i.e. `separatorToString` returned `undefined`
 * NOT because there's no separator at all, but because the separator's
 * text isn't compile-time-known (a `choice(',', ';')`-shaped separator has
 * no single fixed literal). Distinguishes the two `undefined` cases so
 * `emitListSlot` can reference the transport struct's own runtime-resolved
 * `.separator` field (populated by render-module.ts's
 * `buildSeparatorKindMatchLines` from the wire-captured `_separator_kind`)
 * instead of silently falling through to `DEFAULT_JOIN_SEPARATOR`.
 */
function isNonterminalSeparatorRule(rule: RenderRule): boolean {
	const sep = (rule as { separator?: RuleBase<'normalize'>['separator'] }).separator;
	return sep !== undefined && isNonterminalRuleType(sep.value as Rule<'evaluate'>);
}

/**
 * Pick the join-filter name based on a rule's flank metadata, reading
 * trailing/leading attributes directly off the rule.
 *
 * When the rule itself carries no trailing/leading flags (e.g. the outer
 * choice in `fanOutSeqChoices`/`factorChoiceBranches` rebuilds), falls back
 * to the slot values' per-value trailing/leading flags — stamped by
 * `stampSeparatorOnValues` when the separator flowed from a repeat wrapper
 * through wrapper-deletion onto the slot entries.
 */
function selectJoinFilter(
	rule: RenderRule,
	slot?: AssembledNonterminal
): 'join' | 'joinWithTrailing' | 'joinWithLeading' | 'joinWithFlanks' {
	// trailing/leading now live NESTED inside `separator` (PR-S) — no more
	// top-level siblings on the rule to check directly.
	const sep = (rule as { separator?: RuleBase<'normalize'>['separator'] }).separator;
	// Presence check, not a specific `SeparatorFlankMode` value: a rule
	// reaching this (non-`'separatedList'`-classified) function can only
	// carry a `'mandatory'` flank here (a genuinely `'optional'` one would
	// already have routed the rule to `'separatedList'` classification
	// instead, see `isSeparatedListShape`, assemble.ts) — mirrors
	// `collect-slots.ts`'s `hasTrailing`/`hasLeading` derivation.
	const trailing = sep?.trailing !== undefined;
	const leading = sep?.leading !== undefined;
	if (trailing && leading) return 'joinWithFlanks';
	if (trailing) return 'joinWithTrailing';
	if (leading) return 'joinWithLeading';
	// Fallback: read trailing/leading from the slot's per-value entries.
	// This handles the case where the separator was stamped onto slot values
	// by `stampSeparatorOnValues` but the rule itself (a rebuilt choice from
	// `fanOutSeqChoices`/`factorChoiceBranches`) carries no flank flags.
	if (slot !== undefined) {
		const multiVal = slot.values.find((v) => v.multiplicity === 'array' || v.multiplicity === 'nonEmptyArray');
		if (multiVal) {
			const t = (multiVal as { trailing?: boolean }).trailing === true;
			const l = (multiVal as { leading?: boolean }).leading === true;
			if (t && l) return 'joinWithFlanks';
			if (t) return 'joinWithTrailing';
			if (l) return 'joinWithLeading';
		}
		// Also check the AssembledNonterminal's own hasTrailing/hasLeading flags.
		if (slot.hasTrailing && slot.hasLeading) return 'joinWithFlanks';
		if (slot.hasTrailing) return 'joinWithTrailing';
		if (slot.hasLeading) return 'joinWithLeading';
	}
	return 'join';
}

/**
 * Default join separator: a single space between elements when the
 * grammar didn't capture an explicit separator literal.
 */
const DEFAULT_JOIN_SEPARATOR = ' ';

/**
 * Emit Jinja for a list-shaped slot: `{{ name | join("…") }}` (or one
 * of the trailing/leading/flanks variants). Reads the separator from
 * the supplied rule's attributes.
 *
 * The slot name is the RAW (snake_case, singular) field/symbol name,
 * lowercased. We deliberately do NOT use `slot.propertyName` (camelCase +
 * pluralized) — templates reference slots by their raw storage name, and
 * the render-side transport struct fields use that same raw name, so the
 * two must match.
 *
 * When the optional `slot` back-pointer is supplied, the separator is
 * overridden to `""` (empty concatenation) when ALL values in the slot
 * are `token.immediate(…)` terminal entries. Immediate tokens must
 * adjoin the preceding token with no whitespace separator — e.g. the
 * content fragments of a Python string literal (`string_content`,
 * `interpolation`) must concatenate without separator.
 */
function emitListSlot(slotName: string, rule: RenderRule, slot?: AssembledNonterminal): string {
	const filter = selectJoinFilter(rule, slot);
	// Immediate-terminal check: when ALL slot values are terminal entries
	// stamped with `immediate: true` (produced by `token.immediate(…)` in
	// the grammar), the correct separator is the empty string — the tokens
	// must be concatenated adjacently, no whitespace between them.
	const allImmediate =
		slot !== undefined &&
		slot.values.length > 0 &&
		slot.values.every((v) => isTerminalValue(v) && v.immediate === true);
	// Separator resolution: prefer the rule's own separator (directly carried),
	// then fall back to the slot values' per-entry separator (stamped by
	// `stampSeparatorOnValues` when the separator flowed from a repeat wrapper
	// through wrapper-deletion). This handles the case where `fanOutSeqChoices`/
	// `factorChoiceBranches` rebuilt a choice carrying only the rule id (not the
	// separator), so the outer choice has no separator but the slot values do.
	const ruleSep = separatorToString(rule);
	// A genuinely nonterminal separator (e.g. `choice(',', ';')`) has no
	// fixed compile-time text — `ruleSep` is `undefined` for that reason,
	// not because there's no separator at all. Reference the transport
	// struct's own `.separator` field (a runtime-resolved `&str`, populated
	// by render-module.ts's `buildSeparatorKindMatchLines` from the wire-
	// captured `_separator_kind`) instead of falling through to
	// `DEFAULT_JOIN_SEPARATOR` — which would silently drop every separator
	// occurrence (see docs/superpowers/specs/2026-07-12-separator-as-slot-design.md).
	if (!allImmediate && ruleSep === undefined && isNonterminalSeparatorRule(rule)) {
		return `{{ ${slotName} | ${filter}(${slotName}.separator) }}`;
	}
	const slotValueSep: string | undefined =
		ruleSep === undefined && slot !== undefined
			? slot.values.find(
					(v): v is NodeOrTerminal & { separator: string } =>
						(v.multiplicity === 'array' || v.multiplicity === 'nonEmptyArray') &&
						typeof (v as { separator?: string }).separator === 'string'
				)?.separator
			: undefined;
	const sep = allImmediate ? '' : (ruleSep ?? slotValueSep ?? DEFAULT_JOIN_SEPARATOR);
	return `{{ ${slotName} | ${filter}("${escapeJinjaString(sep)}") }}`;
}

/**
 * Emit Jinja for a scalar slot: `{{ name }}`. The slot name is the RAW
 * (snake_case, singular) name lowercased.
 */
function emitScalarSlot(slotName: string): string {
	return `{{ ${slotName} }}`;
}

/**
 * Emit a slot reference from its registered back-pointer slot — the single
 * shared path for symbol, choice, and field-wrapped slots
 * (feedback_ruleid_backpointer). Identity and multiplicity come FROM THE SLOT
 * (its `storageName` is the render-struct field key), never re-derived per
 * call site from `rule.name` / `rule.fieldName`. The leaf `rule.multiplicity`
 * is honoured as a fallback for the case where wrapper push-down stamped the
 * leaf but slot derivation under-counted (the prior emitSymbol "Bug 5" path).
 */
function emitSlotReference(rule: RenderRule, slot: AssembledNonterminal): string {
	const slotName = (slot.storageName.replace(/^_+/, '') || 'children').toLowerCase();
	const mult = (rule as { multiplicity?: string }).multiplicity;
	if (mult === 'array' || mult === 'nonEmptyArray' || isMultiple(slot)) {
		return emitListSlot(slotName, rule, slot);
	}
	if (mult === 'optional' || !isRequired(slot)) {
		return `{% if ${slotName} | isPresent %}${emitScalarSlot(slotName)}{% endif %}`;
	}
	return emitScalarSlot(slotName);
}

/**
 * Fallback slot emission keyed on a field name + the leaf `rule.multiplicity`,
 * for a field-wrapped rule that has NO registered back-pointer slot (rare —
 * e.g. a deleteWrapper-stamped fieldName whose rule id / fieldName didn't
 * resolve in `lookupSlot`). Prefer `emitSlotReference` whenever a slot exists.
 */
function emitFieldNameSlot(slotName: string, rule: RenderRule): string {
	const mult = (rule as { multiplicity?: string }).multiplicity;
	if (mult === 'array' || mult === 'nonEmptyArray') {
		return emitListSlot(slotName, rule);
	}
	if (mult === 'optional') {
		return `{% if ${slotName} | isPresent %}${emitScalarSlot(slotName)}{% endif %}`;
	}
	return emitScalarSlot(slotName);
}

// ---------------------------------------------------------------------------
// Per-RenderRule.type helpers
// ---------------------------------------------------------------------------

// emitField, emitOptional, and emitRepeat were deleted in PR2 Task 3.B3.
// Those wrapper rule types (field / optional / repeat / repeat1) must not
// appear in RenderRule input — the wrapper attributes (fieldName /
// multiplicity / separator) are now on the leaf rules themselves and
// emitSymbol reads them directly. emitRule throws defensively if they appear.

/**
 * Derive the Jinja slot expression for a symbol ref, driven by the leaf
 * attributes set by the enrich / push-down pass (fieldName, multiplicity,
 * separator). In RenderRule input the wrapper rule types (field / optional /
 * repeat / repeat1) are absent; their slot facts live here instead.
 *
 * Multiplicity mapping:
 *  - 'array' | 'nonEmptyArray' → list form: `{{ name | join("…") }}`
 *  - 'optional'               → conditional scalar: `{% if name | isPresent %}{{ name }}{% endif %}`
 *  - undefined (required)     → scalar: `{{ name }}`
 */
function emitSymbol(rule: Extract<RenderRule, { type: 'SYMBOL' }>, ctx: EmitCtx): string {
	// Link-synthesized symbols carry their original literal text — render
	// it verbatim so keyword tokens lifted from `_kw_foo` helpers emit as
	// `foo` not as a slot reference.
	//
	// Chunk D2: a link-symbol renders its literal verbatim ONLY when it has no
	// `fieldName`. A field-wrapped link-operator literal (stamped by
	// deleteWrapper from a surrounding field() wrapper, e.g.
	// `field('operator', symbol(name='amp_amp', literal='&&'))`)
	// is a SLOT — it must fall through to the standard slot path below so the
	// renderer substitutes the actual operator from the parse tree (the now-
	// separate operator slot, Chunk D1) instead of the first arm's hard-coded
	// literal. (`binary_expression` / `comparison_operator` share one
	// `fieldName: 'operator'` across arms with different literals.) Emitting the
	// literal here would render `a < b` as the first arm's operator regardless
	// of the parsed operator and leave read unable to populate the slot.
	//
	// (debt PR-P1) Was `rule.source === 'link'`; `literal` is set ONLY by
	// link.ts's `canonicalizeRuleLiterals` alongside the deleted `source:
	// 'link'` stamp (its only writer), so checking `literal !== undefined`
	// directly is the exact same condition, structurally — not an inference,
	// the same write site produced both facts together.
	const symbolFieldName = (rule as { fieldName?: string }).fieldName;
	if (rule.literal !== undefined && symbolFieldName === undefined) {
		return escapeLiteral(rule.literal);
	}

	// PR2 Task 3.B3: check leaf-level attributes pushed down from wrapper
	// rules. fieldName is set when the symbol was formerly inside a FieldRule;
	// multiplicity when inside a RepeatRule or OptionalRule.
	if (symbolFieldName !== undefined) {
		// Prefer the registered slot (single source); fall back to the field
		// name + leaf multiplicity only when no slot is registered.
		const slot = lookupSlot(rule, ctx);
		if (slot) {
			return emitSlotReference(rule, slot);
		}
		return emitFieldNameSlot(symbolFieldName.toLowerCase(), rule);
	}

	// Slot back-pointer: when assembly registered a slot for this rule
	// position, emit a multiplicity-aware slot expression. In RenderRule
	// input, a symbol with a slot and no multiplicity attribute is a single
	// required value → scalar. Array / optional shapes carry their
	// multiplicity attribute from the push-down pass.
	//
	// Bug 2 fix: When the slot is UNNAMED (derived structurally from child
	// positions rather than a declared grammar field) AND the rule is a
	// group-lift symbol, we must NOT emit the helper-derived slot name — it is not
	// a real FROM/read-populated field. Instead, fall through to the
	// group-lift inlining path below. The inferred-slot path fires because
	// assemble registers a back-pointer for EVERY rule position it processes,
	// including auto-synthesized helpers. We skip it here so the group-lift
	// inline logic handles it correctly.
	const slot = lookupSlot(rule, ctx);
	if (slot && !(slot.isUnnamed && rule.type === SYMBOL && rule.inline === true)) {
		return emitSlotReference(rule, slot);
	}
	// Bug 2 fix: Group-lifted symbols that are auto-synthesized hidden helpers
	// (e.g. `_function_item_optional1`, `_type_parameters_repeat1`) must be
	// INLINED rather than emitted as opaque slot references. These helpers
	// exist in `ctx.nodeMap.nodes` as AssembledGroup nodes with their own
	// `renderRule`, but they do NOT correspond to declared fields that FROM/read
	// can populate — emitting `{{ function_item_optional1 }}` as a slot
	// reference produces unresolvable template variables.
	//
	// The correct behavior: look up the target in `ctx.nodeMap.nodes`. If it
	// has a `renderRule`, recursively emit that rule inline (matching the
	// simplify-side inlining that tree-sitter applies at parse time for
	// grammar.inline helpers). Guard against cycles with `visitingHelpers`.
	//
	// Non-hidden group-lift symbols (no leading `_`) or those without a
	// `renderRule` in the nodeMap fall through to the scalar slot path — they
	// represent proper named groups whose output is a single rendered string.
	// Hidden helper refs INLINE, mirroring tree-sitter's parse-time flattening of
	// `_`-rules. Provenance-free — keyed only on the structural `_` fact, NOT on
	// `source:'group-lift'`. The assembled `renderRule` is the inline source for
	// EVERY hidden ref (verified: emitRule(renderRule) === emitRule(deleteWrapper(raw))
	// for every hidden ref — the raw-rule path below is now only a fallback for the
	// rare hidden-without-renderRule case). Cycle guard via visitingHelpers.
	if (rule.type === SYMBOL && rule.inline === true) {
		const targetNode = ctx.nodeMap.nodes.get(rule.name);
		if (targetNode && 'renderRule' in targetNode && targetNode.renderRule) {
			if (ctx.visitingHelpers.has(rule.name)) {
				// Cycle guard — emit opaque scalar to break recursion
				const slotName = (rule.name.replace(/^_+/, '') || 'children').toLowerCase();
				return emitScalarSlot(slotName);
			}
			ctx.visitingHelpers.add(rule.name);
			try {
				const helperRenderRule = (targetNode as { renderRule: RenderRule }).renderRule;
				const helperBody = emitRule(helperRenderRule, ctx);
				const multiplicity = (rule as { multiplicity?: Multiplicity }).multiplicity;
				// Multiplicity is applied at the inlined SEQ UNIT (never the leaves —
				// pushing past the seq distributes optional onto bare literals which
				// the render walker drops). The inlined body is a seq with one
				// internal slot; apply the ref's seq-unit multiplicity to that slot:
				//   - array/nonEmptyArray → render the single slot with a seq-level
				//     join `{{ k | join(sep) }}`. The list's delimiter literals are
				//     absorbed into the separator (emitListSlot), so we do NOT emit
				//     the raw helperBody (which would inline them). Reuse the in-scope
				//     slot so name+separator reproduce the slot-path output exactly.
				//   - optional → gate the inlined body on the first declared field.
				if (multiplicity === 'array' || multiplicity === 'nonEmptyArray') {
					const listName = slot
						? (slot.storageName.replace(/^_+/, '') || 'children').toLowerCase()
						: (pickConditionalKey(helperRenderRule, ctx) ?? (rule.name.replace(/^_+/, '') || 'children').toLowerCase());
					return emitListSlot(listName, rule, slot);
				}
				if (multiplicity === 'optional' && helperBody) {
					const condKey =
						pickConditionalKey(helperRenderRule, ctx) ?? (rule.name.replace(/^_+/, '') || 'children').toLowerCase();
					return `{% if ${condKey} | isPresent %}${helperBody}{% endif %}`;
				}
				return helperBody;
			} finally {
				ctx.visitingHelpers.delete(rule.name);
			}
		}
		// Hidden without a renderRule node → fall through to the raw-rule fallback below.
	}
	// Hidden helper rules (e.g. python's `_import_list`) are inlined by
	// tree-sitter at parse time. Recurse into the target rule's body so
	// the helper's content surfaces in place — but guard against
	// left-recursive helpers like rust's `_let_chain` which references
	// itself (`_let_chain && let_condition`). When recursion is detected
	// we treat the symbol like an opaque scalar slot reference instead of
	// inlining, matching the walker's `seen.has('@'+name)` short-circuit.
	//
	// ctx.rules is the normalizedRules view (PR-137) — already RenderRule,
	// no deleteWrapper bridge needed. This is a fallback for the rare
	// hidden-without-renderRule case (the primary path above handles every
	// branch/group target); reached e.g. for hidden `pattern`/`multi`
	// modelType targets that never got an AssembledBranch/Group `renderRule`.
	if (rule.type === SYMBOL && rule.inline === true && ctx.rules[rule.name]) {
		if (ctx.visitingHelpers.has(rule.name)) {
			const slotName = (rule.name.replace(/^_+/, '') || 'children').toLowerCase();
			return emitScalarSlot(slotName);
		}
		ctx.visitingHelpers.add(rule.name);
		try {
			const target = ctx.rules[rule.name]!;
			const helperBody = emitRule(target, ctx);
			const multiplicity = (rule as { multiplicity?: Multiplicity }).multiplicity;
			// Seq-unit multiplicity (mirrors the renderRule path above): array →
			// seq-level join on the single slot; optional → gate the inlined body.
			if (multiplicity === 'array' || multiplicity === 'nonEmptyArray') {
				const listName = slot
					? (slot.storageName.replace(/^_+/, '') || 'children').toLowerCase()
					: (pickConditionalKey(target, ctx) ?? (rule.name.replace(/^_+/, '') || 'children').toLowerCase());
				return emitListSlot(listName, rule, slot);
			}
			// Bug 5 fix (hidden-helper path): when the surrounding context stamped
			// `multiplicity: 'optional'` onto this symbol (e.g. the symbol was
			// inside optional(_initializer)), wrap the inlined body in a conditional
			// keyed on the first field inside the helper. This matches the group-lift
			// path's behavior (lines 780-789) and ensures optional hidden helpers
			// produce `{% if condKey | isPresent %}body{% endif %}` not bare `body`.
			if (multiplicity === 'optional' && helperBody) {
				const condKey = pickConditionalKey(target, ctx) ?? (rule.name.replace(/^_+/, '') || 'children').toLowerCase();
				return `{% if ${condKey} | isPresent %}${helperBody}{% endif %}`;
			}
			return helperBody;
		} finally {
			ctx.visitingHelpers.delete(rule.name);
		}
	}
	// Fallback: bare kind-named scalar slot.
	const slotName = (rule.name.replace(/^_+/, '') || 'children').toLowerCase();
	return emitScalarSlot(slotName);
}

// §D-2a/§2d — one-time warning when a seq-unit multiplicity group (the inlined
// form produced by `inlineHiddenSeqRefs`) carries MORE THAN ONE distinct
// internal slot. Such a group cannot be soundly gated on a single
// `| isPresent` slot — it should have stayed a VISIBLE group. The emit-time
// gating-slot resolver is the SINGLE source of slot-count truth (DRY); the
// inline hoist deliberately does not pre-count. Diagnostic only — never throws.
const warnedMultiSlotGroups = new Set<string>();
function warnMultiSlotMultiplicityGroup(rule: Extract<RenderRule, { type: 'SEQ' }>, ctx: EmitCtx): void {
	const keys = new Set<string>();
	for (const m of rule.members) {
		const k = pickConditionalKey(m, ctx);
		if (k) keys.add(k);
	}
	if (keys.size <= 1) return;
	// Message label: the distinct internal slot names identify the offending
	// group precisely enough for a diagnostic (the hidden source-kind name
	// this seq was spliced from is not available here without a metadata
	// read — see `RuleBase.splicedBody`; the slot list is sufficient to find
	// the site, and dedup below is still keyed uniquely per kind + slot set).
	const slotsLabel = [...keys].join(',');
	const tag = `${ctx.currentKind ?? '?'}:${slotsLabel}`;
	if (warnedMultiSlotGroups.has(tag)) return;
	warnedMultiSlotGroups.add(tag);
	console.warn(
		`templates: multi-slot multiplicity group (kind '${ctx.currentKind ?? '?'}', slots ${[...keys].join(', ')}) — should have been a visible group`
	);
}

/**
 * Pick a Jinja conditional predicate name for a clause whose body emits a
 * slot. In RenderRule (wrapper-free) input, field wrappers no longer exist —
 * field metadata lives as `fieldName` on the leaf. Check leaf attributes
 * first, then transparent wrappers, then symbol/seq fallbacks.
 */
function pickConditionalKey(content: RenderRule, ctx: EmitCtx): string | undefined {
	// PR2 Task 3.B3: field wrappers no longer appear in RenderRule. Check
	// the leaf-level fieldName attribute instead (pushed down from FieldRule
	// by the enrich / push-down pass).
	const contentFieldName = (content as { fieldName?: string }).fieldName;
	if (contentFieldName !== undefined) {
		return contentFieldName.toLowerCase();
	}
	// Transparent wrappers — recurse. FIELD/TOKEN/ALIAS are WrapperPhase-only
	// (types/rule.ts) and never survive into RenderRule — applyWrapperDeletion
	// has already pushed their facts (fieldName / aliasedFrom+aliasNamed) onto
	// leaf attributes or unwrapped them to content, so those cases are
	// unreachable here and are not switch arms.
	// PR-P Task 2: TERMINAL case removed — TerminalRule deleted from RenderRule union.
	if (content.type === VARIANT || content.type === GROUP) {
		return pickConditionalKey(content.content, ctx);
	}
	// A seq with a member that has a field name — use that field.
	if (content.type === SEQ) {
		for (const m of content.members) {
			const key = pickConditionalKey(m, ctx);
			if (key) return key;
		}
		return undefined;
	}
	// A choice whose branches carry field names — gate on the first branch
	// that yields a key (mirrors the seq-member loop above). Without this,
	// a group body of `choice([field('name', …), …])` falls through to the
	// caller's `<rule>_optional1` fallback and gates on an unpopulated
	// inlined-group slot instead of the populated field.
	if (content.type === CHOICE) {
		for (const m of content.members) {
			const key = pickConditionalKey(m, ctx);
			if (key) return key;
		}
		return undefined;
	}
	// A symbol with a slot back-pointer — gate on its kind slot name.
	if (content.type === SYMBOL) {
		const sym = content as Extract<RenderRule, { type: 'SYMBOL' }>;
		return (sym.name.replace(/^_+/, '') || 'children').toLowerCase();
	}
	return undefined;
}

/**
 * Scan an emitted arm body for `emitChoice`'s union-routed path — the body is
 * the single authority on what the arm references (name- or id-based
 * partitioning of the render-tree arm is unreliable across choice rebuilds).
 *
 * `key` — the arm's discriminating slot: the first `{{ name }}` reference at
 * if-nesting depth 0 (an ungated reference is REQUIRED within the arm, so its
 * presence discriminates it — e.g. arrow_function's signature arm gates on
 * `parameters`, never on its leading OPTIONAL `type_parameters` block), else
 * the first gated reference.
 *
 * `needsGate` — whether the body has ANY depth-0 reference or literal text.
 * A body that is entirely self-gated blocks (e.g. range_pattern's
 * `{% if left %}…{% endif %}{% if content %}…{% endif %}` arm) must NOT get
 * an outer gate: nothing in it can leak, and wrapping it on one of its
 * optional refs would suppress the other forms.
 */
function scanArmBody(body: string): { key: string | undefined; needsGate: boolean } {
	const tagRe = /\{\{-?\s*([A-Za-z_]\w*)[^}]*\}\}|\{%-?\s*(if|endif)\b[^%]*?%\}/g;
	let depth = 0;
	let last = 0;
	let depth0Ref: string | undefined;
	let firstGated: string | undefined;
	let depth0Payload = false;
	for (let m = tagRe.exec(body); m !== null; m = tagRe.exec(body)) {
		if (depth === 0 && body.slice(last, m.index).trim() !== '') depth0Payload = true;
		last = m.index + m[0].length;
		if (m[2] === 'if') depth++;
		else if (m[2] === 'endif') depth--;
		else if (m[1] !== undefined) {
			if (depth === 0) {
				depth0Ref ??= m[1];
				depth0Payload = true;
			} else {
				firstGated ??= m[1];
			}
		}
	}
	if (depth === 0 && body.slice(last).trim() !== '') depth0Payload = true;
	return { key: depth0Ref ?? firstGated, needsGate: depth0Payload };
}

// emitOptional and emitRepeat were deleted in PR2 Task 3.B3.
// Those wrapper types no longer appear in RenderRule; their slot facts are
// now leaf attributes on the inner rule, consumed by emitSymbol directly.

function emitChoice(rule: Extract<RenderRule, { type: 'CHOICE' }>, ctx: EmitCtx): string {
	// Every choice that surfaces as data is a registered slot — there is no
	// "positional choice" anymore (kind-named slots). Look the slot up by the
	// choice's rule id (the deleteWrapper-stamped `fieldName` case resolves via
	// lookupSlot's fieldName→storageName fallback) and emit it FROM THE SLOT
	// through the shared `emitSlotReference` (feedback_ruleid_backpointer) — no
	// first-arm-pick (which dropped the other arms + the separator), no
	// per-site name re-derivation.
	const slot = lookupSlot(rule, ctx);
	if (slot) {
		// Union-slot routing (2026-07-21 design §2, PR 1): a fieldless
		// structural choice that routed its unnamed-nonterminal arms into ONE
		// union slot resolves here BY THE CHOICE's rule id. The MODEL made the
		// routing decision at slot-derivation time — do NOT re-run the gates
		// on this rule object: the render tree's choice can be a DIFFERENT
		// rebuild sharing the same id (fanOutSeqChoices/factorChoiceBranches),
		// whose arms partition differently (observed: python
		// dict_pattern_group1's render variant carries a fieldless seq arm).
		// The union-backed condition is structural: the slot was built FROM
		// this choice (unnamed + sourceRuleIds carries the choice id).
		//
		// Mixed row (named arms + union arms): the union slot is only PART of
		// the choice's surface. Emit every non-union arm as a presence-gated
		// block (gated on the arm's own discriminating slot, so its ambient
		// literals cannot leak when the parse took another arm), then the
		// union reference (self-gated by emitSlotReference when optional).
		// Arms are deduped BY GATE KEY — rebuild variants of one arm project
		// onto the same slots and must reference them once (the phi2 lesson:
		// never emit one block per arm for arms sharing slots); the longest
		// body wins (it carries the fullest literal shape, e.g. the seq[3]
		// `key ":" value` variant over the seq[2] rebuild).
		const choiceRuleId = (rule as { id?: string }).id;
		const unionBacked =
			(rule as { fieldName?: string }).fieldName === undefined &&
			slot.isUnnamed &&
			choiceRuleId !== undefined &&
			slot.sourceRuleIds.includes(choiceRuleId);
		if (unionBacked) {
			const unionName = (slot.storageName.replace(/^_+/, '') || 'children').toLowerCase();
			const blockByKey = new Map<string, string>();
			for (const arm of rule.members) {
				// The arm's EMITTED BODY is the authority on what it references —
				// structural partitioning is unreliable here because the render
				// tree's choice can be a different rebuild than the derive
				// tree's (arms appear as bare hidden symbols whose slots only
				// materialize through inline-splicing, e.g. python
				// dict_pattern_group1's `_key_value_pattern` kv arm). The
				// body's FIRST slot reference is the arm's discriminating
				// presence key, validated against the owning node's slots
				// (never gate on a name absent from the transport struct — an
				// Askama compile error):
				//  - no reference → nothing gateable (pure-literal arm) → skip;
				//  - reference IS the union slot → the arm is union-covered
				//    (e.g. ts rest_pattern's member_expression arm) — emitting
				//    a block would double-render it → skip.
				// Arms are deduped BY KEY — rebuild variants of one arm project
				// onto the same slots and must reference them once (the phi2
				// lesson: never one block per arm for arms sharing slots); the
				// longest body wins (fullest literal shape).
				const body = emitRule(arm as RenderRule, ctx);
				if (!body) continue;
				const { key, needsGate } = scanArmBody(body);
				if (key === undefined || key === unionName || ctx.ownerSlots?.[key] === undefined) continue;
				const block = needsGate ? `{% if ${key} | isPresent %}${body}{% endif %}` : body;
				const prev = blockByKey.get(key);
				if (prev === undefined || block.length > prev.length) blockByKey.set(key, block);
			}
			return [...blockByKey.values()].join('') + emitSlotReference(rule, slot);
		}
		return emitSlotReference(rule, slot);
	}
	// No back-pointer slot but a deleteWrapper-stamped fieldName (a `field()`
	// around a choice whose members carry no fieldName): emit by the field
	// name directly.
	const choiceFieldName = (rule as { fieldName?: string }).fieldName;
	if (choiceFieldName !== undefined) {
		return emitFieldNameSlot(choiceFieldName.toLowerCase(), rule);
	}
	// No slot, no fieldName. Two sub-cases:
	//
	// A) Synthetic exclusive-arms choice (from `buildBranchRenderRuleFromForms`):
	//    Identified by the sentinel id `__synthetic_exclusive_choice__`. Arms
	//    are mutually exclusive at runtime (grammar guarantee) but we must emit
	//    ALL of them as conditionals so every arm can fire. Each arm emits as
	//    `{% if disc | isPresent %}...{% endif %}`. Concatenating them is correct
	//    because only one fires at runtime.
	//
	//    JINJA_COND_FULL_RE's greedy match treats the concatenated result as a
	//    single conditional block, so the seq boundary checker sees the whole
	//    choice as one conditional unit (correct inner-present boundary; no
	//    outer-absent space inserted between prefix and a non-firing arm).
	//
	// B) Pure-literal choice (punctuation alternates, no data slot): emit
	//    only the first non-empty arm (original behaviour). This also covers
	//    real grammar choices with no registered slot (e.g. group-internal
	//    unregistered choices) — these use first-arm semantics.
	if (rule.id === '__synthetic_exclusive_choice__') {
		// Emit ALL arms — concatenated conditionals, only one fires at runtime.
		return rule.members.map((m) => emitRule(m, ctx)).join('');
	}
	// Pure-literal or unregistered choice — emit the first non-empty arm's text.
	for (const member of rule.members) {
		const text = emitRule(member, ctx);
		if (text) return text;
	}
	return '';
}

// ---------------------------------------------------------------------------
// Slot-preservation gate
//
// The correctness invariant for emitted templates is structural, not
// byte-level: each declared slot for a kind must appear at least once in
// the emitter's output.
//
// Set SITTIR_SLOT_PRESERVATION=0 to bypass for survey / iteration mode.
// ---------------------------------------------------------------------------

function escapeRegex(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Verify each declared slot for `node` appears at least once in `body`.
 * Throws on missing slots — the gate that ensures the emitter's structural
 * rewrite didn't drop a slot reference. This is a structural check, not a
 * byte-equivalence one: the emitter is free to choose its own Jinja
 * formatting as long as every slot is referenced somewhere in the output.
 *
 * Uses word-boundary regex (`\bname\b`) on each slot's `storageName`
 * (snake_case, matches what the emitter writes into templates) so references
 * inside `{{ name }}`, `{% if name | isPresent %}`, and
 * `{{ names | join(...) }}` all match.
 *
 * Skips terminal-only slots (all values are literal terminals with no
 * node-refs) — these are deterministic-value tokens emitted as literals, not
 * as named slot references (e.g. `opening`/`closing` enum-delimiter slots).
 */
function assertSlotPreservation(node: AssembledNode, body: string): void {
	const slots = allSlotsOf(node);
	if (slots.length === 0) return;
	const missing: string[] = [];
	const seen = new Set<string>();
	for (const slot of slots) {
		// Skip terminal-only slots — values are all literals (no node-refs).
		// The template emits their literal text, not a slot-name reference.
		if (kindsOf(slot).length === 0) continue;
		// Unnamed slots ARE checked (union-slot design PR 1, tightening the
		// KNOWN_ISSUES fallback-B gate hole): a REQUIRED positional slot whose
		// name and kinds never appear in the body is a dropped choice arm, and
		// must fail loudly at emit. The former blanket `isUnnamed` skip cited
		// `_semicolon`-style literal slots (terminal-only → still skipped
		// above), and hidden-helper choice arms (cross-arm relaxed to optional
		// → still skipped below); both documented false-positive classes
		// remain covered by the structural skips.
		// (debt PR-P1, item 4) REMOVED a former provenance-reading skip here:
		// `(slot.source as string) === 'link' || 'group-lift'`. Per the
		// doctrine, a compiler decision may not key on rule/slot provenance —
		// this had to become either a structural check or a proven-redundant
		// deletion. Verified EMPIRICALLY (not just by static reasoning) before
		// deleting: generated `node-model.json5` for all three grammars at the
		// pre-PR-P1 baseline (rust/typescript/python) has exactly ONE slot
		// anywhere with `source: 'link'` or `'group-lift'` — typescript's
		// `binary_expression.operator` (the exact case this comment used to
		// cite) — and its `values[]` are ALL terminals (zero node-refs), i.e.
		// `kindsOf(slot).length === 0`, which is ALREADY skipped by the check
		// directly above. So the condition never once changed this function's
		// outcome on any of the three grammars: it is provably redundant, not
		// merely theoretically so. Deleting it is a genuine dead-condition
		// removal — there is no structural fact to convert it to because it
		// never selected anything the prior check hadn't already excluded.
		// (Root cause: link-synthesized operator literals become terminal
		// `.value` entries with no node-ref, per `deriveValuesForRule`'s
		// SYMBOL case in node-map.ts — `kindsOf` is the exact structural
		// signal this check was informally approximating via provenance.)
		// Skip slots where no value is required (all are optional/array). These
		// arise from `mergeChoiceArmSlots` cross-arm relaxation: a slot present
		// in only some choice arms gets its values' multiplicities relaxed from
		// 'single' → 'optional'. Such slots may legitimately not appear in the
		// emitted body when the emitter takes the other arm. Checking them would
		// produce false positives for mutually exclusive choice alternatives.
		// Note: this also skips genuinely-declared optional slots, but those
		// are less likely to be completely dropped (the gate prioritizes catching
		// missing required slots over missing optional-slot guards).
		if (slot.values.length > 0 && slot.values.every((v) => v.multiplicity !== 'single')) continue;
		// Skip slots where every referenced kind already appears in the body
		// under its own name. This handles the `isSyntheticFieldWrapper` case:
		// when deleteWrapper on `field('constraint', optional(seq('extends',
		// field('type', _type))))` produces a slot named 'constraint' with a
		// single node-ref value of kind 'type', but the body correctly emits
		// `{% if type | isPresent %}...{{ type }}...` — the inner 'type' field
		// is rendered directly without naming the outer 'constraint' slot.
		// This is a legitimate inlining pattern where the outer container slot
		// delegates rendering entirely to its inner named slot.
		const slotKinds = kindsOf(slot);
		if (slotKinds.length > 0 && slotKinds.every((k) => new RegExp(`\\b${escapeRegex(k)}\\b`).test(body))) continue;
		// Skip unnamed slots whose every referenced kind is HIDDEN (leading
		// underscore): hidden refs are inline-expanded per the per-ref inline
		// convention (inline = hidden && !aliased), so the body contains their
		// EXPANSION, never their name — a textual check cannot see them (e.g.
		// python dictionary_comprehension's `_comprehension_clauses` slot,
		// rendered as `{{ for_in_clause }} {{ content | join(" ") }}`). Named
		// slots never take this path — a fielded ref emits by field name even
		// when hidden.
		if (slot.isUnnamed && slotKinds.length > 0 && slotKinds.every((k) => k.startsWith('_'))) continue;
		// Use storageName (raw snake_case grammar field name) — this is what
		// the emitter writes into templates, matching `rule.fieldName.toLowerCase()`.
		const name = slot.storageName;
		if (seen.has(name)) continue;
		seen.add(name);
		const re = new RegExp(`\\b${escapeRegex(name)}\\b`);
		if (!re.test(body)) {
			missing.push(name);
		}
	}
	if (missing.length > 0) {
		// Include slot details for debugging
		const slotDetails = missing.map((m) => {
			const s = slots.find((sl) => sl.storageName === m);
			const named = s?.isUnnamed ? 'positional' : 'named';
			return s
				? `${m}(${named},mult=${s.values.map((v) => v.multiplicity).join('|')},kinds=${kindsOf(s).join(',')})`
				: m;
		});
		throw new Error(
			`TemplateEmitter slot-preservation violation on kind '${node.kind}' (${node.modelType}): ` +
				`missing slot(s) [${slotDetails.join(', ')}] in body: ${JSON.stringify(body)}`
		);
	}
}

/**
 * Run TemplateEmitter over an entire NodeMap. Convenience wrapper around
 * the per-modelType dispatch in emit.ts so test fixtures and diagnostic
 * tools don't have to duplicate the loop.
 *
 * Dispatches each node by its modelType, calling the appropriate per-type
 * emitter method (emitLeaf, emitBranch, emitGroup), and
 * applies the skip-emit gate via classifyTemplateEmission.
 *
 * @param config Grammar, NodeMap, and optional grammar SHA
 * @returns EmittedTemplates with bodies keyed by kind
 */
export function runTemplateEmitter(config: EmitTemplatesConfig): EmittedTemplates {
	const te = new TemplateEmitter(config);
	for (const [, node] of config.nodeMap.nodes) {
		// Skip-emit gate: if this node doesn't need a template, skip entirely
		const templateEmission = classifyTemplateEmission(node);
		if (templateEmission !== 'emit') continue;

		// Dispatch by modelType — mirrors production emit.ts:183-218
		switch (node.modelType) {
			case 'pattern':
			case 'keyword':
			case 'enum':
				te.emitLeaf(node);
				break;
			case 'branch':
				te.emitBranch(node);
				break;
			case 'group':
				te.emitGroup(node);
				break;
			case 'supertype':
			case 'token':
			case 'multi':
				// These modelTypes don't emit templates; classifyTemplateEmission
				// should have already skipped them, so this is a safety fallback.
				break;
			// TEMPORARY: 'separatedList' shares 'branch's template emission —
			// see isSlotBearingCompound's doc comment (shared.ts).
			case 'separatedList':
				te.emitBranch(node);
				break;
			default: {
				const _exhaustive: never = node;
				throw new Error(`runTemplateEmitter: unhandled modelType ${(_exhaustive as AssembledNode).modelType}`);
			}
		}
	}
	return te.finalize();
}

/**
 * Write per-kind `.jinja` files to `outputDir`. Creates the directory
 * if it does not exist. After writing, scans the directory for any
 * `.jinja` files whose kind is not in `emitted` and removes them —
 * prevents stale files from accumulating across regenerations when a
 * rule is renamed or removed from the grammar.
 *
 * Preserves `.gitkeep` and non-`.jinja` files (README.md, etc.).
 */
export function writeJinjaTemplates(emitted: EmittedTemplates, outputDir: string): void {
	fs.mkdirSync(outputDir, { recursive: true });
	for (const [kind, body] of emitted.bodies) {
		fs.writeFileSync(join(outputDir, `${kind}.jinja`), body, 'utf-8');
	}
	// Stale-file cleanup — only touches `.jinja` files. Anything else
	// (`.gitkeep`, README) is left alone. A pre-existing `_meta.json`
	// from the short-lived sidecar era (prior to the joinby-filter
	// migration) is removed — the Jinja bodies carry every separator
	// now, so the sidecar is dead data.
	const existing = fs.readdirSync(outputDir);
	const legacyMeta = join(outputDir, '_meta.json');
	if (fs.existsSync(legacyMeta)) fs.rmSync(legacyMeta, { force: true });
	for (const name of existing) {
		if (!name.endsWith('.jinja')) continue;
		const kind = name.slice(0, -'.jinja'.length);
		if (!emitted.bodies.has(kind)) {
			fs.rmSync(join(outputDir, name), { force: true });
		}
	}
}
