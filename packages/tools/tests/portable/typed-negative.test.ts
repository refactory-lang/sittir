import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseTypeCheckDiagnostics, typeCheckOutput } from '@sittir/codegen';
import { REPO_ROOT } from '@sittir/codegen/grammars';
import { portableTypedPath, writeTypedModule } from '../../src/portable/conformance.ts';

const PROBE = (module: string): string => `import type { VocabViews, ViewOf } from '${module}';

declare const literal: VocabViews['literal.boolean'];
// @ts-expect-error a boolean literal's view is not a function's return type
export const returned: ReturnType<VocabViews['declaration.function']['returnType']> = literal;

declare const read: ViewOf<unknown>;
// @ts-expect-error a reader typed unknown reads as unknown, which no member type admits
export const counted: number = read;
`;

describe("the typed module's views", () => {
	it('refuse a view of another kind and a read of an untyped reader', async () => {
		await writeTypedModule('rust');
		const dir = mkdtempSync(join(tmpdir(), 'sittir-typed-negative-'));
		writeFileSync(join(dir, 'probe.ts'), PROBE(portableTypedPath('rust')));
		writeFileSync(join(dir, 'tsconfig.json'), JSON.stringify({ extends: join(REPO_ROOT, 'tsconfig.json'), compilerOptions: { noEmit: true, types: ['node'] }, include: [join(dir, 'probe.ts')] }));
		const diagnostics = parseTypeCheckDiagnostics(typeCheckOutput('pnpm', ['exec', 'tsrs', '-p', join(dir, 'tsconfig.json'), '--noEmit'], REPO_ROOT));
		expect(diagnostics.filter((d) => d.file?.endsWith('probe.ts')).map((d) => d.head)).toEqual([]);
	}, 300_000);
});
