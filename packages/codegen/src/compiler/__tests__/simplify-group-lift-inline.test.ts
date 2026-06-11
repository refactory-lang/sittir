/**
 * PR-D2: Tests for H2 helper-name leak fix in inlineRefs.
 *
 * Before the fix: `source === 'group-lift'` refs always bailed in inlineRefs,
 * which meant optional(seq) group-lift helpers (e.g. `_const_item_optional1`)
 * leaked as slot VALUES on their parent — from.ts emitted a resolver referencing
 * the synthetic helper name, types.ts emitted a parent interface field, and
 * factories.ts emitted a config accessor — all for a name that never materialises
 * at runtime.
 *
 * After the fix: optional-multiplicity group-lift refs fall through to the
 * GROUP/MULTI inline path. The helper's seq content is spliced in-place, carrying
 * `multiplicity:'optional'` via `reapplyInlinedLeafAttrs`. Repeat-multiplicity
 * group-lift refs still bail (they remain as AssembledGroup boundaries).
 *
 * Test nomenclature matches the real cases:
 *   - parent rule: const_item (simplified: seq with _const_item_optional1 ref)
 *   - helper rule: _const_item_optional1 (type:'group', content: seq('=', field(value,_expression)))
 *   - expected post-fix: the ref is replaced by the seq members carrying multiplicity:'optional'
 */

import { SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it, afterEach } from 'vitest';
import { computeSimplifiedRules, drainSlotGroupingDiagnostics } from '../simplify.ts';
import { applyWrapperDeletion } from '../wrapper-deletion.ts';
import type { Rule, RenderRule } from '../../types/rule.ts';

