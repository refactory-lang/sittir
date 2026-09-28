export type PolicyStep = 'upstream-declared' | 'default';

export interface DerivedResolution {
	readonly resolution: { readonly kind: 'AddConflict'; readonly symbols: readonly string[] };
	readonly step: PolicyStep;
	readonly sourceChains: readonly (readonly string[])[];
	readonly conflict: {
		readonly symbolSequence: readonly string[];
		readonly lookahead: string;
		readonly interpretations: readonly string[];
	};
}

export interface ConflictResolutionsFile {
	readonly grammarHash: string;
	readonly resolutions: readonly DerivedResolution[];
}

export interface ConflictResolutionsInput {
	readonly resolutions: readonly { readonly resolution: { readonly symbols: readonly string[] } }[];
}

export const CONFLICT_RESOLUTIONS_FILE = 'resolutions.json';

export const EMPTY_CONFLICT_RESOLUTIONS: ConflictResolutionsFile = { grammarHash: '', resolutions: [] };

export function applyConflictResolutions(grammar: Record<string, unknown>, input: ConflictResolutionsInput): void {
	grammar.conflicts = input.resolutions.map((entry) => [...entry.resolution.symbols]);
}
