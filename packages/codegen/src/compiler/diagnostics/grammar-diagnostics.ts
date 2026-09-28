import { writeFileSync } from 'node:fs';

import { assemble, AssembleCtx, type AssembledNodeMap } from '../assemble.ts';
import { collapseRenamedRules, link } from '../link.ts';
import { normalizeGrammar, NormalizeCtx } from '../normalize.ts';
import { DiagnosticSink } from '../../types/diagnostics.ts';
import { buildInlinableKinds } from '../inline-sets.ts';
import type { ParseKindCollisionDiagnostic } from '../../types/parsekind-collisions.ts';
import type { AssembleWarning, NamingEvent } from '../model/node-map.ts';
import { makeSlotGroupingCollector } from '../simplify.ts';
import { diagnoseRepeatedSeqGrouping, type SlotGroupingDiagnostic } from './slot-grouping.ts';
import type { RawGrammar, LinkedGrammar, NormalizedGrammar, IncludeFilter, DesugarDivergenceEvent, ReservedWordsets, RuleCatalog } from '../types.ts';
import {
	kindCatalogOf,
	predictedEntriesOf,
	renameAwareSymbolSource,
	reservedWordset,
	type GeneratedIdTables,
	type KindEntryLike
} from '../../dsl/symbol-table.ts';
import type { CompilerDiagnostic, GrammarDiagnostic } from '../../types/diagnostics.ts';
import { diagnoseDistributedAliases, diagnoseMixedDisplayUnions } from './alias-distributed.ts';
import { symbolFactsOf } from '../../dsl/rule-patterns.ts';
import { lineTerminated, triviaKinds } from '../model/trivia.ts';
import type { NodeMap } from '../types.ts';

export type { GrammarDiagnostic };

export class GrammarDiagnosticError extends Error {
	readonly codes: readonly string[];

	constructor(
		readonly diagnostics: readonly GrammarDiagnostic[],
		readonly records: readonly GrammarDiagnostic[] = diagnostics
	) {
		super(diagnostics.map((diagnostic) => `${diagnostic.code}: ${diagnostic.message}`).join('\n'));
		this.name = 'GrammarDiagnosticError';
		this.codes = diagnostics.map((diagnostic) => diagnostic.code);
	}
}

export type DiagnosticFloors = Readonly<Record<string, readonly string[]>> | undefined;

export function blockedRecords(
	records: readonly GrammarDiagnostic[],
	floors: DiagnosticFloors,
	allow: ReadonlySet<string> = new Set()
): GrammarDiagnostic[] {
	return records.filter(
		(record) =>
			record.canProceed === false && !allow.has(record.code) && !isExpectedDiagnostic(floors, record.code, record.ownerKind)
	);
}

export function assertGatePasses(
	records: readonly GrammarDiagnostic[],
	floors: DiagnosticFloors,
	allow: ReadonlySet<string> = new Set()
): void {
	const blocked = blockedRecords(records, floors, allow);
	if (blocked.length > 0) throw new GrammarDiagnosticError(blocked, records);
}

export function fromParseKindCollision(grammar: string, diagnostic: ParseKindCollisionDiagnostic): GrammarDiagnostic {
	return {
		scope: 'grammar',
		code: diagnostic.code,
		severity: diagnostic.severity,
		grammar,
		ownerKind: diagnostic.ownerKind,
		slotName: diagnostic.slotName,
		message: diagnostic.message,
		proposal: diagnostic.proposal,
		canProceed: diagnostic.canProceed,
		details: {
			parseKind: diagnostic.parseKind,
			storageKinds: diagnostic.storageKinds
		}
	};
}

export function fromAssembleWarning(grammar: string, warning: AssembleWarning): GrammarDiagnostic {
	const blocking = BLOCKING_SHAPE_CODES.has(warning.code);
	return {
		scope: 'grammar',
		code: warning.code,
		severity: blocking ? 'error' : 'warning',
		grammar,
		ownerKind: warning.ownerKind,
		message: warning.message,
		canProceed: !blocking,
		details: warning.details
	};
}

