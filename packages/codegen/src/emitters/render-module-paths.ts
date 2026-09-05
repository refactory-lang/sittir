export type RenderModuleGrammar = 'rust' | 'typescript' | 'python';

export function renderModuleRoot(grammar: RenderModuleGrammar): string {
	return `rust/crates/sittir-${grammar}`;
}

export function renderModuleSrcDir(grammar: RenderModuleGrammar): string {
	return `${renderModuleRoot(grammar)}/src/render`;
}

export function renderModuleFixturesPath(grammar: RenderModuleGrammar): string {
	return `${renderModuleRoot(grammar)}/test-fixtures.json`;
}
