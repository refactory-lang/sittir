import { generate } from '../packages/codegen/src/compiler/generate.ts'
import { validateFactoryRoundTrip, formatFactoryRoundTripReport } from '../packages/codegen/src/validate/factory-roundtrip.ts'

process.env.SITTIR_VALIDATE_RECURSIVE = '1'

const grammars = (process.argv[2] ? [process.argv[2]] : ['rust', 'typescript', 'python']) as const
for (const grammar of grammars) {
    const result = await generate({ grammar, outputDir: 'src' })
    const frt = await validateFactoryRoundTrip(grammar, result.templatesYaml)
    console.log(`\n=== ${grammar} ===`)
    console.log(`pass=${frt.pass}/${frt.total} fail=${frt.fail} skip=${frt.skip}`)
    const byMessage = new Map<string, { count: number; samples: typeof frt.errors }>()
    for (const e of frt.errors) {
        const classification = classify(e.message)
        const bucket = byMessage.get(classification) ?? { count: 0, samples: [] }
        bucket.count++
        if (bucket.samples.length < 3) bucket.samples.push(e)
        byMessage.set(classification, bucket)
    }
    const sorted = [...byMessage.entries()].sort((a, b) => b[1].count - a[1].count)
    for (const [cls, { count, samples }] of sorted) {
        console.log(`\n  [${count}x] ${cls}`)
        for (const s of samples) {
            console.log(`    ${s.kind} (${s.entry ?? '-'}): ${s.message}`)
        }
    }
}

function classify(msg: string): string {
    if (msg.startsWith('No render rule')) return 'No render rule'
    if (msg.startsWith('factory threw')) {
        const m = /reserved keyword/.exec(msg); if (m) return 'factory threw: reserved keyword'
        const m2 = /text .* does not match pattern/.exec(msg); if (m2) return 'factory threw: pattern mismatch'
        return 'factory threw (other)'
    }
    if (msg.startsWith('re-parse error')) return 're-parse error'
    if (msg.startsWith('kind not found')) return 'kind not found in re-parse'
    return msg.slice(0, 40)
}