export function fromSlotGrouping(grammar: string, diagnostic: SlotGroupingDiagnostic): GrammarDiagnostic {
	return {
		scope: 'grammar',
		code: diagnostic.code,
		severity: diagnostic.severity,
		grammar,
		ownerKind: diagnostic.ownerKind,
		message: diagnostic.message,
		proposal: diagnostic.proposal,
		canProceed: diagnostic.canProceed,
		details: { slotCount: diagnostic.slotCount }
	};
}

const BLOCKING_SHAPE_CODES: ReadonlySet<string> = new Set([
	'storagename-collision',
	'nonterminal-separator-unstamped',
	'unclassifiable-shape',
	'kind-shape-mismatch',
	'single-literal-choice',
	'union-slot-mixed-row',
	'union-slot-unaddressable'
]);

export function isExpectedDiagnostic(
	expectDiagnostics: Readonly<Record<string, readonly string[]>> | undefined,
	code: string,
	ownerKind: string | undefined
): boolean {
	if (ownerKind === undefined) return false;
	return (expectDiagnostics?.[code] ?? []).includes(ownerKind);
}

export function fromBodyPatternZeroMatch(grammar: string, hiddenName: string): GrammarDiagnostic {
	return {
		scope: 'grammar',
		code: 'body-pattern-zero-match',
		severity: 'warning',
		grammar,
		ownerKind: hiddenName,
		message: `groups: body-pattern '${hiddenName}' matched no base-grammar position — the visible-group elevation it declares never fired, so its match sites keep their flat (un-elevated) shape.`,
		proposal: `The pattern body must remain STRUCTURALLY IDENTICAL to the base-grammar sub-tree it targets. If the base grammar changed (or the entry's body was edited), re-align the body — or delete the entry if the pattern is obsolete.`,
		canProceed: true
	};
}

const DESUGAR_DIVERGENCE_DESCRIPTIONS: Record<DesugarDivergenceEvent['site'], string> = {
	'body-pattern-group': "evaluateRulesAndInjectSynthetics's body-pattern-group fallback fired with no wire-side deposit"
};

export function fromDesugarDivergence(grammar: string, event: DesugarDivergenceEvent): GrammarDiagnostic {
	return {
		scope: 'grammar',
		code: `desugar-divergence-${event.site}`,
		severity: 'warning',
		grammar,
		ownerKind: event.name,
		message: `${DESUGAR_DIVERGENCE_DESCRIPTIONS[event.site]}: '${event.name}'. Tree-sitter's separate execution of this grammar never registers this rule, so it has no parser-issued kindId — a phantom kind by construction.`,
		proposal: `Route this synthesis through the DSL layer (enrich/wire) pre-generate, so both executions mint the same rule, instead of leaving it to this evaluate-only fallback.`,
		canProceed: true
	};
}

export function reservedMemberDiagnostics(
	grammar: string,
	reserved: ReservedWordsets | undefined,
	entries: readonly KindEntryLike[]
): GrammarDiagnostic[] {
	return Object.keys(reserved ?? {}).flatMap((wordset) =>
		reservedWordset(reserved, wordset, entries).nonLiteral.map((member) => ({
			scope: 'grammar' as const,
			code: 'reserved-member-not-literal',
			severity: 'warning' as const,
			grammar,
			ownerKind: member,
			message: `reserved wordset '${wordset}' member '${member}' has no literal text, so the word builder cannot reject it.`,
			proposal: `List the word as a string, or as a symbol whose rule is a single literal.`,
			canProceed: true
		}))
	);
}

