/**
 * Deep read-render-parse floor test.
 *
 * The committed `packages/tools/baselines/native.json` (diffed by CI's
 * baseline regression check and refreshable via `sittir tool check-baseline
 * --collect --backend native`) is the single floor authority for the
 * shallow-read validators: from(), template coverage, shallow
 * read-render-parse, factory-storage, and parity fixtures. This file
 * deliberately asserts NONE of those — a second hardcoded copy of the same
 * floors drifts (this suite sat failing for weeks with numbers above AND
 * below measured reality).
 *
 * What the baseline does NOT capture is the DEEP (recursive-read) run:
 * collect-baseline's roundtrip validator is shallow-only. The deep floors
 * below are therefore the one set of counts still pinned here. Ratchet
 * discipline applies: when a fix raises a number, raise the floor in the
 * same commit; floors only ever move up.
 *
 * Source of truth for the pinned numbers: the deep `read-render-parse`
 * column of `packages/tools/validation-history.jsonl` (appended by every
 * `pnpm run validate:native`).
 */

import { describe, it, expect } from 'vitest';
import { generate } from '../../../codegen/src/compiler/generate.ts';
import { validateReadRenderParse } from '../validate/read-render-parse.ts';

/** Deep (recursive-read) floors per grammar. See header for why ONLY these live here. */
const FLOORS = {
	python: {
		rtTotal: 115,
		rtDeepPass: 105,
		rtDeepAstMatchPass: 100
	},
	rust: {
		rtTotal: 136,
		rtDeepPass: 131,
		rtDeepAstMatchPass: 128
	},
	typescript: {
		rtTotal: 111,
		rtDeepPass: 105,
		rtDeepAstMatchPass: 105
	}
} as const;

type GrammarName = keyof typeof FLOORS;

describe.each(Object.keys(FLOORS) as GrammarName[])('deep read-render-parse floor — %s', (grammar) => {
	const floors = FLOORS[grammar];

	it(`deep read-render-parse (recursive read → render → reparse) passes at least ${floors.rtDeepPass}/${floors.rtTotal}, AST match at least ${floors.rtDeepAstMatchPass}`, async () => {
		// Full recursive read — deep-reads ALL named kinds, not just
		// variant-adopted — then native render + reparse. `astMatchPass`
		// floors the strict-structural subset; its gap up to `pass` is
		// the deep fidelity debt.
		const result = await validateReadRenderParse(grammar, { backend: 'native', recursive: true });

		expect(result.total).toBeGreaterThanOrEqual(floors.rtTotal);
		expect(result.pass).toBeGreaterThanOrEqual(floors.rtDeepPass);
		expect(result.astMatchPass).toBeGreaterThanOrEqual(floors.rtDeepAstMatchPass);
	}, 120000);
});

describe('corpus validation — generator produces usable output', () => {
	it.each(Object.keys(FLOORS) as GrammarName[])(
		'%s generate emits all files + sane NodeMap',
		async (grammar) => {
			const result = await generate({
				grammar,
				outputDir: `/tmp/sittir-floor-${grammar}/src`
			});
			expect(result.factories).toContain('_factoryMap');
			expect(result.from).toContain('_fromMap');
			expect(result.nodeMap.nodes.size).toBeGreaterThan(0);
		},
		30000
	);
});
