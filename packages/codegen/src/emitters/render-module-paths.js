export function renderModuleRoot(grammar) {
    return `rust/crates/sittir-${grammar}`;
}
export function renderModuleSrcDir(grammar) {
    return `${renderModuleRoot(grammar)}/src/render`;
}
export function renderModuleTemplatesDir(grammar) {
    return `${renderModuleRoot(grammar)}/templates`;
}
export function renderModuleFixturesPath(grammar) {
    return `${renderModuleRoot(grammar)}/test-fixtures.json`;
}
//# sourceMappingURL=render-module-paths.js.map