export function triviaLineEndDiagnostics(grammar: string, nodeMap: NodeMap): GrammarDiagnostic[] {
	return [...triviaKinds(nodeMap)]
		.filter((kind) => lineTerminated(nodeMap, kind) === undefined)
		.map((kind) => ({
			scope: 'grammar' as const,
			code: 'trivia-line-end-undetermined',
			severity: 'error' as const,
			grammar,
			ownerKind: kind,
			message: `trivia kind '${kind}' ends in an external token with no render rule, so whether it ends its line cannot be read from the grammar.`,
			proposal: `Author a render-only rule for the external token in grammar.sittir.ts, giving the text it scans.`,
			canProceed: false
		}));
}

export function collectGrammarDiagnostics(input: {
	grammar: string;
	parseKindCollisions: readonly ParseKindCollisionDiagnostic[];
	assembleWarnings?: readonly AssembleWarning[];
	slotGroupingDiagnostics?: readonly SlotGroupingDiagnostic[];
}): { diagnostics: readonly GrammarDiagnostic[] } {
	const parseKindMapped = input.parseKindCollisions.map((diagnostic) => ({
		...fromParseKindCollision(input.grammar, diagnostic),
		canProceed: false
	}));
	const assembleWarningMapped = (input.assembleWarnings ?? []).map((warning) => fromAssembleWarning(input.grammar, warning));
	const slotGroupingMapped = (input.slotGroupingDiagnostics ?? []).map((diagnostic) =>
		fromSlotGrouping(input.grammar, diagnostic)
	);
	return { diagnostics: [...parseKindMapped, ...assembleWarningMapped, ...slotGroupingMapped] };
}

const SURFACED_COMPILER_CODES: ReadonlySet<string> = new Set(['groups-config-invalid', 'refine-config-invalid', 'token-interior-unstructurable']);

const UNEXPECTABLE_CODES: ReadonlySet<string> = new Set([
	'dangling-internal-ref',
	'unpredictable-symbol-table',
	'kind-key-collision',
	'groups-config-invalid',
	'refine-config-invalid',
	'rule-cause-missing',
	'rule-cause-mismatch',
	'render-only-not-external',
	'vocabulary-replaces-upstream',
	'whitespace-mint-collision'
]);

export function unexpectableExpectEntries(
	grammar: string,
	expectDiagnostics: Readonly<Record<string, readonly string[]>> | undefined
): GrammarDiagnostic[] {
	return Object.keys(expectDiagnostics ?? {})
		.filter((code) => UNEXPECTABLE_CODES.has(code))
		.map((code) => ({
			scope: 'grammar',
			code: 'expect-diagnostics-invalid',
			severity: 'error',
			grammar,
			message: `expectDiagnostics: '${code}' cannot be expected; it reports a grammar or config the compiler rejects, so fix its cause instead`,
			canProceed: false,
			details: { code }
		}));
}

