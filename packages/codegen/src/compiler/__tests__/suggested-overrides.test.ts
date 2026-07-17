/**
 * US6 — overrides.suggested.ts verification (T067-T070).
 *
 * Exercises the derivation log that Link accumulates and
 * `suggested.ts` renders. These checks run against the *real*
 * grammar packages so we see every inference / promotion the
 * pipeline makes on the shipped rust / typescript / python inputs.
 *
 * SKIPPED: `emitSuggested` (packages/codegen/src/emitters/suggested.ts)
 * is disabled for now (cleanup-slot-naming-source) and unconditionally
 * returns `undefined`, so `result.suggested` no longer has content for
 * these assertions to check. Re-enable once the slot-naming/source
 * refactor settles and emitSuggested resumes emitting real output.
 */

import { describe, it, expect } from 'vitest';
import { generate } from '../generate.ts';

describe.skip('US6 — overrides.suggested.ts (T067)', () => {
	it('rust suggested file contains field-inference entries', async () => {
		const result = await generate({
			grammar: 'rust',
			outputDir: '/tmp/rust-suggested'
		});
		const suggested = result.suggested!;
		// The file is now a real TS module, so we check for the
		// exported data instead of comment fragments. Each inferred
		// field shows up as an object literal with `applied: true/false`
		// and a `fieldName:` property.
		expect(suggested).toContain('Field inferences:');
		expect(suggested).toMatch(/applied: (true|false)/);
		expect(suggested).toMatch(/fieldName: "\w+"/);
	});
});

describe.skip('US6 — supertype promotion candidates (T068)', () => {
	it('rust suggested file surfaces promoted supertypes', async () => {
		const result = await generate({
			grammar: 'rust',
			outputDir: '/tmp/rust-super'
		});
		// Rust has several hidden choice-of-symbols that Link
		// promotes to supertypes (e.g. _expression, _type).
		expect(result.suggested).toContain('supertype');
		expect(result.suggested).toMatch(/_\w+/);
	});

	it('typescript suggested file surfaces promoted supertypes', async () => {
		const result = await generate({
			grammar: 'typescript',
			outputDir: '/tmp/ts-super'
		});
		expect(result.suggested).toContain('supertype');
	});
});

describe.skip('US6 — manual overrides win over inference (T069 / T069a)', () => {
	it('omits entries already present in overrides.ts', async () => {
		const result = await generate({
			grammar: 'rust',
			outputDir: '/tmp/rust-manual'
		});
		// Link sees overrides.ts as the source of truth. Every
		// field the user manually labeled carries source='override'
		// and is filtered out of the derivation log before it
		// reaches suggested.ts. Check that a few known manually
		// overridden field positions (e.g. rust function_item's
		// `body`, `name`, `parameters` fields) aren't surfaced as
		// inference suggestions.
		const suggested = result.suggested!;
		// The suggested file only lists INFERRED or PROMOTED
		// entries, never manual ones — search for the header that
		// separates sections.
		expect(suggested).toContain('Derivation log for grammar');
		// None of the well-known manual override kinds should
		// re-appear in the field-inference section of suggested.ts.
		// We check by scanning for the field-inference block and
		// verifying the manually declared `function_item.body`
		// override isn't duplicated.
		const inferenceSection = suggested.match(/Field inferences[\s\S]*?(?=Rule promotions|$)/);
		if (inferenceSection) {
			expect(inferenceSection[0]).not.toMatch(/function_item\.body/);
		}
	});
});

describe.skip('US6 — suggested.ts is valid TypeScript (T070)', () => {
	it('rust suggested file is a runnable module with real exports', async () => {
		const result = await generate({
			grammar: 'rust',
			outputDir: '/tmp/rust-parse'
		});
		// suggested.ts is a real TS module — it exports three data
		// arrays (`promotedRules`, `inferredFields`, `repeatedShapes`)
		// alongside their type interfaces. The file must advertise
		// each export so downstream tooling can `import { ... }` it.
		const suggested = result.suggested!;
		expect(suggested).toContain('export interface PromotedRule');
		expect(suggested).toContain('export const promotedRules:');
		expect(suggested).toContain('export interface InferredField');
		expect(suggested).toContain('export const inferredFields:');
		expect(suggested).toContain('export interface RepeatedShape');
		expect(suggested).toContain('export const repeatedShapes:');
	});
});
