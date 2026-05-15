/**
 * validate/node-types-loader.ts — thin loader for tree-sitter
 * node-types.json.
 *
 * Consumed by both validators and emitters (grammar.ts, types.ts),
 * so it lives at validate/ rather than under any one consumer's
 * directory. Takes a grammar name and returns the parsed raw entry
 * array from that grammar's `node-types.json` file (or a
 * `.sittir/src/node-types.json` override if present). No caches,
 * no mutable state (FR-022).
 *
 * If a consumer needs to point at a non-standard file (e.g. test
 * fixtures), they pass the resolved path directly via the
 * `explicitPath` argument — there is no module-level path registry.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
// `new URL(...).pathname` is not portable on Windows and leaks URL-encoded
// escape sequences; `fileURLToPath` produces a correct platform path.
const packagesDir = fileURLToPath(new URL('../../../', import.meta.url));
function loadJson(filePath) {
    return JSON.parse(readFileSync(filePath, 'utf8'));
}
/**
 * Non-standard node-types.json locations. Most grammars follow the
 * `tree-sitter-{name}/src/node-types.json` convention; this table
 * lists the exceptions (typescript ships two grammars per package).
 */
const GRAMMAR_PATHS = {
    typescript: 'tree-sitter-typescript/typescript/src/node-types.json',
    tsx: 'tree-sitter-typescript/tsx/src/node-types.json'
};
export function loadRawEntries(grammar, explicitPath) {
    if (explicitPath)
        return loadJson(explicitPath);
    const overridePath = join(packagesDir, grammar, '.sittir', 'src', 'node-types.json');
    if (existsSync(overridePath))
        return loadJson(overridePath);
    const modulePath = GRAMMAR_PATHS[grammar] ?? `tree-sitter-${grammar}/src/node-types.json`;
    return loadJson(fileURLToPath(import.meta.resolve(modulePath)));
}
//# sourceMappingURL=node-types-loader.js.map