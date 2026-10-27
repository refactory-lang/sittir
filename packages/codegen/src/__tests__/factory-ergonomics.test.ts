import { describe, it, expect } from 'vitest';

describe('factory ergonomics', () => {
	describe('Gap 2: omitted required fields default to empty', () => {
		it('emits ?? F.block() fallback for required single-kind container fields', async () => {
			const { readFileSync } = await import('node:fs');
			const { resolve } = await import('node:path');
			const content = readFileSync(resolve(import.meta.dirname, '../../../rust/src/factories/coerce.ts'), 'utf-8');
			// functionItemFrom should default body to F.buildBlock()
			expect(content).toMatch(/body:.*\?\? F\.buildBlock\(\)/);
			// functionItemFrom should default parameters to F.buildParameters()
			expect(content).toMatch(/parameters:.*\?\? F\.buildParameters\(\)/);
		});
	});

	describe('Gap 3: array at wrapper position auto-wraps', () => {
		it('emits _wrapWithChildren dispatch table', async () => {
			const { readFileSync } = await import('node:fs');
			const { resolve } = await import('node:path');
			const content = readFileSync(resolve(import.meta.dirname, '../../../rust/src/factories/coerce.ts'), 'utf-8');
			expect(content).toContain('function _wrapWithChildren');
			// Container kind: dispatches with rest-params spread
			expect(content).toMatch(/case ['"]parameters['"]:[\s\S]*?F\.buildParameters\(/);
		});

		it('_resolveOneBranch handles arrays by wrapping with children', async () => {
			const { readFileSync } = await import('node:fs');
			const { resolve } = await import('node:path');
			const content = readFileSync(resolve(import.meta.dirname, '../../../rust/src/factories/coerce.ts'), 'utf-8');
			expect(content).toMatch(/Array\.isArray\(v\).*_wrapWithChildren/s);
		});
	});

	describe('Gap 4: single value at wrapper position auto-wraps', () => {
		it('_resolveOneBranch wraps non-matching UntypedNode as single child', async () => {
			const { readFileSync } = await import('node:fs');
			const { resolve } = await import('node:path');
			const content = readFileSync(resolve(import.meta.dirname, '../../../rust/src/factories/coerce.ts'), 'utf-8');
			expect(content).toMatch(/isNodeValue\(v\).*\$type.*_wrapWithChildren/s);
		});
	});

	describe('Gap 5: single-field factory signatures', () => {
		it('emits direct-value signature for single-field-no-children factories', async () => {
			const { readFileSync } = await import('node:fs');
			const { resolve } = await import('node:path');
			const content = readFileSync(resolve(import.meta.dirname, '../../../rust/src/factories/raw.ts'), 'utf-8');
			// label's sole slot holds a single concrete kind, so the factory is
			// the FORWARDED refinement of the direct form: a public wrapper
			// accepting the child or the child's constructor args, over a
			// private direct implementation.
			//
			// The parameter is positional, so it is spelled `value` rather than
			// after the slot — but the public direct overload, the private
			// implementation and the `BuildArgs` alias must still agree on it.
			// They are one projection of one calling convention, so a divergent
			// label would mean the parameter list had been composed twice.
			// The parameter's TYPE is the slot's own element type. Indexing
			// `Config` instead re-projects the slot through the config surface
			// and loses the union of kinds it admits.
			expect(content).toMatch(/export function buildLabel\(value: Admit<T\.Identifier>\)/);
			expect(content).toMatch(/function buildLabel\(value: Admit<T\.Identifier>\)/);
			expect(content).toMatch(/function buildLabel\(value: Admit<T\.Identifier>\): T\.Label\.Bound \{/);
			// Should NOT have a config parameter
			expect(content).not.toMatch(/export function buildLabel\(config/);
		});

		it('keeps config form for single-field-with-children factories', async () => {
			const { readFileSync } = await import('node:fs');
			const { resolve } = await import('node:path');
			const content = readFileSync(resolve(import.meta.dirname, '../../../rust/src/factories/raw.ts'), 'utf-8');
			// block has label (1 field) + children — must keep config form
			expect(content).toMatch(/export function buildBlock\(config/);
		});

		it('emits $with setter that calls factory with direct value', async () => {
			const { readFileSync } = await import('node:fs');
			const { resolve } = await import('node:path');
			const content = readFileSync(resolve(import.meta.dirname, '../../../rust/src/factories/raw.ts'), 'utf-8');
			// The setter of a forwarding factory calls the direct builder with the value, so it stores the
			// slot type only: neither the config-spread form nor the dispatcher that builds the target.
			const labelMatch = content.match(/function buildLabel\(value[\s\S]*?\n\}/);
			expect(labelMatch).not.toBeNull();
			const labelBody = labelMatch![0];
			expect(labelBody).toMatch(/=> buildLabel\(value\)/);
			// Not the config-spread form
			expect(labelBody).not.toMatch(/\.\.\.\s*config/);
		});

		it('adapts from() to use direct-value call for single-field factories', async () => {
			const { readFileSync } = await import('node:fs');
			const { resolve } = await import('node:path');
			const content = readFileSync(resolve(import.meta.dirname, '../../../rust/src/factories/coerce.ts'), 'utf-8');
			// coerceToLabel should call F.buildLabel(resolvedIdentifier) not F.buildLabel({ identifier: ... })
			// It should NOT have the config-object form for label
			expect(content).not.toMatch(/F\.buildLabel\(\{/);
		});
	});

	describe('examples cleanup contract', () => {
		it('gives each engine its own table, the coercer under the default engine and the raw builder under the strict one', async () => {
			const { readFileSync } = await import('node:fs');
			const { resolve } = await import('node:path');
			const generated = (path: string) => readFileSync(resolve(import.meta.dirname, '../../../rust/src', path), 'utf-8');
			expect(generated('factories/loose.ts')).toContain('coerceToSourceFile as buildSourceFile,');
			expect(generated('factories/strict.ts')).toMatch(/export \{[^}]*\bbuildSourceFile,[^}]*\} from '\.\/raw\.js';/);
			expect(generated('ir.ts')).toContain("import * as table from './factories/loose.js';");
			expect(generated('ir-strict.ts')).toContain("import * as table from './factories/strict.js';");
			expect(generated('factories/build-table.ts')).not.toContain('from: FR.');
		});
	});
});
