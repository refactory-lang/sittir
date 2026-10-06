import { describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { bindingsHash, bindingsPath } from '@sittir/codegen/bindings';
import { readBindings } from '../../src/inventory/bindings.ts';
import { writeBindingFacts } from '../../src/inventory/index.ts';

describe('writeBindingFacts', () => {
	it("writes each grammar's facts with the key of its bindings.scm to the destination it is given", () => {
		const dir = mkdtempSync(join(tmpdir(), 'binding-facts-'));
		try {
			writeBindingFacts(['rust'], (grammar) => join(dir, `${grammar}.json`));
			const text = readFileSync(bindingsPath('rust'), 'utf8');
			const written = JSON.parse(readFileSync(join(dir, 'rust.json'), 'utf8')) as unknown;
			expect(written).toEqual({ bindingsHash: bindingsHash(text), facts: JSON.parse(JSON.stringify(readBindings(text))) });
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	});
});
