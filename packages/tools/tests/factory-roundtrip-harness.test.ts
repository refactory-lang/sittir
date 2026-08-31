import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('factory-roundtrip harness', () => {
	// The shape dispatch lives in the SHARED `buildFactoryNodeFromReference`
	// (validate/common.ts) — one implementation for the validator and the
	// exercise tool alike.
	it('uses metadata-driven child args for child-backed direct factories', () => {
		const content = readFileSync(resolve(import.meta.dirname, '../src/validate/common.ts'), 'utf-8');
		expect(content).toMatch(/const childArgs = getChildFactoryArgs\(readKind, config, factorySlots, factoryFields\);/);
		expect(content).toMatch(/\? \(config as Record<string, unknown>\)\[camelName\]\s*:\s*childArgs\[0\]/);
		expect(content).not.toMatch(/: \(\(readData\.\$children \?\? \[\]\)\.filter/);
		expect(content).not.toMatch(/: \(\(config\.children \?\? \[\]\) as unknown\[\]\)\[0\]/);
	});

	it('uses metadata-driven child args for spread child-backed factories', () => {
		const content = readFileSync(resolve(import.meta.dirname, '../src/validate/common.ts'), 'utf-8');
		expect(content).toMatch(
			/return factory\(\.\.\.getChildFactoryArgs\(kind, config, factorySlots, factoryFields\)\);/
		);
		expect(content).not.toMatch(/const namedChildren = \(readData\.\$children \?\? \[\]\)\.filter/);
	});

	it('validator and exercise tool share ONE factory-call dispatch', () => {
		const validator = readFileSync(resolve(import.meta.dirname, '../src/validate/factory-render-parse.ts'), 'utf-8');
		const exercise = readFileSync(resolve(import.meta.dirname, '../src/exercise/roundtrip.ts'), 'utf-8');
		expect(validator).toMatch(/buildFactoryNodeFromReference\(/);
		expect(exercise).toMatch(/common\.buildFactoryNodeFromReference\(/);
		// Neither carries its own shape switch any more.
		expect(validator).not.toMatch(/shape === 'elements'/);
		expect(exercise).not.toMatch(/shape === 'elements'/);
	});

	it('uses metadata-driven child args in from validation spread reconstruction', () => {
		const content = readFileSync(resolve(import.meta.dirname, '../src/validate/from.ts'), 'utf-8');
		expect(content).toMatch(/const childArgs = getChildFactoryArgs\(readKind, config, factorySlots, factoryFields\);/);
		expect(content).toMatch(
			/factoryResult = \(factory as \(\.\.\.args: unknown\[\]\) => AnyNodeData\)\(\.\.\.childArgs\);/
		);
		expect(content).not.toMatch(/const namedChildren = \(readData\.\$children \?\? \[\]\)\.filter/);
	});
});
