// Census of claim-level flags: claims whose path ends in a Flag of its parent path
// (`@declaration.method.static`), as resolveFlags reads them.
// Run from the repo root: pnpm exec tsx docs/superpowers/probes/2026-10-13-node-flags/claims.ts
import { readFileSync } from 'node:fs';
import { boundNameOf } from '../../../../packages/codegen/src/dsl/bind.ts';
import { bindFacts, bindingsPath, VOCABULARY_DIR } from '../../../../packages/codegen/src/bindings/facts.ts';
import { renamedFromOf, slotModelOf } from '../../../../packages/codegen/src/bindings/input.ts';
import { readBindings } from '../../../../packages/codegen/src/bindings/read.ts';
import { readVocabulary, resolveFlags } from '../../../../packages/codegen/src/bindings/vocabulary.ts';

const vocabulary = await readVocabulary(VOCABULARY_DIR);
for (const grammar of ['rust', 'typescript', 'python']) {
	const record = JSON.parse(readFileSync(`packages/${grammar}/src/node-model.json5`, 'utf8'));
	const facts = resolveFlags(bindFacts(await readBindings(readFileSync(bindingsPath(grammar), 'utf8')), boundNameOf(renamedFromOf(record))), vocabulary, slotModelOf(record));
	const flagged = facts.claims.filter((claim) => claim.flag !== undefined);
	console.log(`${grammar}: ${flagged.length} claim flags`);
	for (const claim of flagged) {
		const ups = claim.predicates.map((p) => p.subject?.up ?? 'none');
		console.log(
			`  ${claim.kind} ${claim.vocab}.${claim.flag} within=[${claim.within.join(' ')}] predicates=${claim.predicates.map((p) => p.operator).join(',') || '—'} up=[${ups.join(',')}] children=${claim.children.length} fieldLiterals=${JSON.stringify(claim.fieldLiterals)} tokens=${JSON.stringify(claim.tokens)}`
		);
	}
}
