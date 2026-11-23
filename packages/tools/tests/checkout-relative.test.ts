import { afterAll, describe, it, expect } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { checkoutRelativeFile } from '../src/scripts/vitest-report.ts';

const scratch = mkdtempSync(join(tmpdir(), 'checkout-relative-test-'));
afterAll(() => rmSync(scratch, { recursive: true, force: true }));

describe('checkoutRelativeFile', () => {
	it('names a file by its path inside the checkout that holds it', () => {
		const root = join(scratch, 'tree');
		mkdirSync(join(root, '.git'), { recursive: true });
		mkdirSync(join(root, 'packages', 'tools', 'tests'), { recursive: true });
		writeFileSync(join(root, 'packages', 'tools', 'tests', 'a.test.ts'), '');
		expect(checkoutRelativeFile(join(root, 'packages', 'tools', 'tests', 'a.test.ts'))).toBe(
			'packages/tools/tests/a.test.ts'
		);
	});

	it('refuses a file that is not inside any git checkout', () => {
		mkdirSync(join(scratch, 'loose'), { recursive: true });
		writeFileSync(join(scratch, 'loose', 'a.test.ts'), '');
		expect(() => checkoutRelativeFile(join(scratch, 'loose', 'a.test.ts'))).toThrow(/not inside a git checkout/);
	});

	it('refuses a file that no longer exists, so a deleted worktree is not named after its parent checkout', () => {
		const root = join(scratch, 'parent');
		mkdirSync(join(root, '.git'), { recursive: true });
		mkdirSync(join(root, 'scratchpad', 'gone', 'packages'), { recursive: true });
		expect(() => checkoutRelativeFile(join(root, 'scratchpad', 'gone', 'packages', 'a.test.ts'))).toThrow(
			/does not exist, so the checkout that holds it cannot be determined/
		);
	});
});
