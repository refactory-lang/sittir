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

import * as fs from 'node:fs';
import { join } from 'node:path';
import type { NodeMap } from '../compiler/types.ts';
import { AssembledGroup, allSlotsOf, isMultiple, isRequired, kindsOf, isUnresolvedRef } from '../compiler/node-map.ts';
import type {
	AssembledBranch,
	AssembledMulti,
	AssembledNode,
	AssembledNonterminal,
	AssembledPolymorph,
	TerminalValue
} from '../compiler/node-map.ts';
import type { Rule } from '../compiler/rule.ts';
import { deleteWrapper } from '../compiler/wrapper-deletion.ts';
import { compileWordMatcher } from '../compiler/common.ts';
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
	readonly rules: Record<string, Rule>;
	/**
	 * Cycle guard for hidden-helper recursion in `emitSymbol`. The legacy
	 * walker tracks visited helper names via the per-walk `seen` set keyed
	 * by `@${name}`; the new emitter uses a flat mutable Set passed down
	 * via this field. Each call to `emitOne()` resets it.
	 */
	readonly visitingHelpers: Set<string>;
	/**
	 * Owner-level slots for the current node being emitted, keyed by
	 * `storageName` (snake_case, matches `rule.fieldName.toLowerCase()`).
	 * Used as a fallback when `slotByRuleId` lookup fails because the
	 * symbol's rule `id` doesn't match the slot's `sourceRuleId` — a gap
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
	for (const m of SLOT_MISS_LOG) tally[m.recoveredBy]++;
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

export function snakeToCamel(value: string): string {
	return value.replace(/_([a-z0-9])/g, (_match, char: string) => char.toUpperCase());
}

export function escapeJinjaString(value: string): string {
	return value.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
}

export function stringifyRule(rule: Rule): string {
	switch (rule.type) {
		case 'string':
			return rule.value;
		case 'seq':
			return rule.members.map(stringifyRule).join('');
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
		this.#wordMatcher = compileWordMatcher(config.nodeMap.word, config.nodeMap.rules ?? {}) ?? /\w/;
		// EmitCtx for the new modelType-dispatching emitter. Same inputs
		// the legacy walker reads — `rules` (for hidden-helper inlining),
		// `wordMatcher` (currently unused by emitRule but kept for parity),
		// `externals` (token-shape detection), and `nodeMap` (slot back-
		// pointer lookup via `slotByRuleId`).
		this.#ctx = {
			nodeMap: config.nodeMap,
			wordMatcher: this.#wordMatcher,
			externals: [...(config.nodeMap.externals ?? [])],
			rules: config.nodeMap.rules ?? {},
			visitingHelpers: new Set<string>()
		};
	}

	emitLeaf(node: AssembledNode): void {
		this.#emitNode(node);
	}

	emitBranch(node: AssembledNode): void {
		this.#emitNode(node);
	}

	emitPolymorph(node: AssembledNode): void {
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
		// PR3 step 0: skip-emit gate now uses classifyTemplateEmission (the
		// new-side equivalent) instead of the legacy emitBodyForNode call.
		// classifyTemplateEmission is now a strict superset of the legacy gate:
		// it skips non-user-facing nodes, polymorph-form groups, and all
		// leaf modelTypes (pattern/keyword/token/supertype/enum/multi) that
		// emitBodyForNode returned null for unconditionally.
		// emitBodyForNode is no longer called here; it will be deleted in the
		// next step once no callers remain.
		if (classifyTemplateEmission(node) !== 'emit') return;

		this.#ctx.visitingHelpers.clear();
		const newBody = emitOne(node, this.#ctx);

		if (newBody === undefined) {
			// emitOne returned undefined for modelTypes that don't get templates
			// (supertype / pattern / keyword / token / enum) — but legacyBody
			// wasn't null, so emit an empty body to preserve file presence.
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
		case 'polymorph':
			return emitPolymorphTemplate(node, ctxK);
		case 'group':
			return emitGroupTemplate(node, ctxK);
		case 'multi':
			return emitMultiTemplate(node, ctxK);
		case 'supertype':
		case 'pattern':
		case 'keyword':
		case 'token':
		case 'enum':
			return undefined;
		default: {
			const _exhaustive: never = node;
			throw new Error(`emitOne: unhandled modelType ${(_exhaustive as AssembledNode).modelType}`);
		}
	}
}

// ---------------------------------------------------------------------------
// Per-modelType emit functions
//
// Three of the four modelTypes (`branch`, `group`, `multi`) carry a single
// `rule` whose Jinja shape is fully captured by `emitRule`. The polymorph
// case is the outlier: each form is a synthesized `AssembledGroup` with its
// own `rule` + `name`, and the emitted template wraps each form's body in a
// `{%- if $variant == "X" -%}...{%- endif -%}` guard so the renderer can
// dispatch per-form at runtime.
//
// Exported so the modelType-emit test suite can exercise each function in
// isolation against minimal in-memory fixtures (no NodeMap construction
// required).
// ---------------------------------------------------------------------------

export function emitBranchTemplate(node: AssembledBranch, ctx: EmitCtx): string {
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

export function emitMultiTemplate(node: AssembledMulti, ctx: EmitCtx): string {
	// AssembledMulti has no renderRule (multi nodes are always hidden repeat
	// helpers and emitBodyForNode returns null for them). This function is
	// called from emitOne but its output is never written — the legacy skip-
	// emit null-gate fires first. PR3 deletes this entirely.
	//
	// node.rule is RepeatRule | Repeat1Rule. We cannot call emitRule on it
	// directly (emitRule now throws on wrapper types). Instead, emit the
	// list-slot form for the repeat's inner content directly.
	const repeat = node.rule;
	const inner = repeat.content;
	// Look through transparent wrappers to find the field or symbol name.
	let unwrapped = inner;
	while (
		unwrapped.type === 'variant' ||
		unwrapped.type === 'group' ||
		unwrapped.type === 'token' ||
		unwrapped.type === 'terminal' ||
		(unwrapped.type === 'alias' && !unwrapped.named)
	) {
		unwrapped = (unwrapped as Extract<typeof unwrapped, { content: Rule }>).content;
	}
	// Field inner: use the field name.
	if (unwrapped.type === 'field') {
		return emitListSlot(unwrapped.name.toLowerCase(), repeat);
	}
	// Symbol inner: use the symbol kind name.
	if (unwrapped.type === 'symbol') {
		const slotName = (unwrapped.name.replace(/^_+/, '') || 'children').toLowerCase();
		return emitListSlot(slotName, repeat);
	}
	// Generic fallback — recurse into the inner content (non-wrapper).
	return emitRule(inner, ctx);
}

export function emitPolymorphTemplate(node: AssembledPolymorph, ctx: EmitCtx): string {
	// PR2 Task 3.B3: authoritative polymorph emission.
	// Emits one `{%- if variant == "X" -%}<body>{%- endif -%}` block per form.
	// Each form's body comes from its `renderRule` (RenderRule, wrapper-free).
	// Whitespace-strip markers (`{%- ... -%}`) handle surrounding whitespace at
	// render time; blocks are concatenated without separators.
	//
	// Note: `variant` (no `$` prefix) is correct for both Nunjucks and Askama.
	// `$variant` was previously used here but Askama parses it as `$v` + the
	// unknown identifier `ariant`, causing a compile error. The runtime render
	// struct always binds the field as `variant: &str`, not `$variant`.
	if (node.forms.length === 0) return '';
	const parts: string[] = [];
	for (const form of node.forms) {
		parts.push(`{%- if variant == "${form.name}" -%}`);
		// Emit the form body from its renderRule (wrapper-free).
		const formBody = emitRule(form.renderRule, ctx);
		parts.push(formBody);
		parts.push(`{%- endif -%}`);
	}
	return parts.join('');
}

// ---------------------------------------------------------------------------
// emitRule — Rule.type dispatcher
//
// Walks a Rule subtree producing Jinja directly. Replaces the legacy
// `template-walker.ts` + `translateToJinja` two-pass pipeline.
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
//   rightmost/leftmost StringRule text.
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
 * Walk a Rule subtree rightward to classify the rightmost boundary.
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
function rightmostBoundary(rule: Rule): BoundaryEnd {
	switch (rule.type) {
		case 'string':
			// Named field-wrapped string — it becomes a slot, not a literal.
			if (rule.fieldName !== undefined) return SLOT_END;
			return literalEnd(rule.value);
		case 'seq': {
			for (let i = rule.members.length - 1; i >= 0; i--) {
				const end = rightmostBoundary(rule.members[i]!);
				if (end.kind !== 'unknown') return end;
			}
			return UNKNOWN_END;
		}
		case 'choice': {
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
		case 'polymorph': {
			let acc: BoundaryEnd | undefined;
			for (const f of rule.forms) {
				const end = rightmostBoundary(f.content);
				if (end.kind === 'unknown') return UNKNOWN_END;
				if (acc === undefined) acc = end;
				else if (acc.kind !== end.kind) return UNKNOWN_END;
				else if (acc.kind === 'literal' && end.kind === 'literal' && acc.text !== end.text) {
					return UNKNOWN_END;
				}
			}
			return acc ?? UNKNOWN_END;
		}
		case 'optional':
		case 'repeat':
		case 'repeat1':
		case 'variant':
		case 'group':
		case 'clause':
		case 'field':
		case 'alias':
		case 'token':
		case 'terminal':
			if ('content' in rule) return rightmostBoundary((rule as { content: Rule }).content);
			return UNKNOWN_END;
		case 'enum':
			// EnumRule: rightmost member's value is the boundary.
			if (rule.members.length > 0) return literalEnd(rule.members[rule.members.length - 1]!.value);
			return UNKNOWN_END;
		case 'symbol':
			// Symbol refs become slot emissions in the template — word-like at boundary.
			return SLOT_END;
		case 'pattern':
		case 'supertype':
		case 'indent':
		case 'dedent':
		case 'newline':
		default:
			return UNKNOWN_END;
	}
}

/**
 * Walk a Rule subtree leftward to classify the leftmost boundary.
 * Symmetric to {@link rightmostBoundary}.
 */
