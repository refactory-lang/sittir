/**
 * transpile/transpile-overrides.ts — TypeScript → CommonJS bridge for
 * tree-sitter CLI consumption.
 *
 * Sittir's pipeline loads `packages/<lang>/overrides.ts` directly via
 * `import()` (handled by tsx/Node's TS loader). Tree-sitter's CLI
 * cannot — it expects a CommonJS `grammar.js` file that calls the
 * baseline DSL functions (`grammar`, `seq`, `choice`, ...) which it
 * provides as globals via its own runtime.
 *
 * This transpile step bridges the two: it reads `overrides.ts`, runs
 * esbuild in CJS+bundle mode, and writes
 * `packages/<lang>/.sittir/grammar.js`. The `.sittir/` directory is
 * gitignored — it's a build artifact, not source.
 *
 * The sittir DSL extensions (`enrich`, `transform`, `role`, `alias`,
 * `insert`, `replace`) are bundled inline so the transpiled file has
 * no external module references. The base tree-sitter grammar package
 * (`tree-sitter-rust/grammar.js` etc.) stays external — tree-sitter's
 * CLI resolves it the same way it always does.
 */

import * as esbuild from 'esbuild'
import { mkdirSync, existsSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
// packages/codegen/src/transpile/ → packages/
const packagesRoot = resolve(__dirname, '../../..')

export interface TranspileOptions {
    /** Grammar name — e.g. 'rust', 'python', 'typescript'. */
    grammar: string
    /** Override the default packages root (used in tests). */
    packagesRoot?: string
}

export interface TranspileResult {
    /** Absolute path to the generated `.sittir/grammar.js`. */
    outputPath: string
    /** Source size in bytes. */
    sourceBytes: number
    /** Output size in bytes. */
    outputBytes: number
}

/**
 * Transpile `packages/<grammar>/overrides.ts` to
 * `packages/<grammar>/.sittir/grammar.js`. Returns the output path
 * and basic stats. Throws on transpile errors with esbuild's diagnostic
 * messages attached.
 */
export async function transpileOverrides(opts: TranspileOptions): Promise<TranspileResult> {
    const root = opts.packagesRoot ?? packagesRoot
    const inputPath = join(root, opts.grammar, 'overrides.ts')
    const outputDir = join(root, opts.grammar, '.sittir')
    const outputPath = join(outputDir, 'grammar.js')

    if (!existsSync(inputPath)) {
        throw new Error(`transpileOverrides: no overrides.ts at ${inputPath}`)
    }

    mkdirSync(outputDir, { recursive: true })

    // Nested package.json serves two purposes:
    //   1. `type: 'commonjs'` overrides the parent package's `"type":
    //      "module"` so Node loads grammar.js as CJS — tree-sitter's
    //      CLI requires CJS-style `module.exports = ...`.
    //   2. `name` is required by tree-sitter's parser-generator —
    //      it reads the package name from the nearest package.json
    //      to identify the grammar.
    writeFileSync(
        join(outputDir, 'package.json'),
        JSON.stringify({
            name: `tree-sitter-${opts.grammar}`,
            type: 'commonjs',
            'tree-sitter': [{
                scope: `source.${opts.grammar}`,
                'file-types': [],
            }],
        }, null, 2) + '\n',
    )

    // Tree-sitter.json — required for ABI 15 (current). Without this,
    // tree-sitter generate falls back to ABI 14 with a warning.
    writeFileSync(
        join(outputDir, 'tree-sitter.json'),
        JSON.stringify({
            $schema: 'https://tree-sitter.github.io/tree-sitter/assets/schemas/config.schema.json',
            grammars: [{
                name: opts.grammar,
                'camelcase': opts.grammar.charAt(0).toUpperCase() + opts.grammar.slice(1),
                scope: `source.${opts.grammar}`,
                path: '.',
                'file-types': [],
            }],
            metadata: {
                version: '0.0.1',
                license: 'MIT',
                description: `Sittir-bundled ${opts.grammar} grammar`,
                authors: [{ name: 'sittir', email: 'noreply@example.com' }],
            },
        }, null, 4) + '\n',
    )

    const result = await esbuild.build({
        entryPoints: [inputPath],
        outfile: outputPath,
        bundle: true,
        format: 'cjs',
        platform: 'node',
        target: 'node18',
        // The DSL primitives from @sittir/codegen/dsl get inlined so
        // the transpiled file has no external module imports.
        // Tree-sitter base grammars are externalized via a custom
        // resolver plugin that matches both package-name imports
        // (`tree-sitter-python/grammar.js`) and relative pnpm paths
        // (`../../node_modules/.pnpm/tree-sitter-python@.../grammar.js`).
        // Tree-sitter's CLI provides its own `grammar()` global at
        // runtime, so the externalized base call resolves there.
        plugins: [externalizeTreeSitterBases()],
        // esbuild's CJS format wraps the default export as
        // `module.exports = { default: ..., __esModule: true }`.
        // Tree-sitter's CLI loads grammar.js and expects
        // `module.exports` to BE the grammar object directly. The
        // footer flattens the wrapper so tree-sitter sees the grammar
        // at the top level. Idempotent — re-running on an already-
        // flat module.exports is a no-op because `.default` is undefined.
        footer: {
            js: 'if (module.exports && module.exports.default) module.exports = module.exports.default;',
        },
        write: true,
        metafile: true,
        logLevel: 'silent',
    })

    if (result.errors.length > 0) {
        const messages = result.errors.map(e => e.text).join('\n')
        throw new Error(`transpileOverrides(${opts.grammar}): esbuild errors:\n${messages}`)
    }

    const meta = result.metafile!
    const inputMeta = Object.values(meta.inputs)[0]
    const outputMeta = Object.values(meta.outputs)[0]

    return {
        outputPath,
        sourceBytes: inputMeta?.bytes ?? 0,
        outputBytes: outputMeta?.bytes ?? 0,
    }
}

/**
 * esbuild plugin that marks any import resolving to a tree-sitter
 * base grammar (`tree-sitter-<lang>/grammar.js`) as external. Matches
 * both package-name imports and relative pnpm-store paths.
 *
 * Critically: when the import is externalized, the `require()` call
 * in the bundled output must use a path that tree-sitter's CLI can
 * resolve at runtime. We rewrite to the package-name form so it
 * resolves through normal Node module resolution.
 */
function externalizeTreeSitterBases(): esbuild.Plugin {
    return {
        name: 'externalize-tree-sitter-bases',
        setup(build) {
            // Match ANY tree-sitter-<lang> package import — including
            // transitive ones (e.g., typescript's grammar internally
            // requires tree-sitter-javascript). Without this, esbuild
            // bundles the whole grammar dependency chain, which loses
            // the runtime grammar() global and breaks tree-sitter's
            // parser-generator (it processes the bundled tree as if
            // sittir's overrides had replaced it).
            build.onResolve({ filter: /tree-sitter-[a-z]+(\/|$)/ }, (args) => {
                // Strip any leading path components down to the
                // tree-sitter-<lang> package segment, then keep the
                // sub-path (or default to /grammar.js).
                const match = args.path.match(/(?:^|\/)(tree-sitter-[a-z]+)(\/.+)?$/)
                if (!match) return null
                const pkg = match[1]!
                const sub = match[2] ?? '/grammar.js'
                return {
                    path: `${pkg}${sub}`,
                    external: true,
                }
            })
        },
    }
}
