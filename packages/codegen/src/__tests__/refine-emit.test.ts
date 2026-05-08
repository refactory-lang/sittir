/**
 * refine-emit.test.ts — unit tests for ADR-0010 phase 2b emitters.
 *
 * Covers:
 *   - link-refine path + selection validation
 *   - types.ts per-form Config + Tree namespace emission
 *   - factories.ts per-form factory emission
 *   - ir.ts per-form key attachment
 *
 * Builds a tiny synthetic grammar with a single refined kind, pushes
 * it through the pipeline, and inspects emitted source text.
 */

import { describe, it, expect } from 'vitest';
import type { Rule } from '../compiler/rule.ts';
import type { RawGrammar, RefineForm } from '../compiler/types.ts';
import { link } from '../compiler/link.ts';
import { resolveRefinePath, narrowedFieldLiteralsForForm } from '../compiler/link-refine.ts';
import { optimize } from '../compiler/optimize.ts';
import { assemble } from '../compiler/assemble.ts';
import { emitTypes } from '../emitters/types.ts';
import { emitFactories } from '../emitters/factories.ts';
import { emitIr } from '../emitters/ir.ts';
import { createEmptyRuleCatalog } from '../compiler/rule-catalog.ts';
import type { GeneratedIdTables } from '../compiler/generated-metadata.ts';

// ---------------------------------------------------------------------------
// Synthetic grammar: `iface_body` with curly `{...}` and flow `{|...|}` forms
// ---------------------------------------------------------------------------

function makeRefineRaw(forms: RefineForm[]): RawGrammar {
	const ifaceBodyRule: Rule = {
		type: 'seq',
		members: [
			{
				type: 'field',
				name: 'opening',
				content: {
					type: 'choice',
					members: [
						{ type: 'string', value: '{' },
						{ type: 'string', value: '{|' }
					]
				}
			},
			{
				type: 'field',
				name: 'closing',
				content: {
					type: 'choice',
					members: [
						{ type: 'string', value: '}' },
						{ type: 'string', value: '|}' }
					]
				}
			}
		]
	};
	return {
		name: 'synth',
		rules: {
			iface_body: ifaceBodyRule
		},
		ruleCatalog: createEmptyRuleCatalog(),
		extras: [],
		externals: [],
		supertypes: [],
		inline: [],
		conflicts: [],
		word: null,
		references: [],
		refineForms: new Map([['iface_body', forms]])
	};
}

// ---------------------------------------------------------------------------
// Validator tests
// ---------------------------------------------------------------------------

describe('link-refine — validateRefineForms', () => {
	it('accepts valid selections (string and index)', () => {
		const raw = makeRefineRaw([
			{ name: 'curly', selections: { 'opening:': '{', 'closing:': '}' } },
			{ name: 'flow', selections: { 'opening:': 1, 'closing:': 1 } }
		]);
		expect(() => link(raw)).not.toThrow();
	});

	it('throws when a path does not resolve to a choice', () => {
		const raw = makeRefineRaw([{ name: 'curly', selections: { 'nonexistent:': '{' } }]);
		expect(() => link(raw)).toThrow(/does not match any field/);
	});

	it('throws when a string selection does not match any branch literal', () => {
		const raw = makeRefineRaw([{ name: 'curly', selections: { 'opening:': '<bogus>' } }]);
		expect(() => link(raw)).toThrow(/selection '<bogus>' does not match/);
	});

	it('throws when an index selection is out of range', () => {
		const raw = makeRefineRaw([{ name: 'curly', selections: { 'opening:': 5 } }]);
		expect(() => link(raw)).toThrow(/out of range/);
	});

	it('throws with path + form + kind context in the message', () => {
		const raw = makeRefineRaw([{ name: 'funky', selections: { 'opening:': '<bogus>' } }]);
		expect(() => link(raw)).toThrow(/refine\(iface_body\) form 'funky': path 'opening:'/);
	});
});

