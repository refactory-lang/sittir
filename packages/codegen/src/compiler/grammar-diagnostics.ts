import { assemble, type AssembledNodeMap } from './assemble.ts';
import { link } from './link.ts';
import { optimize } from './optimize.ts';
import type { ParseKindCollisionDiagnostic } from './diagnose-parsekind-collisions.ts';
import type { DeriveShapeDiagnostic } from './diagnose-derive-shapes.ts';
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
		severity: 'error',
		grammar,
		ownerKind: diagnostic.ownerKind,
		slotName: diagnostic.slotName,
		message:
			`Slot '${diagnostic.slotName}' of kind '${diagnostic.ownerKind}' ` +
			`collapses [${diagnostic.storageKinds.join(', ')}] onto parse kind '${diagnostic.parseKind}'.`,
		proposal: diagnostic.proposal,
		canProceed: true,
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

export function collectGrammarDiagnostics(input: {
	grammar: string;
	parseKindCollisions: readonly ParseKindCollisionDiagnostic[];
	deriveShapeDiagnostics?: readonly DeriveShapeDiagnostic[];
}): { diagnostics: readonly GrammarDiagnostic[] } {
	const parseKindMapped = input.parseKindCollisions.map((diagnostic) =>
		fromParseKindCollision(input.grammar, diagnostic)
	);
	const deriveShapeMapped = (input.deriveShapeDiagnostics ?? []).map((diagnostic) =>
		fromDeriveShape(input.grammar, diagnostic)
	);
	return { diagnostics: [...parseKindMapped, ...deriveShapeMapped] };
}

export function collectGrammarDiagnosticsForGrammar(input: {
	rawGrammar: RawGrammar;
}): { nodeMap: AssembledNodeMap; diagnostics: readonly GrammarDiagnostic[] } {
	const nodeMap = assemble(optimize(link(input.rawGrammar)));
	return {
		nodeMap,
		diagnostics: collectGrammarDiagnostics({
			grammar: input.rawGrammar.name,
			parseKindCollisions: nodeMap.parseKindCollisions,
			deriveShapeDiagnostics: nodeMap.deriveShapeDiagnostics
		}).diagnostics
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
