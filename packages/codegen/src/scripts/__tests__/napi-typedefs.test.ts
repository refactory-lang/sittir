import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { removeNapiTypedefs } from '../napi-typedefs.ts';

describe('removeNapiTypedefs', () => {
	const roots: string[] = [];
	afterEach(() => {
		for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
	});

	const targetWith = (names: string[]): string => {
		const target = mkdtempSync(join(tmpdir(), 'napi-target-'));
		roots.push(target);
		for (const name of names) {
			mkdirSync(join(target, 'napi-rs', name), { recursive: true });
			writeFileSync(join(target, 'napi-rs', name, 'sittir-core'), '{}');
		}
		return target;
	};

	it('removes the typedef dirs of the grammar and keeps every other grammar\'s', () => {
		const target = targetWith(['sittir-rust-62f44147', 'sittir-rust-1a2b3c', 'sittir-python-07868a2c']);
		removeNapiTypedefs(target, 'rust');
		expect(existsSync(join(target, 'napi-rs', 'sittir-rust-62f44147'))).toBe(false);
		expect(existsSync(join(target, 'napi-rs', 'sittir-rust-1a2b3c'))).toBe(false);
		expect(existsSync(join(target, 'napi-rs', 'sittir-python-07868a2c'))).toBe(true);
	});

	it('does nothing when the target has no napi-rs dir', () => {
		const target = targetWith([]);
		expect(() => removeNapiTypedefs(target, 'rust')).not.toThrow();
	});
});
