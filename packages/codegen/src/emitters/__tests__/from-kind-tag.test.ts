import { describe, expect, it } from 'vitest';
import { emitFrom } from '../../__tests__/helpers/emit-from.ts';
import { makeMinimalNodeMap } from '../../__tests__/helpers/node-map-fixtures.ts';

describe('a `$type` tag is a kind id', () => {
	const emitted = emitFrom({ grammar: 'synth', nodeMap: makeMinimalNodeMap() });

	it('emits one resolver that reads a numeric tag and throws on anything else, naming the candidates', () => {
		expect(emitted).toContain('function _fromOfTag(tag: unknown, candidates: readonly string[], closed = false): keyof _FromMap {');
		expect(emitted).toContain('const name = typeof tag === "number" ? KIND_NAMES.get(tag) : undefined;');
		expect(emitted).toContain('is not a kind id');
	});

	it('keeps no name reading and no supertype default arm', () => {
		expect(emitted).not.toContain('_kindNameOf');
		expect(emitted).not.toContain('_SUPERTYPE_KIND_TAGS');
	});

	it('reads the tag only through _splitTag, never a `kind` key', () => {
		expect(emitted).not.toContain('"kind" in');
		expect(emitted).toContain('function _splitTag(v: unknown)');
		expect(emitted).toContain('const tagged = _splitTag(v);');
	});
});
