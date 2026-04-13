/**
 * compare-v1-v2.ts — dump v1 and v2 generate() outputs to /tmp/sittir-compare
 * for apples-to-apples diffing. Usage: tsx compare-v1-v2.ts [grammar]
 */
import { generate } from '../src/index.ts'
import { generateV2 } from '../src/compiler/generate.ts'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const grammar = process.argv[2] ?? 'rust'
const v1Dir = join('/tmp/sittir-compare/v1', grammar)
const v2Dir = join('/tmp/sittir-compare/v2', grammar)
mkdirSync(v1Dir, { recursive: true })
mkdirSync(v2Dir, { recursive: true })

const v1 = generate({ grammar, outputDir: 'src' })
const v2 = await generateV2({ grammar, outputDir: 'src' })

const files: [string, string][] = [
    ['grammar.ts', 'grammar'],
    ['types.ts', 'types'],
    ['templates.yaml', 'templatesYaml'],
    ['factories.ts', 'factories'],
    ['wrap.ts', 'wrap'],
    ['utils.ts', 'utils'],
    ['from.ts', 'from'],
    ['ir.ts', 'irNamespace'],
    ['consts.ts', 'consts'],
    ['index.ts', 'index'],
    ['tests.test.ts', 'tests'],
    ['type-tests.ts', 'typeTests'],
]

for (const [name, key] of files) {
    writeFileSync(join(v1Dir, name), (v1 as any)[key] ?? '')
    writeFileSync(join(v2Dir, name), (v2 as any)[key] ?? '')
}

console.log(`${grammar}: v1 + v2 outputs written to ${v1Dir} and ${v2Dir}`)
