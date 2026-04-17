import { existsSync, statSync, mkdirSync, copyFileSync, readFileSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { execFileSync } from 'node:child_process'
import { loadWebTreeSitter } from '../validators/common.ts'

export interface CompileOptions {
    force?: boolean
}

export async function compileParser(grammarDir: string, options?: CompileOptions): Promise<string> {
    const sittirDir = join(grammarDir, '.sittir')
    const grammarJs = join(sittirDir, 'grammar.js')
    const wasmPath = join(sittirDir, 'parser.wasm')

    if (!existsSync(grammarJs)) {
        throw new Error(
            `compileParser: no .sittir/grammar.js at ${grammarJs}. ` +
            `Run the transpile step first (codegen --grammar <name>).`
        )
    }

    if (!options?.force && existsSync(wasmPath)) {
        const grammarMtime = statSync(grammarJs).mtimeMs
        const wasmMtime = statSync(wasmPath).mtimeMs
        if (wasmMtime > grammarMtime) {
            return wasmPath
        }
    }

    execFileSync('npx', ['tree-sitter', 'generate'], {
        cwd: sittirDir,
        stdio: 'pipe',
    })

    // Some grammars (e.g., tree-sitter-typescript) bundle a custom
    // external scanner that tree-sitter generate doesn't materialize.
    // Without it, the WASM build fails with "Missing symbols" for the
    // tree_sitter_<lang>_external_scanner_* functions. Copy the
    // base grammar's scanner.c (and any header it relatively-includes)
    // into .sittir/src/ before building.
    syncExternalScanner(grammarDir, sittirDir)

    execFileSync('npx', ['tree-sitter', 'build', '--wasm', '-o', 'parser.wasm'], {
        cwd: sittirDir,
        stdio: 'pipe',
    })

    return wasmPath
}

/**
 * Copy the base grammar's scanner.c into .sittir/src/ when missing,
 * preserving any relative #include paths it uses (e.g., typescript's
 * scanner.c includes ../../common/scanner.h). Looks under the grammar
 * package's node_modules/tree-sitter-<name>/{src,<lang>/src}/scanner.c.
 * No-op when no scanner.c exists in the base grammar (most grammars).
 */
function syncExternalScanner(grammarDir: string, sittirDir: string): void {
    const sittirScanner = join(sittirDir, 'src', 'scanner.c')
    if (existsSync(sittirScanner)) return

    const grammarName = grammarDir.split('/').pop() ?? ''
    const candidates = [
        join(grammarDir, 'node_modules', `tree-sitter-${grammarName}`, 'src', 'scanner.c'),
        join(grammarDir, 'node_modules', `tree-sitter-${grammarName}`, grammarName, 'src', 'scanner.c'),
    ]
    const baseScanner = candidates.find(p => existsSync(p))
    if (!baseScanner) return

    mkdirSync(dirname(sittirScanner), { recursive: true })
    copyFileSync(baseScanner, sittirScanner)

    // Resolve relative #include paths in the scanner — copy any
    // referenced header alongside, mirroring its relative position
    // from the .sittir/src/scanner.c location.
    const src = readFileSync(baseScanner, 'utf8')
    const includeRe = /#include\s+"([^"]+)"/g
    for (const match of src.matchAll(includeRe)) {
        const incPath = match[1]!
        // Skip same-dir includes (handled by other sync logic) and
        // absolute paths.
        if (!incPath.includes('/') || incPath.startsWith('tree_sitter/')) continue
        const baseInc = resolve(dirname(baseScanner), incPath)
        if (!existsSync(baseInc)) continue
        const sittirInc = resolve(dirname(sittirScanner), incPath)
        mkdirSync(dirname(sittirInc), { recursive: true })
        copyFileSync(baseInc, sittirInc)
    }
}

export async function loadOverrideParser(grammarDir: string) {
    const wasmPath = await compileParser(grammarDir)
    const { Parser, Language } = await loadWebTreeSitter()
    const lang = await Language.load(wasmPath)
    return { Parser, Language, lang }
}
