import { writeFileSync } from 'node:fs';

import { assemble, AssembleCtx, type AssembledNodeMap } from '../assemble.ts';
import { link } from '../link.ts';
import { normalizeGrammar } from '../normalize.ts';
import type { ParseKindCollisionDiagnostic } from './parsekind-collisions.ts';
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
		canProceed: true,
		details: { slotCount: diagnostic.slotCount }
	};
}

export function collectGrammarDiagnostics(input: {
	grammar: string;
	parseKindCollisions: readonly ParseKindCollisionDiagnostic[];
	deriveShapeDiagnostics?: readonly DeriveShapeDiagnostic[];
	assembleWarnings?: readonly AssembleWarning[];
	slotGroupingDiagnostics?: readonly SlotGroupingDiagnostic[];
}): { diagnostics: readonly GrammarDiagnostic[] } {
	const parseKindMapped = input.parseKindCollisions.map((diagnostic) =>
		fromParseKindCollision(input.grammar, diagnostic)
	);
	const deriveShapeMapped = (input.deriveShapeDiagnostics ?? []).map((diagnostic) =>
		fromDeriveShape(input.grammar, diagnostic)
	);
	const assembleWarningMapped = (input.assembleWarnings ?? []).map((warning) =>
		fromAssembleWarning(input.grammar, warning)
	);
	const slotGroupingMapped = (input.slotGroupingDiagnostics ?? []).map((d) => fromSlotGrouping(input.grammar, d));
	return { diagnostics: [...parseKindMapped, ...deriveShapeMapped, ...assembleWarningMapped, ...slotGroupingMapped] };
}

export function collectGrammarDiagnosticsForGrammar(input: { rawGrammar: RawGrammar }): {
	nodeMap: AssembledNodeMap;
	diagnostics: readonly GrammarDiagnostic[];
} {
	const linked = link(input.rawGrammar);
	const normalized = normalizeGrammar(linked);
	const nodeMap = assemble(AssembleCtx.from(normalized));
	// drain slot-grouping diagnostics populated during the normalizeGrammar() pass
	const slotGroupingDiagnostics = drainSlotGroupingDiagnostics();
	// §D-2c content-alias injectivity — sole consumer of the diagnostic-only
	// contentAliasedTo map (empty today; guards a future violation).
	const contentAliasDiagnostics = diagnoseContentAliasInjectivity({
		grammar: input.rawGrammar.name,
		contentAliasedTo: linked.contentAliasedTo
	});
	return {
		nodeMap,
		diagnostics: [
			...collectGrammarDiagnostics({
				grammar: input.rawGrammar.name,
				parseKindCollisions: nodeMap.parseKindCollisions,
				deriveShapeDiagnostics: nodeMap.deriveShapeDiagnostics,
				assembleWarnings: nodeMap.assembleWarnings,
				slotGroupingDiagnostics
			}).diagnostics,
			...contentAliasDiagnostics
		]
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

/**
 * Sibling of {@link formatGrammarDiagnostics} for `CompilerDiagnostic`s (PR-S
 * task 5) — kept alongside its natural relative in the same module rather
 * than a new one. `CompilerDiagnostic` has no `ownerKind`/`slotName` (those
 * are `GrammarDiagnostic`-only fields); reusing `formatGrammarDiagnostics`
 * as-is would print literal `-.-` noise, so this formats on `phase` instead.
 */
export function formatCompilerDiagnostics(diagnostics: readonly CompilerDiagnostic[]): string {
	if (diagnostics.length === 0) return 'No compiler diagnostics.';
	return diagnostics
		.map(
			(d) =>
				`[${d.severity}] ${d.code}  (${d.phase})\n  ${d.message}${d.proposal !== undefined ? `\n  Proposal: ${d.proposal}` : ''}`
		)
		.join('\n');
}

/**
 * Persist a diagnostics array to JSON (Cluster D task 13). Sibling of
 * {@link formatGrammarDiagnostics}/{@link formatCompilerDiagnostics} — those
 * format for stderr, this serializes the same shape for a later task
 * (Cluster D task 14) to merge into a unified validation report. Works for
 * either `GrammarDiagnostic` or `CompilerDiagnostic` since both extend the
 * shared `Diagnostic` base (code/severity/message/proposal + scope-specific
 * fields), so no shape adaptation is needed — the array is written as-is.
 */
export function writeGrammarDiagnosticsJson(
	diagnostics: readonly (GrammarDiagnostic | CompilerDiagnostic)[],
	outPath: string
): void {
	writeFileSync(outPath, JSON.stringify(diagnostics, null, 2));
}

/**
 * §D-2c — content-alias injectivity check (the ONLY consumer of the
 * diagnostic-only `contentAliasedTo`/`contentAliasedFrom` maps). Folded in from
 * the former compiler/diagnose-content-alias-injectivity.ts — its sole caller is
 * `collectGrammarDiagnosticsForGrammar` above.
 *
 * `contentAliasedTo` maps a hidden body kind `_x` to the visible twin(s)
 * minted from it. Fan-OUT (`_x → [a, b]`, one body reused by several twins) is
 * LEGITIMATE reuse — no diagnostic. The illegal shape is fan-IN: a single
 * visible twin minted from two DISTINCT hidden bodies (`_a → twin`, `_b →
 * twin`). That would silently drop one body in `mintContentAliasKinds`
 * (`if (!(value in rules))`), so the minted kind's slots/template would depend
 * on mint ORDER — non-deterministic. We flag it as an error mirroring the
 * parse-kind non-injective collision check.
 *
 * The maps are EMPTY on every grammar today (no enrich `alias($._name,$.name)`
 * nodes exist), so this returns `[]` — it guards a FUTURE violation.
 */
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
