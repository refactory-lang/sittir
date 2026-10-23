import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { languageByName } from '../src/languages.ts';
import { dogfoodContract } from '../../../examples/helpers.ts';

const py = await createEngine(await languageByName('python'));
const rs = await createEngine(await languageByName('rust'));

function targetFile(name: string, source: string): string {
	const path = join(mkdtempSync(join(tmpdir(), 'dogfood-')), name);
	writeFileSync(path, source);
	return path;
}

describe('the dogfood contract compares trees by their node JSON', () => {
	it('tells apart two python definitions whose decorators differ', () => {
		const target = targetFile('a.py', '@a\ndef f():\n    pass\n');
		expect(dogfoodContract(py, py.parse('@b\ndef f():\n    pass\n'), target).reparsesEqual).toBe(false);
		expect(dogfoodContract(py, py.parse('@a\ndef  f():\n    pass\n'), target).reparsesEqual).toBe(true);
	});

	it('tells apart comments that differ in text or side, and ignores layout', () => {
		const target = targetFile('a.rs', '// alpha\nfn f() {}\n');
		expect(dogfoodContract(rs, rs.parse('// alpha\n\n  fn f() {}\n'), target).reparsesEqual).toBe(true);
		expect(dogfoodContract(rs, rs.parse('// beta\nfn f() {}\n'), target).reparsesEqual).toBe(false);
		expect(dogfoodContract(rs, rs.parse('fn f() {} // alpha\n'), target).reparsesEqual).toBe(false);
	});
});