export function collectGrammarDiagnosticsForGrammar(input: {
	rawGrammar: RawGrammar;
	include?: IncludeFilter;
	generatedIdTables?: GeneratedIdTables;
}): {
	raw: RawGrammar;
	linked: LinkedGrammar;
	normalized: NormalizedGrammar;
	nodeMap: AssembledNodeMap;
	compilerDiagnostics: DiagnosticSink;
	slotGroupingDiagnostics: readonly SlotGroupingDiagnostic[];
	diagnostics: readonly GrammarDiagnostic[];
} {
	const kindEntries = kindCatalogOf(input.generatedIdTables, input.rawGrammar);
	const rawGrammar = collapseRenamedRules(input.rawGrammar, { kindEntries });
	const compilerDiagnostics = new DiagnosticSink();
	const slotGroupingCollector = makeSlotGroupingCollector();
	const linked = link(rawGrammar, {
		include: input.include,
		generatedIdTables: input.generatedIdTables,
		diagnostics: compilerDiagnostics
	});
	const inlineKinds = buildInlinableKinds(new Set(rawGrammar.inline), linked);
	for (const rec of diagnoseRepeatedSeqGrouping(linked.rules, inlineKinds)) slotGroupingCollector.record(rec);
	const normalized = normalizeGrammar(
		linked,
		new NormalizeCtx({
			grammar: linked,
			inlineKinds,
			diagnostics: compilerDiagnostics,
			slotGroupingCollector
		})
	);
	const nodeMap = assemble(
		AssembleCtx.from(
			normalized,
			input.generatedIdTables,
			compilerDiagnostics,
			kindEntries
		)
	);
	const slotGroupingDiagnostics = slotGroupingCollector.all;
	const contentAliasDiagnostics = diagnoseContentAliasInjectivity({
		grammar: rawGrammar.name,
		contentAliasedTo: linked.contentAliasedTo
	});
	const symbols = renameAwareSymbolSource({
		...symbolFactsOf(rawGrammar),
		kindEntries: predictedEntriesOf(rawGrammar.predictedKinds)
	});
	const surfacedCompilerDiagnostics: GrammarDiagnostic[] = compilerDiagnostics
		.all()
		.filter((d) => SURFACED_COMPILER_CODES.has(d.code))
		.map((d) => ({ ...d, scope: 'grammar' as const, grammar: rawGrammar.name }));
	return {
		raw: rawGrammar,
		linked,
		normalized,
		nodeMap,
		compilerDiagnostics,
		slotGroupingDiagnostics,
		diagnostics: withoutOrphanedGroups(rawGrammar, [
			...collectGrammarDiagnostics({
				grammar: rawGrammar.name,
				parseKindCollisions: nodeMap.parseKindCollisions,
				assembleWarnings: nodeMap.assembleWarnings,
				slotGroupingDiagnostics
			}).diagnostics,
			...contentAliasDiagnostics,
			...diagnoseDistributedAliases({ grammar: rawGrammar.name, symbols }),
			...diagnoseMixedDisplayUnions({ grammar: rawGrammar.name, displayUnions: linked.displayUnions, symbols }),
			...reservedMemberDiagnostics(rawGrammar.name, nodeMap.reserved, kindEntries),
			...triviaLineEndDiagnostics(rawGrammar.name, nodeMap),
			...surfacedCompilerDiagnostics
		])
	};
}

export function predictionFailed(raw: Pick<RawGrammar, 'predictedKinds'>): boolean {
	return raw.predictedKinds !== undefined && 'failure' in raw.predictedKinds;
}

export function predictionRecords(raw: Pick<RawGrammar, 'name' | 'predictedKinds'>): GrammarDiagnostic[] {
	const kinds = raw.predictedKinds;
	if (kinds === undefined) return [];
	if ('entries' in kinds) {
		return kinds.keyCollisions.map(({ key, symbols: [kept, dropped] }) => ({
			scope: 'grammar',
			code: 'kind-key-collision',
			severity: 'error',
			grammar: raw.name,
			ownerKind: key,
			message: `the kind key '${key}' names both ${kept} and ${dropped}; the catalog keeps ${kept}, so ${dropped} has no kind`,
			canProceed: false,
			details: { key, symbols: [kept, dropped] }
		}));
	}
	if (kinds.undefinedNames.length === 0) {
		return [
			{
				scope: 'grammar',
				code: 'unpredictable-symbol-table',
				severity: 'error',
				grammar: raw.name,
				message: `the parser's symbol table cannot be predicted from the grammar: ${kinds.failure}`,
				canProceed: false,
				details: { message: kinds.failure }
			}
		];
	}
	return kinds.undefinedNames.map((targetName) => ({
		scope: 'grammar',
		code: 'dangling-internal-ref',
		severity: 'error',
		grammar: raw.name,
		message: `the grammar references '${targetName}', which names no rule and no external`,
		canProceed: false,
		details: { targetName }
	}));
}

export function evaluateRecords(raw: RawGrammar): GrammarDiagnostic[] {
	return withoutOrphanedGroups(raw, [
		...predictionRecords(raw),
		...unexpectableExpectEntries(raw.name, raw.expectDiagnostics),
		...(raw.bodyPatternZeroMatches ?? []).map((name) => fromBodyPatternZeroMatch(raw.name, name)),
		...(raw.desugarDivergences ?? []).map((event) => fromDesugarDivergence(raw.name, event))
	]);
}

