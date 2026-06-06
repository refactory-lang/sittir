import { assemble, type AssembledNodeMap } from './assemble.ts';
import { link } from './link.ts';
import { normalizeGrammar } from './normalize.ts';
import type { ParseKindCollisionDiagnostic } from './diagnose-parsekind-collisions.ts';
import type { DeriveShapeDiagnostic } from './diagnose-derive-shapes.ts';
import type { AssembleWarning } from './node-map.ts';
import { drainSlotGroupingDiagnostics } from './simplify.ts';
import type { SlotGroupingDiagnostic } from './diagnose-slot-grouping.ts';
import { diagnoseContentAliasInjectivity } from './diagnose-content-alias-injectivity.ts';
import type { RawGrammar } from './types.ts';
import type { GrammarDiagnostic } from './diagnostics.ts';

export type { GrammarDiagnostic };

export class GrammarDiagnosticError extends Error {
	readonly codes: readonly string[];

	constructor(readonly diagnostics: readonly GrammarDiagnostic[]) {
		super(
			diagnostics
				.map((diagnostic) => `${diagnostic.code}: ${diagnostic.message}`)
				.join('\n')
		);
		this.name = 'GrammarDiagnosticError';
		this.codes = diagnostics.map((diagnostic) => diagnostic.code);
	}
}

export function fromParseKindCollision(
	grammar: string,
	diagnostic: ParseKindCollisionDiagnostic
): GrammarDiagnostic {
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

export function fromDeriveShape(
	grammar: string,
	diagnostic: DeriveShapeDiagnostic
): GrammarDiagnostic {
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

export function fromAssembleWarning(
	grammar: string,
	warning: AssembleWarning
): GrammarDiagnostic {
	return {
		scope: 'grammar',
		code: warning.code,
		severity: 'warning',
		grammar,
		ownerKind: warning.ownerKind,
		message: warning.message,
		// Assemble warnings are observational — codegen continues.
		canProceed: true,
		details: warning.details
	};
}

export function fromSlotGrouping(
	grammar: string,
	diagnostic: SlotGroupingDiagnostic
): GrammarDiagnostic {
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
	const slotGroupingMapped = (input.slotGroupingDiagnostics ?? []).map((d) =>
		fromSlotGrouping(input.grammar, d)
	);
	return { diagnostics: [...parseKindMapped, ...deriveShapeMapped, ...assembleWarningMapped, ...slotGroupingMapped] };
}

export function collectGrammarDiagnosticsForGrammar(input: {
	rawGrammar: RawGrammar;
}): { nodeMap: AssembledNodeMap; diagnostics: readonly GrammarDiagnostic[] } {
	const linked = link(input.rawGrammar);
	const nodeMap = assemble(normalizeGrammar(linked));
	// drain slot-grouping diagnostics populated during the optimize() pass
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

export function formatGrammarDiagnostics(
	diagnostics: readonly GrammarDiagnostic[]
): string {
	if (diagnostics.length === 0) return 'No grammar diagnostics.';
	return diagnostics
		.map((d) => `[${d.severity}] ${d.code}  ${d.ownerKind ?? '-'}.${d.slotName ?? '-'}\n  ${d.message}${d.proposal !== undefined ? `\n  Proposal: ${d.proposal}` : ''}`)
		.join('\n');
}
