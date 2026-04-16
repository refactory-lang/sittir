import { existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
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

    execFileSync('npx', ['tree-sitter', 'build', '--wasm', '-o', 'parser.wasm'], {
        cwd: sittirDir,
        stdio: 'pipe',
    })

    return wasmPath
}

export async function loadOverrideParser(grammarDir: string) {
    const wasmPath = await compileParser(grammarDir)
    const { Parser, Language } = await loadWebTreeSitter()
    const lang = await Language.load(wasmPath)
    return { Parser, Language, lang }
}
