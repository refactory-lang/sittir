import { writeFileSync } from 'node:fs';

import { assemble, AssembleCtx, type AssembledNodeMap } from '../assemble.ts';
import { link } from '../link.ts';
import { normalizeGrammar, NormalizeCtx } from '../normalize.ts';
import { DiagnosticSink } from '../../types/diagnostics.ts';
import {
	loadGrammarJsonInlineList,
	loadGrammarJsonAliasMap,
	buildInlinableKinds,
	buildPolymorphsConfigSkip
} from '../inline-sets.ts';
import type { ParseKindCollisionDiagnostic } from '../../types/parsekind-collisions.ts';
import type { DeriveShapeDiagnostic } from './derive-shapes.ts';
import type { AssembleWarning } from '../model/node-map.ts';
import { drainSlotGroupingDiagnostics } from '../simplify.ts';
import type { SlotGroupingDiagnostic } from './slot-grouping.ts';
import type { RawGrammar } from '../types.ts';
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
		// Forward the producer's message/severity/canProceed verbatim rather than
		// regenerating — keeps the wording single-sourced in the producer.
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
		// canProceed: true — derive-shape issues are surfaced as informational
		// warnings; codegen continues so all issues are visible in one pass.
		canProceed: true,
		details: diagnostic.details
	};
}

export function fromAssembleWarning(grammar: string, warning: AssembleWarning): GrammarDiagnostic {
	// typename-collision is auto-resolved at assemble time (the rename already
	// succeeded). Downgrade to 'info' so the channel stays signal-only; genuine
	// unresolved collisions keep 'warning'.
	const severity = warning.code === 'typename-collision' ? 'info' : 'warning';
	return {
		scope: 'grammar',
		code: warning.code,
		severity,
		grammar,
		ownerKind: warning.ownerKind,
		message: warning.message,
		// Assemble warnings are observational — codegen continues.
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
		// Forward the producer's canProceed verbatim (content-collision now always
		// pushes false when it fires — the accepted-floor exception is applied by
		// this function's caller, collectGrammarDiagnostics, where `grammar` is
		// known; the other 3 SlotGroupingShape codes still always push
		// canProceed: true) rather than hardcoding true here, which would silently
		// swallow the flip.
		canProceed: diagnostic.canProceed,
		details: { slotCount: diagnostic.slotCount }
	};
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
		// Assemble-time parsekind-noninjective means enrich did NOT resolve this
		// collision (an enrich-resolved one would already be gone from the
		// grammar by assemble time) — always genuinely blocking. Enrich's own
		// info-severity audit-trail diagnostics never reach this line (they merge
		// in separately, in run-codegen.ts's getEnrichUnaliasDiagnostics path),
		// so this override cannot affect them.
		canProceed: false
	}));
	const deriveShapeMapped = (input.deriveShapeDiagnostics ?? []).map((diagnostic) =>
		fromDeriveShape(input.grammar, diagnostic)
	);
	const assembleWarningMapped = (input.assembleWarnings ?? []).map((warning) => {
		const mapped = fromAssembleWarning(input.grammar, warning);
		// Only specific assemble-warning codes block: storagename-collision (PR-L)
		// and nonterminal-separator-unstamped (a zero-instance guard — any firing
		// means a nonterminal separator reached the slot-value stamp path, which
		// would silently render as a hardcoded space; see collect-slots.ts).
		// typename-collision (the only other code sharing fromAssembleWarning)
		// stays exactly as fromAssembleWarning already maps it (still has live,
		// accepted, non-blocking instances) — do not touch fromAssembleWarning
		// itself, which would flip it as a side effect.
		if (warning.code !== 'storagename-collision' && warning.code !== 'nonterminal-separator-unstamped') return mapped;
		if (isExpectedDiagnostic(input.expectDiagnostics, warning.code, warning.ownerKind)) return mapped;
		return { ...mapped, canProceed: false };
	});
	const slotGroupingMapped = (input.slotGroupingDiagnostics ?? []).map((diagnostic) => {
		const mapped = fromSlotGrouping(input.grammar, diagnostic);
		// content-collision's producer (slot-grouping.ts) always emits canProceed:
		// false when it fires — the expectDiagnostics exception is applied here
		// instead, mirroring the storagename-collision override above. The other
		// 3 SlotGroupingShape codes always push canProceed: true at their own
		// construction sites, so this override never touches them.
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

export function collectGrammarDiagnosticsForGrammar(input: { rawGrammar: RawGrammar }): {
	nodeMap: AssembledNodeMap;
	diagnostics: readonly GrammarDiagnostic[];
} {
	const linked = link(input.rawGrammar);
	// Mirror generate.ts's NormalizeCtx inputs (shared via inline-sets.ts): without
	// inlineKinds, diagnoseSlotGrouping's shape-①b (auto-group helper bodies,
	// e.g. rust `_match_block_optional1`) never fires on this path, so
	// `multi-slot-nested-seq` violations were console-only during regen and
	// absent from the persisted grammar-diagnostics.json / validation report.
	const inlineKinds = new Set(loadGrammarJsonInlineList(input.rawGrammar.name) ?? []);
	const normalized = normalizeGrammar(
		linked,
		new NormalizeCtx({
			grammar: linked,
			inlineKinds: buildInlinableKinds(inlineKinds, linked),
			polymorphSkip: buildPolymorphsConfigSkip(input.rawGrammar.polymorphsConfig),
			diagnostics: new DiagnosticSink()
		})
	);
	const nodeMap = assemble(
		AssembleCtx.from(normalized, undefined, undefined, loadGrammarJsonAliasMap(input.rawGrammar.name))
	);
	// drain slot-grouping diagnostics populated during the normalizeGrammar() pass
	const slotGroupingDiagnostics = drainSlotGroupingDiagnostics();
	// §D-2c content-alias injectivity — sole consumer of the diagnostic-only
	// contentAliasedTo map (empty today; guards a future violation).
	const contentAliasDiagnostics = diagnoseContentAliasInjectivity({
		grammar: input.rawGrammar.name,
		contentAliasedTo: linked.contentAliasedTo
	});
	const orphanedSyntheticGroups = new Set(input.rawGrammar.orphanedSyntheticGroups ?? []);
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
		...(input.rawGrammar.bodyPatternZeroMatches ?? []).map((name) =>
			fromBodyPatternZeroMatch(input.rawGrammar.name, name)
		)
	];
	return {
		nodeMap,
		// Drop diagnostics for a kind this grammar's own override provably
		// orphaned (see `RawGrammar.orphanedSyntheticGroups`) — it can never
		// occur in a real parse, so any diagnostic about it is phantom
		// regardless of code.
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

	// Invert to twin → distinct hidden bodies.
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