afterEach(() => {
	drainSlotGroupingDiagnostics();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Find all symbol refs with the given name anywhere in a rule tree. */
function findSymbolRefs(rule: Rule, name: string, found: Rule[] = []): Rule[] {
	if (rule.type === SYMBOL && rule.name === name) found.push(rule);
	if ('members' in rule && Array.isArray(rule.members)) {
		for (const m of rule.members) findSymbolRefs(m, name, found);
	}
	if ('content' in rule && rule.content && typeof rule.content === 'object') {
		findSymbolRefs(rule.content as Rule, name, found);
	}
	return found;
}

/** Walk a rule tree collecting all symbol names. */
function collectSymbolNames(rule: Rule, out: string[] = []): string[] {
	if (rule.type === SYMBOL) out.push(rule.name);
	if ('members' in rule && Array.isArray(rule.members)) {
		for (const m of rule.members) collectSymbolNames(m, out);
	}
	if ('content' in rule && rule.content && typeof rule.content === 'object') {
		collectSymbolNames(rule.content as Rule, out);
	}
	return out;
}

// ---------------------------------------------------------------------------
// Core fix: optional group-lift ref is inlined, repeat stays
// ---------------------------------------------------------------------------

describe('inlineRefs — optional(seq) group-lift inline (PR-D2 fix)', () => {
	it('optional group-lift ref is replaced by its seq content', () => {
		// Simulates const_item: parent has a `_const_item_optional1` ref with
		// source:'group-lift' and multiplicity:'optional'. The helper rule is a
		// group whose content is seq('=', field(value, _expression)).
		//
		// After computeSimplifiedRules, the helper symbol ref must be gone from
		// the parent rule and its content members must appear in its place.

		const inputRules: Record<string, Rule> = {
			// Parent rule: seq containing an optional group-lift ref.
			// Note: real synthesized group-lift refs do NOT have hidden:true — the
			// synthesizer (auto-groups.ts) does not stamp hidden. The fix must handle
			// both hidden and non-hidden refs; omitting hidden here matches reality.
			const_item: {
				type: 'seq',
				members: [
					{ type: 'string', value: 'const' } as Rule,
					{
						type: 'symbol',
						name: '_const_item_optional1',
						// No hidden:true — matches synthesizeOptionalGroups behavior
						source: 'group-lift',
						// wrapper-deletion already pushed optional down to multiplicity
						multiplicity: 'optional',
						nonterminal: true,
					} as unknown as Rule,
					{ type: 'string', value: ';' } as Rule,
				],
			} as Rule,
			// Helper rule: group with seq content
			_const_item_optional1: {
				type: 'group',
				name: '_const_item_optional1',
				content: {
					type: 'seq',
					members: [
						{ type: 'string', value: '=' },
						{
							type: 'symbol',
							name: '_expression',
							hidden: true,
							fieldName: 'value',
							nonterminal: true,
						} as unknown as Rule,
					],
				},
			} as unknown as Rule,
			// Content kind leaf
			_expression: { type: 'symbol', name: '_expression' } as Rule,
		};

		const renderRules = applyWrapperDeletion(inputRules);
		const simplified = computeSimplifiedRules(renderRules);

		const constItemSimplified = simplified['const_item']!;

		// The helper name must NOT appear in the simplified parent rule.
		const helperRefs = findSymbolRefs(constItemSimplified as Rule, '_const_item_optional1');
		expect(
			helperRefs,
			'_const_item_optional1 helper ref must be dissolved — not remain as a slot value'
		).toHaveLength(0);

		// The content kind (_expression) must appear in the parent rule.
		const contentRefs = collectSymbolNames(constItemSimplified as Rule);
		expect(contentRefs).toContain('_expression');
	});

	it('repeat group-lift ref is NOT inlined — stays as AssembledGroup boundary', () => {
		// Simulates a parent with a repeat group-lift ref (multiplicity:'nonEmptyArray').
		// These are deliberate structural boundaries and must remain as symbol refs.

		const inputRules: Record<string, Rule> = {
			type_arguments: {
				type: 'seq',
				members: [
					{ type: 'string', value: '<' } as Rule,
					{
						type: 'symbol',
						name: '_type_arguments_repeat1',
						hidden: true,
						source: 'group-lift',
						multiplicity: 'nonEmptyArray',
						nonterminal: true,
					} as unknown as Rule,
					{ type: 'string', value: '>' } as Rule,
				],
			} as Rule,
			// Helper: group with seq content (but it's a repeat context)
			_type_arguments_repeat1: {
				type: 'group',
				name: '_type_arguments_repeat1',
				content: {
					type: 'seq',
					members: [
						{ type: 'symbol', name: '_type', hidden: true, nonterminal: true } as unknown as Rule,
					],
				},
			} as unknown as Rule,
			_type: { type: 'symbol', name: '_type' } as Rule,
		};

		const renderRules = applyWrapperDeletion(inputRules);
		const simplified = computeSimplifiedRules(renderRules);

		const typeArgsSimplified = simplified['type_arguments']!;

		// The repeat group-lift helper ref MUST still appear in the parent.
		const helperRefs = findSymbolRefs(typeArgsSimplified as Rule, '_type_arguments_repeat1');
		expect(
			helperRefs.length,
			'_type_arguments_repeat1 repeat group-lift must remain as a symbol ref (AssembledGroup boundary)'
		).toBeGreaterThan(0);
	});

	it('group-lift ref with no multiplicity (conservative) bails like repeat', () => {
		// A group-lift ref with undefined multiplicity — should bail conservatively
		// (treated like a repeat, not an optional). This ensures the gate fails safe.

		const inputRules: Record<string, Rule> = {
			parent_rule: {
				type: 'seq',
				members: [
					{
						type: 'symbol',
						name: '_parent_group1',
						hidden: true,
						source: 'group-lift',
						// No multiplicity attribute
						nonterminal: true,
					} as unknown as Rule,
				],
			} as Rule,
			_parent_group1: {
				type: 'group',
				name: '_parent_group1',
				content: {
					type: 'seq',
					members: [{ type: 'symbol', name: 'some_kind', nonterminal: true } as unknown as Rule],
				},
			} as unknown as Rule,
			some_kind: { type: 'symbol', name: 'some_kind' } as Rule,
		};

		const renderRules = applyWrapperDeletion(inputRules);
		const simplified = computeSimplifiedRules(renderRules);

		const parentSimplified = simplified['parent_rule']!;

		// The group-lift ref without multiplicity must still appear (conservative bail).
		const helperRefs = findSymbolRefs(parentSimplified as Rule, '_parent_group1');
		expect(
			helperRefs.length,
			'group-lift ref with no multiplicity must remain as a symbol ref (conservative bail)'
		).toBeGreaterThan(0);
	});

	it('inline-listed optional group-lift ref still inlines via the grammar.inline path', () => {
		// Simulates _let_declaration_optional1 which IS in grammar.inline.
		// The inline-listed path (line 880) fires regardless of source, so this
		// must continue to work after the PR-D2 fix.
		const inputRules: Record<string, Rule> = {
			let_declaration: {
				type: 'seq',
				members: [
					{ type: 'string', value: 'let' } as Rule,
					{
						type: 'symbol',
						name: '_let_declaration_optional1',
						hidden: true,
						source: 'group-lift',
						multiplicity: 'optional',
						nonterminal: true,
					} as unknown as Rule,
				],
			} as Rule,
			_let_declaration_optional1: {
				type: 'group',
				name: '_let_declaration_optional1',
				content: {
					type: 'seq',
					members: [
						{ type: 'string', value: ':' },
						{
							type: 'symbol',
							name: '_type',
							hidden: true,
							fieldName: 'type',
							nonterminal: true,
						} as unknown as Rule,
					],
				},
			} as unknown as Rule,
			_type: { type: 'symbol', name: '_type' } as Rule,
		};

		const renderRules = applyWrapperDeletion(inputRules);
		// Pass _let_declaration_optional1 in inlineKinds (as in the real pipeline).
		const inlineKinds = new Set(['_let_declaration_optional1']);
		const simplified = computeSimplifiedRules(renderRules, inlineKinds);

		const letDeclSimplified = simplified['let_declaration']!;

		// The helper name must be dissolved.
		const helperRefs = findSymbolRefs(letDeclSimplified as Rule, '_let_declaration_optional1');
		expect(helperRefs).toHaveLength(0);

		// The content kind must be present.
		const contentRefs = collectSymbolNames(letDeclSimplified as Rule);
		expect(contentRefs).toContain('_type');
	});
});