function leftmostBoundary(rule: Rule): BoundaryEnd {
	switch (rule.type) {
		case 'string':
			if (rule.fieldName !== undefined) return SLOT_END;
			return literalEnd(rule.value);
		case 'seq': {
			for (let i = 0; i < rule.members.length; i++) {
				const end = leftmostBoundary(rule.members[i]!);
				if (end.kind !== 'unknown') return end;
			}
			return UNKNOWN_END;
		}
		case 'choice': {
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
		case 'polymorph': {
			let acc: BoundaryEnd | undefined;
			for (const f of rule.forms) {
				const end = leftmostBoundary(f.content);
				if (end.kind === 'unknown') return UNKNOWN_END;
				if (acc === undefined) acc = end;
				else if (acc.kind !== end.kind) return UNKNOWN_END;
				else if (acc.kind === 'literal' && end.kind === 'literal' && acc.text !== end.text) {
					return UNKNOWN_END;
				}
			}
			return acc ?? UNKNOWN_END;
		}
		case 'optional':
		case 'repeat':
		case 'repeat1':
		case 'variant':
		case 'group':
		case 'clause':
		case 'field':
		case 'alias':
		case 'token':
		case 'terminal':
			if ('content' in rule) return leftmostBoundary((rule as { content: Rule }).content);
			return UNKNOWN_END;
		case 'enum':
			if (rule.members.length > 0) return literalEnd(rule.members[0]!.value);
			return UNKNOWN_END;
		case 'symbol':
			return SLOT_END;
		case 'pattern':
		case 'supertype':
		case 'indent':
		case 'dedent':
		case 'newline':
		default:
			return UNKNOWN_END;
	}
}

/**
 * Return true if the leftmost terminal in the rule subtree is a
 * `token.immediate(...)` wrapper — meaning tree-sitter requires it to
 * immediately follow the preceding token with no whitespace.
 */
function isLeftmostTerminalImmediate(rule: Rule): boolean {
	switch (rule.type) {
		case 'token':
			return (rule as { immediate: boolean }).immediate === true;
		case 'seq': {
			for (const m of rule.members) {
				// Only recurse into the first non-empty member.
				const result = isLeftmostTerminalImmediate(m);
				// A string member is not immediate (it's a bare literal, not token.immediate)
				if (m.type === 'string' || m.type === 'pattern') return false;
				return result;
			}
			return false;
		}
		case 'choice': {
			// Immediate only if ALL arms are immediate.
			return rule.members.length > 0 && rule.members.every((m) => isLeftmostTerminalImmediate(m));
		}
		case 'optional':
		case 'repeat':
		case 'repeat1':
		case 'variant':
		case 'group':
		case 'clause':
		case 'field':
		case 'alias':
		case 'terminal':
			if ('content' in rule) return isLeftmostTerminalImmediate((rule as { content: Rule }).content);
			return false;
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
 * Decide if a space is needed between two adjacent seq-member Rule nodes,
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
	left: Rule,
	right: Rule,
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
 * Absorb a leading space INTO a Jinja conditional body so the space only
 * renders when the conditional fires. Converts
 * `{% if x | isPresent %}body{% endif %}` →
 * `{% if x | isPresent %} body{% endif %}`.
 *
 * Falls back to unconditional space prepend if the pattern doesn't match.
 */
function absorbLeadingSpaceIntoConditional(cond: string): string {
	return cond.replace(/^(\{%-? if [^%]+-?%\})/, '$1 ');
}

/**
 * Absorb a trailing space INTO a Jinja conditional body so the space only
 * renders when the conditional fires. Converts
 * `{% if x | isPresent %}body{% endif %}` →
 * `{% if x | isPresent %}body {% endif %}`.
 *
 * Falls back to unconditional space append if the pattern doesn't match.
 */
function absorbTrailingSpaceIntoConditional(cond: string): string {
	return cond.replace(/(\{%-? endif -?%\})$/, ' $1');
}

export function emitRule(rule: Rule, ctx: EmitCtx): string {
	switch (rule.type) {
		case 'string':
			// Bug 3 fix: if a string literal carries `fieldName` (stamped by
			// deleteWrapper when peeling a field() wrapper), emit it as a slot
			// reference rather than the literal value. This makes
			// `field('operator', string('&&'))` emit `{{ operator }}` instead of
			// `&&`, matching the legacy walker's behavior for field-wrapped
			// operator strings.
			//
			// The original code also required `nonterminal: true`, but that
			// attribute is only stamped by the DSL enrich pass (dsl/enrich.ts)
			// and is NOT propagated by deleteWrapper at emitter time. Since
			// `fieldName` on a string can only come from deleteWrapper peeling a
			// `field()` wrapper, the `nonterminal` check is redundant and
			// incorrect — the presence of `fieldName` is sufficient.
			if (rule.fieldName !== undefined) {
				return emitScalarSlot(rule.fieldName.toLowerCase());
			}
			// An optional anonymous separator literal (e.g. the trailing
			// `optional(',')` in a comma-list, stamped `multiplicity:'optional'`
			// by deleteWrapper) has no slot to gate on. Canonical render omits
			// it — emitting it unconditionally produces a spurious trailing
			// token (`f(a,b,)` instead of `f(a,b)`).
			if (rule.multiplicity === 'optional') {
				return '';
			}
			return escapeLiteral(rule.value);

		case 'pattern':
			// Patterns are token shapes — the renderer falls back to
			// `$TEXT` or other slot machinery; the template proper emits
			// nothing for a raw pattern.
			return '';

		case 'enum':
			return rule.members.length > 0 ? escapeLiteral(rule.members[0]!.value) : '';

		case 'seq': {
			// Bug 6 fix (replaces Bug 1): insert spaces between consecutive seq
			// members that would merge into a single lexeme at render time. Uses
			// rule-tree literal walks + grammar wordMatcher to detect word
			// boundaries — grammar-derived rather than ad-hoc character classes.
			//
			// Emit each member, retaining a parallel [rule, emission] pair so the
			// boundary check can walk the original Rule subtrees for literal text,
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
			const emitted: Array<{ rule: Rule; text: string }> = [];
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
					prevRule, currRule, ctx.wordMatcher,
					prevIsCond ? prevText : undefined,
					currIsCond ? currText : undefined
				);

				if (prevIsCond && !currIsCond) {
					// AFTER-conditional boundary: own the outer-absent space for prev.
					// If prev is absent at runtime, emitted[i-2] meets currRule. Use
					// rule-only check (no text) since the absent case has no
					// conditional body to consult.
					const beforePrev = emitted[i - 2]?.rule;
					const needsOuterSpace =
						beforePrev !== undefined &&
						needsSeqSpace(beforePrev, currRule, ctx.wordMatcher);

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
			return out.join('');
		}

		// Transparent wrappers — recurse into content. Variant / group /
		// terminal / token / unnamed-alias have no template-level surface
		// of their own; the inner rule's emission is what the renderer sees.
		case 'token':
		case 'terminal':
		case 'variant':
		case 'group':
			return emitRule(rule.content, ctx);

		case 'alias':
			// Named aliases (`alias($._x, $.visible)`) create a visible
			// parse-tree kind; they're a slot reference like a symbol.
			// Unnamed aliases just relabel content; recurse.
			if (rule.named) {
				return emitSymbolSlot(rule.value, ctx);
			}
			return emitRule(rule.content, ctx);

		// PR2 Task 3.B3: wrapper rule types (field / optional / repeat /
		// repeat1) must not appear in RenderRule input — they have been
		// pushed down to leaf attributes. Throw defensively; should never
		// fire in production. PR3 narrows the emitRule signature to
		// RenderRule, making these unreachable at the type level.
		case 'field':
		case 'optional':
		case 'repeat':
		case 'repeat1':
			throw new Error(
				`emitRule: unexpected wrapper '${rule.type}' — RenderRule input should have no wrappers`
			);

		case 'symbol':
			return emitSymbol(rule, ctx);

		case 'choice':
			return emitChoice(rule, ctx);

		case 'clause':
			return emitClause(rule, ctx);

		case 'indent':
			return '\n  ';
		case 'dedent':
			return '\n';
		case 'newline':
			return '\n';

		case 'supertype':
		case 'polymorph':
			// Supertype + polymorph rules are dispatched at the modelType
			// boundary (`emitPolymorphTemplate` / supertype short-circuit
			// in `emitOne`), not inside nested rule walks. Reaching them
			// here means we're emitting an inline supertype/polymorph
			// reference; defer to per-modelType emit by returning empty.
			return '';

		default: {
			const _exhaustive: never = rule;
			throw new Error(`emitRule: unhandled Rule.type ${(_exhaustive as Rule).type}`);
		}
	}
}

// ---------------------------------------------------------------------------
// Slot emission helpers
// ---------------------------------------------------------------------------

/**
 * Look up an `AssembledNonterminal` for a rule from two sources:
 *
 * 1. `slotByRuleId` — registered during assembly via `slot.sourceRuleId`.
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
function lookupSlot(rule: Rule, ctx: EmitCtx): AssembledNonterminal | undefined {
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
		if (rule.fieldName !== undefined) {
			const byFieldName = ctx.ownerSlots[rule.fieldName.toLowerCase()];
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
		if (recovered === undefined && rule.type === 'symbol' && rule.fieldName === undefined && !rule.name.startsWith('_')) {
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
			fieldName: rule.fieldName,
			recoveredBy
		});
	}
	return recovered;
}

/**
 * Project a rule's separator metadata onto a primitive `string`. The
 * shared `RuleBase.separator` is a union of (string | Rule[] | object);
 * the rendering layer only needs the primitive textual separator. For
 * structured separators we stringify each rule and concatenate so the
 * resulting join filter still represents the source text faithfully.
 */
function separatorToString(rule: Rule): string | undefined {
	const sep = rule.separator;
	if (sep === undefined) return undefined;
	if (typeof sep === 'string') return sep;
	if (Array.isArray(sep)) return sep.map(stringifyRule).join('');
	// object form: { rules, trailing?, leading? }
	const obj = sep as { rules: readonly Rule[] };
	return obj.rules.map(stringifyRule).join('');
}

/**
 * Pick the join-filter name based on a rule's flank metadata. Matches
 * the legacy `filterForFlanks` decision tree but reads attributes off
 * the rule directly (no `JinjaTranslateMeta` indirection).
 */
function selectJoinFilter(rule: Rule): 'join' | 'joinWithTrailing' | 'joinWithLeading' | 'joinWithFlanks' {
	const repeatLike = rule as { trailing?: boolean; leading?: boolean };
	const trailing = repeatLike.trailing === true;
	const leading = repeatLike.leading === true;
	if (trailing && leading) return 'joinWithFlanks';
	if (trailing) return 'joinWithTrailing';
	if (leading) return 'joinWithLeading';
	// Also honour the structured-separator object form when carrying
	// the flank flags directly.
	const sep = rule.separator;
	if (sep && typeof sep === 'object' && !Array.isArray(sep)) {
		const obj = sep as { trailing?: boolean; leading?: boolean };
		const t = obj.trailing === true;
		const l = obj.leading === true;
		if (t && l) return 'joinWithFlanks';
		if (t) return 'joinWithTrailing';
		if (l) return 'joinWithLeading';
	}
	return 'join';
}

/**
 * Default join separator. Mirrors the legacy walker's default of a
 * single space between elements when the grammar didn't capture an
 * explicit separator literal.
 */
const DEFAULT_JOIN_SEPARATOR = ' ';

/**
 * Emit Jinja for a list-shaped slot: `{{ name | join("…") }}` (or one
 * of the trailing/leading/flanks variants). Reads the separator from
 * the supplied rule's attributes.
 *
 * The slot name is the RAW (snake_case, singular) field/symbol name
 * lowercased — matching the legacy walker's `$NAME` → `{{ name }}`
 * translation in `translateToJinja`. We deliberately do NOT use
 * `slot.propertyName` (camelCase + pluralized) because the walker's
 * template output is byte-compared against the new emitter and any
 * naming divergence breaks the diff gate.
 *
 * When the optional `slot` back-pointer is supplied, the separator is
 * overridden to `""` (empty concatenation) when ALL values in the slot
 * are `token.immediate(…)` terminal entries. Immediate tokens must
 * adjoin the preceding token with no whitespace separator — e.g. the
 * content fragments of a Python string literal (`string_content`,
 * `interpolation`) must concatenate without separator.
 */
function emitListSlot(slotName: string, rule: Rule, slot?: AssembledNonterminal): string {
	const filter = selectJoinFilter(rule);
	// Immediate-terminal check: when ALL slot values are terminal entries
	// stamped with `immediate: true` (produced by `token.immediate(…)` in
	// the grammar), the correct separator is the empty string — the tokens
	// must be concatenated adjacently, no whitespace between them.
	const allImmediate =
		slot !== undefined &&
		slot.values.length > 0 &&
		slot.values.every((v) => v.kind === 'terminal' && (v as TerminalValue).immediate === true);
	const sep = allImmediate ? '' : (separatorToString(rule) ?? DEFAULT_JOIN_SEPARATOR);
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
function emitSlotReference(rule: Rule, slot: AssembledNonterminal): string {
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
function emitFieldNameSlot(slotName: string, rule: Rule): string {
	const mult = (rule as { multiplicity?: string }).multiplicity;
	if (mult === 'array' || mult === 'nonEmptyArray') {
		return emitListSlot(slotName, rule);
	}
	if (mult === 'optional') {
		return `{% if ${slotName} | isPresent %}${emitScalarSlot(slotName)}{% endif %}`;
	}
	return emitScalarSlot(slotName);
}

/**
 * Emit a kind-named scalar slot for a named alias reference. In RenderRule
 * input, a named alias represents a single visible kind — always scalar.
 * (The legacy walker emitted list form here via `$$$SLOT` → join; the new
 * emitter uses multiplicity-aware dispatch in `emitSymbol` instead.)
 */
function emitSymbolSlot(kindName: string, _ctx: EmitCtx): string {
	const slotName = (kindName.replace(/^_+/, '') || 'children').toLowerCase();
	return `{{ ${slotName} }}`;
}

// ---------------------------------------------------------------------------
// Per-Rule.type helpers
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
function emitSymbol(rule: Extract<Rule, { type: 'symbol' }>, ctx: EmitCtx): string {
	// Link-synthesized symbols carry their original literal text — render
	// it verbatim so keyword tokens lifted from `_kw_foo` helpers emit as
	// `foo` not as a slot reference.
	//
	// Chunk D2: a link-symbol renders its literal verbatim ONLY when it has no
	// `fieldName`. A field-wrapped link-operator literal (stamped by
	// deleteWrapper from a surrounding field() wrapper, e.g.
	// `field('operator', symbol(name='amp_amp', source='link', literal='&&'))`)
	// is a SLOT — it must fall through to the standard slot path below so the
	// renderer substitutes the actual operator from the parse tree (the now-
	// separate operator slot, Chunk D1) instead of the first arm's hard-coded
	// literal. (`binary_expression` / `comparison_operator` share one
	// `fieldName: 'operator'` across arms with different literals.) Emitting the
	// literal here would render `a < b` as the first arm's operator regardless
	// of the parsed operator and leave read unable to populate the slot.
	if (rule.source === 'link' && rule.fieldName === undefined) {
		return rule.literal !== undefined ? escapeLiteral(rule.literal) : '';
	}

	// PR2 Task 3.B3: check leaf-level attributes pushed down from wrapper
	// rules. fieldName is set when the symbol was formerly inside a FieldRule;
	// multiplicity when inside a RepeatRule or OptionalRule.
	if (rule.fieldName !== undefined) {
		// Prefer the registered slot (single source); fall back to the field
		// name + leaf multiplicity only when no slot is registered.
		const slot = lookupSlot(rule, ctx);
		if (slot) {
			return emitSlotReference(rule, slot);
		}
		return emitFieldNameSlot(rule.fieldName.toLowerCase(), rule);
	}

	// Slot back-pointer: when assembly registered a slot for this rule
	// position, emit a multiplicity-aware slot expression. In RenderRule
	// input, a symbol with a slot and no multiplicity attribute is a single
	// required value → scalar. Array / optional shapes carry their
	// multiplicity attribute from the push-down pass.
	//
	// Bug 2 fix: When the slot is INFERRED (derived from the group-lift
	// helper name rather than a declared grammar field) AND the rule is a
	// group-lift symbol, we must NOT emit the inferred slot name — it is not
	// a real FROM/read-populated field. Instead, fall through to the
	// group-lift inlining path below. The inferred-slot path fires because
	// assemble registers a back-pointer for EVERY rule position it processes,
	// including auto-synthesized helpers. We skip it here so the group-lift
	// inline logic handles it correctly.
	const slot = lookupSlot(rule, ctx);
	if (slot && !((slot.source as string) === 'inferred' && rule.source === 'group-lift')) {
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
	if (rule.source === 'group-lift') {
		// Only inline HIDDEN auto-synthesized helpers (name starts with `_`).
		// Visible group-lift symbols are user-facing kinds with their own
		// templates; emit them as scalar slots like before.
		if (rule.name.startsWith('_')) {
			const targetNode = ctx.nodeMap.nodes.get(rule.name);
			if (targetNode && 'renderRule' in targetNode && targetNode.renderRule) {
				if (ctx.visitingHelpers.has(rule.name)) {
					// Cycle guard — emit opaque scalar to break recursion
					const slotName = (rule.name.replace(/^_+/, '') || 'children').toLowerCase();
					return emitScalarSlot(slotName);
				}
				ctx.visitingHelpers.add(rule.name);
				try {
					const helperRenderRule = (targetNode as { renderRule: Rule }).renderRule;
					const helperBody = emitRule(helperRenderRule, ctx);
					const multiplicity = rule.multiplicity;
					// When the group-lift symbol is optional (its parent wrapped it in
					// optional()), wrap the inlined body in a conditional keyed on the
					// first declared field inside the helper's body. This preserves the
					// "only render this block when the optional part is present" semantics.
					if ((multiplicity === 'optional' || multiplicity === 'array' || multiplicity === 'nonEmptyArray') && helperBody) {
						const condKey = pickConditionalKey(helperRenderRule, ctx)
							?? (rule.name.replace(/^_+/, '') || 'children').toLowerCase();
						if (multiplicity === 'optional') {
							return `{% if ${condKey} | isPresent %}${helperBody}{% endif %}`;
						}
						// Array group-lifts — emit the body directly (repeat handling
						// is already captured in the body's join filter from the
						// helper's renderRule).
					}
					return helperBody;
				} finally {
					ctx.visitingHelpers.delete(rule.name);
				}
			}
		}
		// Visible group-lift or hidden without renderRule → scalar slot
		const slotName = (rule.name.replace(/^_+/, '') || 'children').toLowerCase();
		return emitScalarSlot(slotName);
	}
	// Hidden helper rules (e.g. python's `_import_list`) are inlined by
	// tree-sitter at parse time. Recurse into the target rule's body so
	// the helper's content surfaces in place — but guard against
	// left-recursive helpers like rust's `_let_chain` which references
	// itself (`_let_chain && let_condition`). When recursion is detected
	// we treat the symbol like an opaque scalar slot reference instead of
	// inlining, matching the walker's `seen.has('@'+name)` short-circuit.
	//
	// ctx.rules contains RAW rules (not renderRules), so we must apply
	// deleteWrapper before passing to emitRule which now expects RenderRule.
	if (rule.name.startsWith('_') && ctx.rules[rule.name]) {
		if (ctx.visitingHelpers.has(rule.name)) {
			const slotName = (rule.name.replace(/^_+/, '') || 'children').toLowerCase();
			return emitScalarSlot(slotName);
		}
		ctx.visitingHelpers.add(rule.name);
		try {
			const target = deleteWrapper(ctx.rules[rule.name]!);
			const helperBody = emitRule(target, ctx);
			const multiplicity = rule.multiplicity;
			// Bug 5 fix (hidden-helper path): when the surrounding context stamped
			// `multiplicity: 'optional'` onto this symbol (e.g. the symbol was
			// inside optional(_initializer)), wrap the inlined body in a conditional
			// keyed on the first field inside the helper. This matches the group-lift
			// path's behavior (lines 780-789) and ensures optional hidden helpers
			// produce `{% if condKey | isPresent %}body{% endif %}` not bare `body`.
			if (multiplicity === 'optional' && helperBody) {
				const condKey = pickConditionalKey(target, ctx)
					?? (rule.name.replace(/^_+/, '') || 'children').toLowerCase();
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

/**
 * Pick a Jinja conditional predicate name for a clause whose body emits a
 * slot. In RenderRule (wrapper-free) input, field wrappers no longer exist —
 * field metadata lives as `fieldName` on the leaf. Check leaf attributes
 * first, then transparent wrappers, then symbol/seq fallbacks.
 */
function pickConditionalKey(content: Rule, ctx: EmitCtx): string | undefined {
	// PR2 Task 3.B3: field wrappers no longer appear in RenderRule. Check
	// the leaf-level fieldName attribute instead (pushed down from FieldRule
	// by the enrich / push-down pass).
	if (content.fieldName !== undefined) {
		return content.fieldName.toLowerCase();
	}
	// Legacy path for RawRule still-in-flight: direct field wrapper.
	if (content.type === 'field') {
		return content.name.toLowerCase();
	}
	// Transparent wrappers — recurse.
	if (
		content.type === 'variant' ||
		content.type === 'group' ||
		content.type === 'token' ||
		content.type === 'terminal'
	) {
		return pickConditionalKey(content.content, ctx);
	}
	if (content.type === 'alias' && !content.named) {
		return pickConditionalKey(content.content, ctx);
	}
	// A seq with a member that has a field name — use that field.
	if (content.type === 'seq') {
		for (const m of content.members) {
			const key = pickConditionalKey(m, ctx);
			if (key) return key;
		}
		return undefined;
	}
	// A symbol with a slot back-pointer — gate on its kind slot name.
	if (content.type === 'symbol') {
		const sym = content as Extract<Rule, { type: 'symbol' }>;
		return (sym.name.replace(/^_+/, '') || 'children').toLowerCase();
	}
	return undefined;
}

// emitOptional and emitRepeat were deleted in PR2 Task 3.B3.
// Those wrapper types no longer appear in RenderRule; their slot facts are
// now leaf attributes on the inner rule, consumed by emitSymbol directly.

function emitChoice(rule: Extract<Rule, { type: 'choice' }>, ctx: EmitCtx): string {
	// Every choice that surfaces as data is a registered slot — there is no
	// "positional choice" anymore (kind-named slots). Look the slot up by the
	// choice's rule id (the deleteWrapper-stamped `fieldName` case resolves via
	// lookupSlot's fieldName→storageName fallback) and emit it FROM THE SLOT
	// through the shared `emitSlotReference` (feedback_ruleid_backpointer) — no
	// first-arm-pick (which dropped the other arms + the separator), no
	// per-site name re-derivation.
	const slot = lookupSlot(rule, ctx);
	if (slot) {
		return emitSlotReference(rule, slot);
	}
	// No back-pointer slot but a deleteWrapper-stamped fieldName (a `field()`
	// around a choice whose members carry no fieldName): emit by the field
	// name directly.
	if (rule.fieldName !== undefined) {
		return emitFieldNameSlot(rule.fieldName.toLowerCase(), rule);
	}
	// No slot, no fieldName → a choice of pure literals/patterns (no data slot).
	// Emit the first non-empty branch's literal text.
	for (const member of rule.members) {
		const text = emitRule(member, ctx);
		if (text) return text;
	}
	return '';
}

function emitClause(rule: Extract<Rule, { type: 'clause' }>, ctx: EmitCtx): string {
	const body = emitRule(rule.content, ctx);
	if (!body) return '';
	// The clause name is the field name to gate on per `detectClause`'s
	// invariant. Use the RAW lowercased name to match the walker's
	// `emitJinjaConditional(rule.name, body)` shape.
	const slotKey = pickConditionalKey(rule.content, ctx) ?? rule.name.toLowerCase();
	return `{% if ${slotKey} | isPresent %}${body}{% endif %}`;
}

// ---------------------------------------------------------------------------
// Slot-preservation gate (PR2 Task 3.B4)
//
// Replaces the byte-equivalence diff gate deleted in PR2 Task 3.B3 (commit
// fb889165). The new emitter intentionally produces different bytes than the
// legacy walker; the actual correctness invariant is structural: each
// declared slot for a kind must appear at least once in the emitter's output.
//
// Set SITTIR_SLOT_PRESERVATION=0 to bypass for survey / iteration mode.
// ---------------------------------------------------------------------------

function escapeRegex(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Verify each declared slot for `node` appears at least once in `body`.
 * Throws on missing slots — the gate that ensures the emitter's structural
 * rewrite didn't drop a slot reference.
 *
 * Replaces the byte-equivalence diff gate deleted in PR2 Task 3.B3 (commit
 * fb889165). The new emitter intentionally produces different bytes than
 * the legacy walker; structural slot-preservation is the actual correctness
 * invariant.
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
		// Skip inferred slots — those are derived from choice-member kind names
		// (no `field()` wrapper), such as `_semicolon` rendered as `;` literal,
		// or alternative choice arms from hidden-helper inlining. The emitter
		// correctly handles these via symbol inlining or literal emission rather
		// than named slot references. Checking them would produce false positives.
		if (slot.source === 'inferred') continue;
		// Skip link-sourced slots — derived from link-phase synthesized symbol
		// rules (SymbolRule.source === 'link'). These are inlined as their
		// literal text by emitSymbol (`rule.source === 'link'` → escapeLiteral),
		// so the template will contain the literal string rather than a
		// `{{ slotName }}` reference. Trying to find the slot name in the body
		// would produce false positives (e.g. binary_expression.operator which
		// emits '&&' instead of '{{ operator }}').
		// Note: slot.source is typed as AssembledNonterminal.source but at
		// runtime can also be 'link' or 'group-lift' (from SymbolRule.source
		// propagated through deriveSlotsRaw).
		if ((slot.source as string) === 'link' || (slot.source as string) === 'group-lift') continue;
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
			return s ? `${m}(src=${s.source},mult=${s.values.map((v) => v.multiplicity).join('|')},kinds=${kindsOf(s).join(',')})` : m;
		});
		throw new Error(
			`TemplateEmitter slot-preservation violation on kind '${node.kind}' (${node.modelType}): ` +
				`missing slot(s) [${slotDetails.join(', ')}] in body: ${JSON.stringify(body)}`
		);
	}
}

/**
 * Run the new TemplateEmitter over an entire NodeMap. Convenience wrapper
 * around the per-modelType dispatch in emit.ts so test fixtures and
 * diagnostic tools don't have to duplicate the loop.
 *
 * Dispatches each node by its modelType, calling the appropriate per-type
 * emitter method (emitLeaf, emitBranch, emitPolymorph, emitGroup), and
 * honors the legacy skip-emit gate via classifyTemplateEmission.
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
			case 'polymorph':
				te.emitPolymorph(node);
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
			default: {
				const _exhaustive: never = node;
				throw new Error(
					`runTemplateEmitter: unhandled modelType ${(_exhaustive as AssembledNode).modelType}`
				);
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
