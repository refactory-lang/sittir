import { describe, expect, it } from 'vitest';
import { emitFrom } from '../../__tests__/helpers/emit-from.ts';
import { makeMinimalNodeMap } from '../../__tests__/helpers/node-map-fixtures.ts';

describe('a `kind:` tag is a kind id', () => {
	const emitted = emitFrom({ grammar: 'synth', nodeMap: makeMinimalNodeMap() });

	it('emits one resolver that reads a numeric tag and names the candidates it is not one of', () => {
		expect(emitted).toContain('function _fromOfTag(tag: unknown, candidates: readonly string[]): keyof _FromMap | undefined {');
		expect(emitted).toContain('const name = typeof tag === "number" ? KIND_NAMES.get(tag) : undefined;');
		expect(emitted).toContain('is not a kind id of [');
	});

	it('keeps no name reading and no supertype default arm', () => {
		expect(emitted).not.toContain('_kindNameOf');
		expect(emitted).not.toContain('_SUPERTYPE_KIND_TAGS');
	});

	it('resolves every "kind" in v site through it', () => {
		const kindInVSites = emitted.split('\n').filter((l) => l.includes('"kind" in'));
		expect(kindInVSites.length).toBeGreaterThan(0);
		expect(emitted).toContain('const kindName = _fromOfTag(kind, [...leafKinds, ...branchKinds]);');
		expect(emitted).toContain('const built = _resolveByKind(kindName, rest) as _LooseFieldInput;');
	});
});
