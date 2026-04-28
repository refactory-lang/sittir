export type RenderCrateGrammar = 'rust' | 'typescript' | 'python';

export function renderCrateRoot(grammar: RenderCrateGrammar): string {
	return `rust/crates/sittir-render-${grammar}`;
}

export function renderCrateSrcDir(grammar: RenderCrateGrammar): string {
	return `${renderCrateRoot(grammar)}/src`;
}

export function renderCrateTemplatesDir(grammar: RenderCrateGrammar): string {
	return `${renderCrateRoot(grammar)}/templates`;
}

export function renderCrateFixturesPath(grammar: RenderCrateGrammar): string {
	return `${renderCrateRoot(grammar)}/test-fixtures.json`;
}
