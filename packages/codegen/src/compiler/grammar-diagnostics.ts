import { assemble, type AssembledNodeMap } from './assemble.ts';
import { link } from './link.ts';
import { optimize } from './optimize.ts';
import type { ParseKindCollisionDiagnostic } from './diagnose-parsekind-collisions.ts';
import type { RawGrammar } from './types.ts';

export interface GrammarDiagnostic {
	readonly code: string;
	readonly severity: 'warning' | 'error';
	readonly grammar: string;
	readonly ownerKind: string;
	readonly slotName?: string;
	readonly message: string;
	readonly proposal?: string;
	readonly canProceed: boolean;
	readonly details?: Record<string, unknown>;
}

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
		code: diagnostic.code,
		severity: 'error',
		grammar,
		ownerKind: diagnostic.ownerKind,
		slotName: diagnostic.slotName,
		message:
			`Slot '${diagnostic.slotName}' of kind '${diagnostic.ownerKind}' ` +
			`collapses [${diagnostic.storageKinds.join(', ')}] onto parse kind '${diagnostic.parseKind}'.`,
		proposal: diagnostic.proposal,
		canProceed: false,
		details: {
			parseKind: diagnostic.parseKind,
			storageKinds: diagnostic.storageKinds
		}
	};
}

export function collectGrammarDiagnostics(input: {
	grammar: string;
	parseKindCollisions: readonly ParseKindCollisionDiagnostic[];
}): { diagnostics: readonly GrammarDiagnostic[] } {
	return {
		diagnostics: input.parseKindCollisions.map((diagnostic) =>
			fromParseKindCollision(input.grammar, diagnostic)
		)
	};
}

export function collectGrammarDiagnosticsForGrammar(input: {
	rawGrammar: RawGrammar;
}): { nodeMap: AssembledNodeMap; diagnostics: readonly GrammarDiagnostic[] } {
	const nodeMap = assemble(optimize(link(input.rawGrammar)));
	return {
		nodeMap,
		diagnostics: collectGrammarDiagnostics({
			grammar: input.rawGrammar.name,
			parseKindCollisions: nodeMap.parseKindCollisions
		}).diagnostics
	};
}
