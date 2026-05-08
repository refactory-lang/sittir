/**
 * probe-rule — dump a rule through each compiler phase
 * (evaluate → link → optimize → simplify).
 * Usage: npx tsx packages/codegen/src/scripts/probe-rule.ts <grammar> <kind>
 */

import { evaluate } from '../compiler/evaluate.ts';
import { link } from '../compiler/link.ts';
import { optimize } from '../compiler/optimize.ts';
import { resolveOverridesPath } from '../compiler/resolve-grammar.ts';

const [grammar, kind] = process.argv.slice(2);
if (!grammar || !kind) {
	console.error('Usage: probe-rule.ts <grammar> <kind>');
	process.exit(1);
}

const dump = (rule: unknown) => JSON.stringify(rule, (k, v) => (k === '_ref' ? undefined : v), 2);
//TODO:


const raw = await evaluate(resolveOverridesPath(grammar));
if (!raw.rules[kind]) {
	console.warn('kind not found at evaluate stage:', kind);
	process.exit(1);
}
else
{
	console.log('=== POST-EVALUATE ===');
	console.log(dump(raw.rules[kind]));
}


const linked = link(raw);
console.log('\n=== POST-LINK ===');
console.log(dump(linked.rules[kind]));

const optimized = optimize(linked);
console.log('\n=== POST-OPTIMIZE ===');
console.log(dump(optimized.rules[kind]));

// Read optimize's pre-computed simplifiedRules rather than re-running
// simplifyRule ourselves — the pipeline version is word-matcher-aware
// (keyword-shape detection uses the grammar's own word rule), so this
// matches what downstream assemble / derive actually see.
console.log('\n=== POST-SIMPLIFY ===');
console.log(dump(optimized.simplifiedRules[kind]));
