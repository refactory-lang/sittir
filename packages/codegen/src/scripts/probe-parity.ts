import { validateRoundTrip } from '../validate/roundtrip.ts'

const grammar = process.argv[2] ?? 'rust'
const target = process.argv[3] ?? 'visibility_modifier'
const covered = new Set<string>()
const r = await validateRoundTrip(grammar, `./packages/${grammar}/templates`, {
    onFixture: (fx) => {
        if (fx.kind === 'roundtrip') covered.add(fx.pattern)
    },
})

console.log(`[${grammar}] roundtrip kinds covered: ${covered.size}`)
console.log(`  target '${target}' covered: ${covered.has(target)}`)
const variantChildren = [...covered].filter(k => k.startsWith(`_${target}_`))
console.log(`  variant children covered:`, variantChildren)
console.log(`  all errors involving '${target}':`, r.errors.filter(e => e.name.includes(target)).slice(0, 5).map(e => e.name))
console.log(`  all astMismatches involving '${target}':`, r.astMismatches.filter(e => e.name.includes(target)).slice(0, 5).map(e => e.name))
console.log(`  pass=${r.pass}/${r.total} astMatchPass=${r.astMatchPass} skip=${r.skip}`)
console.log()
console.log(`Sample of covered kinds:`, [...covered].slice(0, 20).sort())
