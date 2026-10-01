import { describe, expect, it } from 'vitest';
import { structuralBuilder } from '../../dsl/builders.ts';
import { buildRuleCatalog } from '../rule-catalog.ts';
import {
	blockedRecords,
	collectGrammarDiagnostics,
	collectGrammarDiagnosticsForGrammar,
	evaluateRecords,
	GrammarDiagnosticError
} from '../diagnostics/grammar-diagnostics.ts';
import { diagnoseSlotGrouping } from '../diagnostics/slot-grouping.ts';
import type { SimplifiedRule } from '../../types/rule.ts';
import type { RawGrammar } from '../types.ts';
import { predictedKindsOf, type GeneratedIdTables } from '../../dsl/symbol-table.ts';
import { AssembledEnum } from '../model/node-map.ts';
import { CHOICE, SEQ, STRING } from '../../types/rule-types.ts';

function buildRawGrammar(rules: Record<string, unknown>, inline: string[] = [], supertypes: string[] = []): RawGrammar {
	const { rules: catalogRules, ruleCatalog } = buildRuleCatalog(rules as never);
	return {
		name: 'synth',
		fileTypes: [],
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

function withPredictedKinds(raw: RawGrammar): RawGrammar {
	return { ...raw, predictedKinds: predictedKindsOf(raw) };
}

function collisionGrammar(): RawGrammar {
	return withPredictedKinds(buildRawGrammar({
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
	}));
}

describe('grammar diagnostics preflight', () => {
	it('records single-literal-choice and leaves the kind out when a literal choice yields fewer than two values', () => {
		const seq = (...values: string[]) => ({ type: 'SEQ', members: values.map((value) => ({ type: 'STRING', value })) });
		const rawGrammar = withPredictedKinds(
			buildRawGrammar({
				program: { type: 'SYMBOL', name: 'meta_property' },
				meta_property: { type: 'CHOICE', members: [seq('new', '.', 'target'), seq('import', '.', 'meta')] }
			})
		);
		const result = collectGrammarDiagnosticsForGrammar({ rawGrammar });
		expect(result.diagnostics).toContainEqual(
			expect.objectContaining({ code: 'single-literal-choice', ownerKind: 'meta_property', canProceed: false })
		);
		expect(result.nodeMap.nodes.has('meta_property')).toBe(false);
		expect(result.nodeMap.droppedKinds).toEqual(new Set(['meta_property']));
	});

	it('an AssembledEnum with fewer than two values is unreachable past the record, so its constructor still refuses one', () => {
		const tail = (head: string, last: string) => ({ type: SEQ, members: [head, '.', last].map((value) => ({ type: STRING, value })) });
		expect(() => new AssembledEnum('meta_property', { type: CHOICE, members: [tail('new', 'target'), tail('import', 'meta')] })).toThrow(
			/assemble records single-literal-choice before constructing one/
		);
	});

	it('records groups-config-invalid for a lift that does not resolve and applies the others', () => {
		const rawGrammar = withPredictedKinds({
			...buildRawGrammar({
				program: {
					type: 'SEQ',
					members: [
						{ type: 'SYMBOL', name: 'a' },
						{ type: 'SEQ', members: [{ type: 'STRING', value: '(' }, { type: 'SYMBOL', name: 'b' }] }
					]
				},
				a: { type: 'PATTERN', value: 'a' },
				b: { type: 'PATTERN', value: 'b' }
			}),
			groups: { program: { '1': 'inner', '7': 'missing' } }
		});
		const result = collectGrammarDiagnosticsForGrammar({ rawGrammar });
		expect(result.diagnostics).toContainEqual(
			expect.objectContaining({
				code: 'groups-config-invalid',
				canProceed: false,
				message: expect.stringMatching(/groups\['program'\]\['7'\]/)
			})
		);
		expect(result.linked.rules._program_inner).toBeDefined();
	});

	it('rejects an expectDiagnostics entry that names a code no entry can expect', () => {
		const rawGrammar = { ...collisionGrammar(), expectDiagnostics: { 'refine-config-invalid': ['host'] } };
		expect(evaluateRecords(rawGrammar)).toContainEqual(
			expect.objectContaining({ code: 'expect-diagnostics-invalid', canProceed: false, details: { code: 'refine-config-invalid' } })
		);
	});

	it('rejects floors on the declaration codes, and keeps the debt codes floorable', () => {
		const declarationCodes = ['rule-cause-missing', 'rule-cause-mismatch', 'render-only-not-external', 'vocabulary-replaces-upstream'];
		const debtCodes = ['rule-reauthored-without-cause', 'patch-without-cause'];
		const rawGrammar = {
			...collisionGrammar(),
			expectDiagnostics: Object.fromEntries([...declarationCodes, ...debtCodes].map((code) => [code, ['host']]))
		};
		const invalid = evaluateRecords(rawGrammar)
			.filter((d) => d.code === 'expect-diagnostics-invalid')
			.map((d) => (d.details as { code: string }).code);
		expect(invalid.sort()).toEqual([...declarationCodes].sort());
	});

	it('keeps aliased arms injective by their storage ids under the predicted catalog, and trips display-union-mixed because the fixture skips the enrich pass that resolves a display over both a terminal and a nonterminal', () => {
		const result = collectGrammarDiagnosticsForGrammar({ rawGrammar: collisionGrammar() });

		expect(result.nodeMap.parseKindCollisions).toEqual([]);
		expect(result.diagnostics).toEqual([
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

	it('parsekind-noninjective blocks (canProceed: false)', () => {
		const { diagnostics } = collectGrammarDiagnostics({
			grammar: 'synth',
			parseKindCollisions: [
				{
					code: 'parsekind-noninjective',
					severity: 'error',
					message: "Slot 'content' of kind 'host' collapses [left, shared] onto parse kind 'shared'.",
					canProceed: true,
					ownerKind: 'host',
					slotName: 'content',
					shape: 'propose-distinct-alias',
					parseKind: 'shared',
					storageKinds: ['left', 'shared'],
					proposal: 'Give each colliding arm a distinct alias.'
				}
			]
		});
		expect(diagnostics).toEqual([expect.objectContaining({ code: 'parsekind-noninjective', ownerKind: 'host', canProceed: false })]);
	});

	it("files a display union's members by the predicted catalog, so an enrich-skipping fixture over a terminal and a nonterminal trips the mixed-display guard", () => {
		const result = collectGrammarDiagnosticsForGrammar({ rawGrammar: collisionGrammar() });
		expect(result.diagnostics).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					code: 'display-union-mixed',
					ownerKind: 'shared',
					canProceed: false,
					details: { display: 'shared', terminals: ['left', 'right'], nonterminals: ['shared'] }
				})
			])
		);
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

	it('an unstructurable token interior reaches the grammar diagnostics as a blocking record', () => {
		const rawGrammar = buildRawGrammar({
			host: { type: 'SEQ', members: [{ type: 'SYMBOL', name: 'tok' }] },
			tok: { type: 'PATTERN', value: '(?<name>[a-z]+)\\d+' }
		});
		const { diagnostics } = collectGrammarDiagnosticsForGrammar({ rawGrammar });
		expect(diagnostics).toEqual(
			expect.arrayContaining([expect.objectContaining({ code: 'token-interior-unstructurable', ownerKind: 'tok', canProceed: false })])
		);
	});

	it('an automatic type-name rename is a naming event, not a grammar diagnostic', () => {
		const rawGrammar = buildRawGrammar({
			host: {
				type: 'SEQ',
				members: [
					{ type: 'SYMBOL', name: 'foo' },
					{ type: 'SYMBOL', name: 'Foo' }
				]
			},
			foo: { type: 'PATTERN', value: 'f' },
			Foo: { type: 'PATTERN', value: 'F' }
		});
		const result = collectGrammarDiagnosticsForGrammar({ rawGrammar });
		expect(result.nodeMap.namingEvents).toEqual([expect.objectContaining({ kind: 'foo', from: 'Foo', to: 'Foo2' })]);
		expect(result.diagnostics.map((d) => d.code)).not.toContain('typename-collision');
	});

	it("keeps link's kindid-* stamp-miss reports out of the grammar diagnostics", () => {
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
		expect(result.compilerDiagnostics.all().map((d) => d.code)).toEqual(
			expect.arrayContaining(['kindid-inline-excluded-symbols', 'kindid-unclassified-symbols'])
		);
		expect(result.diagnostics.filter((d) => d.code.startsWith('kindid-'))).toEqual([]);
	});

	it('evaluateRecords surfaces desugarDivergences (evaluate-only mints with no wire-side deposit)', () => {
		const rawGrammar: RawGrammar = {
			...buildRawGrammar({
				host: { type: 'SYMBOL', name: 'known' },
				known: { type: 'PATTERN', value: 'x' }
			}),
			desugarDivergences: [
				{ site: 'body-pattern-group', name: '_orphan_group' }
			]
		};
		expect(evaluateRecords(rawGrammar)).toEqual(
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

		const contentCollision = (kind: string) =>
			collectGrammarDiagnostics({
				grammar: 'typescript',
				parseKindCollisions: [],
				slotGroupingDiagnostics: diagnoseSlotGrouping({ [kind]: twoContentSlotRule })
			}).diagnostics;
		const storageCollision = (kind: string) =>
			collectGrammarDiagnostics({
				grammar: 'typescript',
				parseKindCollisions: [],
				assembleWarnings: [
					{
						code: 'storagename-collision',
						ownerKind: kind,
						message: `storageName collision: kind '${kind}' has 2 slots with storageName 'content'`,
						details: {}
					}
				]
			}).diagnostics;

		it('both codes record canProceed: false; the floor applies only at the gate', () => {
			expect(contentCollision('_object_type_group1')).toEqual([
				expect.objectContaining({ code: 'content-collision', ownerKind: '_object_type_group1', canProceed: false })
			]);
			expect(storageCollision('_object_type_group1')).toEqual([
				expect.objectContaining({ code: 'storagename-collision', ownerKind: '_object_type_group1', canProceed: false })
			]);
		});

		it('the gate accepts _object_type_group1 for both codes when expectDiagnostics declares it (the accepted floor)', () => {
			expect(blockedRecords(contentCollision('_object_type_group1'), objectTypeGroup1ExpectDiagnostics)).toEqual([]);
			expect(blockedRecords(storageCollision('_object_type_group1'), objectTypeGroup1ExpectDiagnostics)).toEqual([]);
		});

		it('the gate blocks a different kind with the same shape, even with expectDiagnostics declared', () => {
			expect(blockedRecords(contentCollision('host'), objectTypeGroup1ExpectDiagnostics)).toHaveLength(1);
			expect(blockedRecords(storageCollision('host'), objectTypeGroup1ExpectDiagnostics)).toHaveLength(1);
		});

		it('the gate blocks _object_type_group1 when no expectDiagnostics is supplied (the real bug this guards against)', () => {
			expect(blockedRecords(contentCollision('_object_type_group1'), undefined)).toHaveLength(1);
			expect(blockedRecords(storageCollision('_object_type_group1'), undefined)).toHaveLength(1);
		});

		it('the gate blocks content-collision when expectDiagnostics declares a DIFFERENT code for the kind', () => {
			const floors = { 'storagename-collision': ['_object_type_group1'] };
			expect(blockedRecords(contentCollision('_object_type_group1'), floors)).toEqual([
				expect.objectContaining({ code: 'content-collision', ownerKind: '_object_type_group1' })
			]);
		});
	});
});

describe('unsupported shapes block unless floor-listed for their own code', () => {
	const warning = (code: string) => ({ code, ownerKind: 'k', message: 'm', details: {} });

	for (const code of ['unclassifiable-shape', 'union-slot-mixed-row', 'union-slot-unaddressable']) {
		it(`${code} blocks, is accepted when the owner is floor-listed for it, and still blocks when listed for another code`, () => {
			const records = collectGrammarDiagnostics({ grammar: 'synth', parseKindCollisions: [], assembleWarnings: [warning(code)] })
				.diagnostics;
			expect(records).toEqual([expect.objectContaining({ code, canProceed: false })]);
			expect(blockedRecords(records, undefined)).toHaveLength(1);
			expect(blockedRecords(records, { [code]: ['k'] })).toEqual([]);
			expect(blockedRecords(records, { 'union-slot-routed': ['k'] })).toHaveLength(1);
		});
	}

	it('union-slot-routed stays a census warning: it reports the supported union-slot routing', () => {
		const [d] = collectGrammarDiagnostics({
			grammar: 'synth',
			parseKindCollisions: [],
			assembleWarnings: [warning('union-slot-routed')]
		}).diagnostics;
		expect(d).toEqual(expect.objectContaining({ code: 'union-slot-routed', canProceed: true }));
	});

	it('multi-slot-nested-seq blocks, and is accepted only when floor-listed for its own code', () => {
		const record = {
			code: 'multi-slot-nested-seq' as const,
			severity: 'warning' as const,
			message: 'm',
			canProceed: false,
			ownerKind: 'k',
			slotCount: 2,
			proposal: 'p'
		};
		const records = collectGrammarDiagnostics({ grammar: 'synth', parseKindCollisions: [], slotGroupingDiagnostics: [record] })
			.diagnostics;
		expect(blockedRecords(records, undefined)).toHaveLength(1);
		expect(blockedRecords(records, { 'multi-slot-nested-seq': ['k'] })).toEqual([]);
		expect(blockedRecords(records, { 'content-collision': ['k'] })).toHaveLength(1);
	});
});

describe('the grammar root must be a non-terminal', () => {
	const rootRecords = (rules: Record<string, unknown>) =>
		collectGrammarDiagnosticsForGrammar({ rawGrammar: withPredictedKinds(buildRawGrammar(rules)) }).diagnostics.filter(
			(d) => d.code === 'grammar-root-terminal'
		);

	it('a choice-of-literals root is a blocking record naming the root', () => {
		expect(rootRecords({ mode: { type: 'CHOICE', members: [{ type: 'STRING', value: 'on' }, { type: 'STRING', value: 'off' }] } })).toEqual([
			expect.objectContaining({ ownerKind: 'mode', severity: 'error', canProceed: false })
		]);
	});

	it('a single-pattern root is a blocking record naming the root', () => {
		expect(rootRecords({ word: { type: 'PATTERN', value: '[a-z]+' } })).toEqual([
			expect.objectContaining({ ownerKind: 'word', severity: 'error', canProceed: false })
		]);
	});

	it('a root with children compiles without the record', () => {
		expect(
			rootRecords({
				program: { type: 'REPEAT', content: { type: 'SYMBOL', name: 'word' } },
				word: { type: 'PATTERN', value: '[a-z]+' }
			})
		).toEqual([]);
	});
});
