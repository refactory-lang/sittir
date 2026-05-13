import { describe, expect, it } from 'vitest';

describe('single-child polymorph hoists', () => {
	it('keeps scalar-child factory hoists on generated rust forms', async () => {
		const { readFileSync } = await import('node:fs');
		const { resolve } = await import('node:path');
		const content = readFileSync(resolve(import.meta.dirname, '../../../rust/src/factories.ts'), 'utf-8');

		expect(content).toMatch(
			/export function arrayExpressionUFormSemi\(config: Omit<ConfigOf<T\.ArrayExpressionUFormSemi>, '\$variant'>\) \{\s+const inner = _arrayExpressionSemi\(config\);/s
		);
		expect(content).not.toMatch(
			/export function arrayExpressionUFormSemi[\s\S]*?_configChildren<T\.ArrayExpressionUFormSemi\['\$children'\]>/s
		);
	});

	it('keeps scalar-child from() hoists on generated rust forms', async () => {
		const { readFileSync } = await import('node:fs');
		const { resolve } = await import('node:path');
		const content = readFileSync(resolve(import.meta.dirname, '../../../rust/src/from.ts'), 'utf-8');
		const fnMatch = content.match(
			/export function arrayExpressionUFormSemiFrom\(input: Omit<ConfigOf<T\.ArrayExpressionUFormSemi>, '\$variant'>\): ReturnType<typeof F\.arrayExpressionUFormSemi> \{[\s\S]*?\n\}/
		);

		expect(fnMatch).not.toBeNull();
		const fnBody = fnMatch![0];

		expect(fnBody).toMatch(
			/return F\.arrayExpressionUFormSemi\(\{\s+attributes:[\s\S]*elements:[\s\S]*length:[\s\S]*\}\);/s
		);
		expect(fnBody).not.toMatch(/children:\s*_resolveOneBranch/);
	});
});
