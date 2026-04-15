/**
 * resolve-grammar.ts — resolve grammar name to grammar.js path
 *
 * Maps grammar names (e.g., "rust", "typescript", "python") to the
 * grammar.js file paths in node_modules.
 */

import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)

/**
 * Well-known grammar.js paths for grammars with non-standard layouts.
 * Most grammars use `tree-sitter-{grammar}/grammar.js`.
 */
const GRAMMAR_JS_PATHS: Record<string, string> = {
    typescript: 'tree-sitter-typescript/typescript/grammar.js',
    tsx: 'tree-sitter-typescript/tsx/grammar.js',
}

/**
 * Resolve a grammar name to the absolute path of its grammar.js file.
 */
export function resolveGrammarJsPath(grammar: string): string {
    const wellKnown = GRAMMAR_JS_PATHS[grammar]
    if (wellKnown) {
        return require.resolve(wellKnown)
    }
    return require.resolve(`tree-sitter-${grammar}/grammar.js`)
}

/**
 * Resolve a grammar name to its overrides.ts path (if it exists).
 * Returns the path in packages/{grammar}/overrides.ts.
 */
export function resolveOverridesPath(grammar: string): string {
    // Navigate from compiler/ → src/ → codegen/ → packages/
    const compilerDir = dirname(new URL(import.meta.url).pathname)  // compiler/
    const srcDir = dirname(compilerDir)                              // src/
    const codegenDir = dirname(srcDir)                               // codegen/
    const packagesDir = dirname(codegenDir)                          // packages/
    return join(packagesDir, grammar, 'overrides.ts')
}
