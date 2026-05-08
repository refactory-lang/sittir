import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('factory-roundtrip direct-shape harness', () => {
	it('uses processed config.children for child-backed direct factories', () => {
		const content = readFileSync(resolve(import.meta.dirname, '../validate/factory-render-parse.ts'), 'utf-8');
		expect(content).toMatch(/\? \(config as Record<string, unknown>\)\[camelName\]\s*\n\s*: \(\(config\.children \?\? \[\]\) as unknown\[\]\)\[0\]/);
		expect(content).not.toMatch(/: \(\(readData\.\$children \?\? \[\]\)\.filter/);
	});
});
