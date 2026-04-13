import { generateV2 } from '../src/compiler/generate.ts'

// Fields-only strict — inference held back, promotion still applied
const strict = await generateV2({
    grammar: 'rust',
    outputDir: '/tmp/ignored',
    include: { fields: [] },
})
console.log('strict (fields: []):')
console.log('  inferred entries:', strict.nodeMap.derivations.inferredFields.length)
console.log('  applied inferred:', strict.nodeMap.derivations.inferredFields.filter(e => e.applied).length)
console.log('  promoted entries:', strict.nodeMap.derivations.promotedRules.length)
console.log('  applied promoted:', strict.nodeMap.derivations.promotedRules.filter(e => e.applied).length)

// Permissive (default)
const perm = await generateV2({
    grammar: 'rust',
    outputDir: '/tmp/ignored',
})
console.log('permissive:')
console.log('  inferred entries:', perm.nodeMap.derivations.inferredFields.length)
console.log('  applied inferred:', perm.nodeMap.derivations.inferredFields.filter(e => e.applied).length)
console.log('  promoted entries:', perm.nodeMap.derivations.promotedRules.length)
console.log('  applied promoted:', perm.nodeMap.derivations.promotedRules.filter(e => e.applied).length)

// Also write suggested.ts under strict-fields so we can see [held] tags
import { writeFileSync } from 'node:fs'
writeFileSync('/tmp/suggested-strict.ts', strict.suggested)
console.log('\nstrict suggested.ts written to /tmp/suggested-strict.ts')
