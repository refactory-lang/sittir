export type RenderModuleGrammar = 'rust' | 'typescript' | 'python';

export function renderModuleRoot(grammar: RenderModuleGrammar): string {
	return `rust/crates/sittir-${grammar}`;
}

export function renderModuleSrcDir(grammar: RenderModuleGrammar): string {
	return `${renderModuleRoot(grammar)}/src/render`;
}

export function renderModuleTemplatesDir(grammar: RenderModuleGrammar): string {
	return `${renderModuleRoot(grammar)}/templates`;
}

export function renderModuleFixturesPath(grammar: RenderModuleGrammar): string {
	return `${renderModuleRoot(grammar)}/test-fixtures.json`;
}
