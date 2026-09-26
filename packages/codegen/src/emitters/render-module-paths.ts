import { nativeCrateRelDir, type GrammarName } from '../grammars.ts';

export function renderModuleRoot(grammar: GrammarName): string {
	return nativeCrateRelDir(grammar);
}

export function renderModuleSrcDir(grammar: GrammarName): string {
	return `${renderModuleRoot(grammar)}/src/render`;
}

export function renderModuleFixturesPath(grammar: GrammarName): string {
	return `${renderModuleRoot(grammar)}/test-fixtures.json`;
}

export function renderModuleLeftOutPath(grammar: GrammarName): string {
	return `${renderModuleRoot(grammar)}/test-fixtures.left-out.json`;
}
