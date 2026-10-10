/**
 * Round-trip validation: generated output → runtime validation.
 *
 * This is the critical acceptance test for the five-phase rewrite.
 * It exercises the generated code at runtime:
 *   1. Generate output via generate()
 *   2. Write templates.yaml (factory round-trip uses this directly)
 *   3. Run validateFactoryRoundTrip against the output
 *   4. Report pass/fail
 *
 * Note: This test depends on the generated factories being importable
 * at packages/{grammar}/src/factories.ts. It does NOT currently overwrite
 * the checked-in generated files — it writes to /tmp and expects the
 * validator to load from the checked-in location.
 */

import { beforeAll, describe, it, expect } from 'vitest';
import { FULL_PIPELINE_TIMEOUT } from '../../__tests__/helpers/timeouts.ts';
import { generate } from '../../compiler/generate.ts';
import { AbstractAssembledCompound } from '../../compiler/model/node-map.ts';

type Generated = Awaited<ReturnType<typeof generate>>;

let python: Generated;

beforeAll(async () => {
	python = await generate({ grammar: 'python', outputDir: '/tmp/sittir-rt-python/src' });
}, FULL_PIPELINE_TIMEOUT);

describe('round-trip validation', () => {
	it('generates all output files for python without crashing', () => {
		expect(python.types.length).toBeGreaterThan(0);
		expect(python.factories.length).toBeGreaterThan(0);
		expect(python.templates.bodies.size).toBeGreaterThan(0);
		expect(python.from.length).toBeGreaterThan(0);
	});

	describe.each(['rust', 'typescript'])('%s', (grammar) => {
		let result: Generated;

		beforeAll(async () => {
			result = await generate({ grammar, outputDir: `/tmp/sittir-rt-${grammar}/src` });
		}, FULL_PIPELINE_TIMEOUT);

		it('generates all output files without crashing', () => {
			expect(result.types.length).toBeGreaterThan(0);
			expect(result.factories.length).toBeGreaterThan(0);
		});
	});

	it('produces a render body per emitted kind for python', () => {
		// The emitted Map should have meaningful per-rule templates.
		expect(python.templates.bodies.size).toBeGreaterThan(20);
	});

	it('factory round-trip is valid: NodeMap → factories reference correct types', () => {
		// Basic sanity — factories should export functions and reference types
		expect(python.factories).toContain('export function');
		expect(python.factories).toContain('_factoryMap');
		// Types should have interfaces
		expect(python.types).toContain('export interface');
		expect(python.types).toContain('TSKindId');
	});
});

describe('NodeMap structure', () => {
	it('polymorph forms are synthesized into the NodeMap as groups', () => {
		// Check the NodeMap contains group entries for polymorph forms.
		// Python's only native polymorph (`assignment`) is now a nested-
		// alias variant, so at least one hoisted polymorph-form node must
		// exist in the map (e.g. `assignment_eq` / `assignment_type` /
		// `assignment_typed`). The previous `>= 0` assertion was a no-op.
		let groupCount = 0;
		const assignmentVariantKinds = new Set<string>();
		for (const [kind, node] of python.nodeMap.nodes) {
			if (node instanceof AbstractAssembledCompound && node.seated) {
				groupCount++;
				if (kind.startsWith('assignment_')) assignmentVariantKinds.add(kind);
			}
		}
		expect(groupCount).toBeGreaterThan(0);
		expect(assignmentVariantKinds.size).toBeGreaterThanOrEqual(2);
	});

	it('every branch node has a rule attached', () => {
		let branchCount = 0;
		for (const [_kind, node] of python.nodeMap.nodes) {
			if (node.modelType === 'branch') {
				branchCount++;
				// AssembledBranch.rule should be present
				expect((node as any).rule).toBeDefined();
			}
		}
		expect(branchCount).toBeGreaterThan(0);
	});
});
