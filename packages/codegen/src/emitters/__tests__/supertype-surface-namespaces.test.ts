import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const namespaceBlock = (file: string, name: string): string => {
	const src = readFileSync(`packages/rust/src/${file}`, 'utf8');
	const start = src.indexOf(`export namespace ${name} {`);
	return start < 0 ? '' : src.slice(start, src.indexOf('\n}\n', start));
};

describe('supertype namespaces', () => {
	it('a declared supertype namespace carries the Bound and Parsed unions', () => {
		const block = namespaceBlock('types.ts', 'Statement');
		expect(block).toContain('export type Bound = SupertypeSurface<Statement, BoundByKindId>;');
		expect(block).toContain('export type Parsed = SupertypeSurface<Statement, ParsedByKindId>;');
	});

	it('an undeclared hidden choice has no Bound or Parsed namespace member', () => {
		const block = namespaceBlock('types-internal.ts', 'TokenPattern');
		expect(block).toContain("export type Kind = '_token_pattern';");
		expect(block).not.toContain('Bound');
		expect(block).not.toContain('Parsed');
		expect(namespaceBlock('types.ts', 'TokenPattern')).toBe('');
	});
});
