import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

const rs = await createEngine(rust);

const parameter = (name: string, type: string) => ({ $type: rs.kinds.Parameter, name, type }) as never;

describe('a config bag names its kind with a kind id', () => {
	it('dispatches a tagged bag held in a list, whether the list is given as an array or as elements', () => {
		expect(rs.build.parameters([parameter('b', 'i32')]).$render()).toBe('(b: i32)');
		expect(rs.build.parameters([parameter('b', 'i32'), parameter('c', 'u8')]).$render()).toBe('(b: i32, c: u8)');
		expect(rs.build.parametersElements(parameter('b', 'i32'), parameter('c', 'u8')).$render()).toBe('b: i32, c: u8');
	});

	it('rejects an untagged bag where the list element could be more than one kind, naming the candidates', () => {
		expect(() => rs.build.parameters([{ name: 'b', type: 'i32' } as never])).toThrow(
			/a bag in this list needs a \$type tag naming one of \[attributed_parameter, .*\bparameter\b/
		);
	});

	it('rejects a kind name where a kind id is required', () => {
		expect(() =>
			rs.build.enumVariant({ name: 'V', body: { $type: 'field_declaration', name: 'a', type: 'i32' } as never })
		).toThrow(/the \$type tag "field_declaration" is not a kind id of \[/);
	});

	it('rejects a supertype tag, so the tag always names the kind that is built', () => {
		expect(() =>
			rs.build.enumVariant({ name: 'V', body: { $type: rs.kinds.Expression, name: 'a', type: 'i32' } as never })
		).toThrow(/is not a kind id of \[/);
	});
});

describe('a kind tag must name one of the slot candidates', () => {
	it('rejects a valid kind id that is not a candidate of the list, naming the candidates', () => {
		expect(() => rs.build.parameters([{ $type: rs.kinds.Identifier, name: 'b', type: 'i32' } as never])).toThrow(
			/the \$type tag \d+ is not a kind id of \[attributed_parameter, .*\bparameter\b/
		);
	});

	it('rejects an untagged bag mixed with parsed elements instead of dropping it', () => {
		const parsed = rs.build.parameters([parameter('a', 'i32')]).$render();
		expect(parsed).toBe('(a: i32)');
		expect(() => rs.build.parameters([parameter('a', 'i32'), { name: 'verbose', type: 'bool' } as never])).toThrow(
			/a bag in this list needs a \$type tag/
		);
	});
});

describe('a bag with no slots is built, not passed through as a node', () => {
	it('builds an empty block bag from its $type alone', () => {
		expect(rs.build.functionItem({ name: 'f', parameters: rs.build.parameters(), body: { $type: rs.kinds.Block } as never }).$render()).toMatch(/^fn f\(\) \{\s*\}$/);
	});
});
