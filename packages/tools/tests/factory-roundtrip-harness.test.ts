import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('factory-roundtrip harness', () => {
	it('uses metadata-driven child args for child-backed direct factories', () => {
		const content = readFileSync(resolve(import.meta.dirname, '../src/validate/factory-render-parse.ts'), 'utf-8');
		expect(content).toMatch(/const childArgs = getChildFactoryArgs\(renderedKind, config, factorySlots\);/);
		expect(content).toMatch(/\? \(config as Record<string, unknown>\)\[camelName\]\s*\n\s*: childArgs\[0\]/);
		expect(content).not.toMatch(/: \(\(readData\.\$children \?\? \[\]\)\.filter/);
		expect(content).not.toMatch(/: \(\(config\.children \?\? \[\]\) as unknown\[\]\)\[0\]/);
	});

	it('uses metadata-driven child args for spread child-backed factories', () => {
		const content = readFileSync(resolve(import.meta.dirname, '../src/validate/factory-render-parse.ts'), 'utf-8');
		expect(content).toMatch(/const childArgs = getChildFactoryArgs\(renderedKind, config, factorySlots\);/);
		expect(content).toMatch(/return \(factory as \(\.\.\.args: unknown\[\]\) => AnyNodeData\)\(\.\.\.childArgs\);/);
		expect(content).not.toMatch(/const namedChildren = \(readData\.\$children \?\? \[\]\)\.filter/);
	});

	it('uses metadata-driven child args in from validation spread reconstruction', () => {
		const content = readFileSync(resolve(import.meta.dirname, '../src/validate/from.ts'), 'utf-8');
		expect(content).toMatch(/const childArgs = getChildFactoryArgs\(kind, config, factorySlots\);/);
		expect(content).toMatch(
			/factoryResult = \(factory as \(\.\.\.args: unknown\[\]\) => AnyNodeData\)\(\.\.\.childArgs\);/
		);
		expect(content).not.toMatch(/const namedChildren = \(readData\.\$children \?\? \[\]\)\.filter/);
	});
});
