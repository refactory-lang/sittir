import { describe, expect, it } from 'vitest';
import { structuralBuilder } from '../../dsl/builders.ts';
import { buildRuleCatalog } from '../rule-catalog.ts';
import {
	collectGrammarDiagnostics,
	collectGrammarDiagnosticsForGrammar,
	GrammarDiagnosticError
} from '../diagnostics/grammar-diagnostics.ts';
import { diagnoseSlotGrouping } from '../diagnostics/slot-grouping.ts';
import type { DeriveShapeDiagnostic } from '../diagnostics/derive-shapes.ts';
import type { SimplifiedRule } from '../../types/rule.ts';
import type { RawGrammar } from '../types.ts';
import type { GeneratedIdTables } from '../generated-metadata.ts';

function buildRawGrammar(rules: Record<string, unknown>, inline: string[] = [], supertypes: string[] = []): RawGrammar {
	const { rules: catalogRules, ruleCatalog } = buildRuleCatalog(rules as never);
	return {
		name: 'synth',
		rules: catalogRules,
		ruleCatalog,
		extras: [],
		externals: [],
		supertypes,
		factoryInline: [],
		inline,
		conflicts: [],
		precedences: [],
		word: null,
		references: []
	};
}

function catalogTables(symbols: {
	readonly terminals: readonly string[];
	readonly nonterminals: readonly string[];
}): GeneratedIdTables {
	const row = (name: string, id: number, terminal: boolean) => [
		name,
		{
			id,
			parser: {
				cSymbol: `sym_${name}`,
				parserName: name,
				symbolName: name,
				anon: false,
				aux: false,
				alias: false,
				hidden: false,
				...(terminal ? { terminal: true as const } : {})
			}
		}
	];
	const kindIds = Object.fromEntries([
		...symbols.terminals.map((name, index) => row(name, index + 1, true)),
		...symbols.nonterminals.map((name, index) => row(name, symbols.terminals.length + index + 1, false))
	]);
	return { kindIds, sourceArtifact: 'test' };
}

