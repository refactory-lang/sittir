import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseTypeCheckDiagnostics, typeCheckOutput } from '@sittir/codegen';
import { REPO_ROOT } from '@sittir/codegen/grammars';
import { portableTypedPath, writeTypedModule } from '../../src/portable/conformance.ts';

const PROBE = (module: string): string => `import type { VocabViews } from '${module}';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type ValueOf<P extends keyof VocabViews> = VocabViews[P] extends { readonly $value: () => infer R } ? R : never;

export const integer: Equal<ValueOf<'literal.number.integer'>, number | bigint> = true;
export const float: Equal<ValueOf<'literal.number.float'>, number> = true;
export const yes: Equal<ValueOf<'literal.boolean.true'>, true> = true;
`;

const factoryOf = (source: string, path: string): string[] =>
	source.split('\n').filter((_, i, lines) => i > 0 && [`VocabViews['${path}'] {`, `VocabViews["${path}"] {`].some((end) => lines[i - 1]!.endsWith(end)));

describe("the typed module's $value", () => {
	it('is the value the runtime reads from the arm: a number for a scalar arm, the literal for a boolean, and text only where every claimer reads text', async () => {
		const typed = await writeTypedModule('rust');
		if (typed === undefined) throw new Error('rust emitted no typed module');
		for (const [path, reader] of [
			['literal.number.integer', 'integerValue'],
			['literal.number.float', 'floatValue'],
			['literal.boolean.true', 'trueValue']
		] as const) {
			const lines = factoryOf(typed.source, path);
			expect(lines.length, path).toBeGreaterThan(0);
			expect(lines.filter((line) => !line.includes(`$value: ${reader}`)), path).toEqual([]);
		}
		const dir = mkdtempSync(join(tmpdir(), 'sittir-typed-values-'));
		writeFileSync(join(dir, 'probe.ts'), PROBE(portableTypedPath('rust')));
		writeFileSync(join(dir, 'tsconfig.json'), JSON.stringify({ extends: join(REPO_ROOT, 'tsconfig.json'), compilerOptions: { noEmit: true, types: ['node'] }, include: [join(dir, 'probe.ts')] }));
		const diagnostics = parseTypeCheckDiagnostics(typeCheckOutput('pnpm', ['exec', 'tsrs', '-p', join(dir, 'tsconfig.json'), '--noEmit'], REPO_ROOT));
		expect(diagnostics.filter((d) => d.file?.endsWith('probe.ts')).map((d) => d.head)).toEqual([]);
	}, 300_000);
});