describe('link-refine — resolveRefinePath + narrowedFieldLiteralsForForm', () => {
	it('resolves field-traversal paths to the choice', () => {
		const raw = makeRefineRaw([]);
		const rule = raw.rules.iface_body!;
		const res = resolveRefinePath('iface_body', 'curly', 'opening:', rule);
		expect(res.fieldName).toBe('opening');
		expect(res.choice.type).toBe('choice');
		expect(res.choice.members).toHaveLength(2);
	});

	it('extracts narrowed field literals per form', () => {
		const form: RefineForm = {
			name: 'curly',
			selections: { 'opening:': '{', 'closing:': '}' }
		};
		const raw = makeRefineRaw([form]);
		const rule = raw.rules.iface_body!;
		const narrowed = narrowedFieldLiteralsForForm(rule, form);
		expect(narrowed).toEqual([
			{ fieldName: 'opening', literal: '{' },
			{ fieldName: 'closing', literal: '}' }
		]);
	});

	it('resolves numeric-index selections to the string literal', () => {
		const form: RefineForm = {
			name: 'flow',
			selections: { 'opening:': 1, 'closing:': 1 }
		};
		const raw = makeRefineRaw([form]);
		const rule = raw.rules.iface_body!;
		const narrowed = narrowedFieldLiteralsForForm(rule, form);
		expect(narrowed).toEqual([
			{ fieldName: 'opening', literal: '{|' },
			{ fieldName: 'closing', literal: '|}' }
		]);
	});
});

// ---------------------------------------------------------------------------
// End-to-end emitter tests
// ---------------------------------------------------------------------------

function runPipeline(forms: RefineForm[]) {
	const raw = makeRefineRaw(forms);
	const linked = link(raw);
	const optimized = optimize(linked);
	const nodeMap = assemble(optimized);
	const generatedIdTables = makeGeneratedIdTables();
	return {
		nodeMap,
		typesSrc: emitTypes({ grammar: 'synth', nodeMap, generatedIdTables }),
		factoriesSrc: emitFactories({ grammar: 'synth', nodeMap }),
		irSrc: emitIr({ grammar: 'synth', nodeMap })
	};
}

function makeGeneratedIdTables(): GeneratedIdTables {
	return {
		kindIds: {
			iface_body: {
				id: 11,
				parser: {
					cSymbol: 'sym_iface_body',
					parserName: 'iface_body',
					anon: false,
					aux: false,
					alias: false,
					hidden: false
				}
			},
			iface_body_curly: {
				id: 17,
				parser: {
					cSymbol: 'sym_iface_body_curly',
					parserName: 'iface_body_curly',
					anon: false,
					aux: false,
					alias: false,
					hidden: false
				}
			},
			iface_body_flow: {
				id: 23,
				parser: {
					cSymbol: 'sym_iface_body_flow',
					parserName: 'iface_body_flow',
					anon: false,
					aux: false,
					alias: false,
					hidden: false
				}
			}
		},
		sourceArtifact: 'parser.wasm'
	};
}

