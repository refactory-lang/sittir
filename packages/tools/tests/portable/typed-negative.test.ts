import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { probeDiagnostics } from '@sittir/codegen';
import { REPO_ROOT } from '@sittir/codegen/grammars';
import { portableTypedPath, writeTypedModule } from '../../src/portable/conformance.ts';

const PROBE = (module: string): string => `import type { VocabViews, ViewOf } from '${module}';

declare const literal: VocabViews['literal.boolean'];
// @ts-expect-error a boolean literal's view is not a function's return type
export const returned: ReturnType<VocabViews['declaration.function']['returnType']> = literal;

declare const read: ViewOf<unknown>;
// @ts-expect-error a reader typed unknown reads as unknown, which no slot type admits
export const counted: number = read;
`;

describe("the typed module's views", () => {
	it('refuse a view of another kind and a read of an untyped reader', async () => {
		await writeTypedModule('rust');
		const diagnostics = probeDiagnostics({ extends: join(REPO_ROOT, 'tsconfig.json'), sources: { 'probe.ts': PROBE(portableTypedPath('rust')) } }, REPO_ROOT);
		expect(diagnostics.filter((d) => d.file?.endsWith('probe.ts')).map((d) => d.head)).toEqual([]);
	}, 300_000);
});