function collisionGrammar(): RawGrammar {
	return buildRawGrammar({
		host: structuralBuilder.choice(
			structuralBuilder.alias({ type: 'SYMBOL', name: 'left' }, { type: 'SYMBOL', name: 'shared' }),
			{ type: 'SYMBOL', name: 'shared' },
			structuralBuilder.alias({ type: 'SYMBOL', name: 'right' }, { type: 'SYMBOL', name: 'shared' })
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
	});
}

describe('grammar diagnostics preflight', () => {
	it('emits parsekind-noninjective from compiler-produced collisions, and display-union-mixed because the fixture skips the enrich pass that resolves a display over both a terminal and a nonterminal', () => {
		const result = collectGrammarDiagnosticsForGrammar({ rawGrammar: collisionGrammar() });

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
				canProceed: false
			}),
			expect.objectContaining({
				code: 'display-union-mixed',
				ownerKind: 'shared',
				canProceed: false,
				details: { display: 'shared', terminals: ['left', 'right'], nonterminals: ['shared'] }
			})
		]);
	});

	it('keeps identical-structure collisions auto-merged without diagnostics', () => {
		const result = collectGrammarDiagnosticsForGrammar({
			rawGrammar: buildRawGrammar({
				host: structuralBuilder.choice(
					structuralBuilder.alias({ type: 'SYMBOL', name: 'left' }, { type: 'SYMBOL', name: 'shared' }),
					{ type: 'SYMBOL', name: 'shared' },
					structuralBuilder.alias({ type: 'SYMBOL', name: 'right' }, { type: 'SYMBOL', name: 'shared' })
				),
				left: { type: 'PATTERN', value: '[a-z]+' },
				shared: { type: 'PATTERN', value: '[a-z]+' },
				right: { type: 'PATTERN', value: '[a-z]+' }
			})
		});

		const host = result.nodeMap.nodes.get('host');
		const slot = (host as { slots: readonly { values: readonly unknown[] }[] }).slots[0];
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

	it('parsekind-noninjective now blocks (canProceed: false), beside the mixed-display guard an enrich-skipping fixture trips', () => {
		const result = collectGrammarDiagnosticsForGrammar({ rawGrammar: collisionGrammar() });
		expect(result.diagnostics).toEqual([
			expect.objectContaining({ code: 'parsekind-noninjective', ownerKind: 'host', canProceed: false }),
			expect.objectContaining({ code: 'display-union-mixed', ownerKind: 'shared', canProceed: false })
		]);
	});

	it("files a display union's members by the parser catalog, so an enrich-skipping fixture over a terminal and a nonterminal trips the mixed-display guard", () => {
		const result = collectGrammarDiagnosticsForGrammar({
			rawGrammar: collisionGrammar(),
			generatedIdTables: catalogTables({
				terminals: ['left', 'right', 'identifier', 'identifier2'],
				nonterminals: ['host', 'shared']
			})
		});
		expect(result.diagnostics).toEqual([
			expect.objectContaining({
				code: 'display-union-mixed',
				ownerKind: 'shared',
				canProceed: false,
				details: { display: 'shared', terminals: ['left', 'right'], nonterminals: ['shared'] }
			})
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
						structuralBuilder.choice({ type: 'SYMBOL', name: 'a' }, { type: 'SYMBOL', name: 'b' }),
						structuralBuilder.choice({ type: 'SYMBOL', name: 'c' }, { type: 'SYMBOL', name: 'd' })
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

	it("collectGrammarDiagnosticsForGrammar surfaces link's kindid-inline-excluded-symbols and kindid-unclassified-symbols diagnostics", () => {
		// 'known' has a kindId; 'inline_only_kind' is a stamp miss declared in
		// the grammar's own inline: array and as a supertype, so its reference
		// stays a boundary instead of splicing; 'gap_kind' is a stamp miss that is
		// neither inline nor stamped, reachable from the root ('host', the
		// first declared rule) — a genuine, unaccepted gap.
		const rawGrammar = buildRawGrammar(
			{
				host: {
					type: 'SEQ',
					members: [
						{ type: 'SYMBOL', name: 'known' },
						{ type: 'SYMBOL', name: 'inline_only_kind' },
						{ type: 'SYMBOL', name: 'gap_kind' }
					]
				},
				known: { type: 'PATTERN', value: 'x' },
				inline_only_kind: { type: 'CHOICE', members: [{ type: 'SYMBOL', name: 'known' }] },
				gap_kind: { type: 'PATTERN', value: 'z' }
			},
			['inline_only_kind'],
			['inline_only_kind']
		);
		const generatedIdTables: GeneratedIdTables = { kindIds: { known: 1 }, sourceArtifact: 'test' };
		const result = collectGrammarDiagnosticsForGrammar({ rawGrammar, generatedIdTables });
		expect(result.diagnostics).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					scope: 'grammar',
					code: 'kindid-inline-excluded-symbols',
					grammar: 'synth',
					details: { kinds: ['inline_only_kind'] }
				}),
				expect.objectContaining({
					scope: 'grammar',
					code: 'kindid-unclassified-symbols',
					grammar: 'synth',
					severity: 'warning',
					details: { kinds: ['gap_kind'] }
				})
			])
		);
	});

	it('collectGrammarDiagnosticsForGrammar surfaces desugarDivergences (evaluate-only mints with no wire-side deposit)', () => {
		const rawGrammar: RawGrammar = {
			...buildRawGrammar({
				host: { type: 'SYMBOL', name: 'known' },
				known: { type: 'PATTERN', value: 'x' }
			}),
			desugarDivergences: [
				{ site: 'body-pattern-group', name: '_orphan_group' }
			]
		};
		const result = collectGrammarDiagnosticsForGrammar({ rawGrammar });
		expect(result.diagnostics).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					scope: 'grammar',
					code: 'desugar-divergence-body-pattern-group',
					grammar: 'synth',
					ownerKind: '_orphan_group',
					severity: 'warning',
					canProceed: true
				})
			])
		);
	});

	it('nonterminal-separator-unstamped blocks (canProceed: false) — zero-instance guard', () => {
		// No grammar fixture can fire this today (no kind in any of the 3 grammars
		// routes a nonterminal separator through the slot-value stamp path's
		// nested-arm-scan source — see the guard in collect-slots.ts's buildSlot),
		// so this pins only the mapping: if the warning is ever recorded, it must
		// block.
		const result = collectGrammarDiagnostics({
			grammar: 'synth',
			parseKindCollisions: [],
			assembleWarnings: [
				{
					code: 'nonterminal-separator-unstamped',
					ownerKind: 'host',
					message: 'nonterminal separator reached the slot-value stamp path'
				}
			]
		});
		expect(result.diagnostics).toEqual([
			expect.objectContaining({ code: 'nonterminal-separator-unstamped', ownerKind: 'host', canProceed: false })
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

		// Mirrors the `expectDiagnostics:` block typescript's own grammar.sittir.ts
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
			// Same kind name, same shape, but the calling grammar's own grammar.sittir.ts
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