describe('types emitter — per-form namespace sugar', () => {
	it('emits sub-namespaces with Config and Tree for each form', () => {
		const { typesSrc } = runPipeline([
			{ name: 'curly', selections: { 'opening:': '{', 'closing:': '}' } },
			{ name: 'flow', selections: { 'opening:': '{|', 'closing:': '|}' } }
		]);
		// Sub-namespace declarations exist.
		expect(typesSrc).toMatch(/export namespace IfaceBody \{[\s\S]*export namespace Curly/);
		expect(typesSrc).toMatch(/export namespace Flow/);
		// Per-form Config omits both narrowed fields.
		expect(typesSrc).toMatch(/Curly \{\s+export type Config = Omit<ConfigFor<'iface_body'>, "opening" \| "closing">/);
		// Per-form Tree aliases point at the base Tree.
		expect(typesSrc).toContain('export type IfaceBodyCurlyTree = IfaceBodyTree;');
		expect(typesSrc).toContain('export type IfaceBodyFlowTree = IfaceBodyTree;');
		// Default Config points at the first-declared form.
		expect(typesSrc).toMatch(/Default form: 'curly' \(first-declared\)/);
		expect(typesSrc).toMatch(/export type Config = Curly\.Config;/);
	});

	it('leaves non-refined kinds with the original ConfigFor shape', () => {
		// Same kind, but no refine forms declared — namespace should be the
		// plain `Config = ConfigFor<'kind'>` form.
		const raw = makeRefineRaw([]);
		// Drop the refineForms map entry to simulate the no-refine path.
		const noRefine: RawGrammar = { ...raw, refineForms: undefined };
		const linked = link(noRefine);
		const optimized = optimize(linked);
		const nodeMap = assemble(optimized);
		const src = emitTypes({
			grammar: 'synth',
			nodeMap,
			generatedIdTables: makeGeneratedIdTables()
		});
		// No sub-namespaces.
		expect(src).not.toMatch(/namespace Curly/);
		expect(src).not.toMatch(/namespace Flow/);
		// The plain Config line is present.
		expect(src).toMatch(/export type Config = ConfigFor<'iface_body'>;/);
	});
});

describe('factories emitter — per-form factory emission', () => {
	it('emits a factory per form alongside the base factory', () => {
		const { factoriesSrc } = runPipeline([
			{ name: 'curly', selections: { 'opening:': '{', 'closing:': '}' } },
			{ name: 'flow', selections: { 'opening:': '{|', 'closing:': '|}' } }
		]);
		expect(factoriesSrc).toMatch(/export function ifaceBody\(/);
		expect(factoriesSrc).toMatch(/export function ifaceBodyCurly\(/);
		expect(factoriesSrc).toMatch(/export function ifaceBodyFlow\(/);
	});

	it('stamps the selected literal into _<name> storage', () => {
		const { factoriesSrc } = runPipeline([
			{ name: 'curly', selections: { 'opening:': '{', 'closing:': '}' } },
			{ name: 'flow', selections: { 'opening:': '{|', 'closing:': '|}' } }
		]);
		// Curly factory stamps '{' / '}' via _<name> storage.
		expect(factoriesSrc).toMatch(/ifaceBodyCurly[\s\S]*_opening = "\{" as const[\s\S]*_closing = "\}" as const/);
		// Flow factory stamps '{|' / '|}' via _<name> storage.
		expect(factoriesSrc).toMatch(/ifaceBodyFlow[\s\S]*_opening = "\{\|" as const[\s\S]*_closing = "\|\}" as const/);
	});

	it('does not emit a $variant tag (NodeData round-trips through readNode)', () => {
		const { factoriesSrc } = runPipeline([{ name: 'curly', selections: { 'opening:': '{', 'closing:': '}' } }]);
		// Pull out just the curly function body and assert no $variant.
		const match = factoriesSrc.match(/export function ifaceBodyCurly[\s\S]*?\n\}/);
		expect(match).toBeTruthy();
		expect(match![0]).not.toContain('$variant');
	});

	it('types the per-form factory parameter with the narrowed Config', () => {
		const { factoriesSrc } = runPipeline([{ name: 'curly', selections: { 'opening:': '{', 'closing:': '}' } }]);
		// Per-form Config lives under the parent namespace as a sub-namespace
		// (`T.IfaceBody.Curly.Config`), not as a flat alias. See
		// emitRefineFormSubNamespaces in emitters/types.ts.
		expect(factoriesSrc).toMatch(/export function ifaceBodyCurly\(config\??: T\.IfaceBody\.Curly\.Config\)/);
	});
});

describe('ir emitter — per-form key attachment', () => {
	it('attaches per-form factories under the parent ir key', () => {
		const { irSrc } = runPipeline([
			{ name: 'curly', selections: { 'opening:': '{', 'closing:': '}' } },
			{ name: 'flow', selections: { 'opening:': '{|', 'closing:': '|}' } }
		]);
		// The bundle expression should list curly and flow entries alongside `from`.
		expect(irSrc).toMatch(
			/ifaceBody: _attach\(F\.ifaceBody, \{ from: FR\.ifaceBodyFrom, curly: F\.ifaceBodyCurly, flow: F\.ifaceBodyFlow \}\)/
		);
	});
});
