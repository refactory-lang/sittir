import { writeFileSync } from 'node:fs';

import { assemble, AssembleCtx, type AssembledNodeMap } from '../assemble.ts';
import { link } from '../link.ts';
import { normalizeGrammar, NormalizeCtx } from '../normalize.ts';
import { DiagnosticSink } from '../../types/diagnostics.ts';
import {
	loadGrammarJsonInlineList,
	loadGrammarJsonAliasMap,
	buildInlinableKinds
} from '../inline-sets.ts';
import type { ParseKindCollisionDiagnostic } from '../../types/parsekind-collisions.ts';
import type { DeriveShapeDiagnostic } from './derive-shapes.ts';
import type { AssembleWarning } from '../model/node-map.ts';
import { drainSlotGroupingDiagnostics } from '../simplify.ts';
import type { SlotGroupingDiagnostic } from './slot-grouping.ts';
import type { RawGrammar, DesugarDivergenceEvent } from '../types.ts';
import type { GeneratedIdTables } from '../generated-metadata.ts';
import type { CompilerDiagnostic, GrammarDiagnostic } from '../../types/diagnostics.ts';

export type { GrammarDiagnostic };

export class GrammarDiagnosticError extends Error {
	readonly codes: readonly string[];

	constructor(readonly diagnostics: readonly GrammarDiagnostic[]) {
		super(diagnostics.map((diagnostic) => `${diagnostic.code}: ${diagnostic.message}`).join('\n'));
		this.name = 'GrammarDiagnosticError';
		this.codes = diagnostics.map((diagnostic) => diagnostic.code);
	}
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

export function fromDeriveShape(grammar: string, diagnostic: DeriveShapeDiagnostic): GrammarDiagnostic {
	return {
		scope: 'grammar',
		code: diagnostic.code,
		severity: diagnostic.severity,
		grammar,
		ownerKind: diagnostic.ownerKind ?? '(no-kind-context)',
		ruleId: diagnostic.ruleId,
		message: diagnostic.message,
		proposal: diagnostic.proposal,
		canProceed: true,
		details: diagnostic.details
	};
}

export function fromAssembleWarning(grammar: string, warning: AssembleWarning): GrammarDiagnostic {
	const severity = warning.code === 'typename-collision' ? 'info' : 'warning';
	return {
		scope: 'grammar',
		code: warning.code,
		severity,
		grammar,
		ownerKind: warning.ownerKind,
		message: warning.message,
		canProceed: true,
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

function isBlockingAssembleWarningCode(code: string): boolean {
	return code === 'storagename-collision' || code === 'nonterminal-separator-unstamped';
}

function isExpectedDiagnostic(
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
	'inline-alias-source': 'synthesizeInlineAliasSources minted an alias source with no wire-side deposit',
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

export function collectGrammarDiagnostics(input: {
	grammar: string;
	parseKindCollisions: readonly ParseKindCollisionDiagnostic[];
	deriveShapeDiagnostics?: readonly DeriveShapeDiagnostic[];
	assembleWarnings?: readonly AssembleWarning[];
	slotGroupingDiagnostics?: readonly SlotGroupingDiagnostic[];
	expectDiagnostics?: Readonly<Record<string, readonly string[]>>;
}): { diagnostics: readonly GrammarDiagnostic[] } {
	const parseKindMapped = input.parseKindCollisions.map((diagnostic) => ({
		...fromParseKindCollision(input.grammar, diagnostic),
		canProceed: false
	}));
	const deriveShapeMapped = (input.deriveShapeDiagnostics ?? []).map((diagnostic) =>
		fromDeriveShape(input.grammar, diagnostic)
	);
	const assembleWarningMapped = (input.assembleWarnings ?? []).map((warning) => {
		const mapped = fromAssembleWarning(input.grammar, warning);
		if (!isBlockingAssembleWarningCode(warning.code)) return mapped;
		if (isExpectedDiagnostic(input.expectDiagnostics, warning.code, warning.ownerKind)) return mapped;
		return { ...mapped, canProceed: false };
	});
	const slotGroupingMapped = (input.slotGroupingDiagnostics ?? []).map((diagnostic) => {
		const mapped = fromSlotGrouping(input.grammar, diagnostic);
		if (
			diagnostic.code === 'content-collision' &&
			isExpectedDiagnostic(input.expectDiagnostics, diagnostic.code, diagnostic.ownerKind)
		) {
			return { ...mapped, canProceed: true };
		}
		return mapped;
	});
	return { diagnostics: [...parseKindMapped, ...deriveShapeMapped, ...assembleWarningMapped, ...slotGroupingMapped] };
}

export function collectGrammarDiagnosticsForGrammar(input: {
	rawGrammar: RawGrammar;
	generatedIdTables?: GeneratedIdTables;
}): {
	nodeMap: AssembledNodeMap;
	diagnostics: readonly GrammarDiagnostic[];
} {
	const linkSink = new DiagnosticSink();
	const linked = link(input.rawGrammar, { generatedIdTables: input.generatedIdTables, diagnostics: linkSink });
	const inlineKinds = new Set(loadGrammarJsonInlineList(input.rawGrammar.name) ?? []);
	const normalized = normalizeGrammar(
		linked,
		new NormalizeCtx({
			grammar: linked,
			inlineKinds: buildInlinableKinds(inlineKinds, linked),
			diagnostics: new DiagnosticSink()
		})
	);
	const nodeMap = assemble(
		AssembleCtx.from(normalized, input.generatedIdTables, undefined, loadGrammarJsonAliasMap(input.rawGrammar.name))
	);
	const slotGroupingDiagnostics = drainSlotGroupingDiagnostics();
	const contentAliasDiagnostics = diagnoseContentAliasInjectivity({
		grammar: input.rawGrammar.name,
		contentAliasedTo: linked.contentAliasedTo
	});
	const orphanedSyntheticGroups = new Set(input.rawGrammar.orphanedSyntheticGroups ?? []);
	const kindIdStampDiagnostics: GrammarDiagnostic[] = linkSink
		.all()
		.filter(
			(d) =>
				d.code.startsWith('kindid-unstamped') ||
				d.code.startsWith('kindid-vaporized') ||
				d.code.startsWith('kindid-inline-excluded') ||
				d.code.startsWith('kindid-unclassified')
		)
		.map((d) => ({ ...d, scope: 'grammar' as const, grammar: input.rawGrammar.name }));
	const allDiagnostics = [
		...collectGrammarDiagnostics({
			grammar: input.rawGrammar.name,
			parseKindCollisions: nodeMap.parseKindCollisions,
			deriveShapeDiagnostics: nodeMap.deriveShapeDiagnostics,
			assembleWarnings: nodeMap.assembleWarnings,
			slotGroupingDiagnostics,
			expectDiagnostics: input.rawGrammar.expectDiagnostics
		}).diagnostics,
		...contentAliasDiagnostics,
		...kindIdStampDiagnostics,
		...(input.rawGrammar.bodyPatternZeroMatches ?? []).map((name) =>
			fromBodyPatternZeroMatch(input.rawGrammar.name, name)
		),
		...(input.rawGrammar.desugarDivergences ?? []).map((event) => fromDesugarDivergence(input.rawGrammar.name, event))
	];
	return {
		nodeMap,
		diagnostics:
			orphanedSyntheticGroups.size === 0
				? allDiagnostics
				: allDiagnostics.filter((d) => d.ownerKind === undefined || !orphanedSyntheticGroups.has(d.ownerKind))
	};
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
