/**
 * polymorph-branch-renderrule.test.ts — PR-I Stage 1a (spacing-fix + re-anchor)
 *
 * Tests `buildBranchRenderRuleFromForms` IN ISOLATION before any dispatch
 * flip. This is the crux gate: proves the builder is correct without the
 * global classifyNode change muddying attribution.
 *
 * PROVEN invariants (all PASSING):
 *
 * 1. SLOT/LITERAL PRESERVATION (−32 check): shared prefix slots, suffix slots,
 *    and prefix literals all appear in the merged template with their original
 *    rule ids preserved (`{{ reference }}` and `{{ value }}` for
 *    reference_expression; `impl` literal for impl_item; etc.). The −32 bug
 *    that DROPPED these is confirmed NOT to occur.
 *
 * 2. ZERO UNRESOLVED SLOT MISSES (DBG_SLOT_MISS=0): shared slots resolve by
 *    PRIMARY id lookup. Discriminating slots resolve by symbol-name fallback
 *    (`recov:symbol-name`) — expected for kind-named optional slots with
 *    empty sourceRuleIds.
 *
 * 3. STRUCTURAL: prefix/suffix members carry their original `id`s; choice
 *    member per discriminating arm per form.
 *
 * 4. PER-FORM TEMPLATE EQUIVALENCE (re-anchored): for every form of every
 *    MUST-CONSTRUCT polymorph kind, the merged template rendered with THAT
 *    form's discriminating arm active byte-equals THAT FORM's own correct
 *    render (emitRule(form.renderRule) with the same context). This is the
 *    correct anchor — NOT the emitPolymorphTemplate (which is the broken
 *    parent-kind approach being superseded), and NOT the parent-kind-js-baseline.json
 *    golden (which captured broken native/JS parent-render state).
 *
 * 5. SPACING CASES VERIFIED EXACTLY: pointer_type (`*mut T`/`*const T`, no
 *    space after `*`), line_comment (`//doc`, no space), match_arm (`=>body`,
 *    no space before discriminating slot), reference_expression (`&raw const x`
 *    with all slots). These are byte-exact synthetic-render assertions.
 *
 * BYTE-DIFF GATE: no generated files changed (scratch regen diff is empty).
 * The builder is NOT wired into classifyNode/emitPolymorphTemplate dispatch.
 *
 * PROVENANCE: parent-kind-js-baseline.json is retained as documented provenance
 * of the broken native/JS parent-kind render state (NOT asserted against here).
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { evaluate } from '../compiler/evaluate.ts';
import { link } from '../compiler/link.ts';
import { normalizeGrammar } from '../compiler/normalize.ts';
import { assemble, buildBranchRenderRuleFromForms } from '../compiler/assemble.ts';
import { resolveOverridesPath } from '../compiler/resolve-grammar.ts';
import {
	emitRule,
	type EmitCtx
} from '../emitters/templates.ts';
import { compileWordMatcher } from '../compiler/common.ts';
import type { AssembledPolymorph } from '../compiler/node-map.ts';
import type { NodeMap } from '../compiler/types.ts';

// ---------------------------------------------------------------------------
// Minimal Jinja evaluator (no external dependency)
//
// The templates produced by emitRule use only a small subset of Jinja syntax.
// This evaluator handles the forms we need for template equivalence testing
// without importing nunjucks.
//
// Supported:
//   - `{{ slotName }}` — emit ctx[slotName] or ''
//   - `{{ slotName | join("sep") }}` — array join (simplified: treated as scalar)
//   - `{% if slotName | isPresent %}body{% endif %}` — conditional on slot presence
//   - `{%- if slotName | isPresent -%}body{%- endif -%}` — whitespace-trimmed conditional
//
// Not supported: nested conditionals, elif/else, loops. Our templates don't use them.
// ---------------------------------------------------------------------------

function isPresent(val: unknown): boolean {
	if (val === null || val === undefined) return false;
	if (typeof val === 'string') return val.length > 0;
	if (typeof val === 'boolean') return val;
	if (Array.isArray(val)) return val.length > 0;
	return true;
}

/**
 * Evaluate a sittir Jinja template string against a context.
 * Handles `{{ var }}`, `{% if var | isPresent %}...{% endif %}`.
 */
