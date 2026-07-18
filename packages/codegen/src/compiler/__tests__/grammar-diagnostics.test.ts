import { describe, expect, it } from 'vitest';
import { alias, buildRuleCatalog, choice } from '../evaluate.ts';
import {
	collectGrammarDiagnostics,
	collectGrammarDiagnosticsForGrammar,
	GrammarDiagnosticError
} from '../diagnostics/grammar-diagnostics.ts';
import { diagnoseSlotGrouping } from '../diagnostics/slot-grouping.ts';
import type { DeriveShapeDiagnostic } from '../diagnostics/derive-shapes.ts';
import type { SimplifiedRule } from '../../types/rule.ts';
import type { RawGrammar } from '../types.ts';

function buildRawGrammar(rules: Record<string, unknown>): RawGrammar {
	const { rules: catalogRules, ruleCatalog } = buildRuleCatalog(rules as never);
	return {
		name: 'synth',
		rules: catalogRules,
		ruleCatalog,
		extras: [],
		externals: [],
		supertypes: [],
		inline: [],
		conflicts: [],
		word: null,
		references: []
	};
}

describe('grammar diagnostics preflight', () => {
	it('emits parsekind-noninjective records from compiler-produced collisions', () => {
		const result = collectGrammarDiagnosticsForGrammar({
			rawGrammar: buildRawGrammar({
				host: choice(
					alias({ type: 'SYMBOL', name: 'left' }, { type: 'SYMBOL', name: 'shared' }),
					{ type: 'SYMBOL', name: 'shared' },
					alias({ type: 'SYMBOL', name: 'right' }, { type: 'SYMBOL', name: 'shared' })
				),
				left: { type: 'PATTERN', value: '[a-z]+' },
				shared: {
					type: 'SEQ',
					members: [
						{ type: 'SYMBOL', name: 'identifier', fieldName: 'body' },
						{ type: 'SYMBOL', name: 'identifier2', fieldName: 'tail' }
					]
				},
				right: { type: 'PATTERN', value: '[0-9]+' },
				identifier: { type: 'PATTERN', value: '[a-z_]\\w*' },
				identifier2: { type: 'PATTERN', value: '[A-Z_]\\w*' }
			})
		});

		expect(result.nodeMap.parseKindCollisions).toEqual([
			expect.objectContaining({
				code: 'parsekind-noninjective',
				ownerKind: 'host',
				slotName: 'content',
				parseKind: 'shared'
			})
		]);
		expect(result.diagnostics).toEqual([
			expect.objectContaining({
				scope: 'grammar',
				code: 'parsekind-noninjective',
				grammar: 'synth',
				ownerKind: 'host',
				slotName: 'content',
				// PR-L Task 5: assemble-time parsekind-noninjective now blocks.
				canProceed: false
			})
		]);
	});

	it('keeps identical-structure collisions auto-merged without diagnostics', () => {
		const result = collectGrammarDiagnosticsForGrammar({
			rawGrammar: buildRawGrammar({
				host: choice(
					alias({ type: 'SYMBOL', name: 'left' }, { type: 'SYMBOL', name: 'shared' }),
					{ type: 'SYMBOL', name: 'shared' },
					alias({ type: 'SYMBOL', name: 'right' }, { type: 'SYMBOL', name: 'shared' })
				),
				left: { type: 'PATTERN', value: '[a-z]+' },
				shared: { type: 'PATTERN', value: '[a-z]+' },
				right: { type: 'PATTERN', value: '[a-z]+' }
			})
		});

		const host = result.nodeMap.nodes.get('host');
		const slot = Object.values((host as { slots: Record<string, { values: readonly unknown[] }> }).slots)[0];
		expect(result.nodeMap.parseKindCollisions).toEqual([]);
		expect(result.diagnostics).toEqual([]);
		expect(slot?.values).toHaveLength(1);
	});

	it('includes derive-shape diagnostics in the shared batch', () => {
		const deriveD: DeriveShapeDiagnostic = {
			code: 'seq-with-nested-seq',
			severity: 'error',
			ownerKind: 'host',
			message:
				"Kind 'host' still contains a nested seq that should have been flattened, grouped, or normalized before derive.",
			canProceed: false,
			details: { rawShape: 'seq-with-nested-seq', ruleType: 'seq', context: 'fields' }
		};
		const result = collectGrammarDiagnostics({
			grammar: 'synth',
			parseKindCollisions: [],
			deriveShapeDiagnostics: [deriveD]
		});
		expect(result.diagnostics).toEqual([
			expect.objectContaining({
				scope: 'grammar',
				code: 'seq-with-nested-seq',
				grammar: 'synth',
				ownerKind: 'host',
				canProceed: true
			})
		]);
	});

	it('captures diagnostic codes in GrammarDiagnosticError', () => {
		const { diagnostics } = collectGrammarDiagnostics({
			grammar: 'synth',
			parseKindCollisions: [
				{
					code: 'parsekind-noninjective',
					severity: 'error',
					message: "Slot 'content' of kind '_suite' collapses [_simple_statements, block] onto parse kind 'block'.",
					canProceed: true,
					ownerKind: '_suite',
					slotName: 'content',
					shape: 'propose-distinct-alias',
					parseKind: 'block',
					storageKinds: ['_simple_statements', 'block'],
					proposal: 'Give each colliding arm a distinct alias.'
				}
			]
		});

		const error = new GrammarDiagnosticError(diagnostics);
		expect(error.name).toBe('GrammarDiagnosticError');
		expect(error.codes).toEqual(['parsekind-noninjective']);
		expect(error.message).toContain('parsekind-noninjective');
	});

	it('parsekind-noninjective now blocks (canProceed: false)', () => {
		const result = collectGrammarDiagnosticsForGrammar({
			rawGrammar: buildRawGrammar({
				host: choice(
					alias({ type: 'SYMBOL', name: 'left' }, { type: 'SYMBOL', name: 'shared' }),
					{ type: 'SYMBOL', name: 'shared' },
					alias({ type: 'SYMBOL', name: 'right' }, { type: 'SYMBOL', name: 'shared' })
				),
				left: { type: 'PATTERN', value: '[a-z]+' },
				shared: {
					type: 'SEQ',
					members: [
						{ type: 'SYMBOL', name: 'identifier', fieldName: 'body' },
						{ type: 'SYMBOL', name: 'identifier2', fieldName: 'tail' }
					]
				},
				right: { type: 'PATTERN', value: '[0-9]+' },
				identifier: { type: 'PATTERN', value: '[a-z_]\\w*' },
				identifier2: { type: 'PATTERN', value: '[A-Z_]\\w*' }
			})
		});
		expect(result.diagnostics).toEqual([
			expect.objectContaining({ code: 'parsekind-noninjective', ownerKind: 'host', canProceed: false })
		]);
	});

	it('content-collision now blocks (canProceed: false)', () => {
		const result = collectGrammarDiagnosticsForGrammar({
			rawGrammar: buildRawGrammar({
				// unnamed seq of two unnamed multi-kind choices — both resolve to the
				// generic `content` storage name (same shape as content-collision.test.ts's
				// '_class_body_member shape' fixture).
				host: {
					type: 'SEQ',
					members: [
						choice({ type: 'SYMBOL', name: 'a' }, { type: 'SYMBOL', name: 'b' }),
						choice({ type: 'SYMBOL', name: 'c' }, { type: 'SYMBOL', name: 'd' })
					]
				},
				a: { type: 'PATTERN', value: 'a' },
				b: { type: 'PATTERN', value: 'b' },
				c: { type: 'PATTERN', value: 'c' },
				d: { type: 'PATTERN', value: 'd' }
			})
		});
		expect(result.diagnostics).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ code: 'content-collision', ownerKind: 'host', canProceed: false })
			])
		);
	});

	it('storagename-collision now blocks (canProceed: false)', () => {
		// Non-adjacent duplicate (identifier ... op ... identifier), not adjacent
		// (op, identifier, identifier) — matches the proven-firing fixture shape
		// from slot-structural-signals.test.ts's 'two unnamed same-kind slots in
		// one branch fire storagename-collision' test. An adjacent duplicate does
		// not reproduce the collision through this full link/normalize/assemble
		// pipeline (something canonicalizes adjacent identical seq members before
		// the collision check runs), so this fixture uses the shape confirmed to
		// actually exercise the real assemble-time collision path.
		const result = collectGrammarDiagnosticsForGrammar({
			rawGrammar: buildRawGrammar({
				host: {
					type: 'CHOICE',
					members: [
						{
							type: 'SEQ',
							members: [
								{ type: 'SYMBOL', name: 'identifier' },
								{ type: 'SYMBOL', name: 'op', fieldName: 'op' },
								{ type: 'SYMBOL', name: 'identifier' }
							]
						}
					]
				},
				op: { type: 'STRING', value: '+' },
				identifier: { type: 'PATTERN', value: '[a-z_]\\w*' }
			})
		});
		expect(result.diagnostics).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ code: 'storagename-collision', ownerKind: 'host', canProceed: false })
			])
		);
	});

	it('typename-collision stays non-blocking (regression guard on the shared fromAssembleWarning mapper)', () => {
		// typename-collision is the ONLY other code sharing fromAssembleWarning
		// with storagename-collision (confirmed this session: fromAssembleWarning's
		// own severity branch names it explicitly). seq-with-nested-seq is a
		// DeriveShapeDiagnostic mapped by the separate fromDeriveShape function
		// (see the 'includes derive-shape diagnostics in the shared batch' test
		// above, which already pins its canProceed: true unchanged) — untouched by
		// Step 4's edit, so it needs no separate guard here.
		const result = collectGrammarDiagnostics({
			grammar: 'synth',
			parseKindCollisions: [],
			assembleWarnings: [
				{ code: 'typename-collision', ownerKind: 'host', message: 'auto-resolved rename', details: {} }
			]
		});
		expect(result.diagnostics).toEqual([
			expect.objectContaining({ code: 'typename-collision', ownerKind: 'host', severity: 'info', canProceed: true })
		]);
	});

	describe('_object_type_group1 accepted-floor exception (see docs/KNOWN_ISSUES.md)', () => {
		// Same shape as content-collision.test.ts's '_class_body_member shape' fixture:
		// an unnamed seq of two unnamed multi-kind choices, both resolving to `content`.
		const twoContentSlotRule: SimplifiedRule = {
			type: 'SEQ',
			members: [
				{
					type: 'CHOICE',
					members: [
						{ type: 'SYMBOL', name: 'a' },
						{ type: 'SYMBOL', name: 'b' }
					]
				},
				{
					type: 'CHOICE',
					members: [
						{ type: 'SYMBOL', name: 'c' },
						{ type: 'SYMBOL', name: 'd' }
					]
				}
			]
		};

		// Mirrors the `expectDiagnostics:` block typescript's own overrides.ts
		// declares for `_object_type_group1` — the exception now lives entirely
		// in the grammar's own declaration, not in a `grammar === 'typescript'`
		// string comparison.
		const objectTypeGroup1ExpectDiagnostics = {
			'content-collision': ['_object_type_group1'],
			'storagename-collision': ['_object_type_group1']
		};

		it('diagnoseSlotGrouping (the producer) always reports canProceed: false — it has no `grammar` to scope on', () => {
			// The producer has no grammar parameter (see slot-grouping.ts), so it can
			// never safely except a kind by name alone — doing so would except a
			// same-named kind in ANY grammar. The accepted-floor exception is applied
			// later, in collectGrammarDiagnostics, where `expectDiagnostics` is known.
			const records = diagnoseSlotGrouping({ _object_type_group1: twoContentSlotRule });
			expect(records).toEqual([
				expect.objectContaining({
					code: 'content-collision',
					ownerKind: '_object_type_group1',
					slotCount: 2,
					canProceed: false
				})
			]);
		});

		it('content-collision stays canProceed: true for _object_type_group1 when expectDiagnostics declares it (the accepted floor)', () => {
			const result = collectGrammarDiagnostics({
				grammar: 'typescript',
				parseKindCollisions: [],
				slotGroupingDiagnostics: diagnoseSlotGrouping({ _object_type_group1: twoContentSlotRule }),
				expectDiagnostics: objectTypeGroup1ExpectDiagnostics
			});
			expect(result.diagnostics).toEqual([
				expect.objectContaining({ code: 'content-collision', ownerKind: '_object_type_group1', canProceed: true })
			]);
		});

		it('content-collision becomes canProceed: false for a different kind with the same slotCount, even with expectDiagnostics declared', () => {
			const result = collectGrammarDiagnostics({
				grammar: 'typescript',
				parseKindCollisions: [],
				slotGroupingDiagnostics: diagnoseSlotGrouping({ host: twoContentSlotRule }),
				expectDiagnostics: objectTypeGroup1ExpectDiagnostics
			});
			expect(result.diagnostics).toEqual([
				expect.objectContaining({ code: 'content-collision', ownerKind: 'host', canProceed: false })
			]);
		});

		it('content-collision becomes canProceed: false for _object_type_group1 when no expectDiagnostics is supplied (the real bug this guards against)', () => {
			// Same kind name, same shape, but the calling grammar's own overrides.ts
			// never declared the exception — scoping is achieved by presence of the
			// grammar's OWN expectDiagnostics declaration, not a grammar-name string
			// comparison, so omitting it must not silently inherit the floor.
			const result = collectGrammarDiagnostics({
				grammar: 'rust',
				parseKindCollisions: [],
				slotGroupingDiagnostics: diagnoseSlotGrouping({ _object_type_group1: twoContentSlotRule })
			});
			expect(result.diagnostics).toEqual([
				expect.objectContaining({ code: 'content-collision', ownerKind: '_object_type_group1', canProceed: false })
			]);
		});

		it('storagename-collision stays canProceed: true for _object_type_group1 when expectDiagnostics declares it (the accepted floor)', () => {
			const result = collectGrammarDiagnostics({
				grammar: 'typescript',
				parseKindCollisions: [],
				assembleWarnings: [
					{
						code: 'storagename-collision',
						ownerKind: '_object_type_group1',
						message: "storageName collision: kind '_object_type_group1' has 2 slots with storageName 'content'",
						details: {}
					}
				],
				expectDiagnostics: objectTypeGroup1ExpectDiagnostics
			});
			expect(result.diagnostics).toEqual([
				expect.objectContaining({ code: 'storagename-collision', ownerKind: '_object_type_group1', canProceed: true })
			]);
		});

		it('storagename-collision becomes canProceed: false for a different kind, even with expectDiagnostics declared', () => {
			const result = collectGrammarDiagnostics({
				grammar: 'typescript',
				parseKindCollisions: [],
				assembleWarnings: [
					{
						code: 'storagename-collision',
						ownerKind: 'host',
						message: "storageName collision: kind 'host' has 2 slots with storageName 'content'",
						details: {}
					}
				],
				expectDiagnostics: objectTypeGroup1ExpectDiagnostics
			});
			expect(result.diagnostics).toEqual([
				expect.objectContaining({ code: 'storagename-collision', ownerKind: 'host', canProceed: false })
			]);
		});

		it('storagename-collision becomes canProceed: false for _object_type_group1 when no expectDiagnostics is supplied (the real bug this guards against)', () => {
			const result = collectGrammarDiagnostics({
				grammar: 'rust',
				parseKindCollisions: [],
				assembleWarnings: [
					{
						code: 'storagename-collision',
						ownerKind: '_object_type_group1',
						message: "storageName collision: kind '_object_type_group1' has 2 slots with storageName 'content'",
						details: {}
					}
				]
			});
			expect(result.diagnostics).toEqual([
				expect.objectContaining({ code: 'storagename-collision', ownerKind: '_object_type_group1', canProceed: false })
			]);
		});

		it('content-collision becomes canProceed: false when expectDiagnostics declares a DIFFERENT code for the kind', () => {
			// expectDiagnostics is keyed per diagnostic code, not just per kind — a
			// kind exempted from storagename-collision alone must still block on
			// content-collision.
			const result = collectGrammarDiagnostics({
				grammar: 'typescript',
				parseKindCollisions: [],
				slotGroupingDiagnostics: diagnoseSlotGrouping({ _object_type_group1: twoContentSlotRule }),
				expectDiagnostics: { 'storagename-collision': ['_object_type_group1'] }
			});
			expect(result.diagnostics).toEqual([
				expect.objectContaining({ code: 'content-collision', ownerKind: '_object_type_group1', canProceed: false })
			]);
		});
	});
});
