import { describe, expect, it } from 'vitest';
import { emitFrom } from '../../__tests__/helpers/emit-from.ts';
import { makeMinimalNodeMap } from '../../__tests__/helpers/node-map-fixtures.ts';

/**
 * A discriminated `kind:` config accepts the grammar's string name and the
 * numeric `TSKindId` the package stamps for the same purpose. `_kindNameOf`
 * resolves either spelling once, and every `"kind" in v` site
 * (`_resolveOne`, `_resolveOneLeaf`, `_resolveOneBranch`) reads it.
 */
describe('a `kind:` discriminant resolves both its string and numeric spellings', () => {
	const emitted = emitFrom({ grammar: 'synth', nodeMap: makeMinimalNodeMap() });

	it('emits one shared resolver for both spellings', () => {
		expect(emitted).toContain('function _kindNameOf(kind: unknown): string | undefined {');
		expect(emitted).toContain(
			'return typeof kind === "number" ? KIND_NAMES.get(kind) : typeof kind === "string" ? kind : undefined;'
		);
	});

	it('every "kind" in v" site resolves through it, not a raw string-only check', () => {
		const kindInVSites = emitted.split('\n').filter((l) => l.includes('"kind" in'));
		expect(kindInVSites.length).toBeGreaterThan(0);
		expect(emitted).not.toContain('typeof kind === "string" && _isFromKind(kind)');
		expect(emitted).not.toContain('typeof k === "string" && _isFromKind(k)');
	});

	it('resolves through _kindNameOf before dispatching by kind', () => {
		expect(emitted).toContain('const kindName = _kindNameOf(kind);');
		expect(emitted).toContain('if (kindName !== undefined && _isFromKind(kindName)) return _resolveByKind(kindName, rest) as T;');
	});
});