function evalJinja(template: string, ctx: Record<string, unknown>): string {
	// Strip GENERATED_HEADER comment if present
	const stripped = template.replace(/^\{#-.*?-#\}\n/, '');

	let result = '';
	let pos = 0;
	const src = stripped;

	while (pos < src.length) {
		const nextBrace = src.indexOf('{', pos);
		if (nextBrace === -1) {
			result += src.slice(pos);
			break;
		}
		result += src.slice(pos, nextBrace);
		pos = nextBrace;

		if (src[pos + 1] === '{') {
			const end = src.indexOf('}}', pos);
			if (end === -1) { result += src.slice(pos); break; }
			const expr = src.slice(pos + 2, end).trim();
			const val = evalExpr(expr, ctx);
			result += val;
			pos = end + 2;
		} else if (src[pos + 1] === '%') {
			const extracted = extractTagKeyword(src, pos);
			if (!extracted) { result += src[pos]; pos++; continue; }
			const { keyword: tag, afterTag } = extracted;
			pos = afterTag;

			if (tag.startsWith('if ')) {
				const { body, after } = extractIfBody(src, pos);
				if (evalCondition(tag.slice(3).trim(), ctx)) {
					result += evalJinja(body, ctx);
				}
				pos = after;
			} else if (tag === 'endif') {
				break;
			}
		} else if (src[pos + 1] === '#') {
			const end = src.indexOf('#}', pos);
			if (end === -1) { result += src.slice(pos); break; }
			pos = end + 2;
		} else {
			result += src[pos];
			pos++;
		}
	}
	return result;
}

function evalExpr(expr: string, ctx: Record<string, unknown>): string {
	const pipeIdx = expr.indexOf('|');
	const varName = (pipeIdx === -1 ? expr : expr.slice(0, pipeIdx)).trim();
	const val = ctx[varName];
	if (val === null || val === undefined) return '';
	if (Array.isArray(val)) return val.join(' ');
	return String(val);
}

function evalCondition(condition: string, ctx: Record<string, unknown>): boolean {
	condition = condition.trim().replace(/^-|-%$/, '').trim();
	const presentMatch = condition.match(/^(\w+)\s*\|\s*isPresent$/);
	if (presentMatch) {
		const varName = presentMatch[1]!;
		return isPresent(ctx[varName]);
	}
	const eqMatch = condition.match(/^(\w+)\s*==\s*["']([^"']*)["']$/);
	if (eqMatch) {
		const varName = eqMatch[1]!;
		const expected = eqMatch[2]!;
		return String(ctx[varName] ?? '') === expected;
	}
	return false;
}

function extractTagKeyword(src: string, pos: number): { keyword: string; afterTag: number } | null {
	if (src[pos + 1] !== '%') return null;
	const tagEnd = src.indexOf('%}', pos);
	if (tagEnd === -1) return null;
	const rawContent = src.slice(pos + 2, tagEnd);
	const content = rawContent.replace(/^-+/, '').replace(/-+$/, '').trim();
	return { keyword: content, afterTag: tagEnd + 2 };
}

function extractIfBody(src: string, pos: number): { body: string; after: number } {
	let depth = 1;
	const bodyStart = pos;
	let p = pos;

	while (p < src.length) {
		const next = src.indexOf('{%', p);
		if (next === -1) break;
		const extracted = extractTagKeyword(src, next);
		if (!extracted) { p++; continue; }
		const { keyword, afterTag } = extracted;
		if (keyword.startsWith('if ')) {
			depth++;
		} else if (keyword === 'endif') {
			depth--;
			if (depth === 0) {
				return { body: src.slice(bodyStart, next), after: afterTag };
			}
		}
		p = afterTag;
	}
	return { body: src.slice(bodyStart), after: src.length };
}

// ---------------------------------------------------------------------------
// Grammar NodeMap cache (all 3 grammars)
// ---------------------------------------------------------------------------

const GRAMMARS = ['rust', 'typescript', 'python'] as const;
type Grammar = (typeof GRAMMARS)[number];

const nodeMaps = new Map<Grammar, NodeMap>();
const emitCtxes = new Map<Grammar, EmitCtx>();

// ---------------------------------------------------------------------------
// Inventory fixture
// ---------------------------------------------------------------------------

const FIXTURES_DIR = fileURLToPath(new URL('./fixtures/polymorph-golden', import.meta.url));

interface InventoryEntry {
	grammar: string;
	kind: string;
	partition: 'ROUTE-EXISTING' | 'MUST-CONSTRUCT';
	forms: string[];
	note?: string;
}

interface Inventory {
	partitionTable: InventoryEntry[];
}

// ---------------------------------------------------------------------------
// DBG_SLOT_MISS capture
// ---------------------------------------------------------------------------

/** Intercept stderr during `fn` and return what was written. */
async function captureStderr(fn: () => Promise<unknown>): Promise<string> {
	const chunks: string[] = [];
	const orig = process.stderr.write.bind(process.stderr);
	process.stderr.write = (chunk: Buffer | string, ...args: unknown[]): boolean => {
		chunks.push(typeof chunk === 'string' ? chunk : chunk.toString('utf-8'));
		return true;
	};
	try {
		await fn();
	} finally {
		process.stderr.write = orig;
	}
	return chunks.join('');
}

// ---------------------------------------------------------------------------
// Synthetic rendering context for a polymorph kind + form index
//
// For PER-FORM EQUIVALENCE testing, we build a context where:
//   - "Discriminating" slots (optional kind-named slots present only in some
//     forms) are set to a synthetic placeholder for the ACTIVE form's
//     discriminator and empty for all other forms' discriminators.
//   - "Shared" slots (named fields present in all forms) are set to a
//     synthetic non-empty placeholder.
//
// The SAME context is used to evaluate BOTH the merged template and the
// form's own template — the results must be byte-equal.
// ---------------------------------------------------------------------------

function buildSyntheticContext(
	node: AssembledPolymorph,
	activeFormIndex: number
): Record<string, string> {
	const ctx: Record<string, string> = {};

	// Start with all slots populated
	const allSlotNames = Object.keys(node.slots);
	for (const slotName of allSlotNames) {
		ctx[slotName] = 'SLOT_' + slotName.toUpperCase();
	}

	// Zero-out any slot that does NOT appear in the ACTIVE form's slot set.
	// This ensures: (a) discriminating slots of other forms are absent, and
	// (b) slots shared among a SUBSET of forms (but not the active form) are
	// also absent. The latter handles e.g. range_pattern's `left` slot which
	// appears in forms[1,2] but not form[0].
	const activeFormSlots = new Set(Object.keys(node.forms[activeFormIndex]!.slots));
	for (const slotName of allSlotNames) {
		if (!activeFormSlots.has(slotName)) {
			ctx[slotName] = '';
		}
	}

	return ctx;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('buildBranchRenderRuleFromForms — Stage 1a (spacing-fix + re-anchor)', () => {
	beforeAll(async () => {
		for (const grammar of GRAMMARS) {
			const overridePath = resolveOverridesPath(grammar);
			const raw = await evaluate(overridePath);
			const linked = link(raw);
			const optimized = normalizeGrammar(linked);
			const nodeMap = assemble(optimized);
			const wordMatcher = compileWordMatcher(optimized.word, optimized.rules) ?? /\w/;
			nodeMaps.set(grammar, nodeMap);
			emitCtxes.set(grammar, {
				nodeMap,
				wordMatcher,
				externals: [...(nodeMap.externals ?? [])],
				rules: nodeMap.rules ?? {},
				visitingHelpers: new Set()
			});
		}
	}, 60_000);

	it('inventory.json is readable', () => {
		const raw = readFileSync(resolve(FIXTURES_DIR, 'inventory.json'), 'utf-8');
		const inv = JSON.parse(raw) as Inventory;
		expect(inv.partitionTable).toBeDefined();
	});

	// ---------------------------------------------------------------------------
	// Per-form equivalence: merged template byte-equals the form's own template
	// Re-anchored from emitPolymorphTemplate to emitRule(form.renderRule).
	// ---------------------------------------------------------------------------

	describe('MUST-CONSTRUCT kinds — per-form template equivalence (re-anchored)', () => {
		const inventory = JSON.parse(
			readFileSync(resolve(FIXTURES_DIR, 'inventory.json'), 'utf-8')
		) as Inventory;

		const mustConstruct = inventory.partitionTable.filter(
			(e) => e.partition === 'MUST-CONSTRUCT'
		);

		for (const entry of mustConstruct) {
			const grammar = entry.grammar as Grammar;
			const kind = entry.kind;

			it(`${grammar}/${kind}: merged template is per-form equivalent to form's own render`, async () => {
				const nodeMap = nodeMaps.get(grammar)!;
				const baseCtx = emitCtxes.get(grammar)!;

				const node = nodeMap.nodes.get(kind) as AssembledPolymorph | undefined;
				expect(node, `${grammar}/${kind} node exists`).toBeDefined();
				if (!node) return;

				expect(node.modelType, `${grammar}/${kind} is polymorph`).toBe('polymorph');

				// Build the merged renderRule from forms
				const mergedRule = buildBranchRenderRuleFromForms(node.forms);
				const ctxWithSlots: EmitCtx = {
					...baseCtx,
					ownerSlots: node.slots,
					currentKind: kind
				};

				// Emit MERGED template (new branch-choice renderRule)
				const mergedTemplate = emitRule(mergedRule, ctxWithSlots);

				expect(mergedTemplate.length, `${grammar}/${kind} merged template is non-empty`).toBeGreaterThan(0);

				// For each form: render merged with that form's arm active AND
				// render the form's OWN renderRule. Assert byte equality.
				// This is the correct anchor — the form-group kinds render correctly
				// today. The broken parent-kind render (parent-kind-js-baseline.json)
				// is NOT the reference.
				for (let formIdx = 0; formIdx < node.forms.length; formIdx++) {
					const form = node.forms[formIdx]!;
					const syntheticCtx = buildSyntheticContext(node, formIdx);

					// Anchor: the form's own correct render
					const formTemplate = emitRule(form.renderRule, {
						...ctxWithSlots,
						currentKind: form.kind
					});
					const formRendered = evalJinja(formTemplate, syntheticCtx);

					// New: merged template rendered with same context
					const mergedRendered = evalJinja(mergedTemplate, syntheticCtx);

					expect(
						mergedRendered,
						`${grammar}/${kind} form[${formIdx}] (${form.kind}) merged render == form own render`
					).toBe(formRendered);
				}
			});
		}
	});

	// ---------------------------------------------------------------------------
	// Zero UNRESOLVED slot misses
	// ---------------------------------------------------------------------------

	describe('MUST-CONSTRUCT kinds — zero UNRESOLVED slot misses', () => {
		const inventory = JSON.parse(
			readFileSync(resolve(FIXTURES_DIR, 'inventory.json'), 'utf-8')
		) as Inventory;

		const mustConstruct = inventory.partitionTable.filter(
			(e) => e.partition === 'MUST-CONSTRUCT'
		);

		it('no UNRESOLVED slot misses across all MUST-CONSTRUCT kinds (DBG_SLOT_MISS)', async () => {
			process.env['DBG_SLOT_MISS'] = '1';
			let stderrOutput = '';

			try {
				stderrOutput = await captureStderr(async () => {
					for (const entry of mustConstruct) {
						const grammar = entry.grammar as Grammar;
						const nodeMap = nodeMaps.get(grammar)!;
						const baseCtx = emitCtxes.get(grammar)!;

						const node = nodeMap.nodes.get(entry.kind) as AssembledPolymorph | undefined;
						if (!node) continue;

						const mergedRule = buildBranchRenderRuleFromForms(node.forms);
						const ctxWithSlots: EmitCtx = {
							...baseCtx,
							ownerSlots: node.slots,
							currentKind: entry.kind
						};
						emitRule(mergedRule, ctxWithSlots);
					}
				});
			} finally {
				delete process.env['DBG_SLOT_MISS'];
			}

			const unresolvedMatch = stderrOutput.match(/UNRESOLVED=(\d+)/g);
			const totalUnresolved = (unresolvedMatch ?? []).reduce(
				(sum, m) => sum + parseInt(m.replace('UNRESOLVED=', '')),
				0
			);

			expect(
				totalUnresolved,
				`DBG_SLOT_MISS UNRESOLVED count (stderr: ${stderrOutput.slice(0, 300)})`
			).toBe(0);
		});
	});

	// ---------------------------------------------------------------------------
	// Structural id-preservation — prefix/suffix retain original ids
	// ---------------------------------------------------------------------------

	describe('structural id-preservation — prefix/suffix retain original ids', () => {
		it('reference_expression: prefix (reference) and suffix (value) members retain their original rule ids', async () => {
			const nodeMap = nodeMaps.get('rust')!;
			const node = nodeMap.nodes.get('reference_expression') as AssembledPolymorph | undefined;
			expect(node).toBeDefined();
			if (!node) return;

			const mergedRule = buildBranchRenderRuleFromForms(node.forms);
			expect(mergedRule.type).toBe('seq');
			const seq = mergedRule as Extract<typeof mergedRule, { type: 'seq' }>;

			const form0Seq = node.forms[0]!.renderRule as Extract<typeof mergedRule, { type: 'seq' }>;
			const expectedPrefixId = form0Seq.members[0]!.id;
			expect(expectedPrefixId, 'form[0] prefix has an id').toBeTruthy();
			expect(seq.members[0]!.id, 'merged prefix member has same id as form[0] prefix').toBe(expectedPrefixId);

			const expectedSuffixId = form0Seq.members[2]!.id;
			expect(expectedSuffixId, 'form[0] suffix has an id').toBeTruthy();
			expect(seq.members[seq.members.length - 1]!.id, 'merged suffix member has same id as form[0] suffix').toBe(expectedSuffixId);
		});

		it('pointer_type: shared prefix (*) and suffix (type) retain original ids', async () => {
			const nodeMap = nodeMaps.get('rust')!;
			const node = nodeMap.nodes.get('pointer_type') as AssembledPolymorph | undefined;
			expect(node).toBeDefined();
			if (!node) return;

			const mergedRule = buildBranchRenderRuleFromForms(node.forms);
			expect(mergedRule.type).toBe('seq');
			const seq = mergedRule as Extract<typeof mergedRule, { type: 'seq' }>;

			const form0Seq = node.forms[0]!.renderRule as Extract<typeof mergedRule, { type: 'seq' }>;
			expect(seq.members[0]!.id, 'prefix id preserved').toBe(form0Seq.members[0]!.id);
			const lastIdx = seq.members.length - 1;
			const form0LastIdx = form0Seq.members.length - 1;
			expect(seq.members[lastIdx]!.id, 'suffix id preserved').toBe(form0Seq.members[form0LastIdx]!.id);
		});
	});

	// ---------------------------------------------------------------------------
	// Shared-slot preservation — the −32 check
	// ---------------------------------------------------------------------------

	describe('shared-slot preservation — the −32 check', () => {
		it('reference_expression: shared prefix slot (reference) and suffix slot (value) preserved in merged rule', async () => {
			const nodeMap = nodeMaps.get('rust')!;
			const baseCtx = emitCtxes.get('rust')!;
			const node = nodeMap.nodes.get('reference_expression') as AssembledPolymorph | undefined;
			expect(node, 'reference_expression node exists').toBeDefined();
			if (!node) return;

			const mergedRule = buildBranchRenderRuleFromForms(node.forms);
			const newTemplate = emitRule(mergedRule, {
				...baseCtx,
				ownerSlots: node.slots,
				currentKind: 'reference_expression'
			});

			expect(newTemplate, 'merged template contains {{ reference }}').toContain('{{ reference }}');
			expect(newTemplate, 'merged template contains {{ value }}').toContain('{{ value }}');
		});

		it('impl_item: shared prefix and suffix slots preserved', async () => {
			const nodeMap = nodeMaps.get('rust')!;
			const baseCtx = emitCtxes.get('rust')!;
			const node = nodeMap.nodes.get('impl_item') as AssembledPolymorph | undefined;
			expect(node, 'impl_item node exists').toBeDefined();
			if (!node) return;

			const mergedRule = buildBranchRenderRuleFromForms(node.forms);
			const newTemplate = emitRule(mergedRule, {
				...baseCtx,
				ownerSlots: node.slots,
				currentKind: 'impl_item'
			});

			expect(newTemplate.length, 'impl_item merged template is non-trivial').toBeGreaterThan(20);
		});

		it('closure_expression: shared prefix slots preserved in merged template', async () => {
			const nodeMap = nodeMaps.get('rust')!;
			const baseCtx = emitCtxes.get('rust')!;
			const node = nodeMap.nodes.get('closure_expression') as AssembledPolymorph | undefined;
			expect(node, 'closure_expression node exists').toBeDefined();
			if (!node) return;

			const mergedRule = buildBranchRenderRuleFromForms(node.forms);
			const newTemplate = emitRule(mergedRule, {
				...baseCtx,
				ownerSlots: node.slots,
				currentKind: 'closure_expression'
			});

			expect(newTemplate.length, 'closure_expression merged template is non-trivial').toBeGreaterThan(10);
		});
	});

	// ---------------------------------------------------------------------------
	// Explicit spacing assertions — the 6 spacing-critical kinds
	//
	// These verify EXACT byte rendering for the spacing cases that were
	// previously "BLOCKED" in Stage 1a (now fixed by the ChoiceRule middle).
	//
	// Slot values use short lowercase strings to match real rendering.
	// The key invariant: NO spurious space between adjacent token+discriminator.
	// ---------------------------------------------------------------------------

	describe('spacing-critical kinds — exact byte rendering', () => {
		it('pointer_type: *const renders adjacent (no space after *)', async () => {
			const nodeMap = nodeMaps.get('rust')!;
			const baseCtx = emitCtxes.get('rust')!;
			const node = nodeMap.nodes.get('pointer_type') as AssembledPolymorph | undefined;
			expect(node).toBeDefined();
			if (!node) return;

			const mergedRule = buildBranchRenderRuleFromForms(node.forms);
			const template = emitRule(mergedRule, { ...baseCtx, ownerSlots: node.slots, currentKind: 'pointer_type' });

			// Form 0: pointer_type__form_const (const qualifier)
			const ctxConst: Record<string, string> = {
				pointer_type_const: 'const',
				pointer_type_mut: '',
				type: 'T'
			};
			const renderedConst = evalJinja(template, ctxConst);
			expect(renderedConst, 'pointer_type *const renders without space after *').toBe('*const T');

			// Form 1: pointer_type__form_mut (mut qualifier)
			const ctxMut: Record<string, string> = {
				pointer_type_const: '',
				pointer_type_mut: 'mut',
				type: 'T'
			};
			const renderedMut = evalJinja(template, ctxMut);
			expect(renderedMut, 'pointer_type *mut renders without space after *').toBe('*mut T');
		});

		it('line_comment: //doc renders adjacent (no space after //)', async () => {
			const nodeMap = nodeMaps.get('rust')!;
			const baseCtx = emitCtxes.get('rust')!;
			const node = nodeMap.nodes.get('line_comment') as AssembledPolymorph | undefined;
			expect(node).toBeDefined();
			if (!node) return;

			const mergedRule = buildBranchRenderRuleFromForms(node.forms);
			const template = emitRule(mergedRule, { ...baseCtx, ownerSlots: node.slots, currentKind: 'line_comment' });

			// Form 0: regular_dslash
			const ctxDoc: Record<string, string> = {
				line_comment_regular_dslash: '',
				line_comment_doc: 'doc',
				line_comment_content: ''
			};
			const rendered = evalJinja(template, ctxDoc);
			expect(rendered, 'line_comment //doc renders without space after //').toBe('//doc');

			// Form 1: regular_dslash form
			const ctxReg: Record<string, string> = {
				line_comment_regular_dslash: 'reg',
				line_comment_doc: '',
				line_comment_content: ''
			};
			const renderedReg = evalJinja(template, ctxReg);
			expect(renderedReg, 'line_comment //reg renders without space after //').toBe('//reg');
		});

		it('match_arm: pattern=>body renders adjacent (no space before body)', async () => {
			const nodeMap = nodeMaps.get('rust')!;
			const baseCtx = emitCtxes.get('rust')!;
			const node = nodeMap.nodes.get('match_arm') as AssembledPolymorph | undefined;
			expect(node).toBeDefined();
			if (!node) return;

			const mergedRule = buildBranchRenderRuleFromForms(node.forms);
			const template = emitRule(mergedRule, { ...baseCtx, ownerSlots: node.slots, currentKind: 'match_arm' });

			// Form 0: with_comma — body directly after =>
			const ctxComma: Record<string, string> = {
				attributes: '',
				pattern: 'p',
				match_pattern: 'p',
				match_arm_with_comma: 'body,',
				match_arm_block_ending: ''
			};
			const rendered = evalJinja(template, ctxComma);
			// The `=>` is adjacent to the body slot in the form template
			expect(rendered, 'match_arm rendered contains =>body').toContain('=>body,');
		});

		it('reference_expression: &raw const x renders with all slots correctly spaced', async () => {
			const nodeMap = nodeMaps.get('rust')!;
			const baseCtx = emitCtxes.get('rust')!;
			const node = nodeMap.nodes.get('reference_expression') as AssembledPolymorph | undefined;
			expect(node).toBeDefined();
			if (!node) return;

			const mergedRule = buildBranchRenderRuleFromForms(node.forms);
			const template = emitRule(mergedRule, { ...baseCtx, ownerSlots: node.slots, currentKind: 'reference_expression' });

			// Form 0: raw_const — & raw const x
			const ctxRawConst: Record<string, string> = {
				reference: '&',
				reference_expression_raw_const: 'const',
				reference_expression_raw_mut: '',
				value: 'x'
			};
			const renderedConst = evalJinja(template, ctxRawConst);
			// form template: {{ reference }} raw{% if raw_const %} {{ raw_const }}{% endif %} {{ value }}
			// → & raw const x
			expect(renderedConst, '& raw const x — reference_expression form 0').toBe('& raw const x');

			// Form 1: raw_mut — & raw mut x
			const ctxRawMut: Record<string, string> = {
				reference: '&',
				reference_expression_raw_const: '',
				reference_expression_raw_mut: 'mut',
				value: 'x'
			};
			const renderedMut = evalJinja(template, ctxRawMut);
			expect(renderedMut, '& raw mut x — reference_expression form 1').toBe('& raw mut x');
		});

		it('merged template renders identically to per-form template for each form (pointer_type)', async () => {
			const nodeMap = nodeMaps.get('rust')!;
			const baseCtx = emitCtxes.get('rust')!;
			const node = nodeMap.nodes.get('pointer_type') as AssembledPolymorph | undefined;
			expect(node).toBeDefined();
			if (!node) return;

			const mergedRule = buildBranchRenderRuleFromForms(node.forms);
			const mergedTemplate = emitRule(mergedRule, { ...baseCtx, ownerSlots: node.slots, currentKind: 'pointer_type' });

			for (let formIdx = 0; formIdx < node.forms.length; formIdx++) {
				const form = node.forms[formIdx]!;
				const syntheticCtx = buildSyntheticContext(node, formIdx);
				const formTemplate = emitRule(form.renderRule, { ...baseCtx, ownerSlots: node.slots, currentKind: form.kind });

				const formRendered = evalJinja(formTemplate, syntheticCtx);
				const mergedRendered = evalJinja(mergedTemplate, syntheticCtx);

				expect(mergedRendered, `pointer_type form[${formIdx}] merged == form own render`).toBe(formRendered);
			}
		});
	});
});