export function diagnoseStage(raw: RawGrammar): { diagnostics: GrammarDiagnostic[]; ruleCatalog?: RuleCatalog } {
	const records = evaluateRecords(raw);
	if (predictionFailed(raw)) return { diagnostics: records };
	const { diagnostics, raw: collapsed } = collectGrammarDiagnosticsForGrammar({ rawGrammar: raw });
	return { diagnostics: [...records, ...diagnostics], ruleCatalog: collapsed.ruleCatalog };
}

function withoutOrphanedGroups(raw: Pick<RawGrammar, 'orphanedSyntheticGroups'>, records: GrammarDiagnostic[]): GrammarDiagnostic[] {
	const orphaned = new Set(raw.orphanedSyntheticGroups ?? []);
	return orphaned.size === 0 ? records : records.filter((d) => d.ownerKind === undefined || !orphaned.has(d.ownerKind));
}

export function formatGrammarDiagnostics(diagnostics: readonly GrammarDiagnostic[]): string {
	if (diagnostics.length === 0) return 'No grammar diagnostics.';
	return diagnostics
		.map(
			(d) =>
				`[${d.severity}] ${d.code}  ${d.ownerKind ?? '-'}.${d.slotName ?? '-'}\n  ${d.message}${d.proposal !== undefined ? `\n  Proposal: ${d.proposal}` : ''}`
		)
		.join('\n');
}

export function formatNamingEvents(events: readonly NamingEvent[]): string {
	return events.map((e) => `[naming] ${e.kind}: type name '${e.from}' → '${e.to}' (${e.message})`).join('\n');
}

export function formatCompilerDiagnostics(diagnostics: readonly CompilerDiagnostic[]): string {
	if (diagnostics.length === 0) return 'No compiler diagnostics.';
	return diagnostics
		.map(
			(d) =>
				`[${d.severity}] ${d.code}  (${d.phase})\n  ${d.message}${d.proposal !== undefined ? `\n  Proposal: ${d.proposal}` : ''}`
		)
		.join('\n');
}

export function writeGrammarDiagnosticsJson(
	diagnostics: readonly (GrammarDiagnostic | CompilerDiagnostic)[],
	outPath: string
): void {
	writeFileSync(outPath, JSON.stringify(diagnostics, null, 2));
}

export function diagnoseContentAliasInjectivity(input: {
	grammar: string;
	contentAliasedTo?: ReadonlyMap<string, readonly string[]>;
}): readonly GrammarDiagnostic[] {
	const { contentAliasedTo } = input;
	if (!contentAliasedTo || contentAliasedTo.size === 0) return [];

	const bodiesByTwin = new Map<string, Set<string>>();
	for (const [body, twins] of contentAliasedTo) {
		for (const twin of twins) {
			const set = bodiesByTwin.get(twin) ?? new Set<string>();
			set.add(body);
			bodiesByTwin.set(twin, set);
		}
	}

	const diagnostics: GrammarDiagnostic[] = [];
	for (const [twin, bodies] of bodiesByTwin) {
		if (bodies.size <= 1) continue;
		const bodyList = [...bodies].sort();
		diagnostics.push({
			scope: 'grammar',
			code: 'content-alias-noninjective',
			severity: 'error',
			grammar: input.grammar,
			ownerKind: twin,
			message: `Content-alias twin '${twin}' is minted from ${bodies.size} distinct hidden bodies (${bodyList.join(', ')}); the second mint is silently dropped, so the kind's shape depends on order.`,
			proposal: `Give each hidden body its own visible twin name, or merge the bodies into one shared kind.`,
			canProceed: true,
			details: { twin, bodies: bodyList }
		});
	}
	return diagnostics;
}
