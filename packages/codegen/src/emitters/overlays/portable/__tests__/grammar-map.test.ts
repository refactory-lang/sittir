import { beforeAll, describe, expect, it } from 'vitest';
import { generate } from '../../../../compiler/generate.ts';

const mapOf = async (grammar: string): Promise<string> => {
	const generated = await generate({ grammar, outputDir: `/tmp/sittir-grammar-map-${grammar}/src` });
	if (generated.portableTyped === undefined) throw new Error(`${grammar} emitted no typed module`);
	return generated.portableTyped.map;
};

const entryOf = (map: string, path: string): string | undefined => {
	const start = map.indexOf(`\t\treadonly "${path}": {\n`);
	return start < 0 ? undefined : map.slice(start, map.indexOf('\n\t\t};', start));
};

const armsAt = (map: string, path: string, member: string): readonly string[] => {
	const line = entryOf(map, path)
		?.split('\n')
		.find((candidate) => candidate.startsWith(`\t\t\treadonly ${member}: `));
	if (line === undefined) throw new Error(`no override at ${path}.${member}`);
	return line.slice(`\t\t\treadonly ${member}: `.length, -1).split(' | ');
};

describe('emitGrammarMap, rust', () => {
	let map: string;

	beforeAll(async () => {
		map = await mapOf('rust');
	}, 120_000);

	it('declares the map over the grammar features and ends by asserting it fits the vocabulary', () => {
		expect(map).toContain(
			'export interface RustMap extends V.GrammarMap {\n\treadonly features: V.RustFeatures;\n\treadonly overrides: {\n'
		);
		expect(map.trimEnd().endsWith('export type RustMapFits = V.Assert<V.Fits<RustMap>>;')).toBe(true);
	});

	it("overrides a slot holding a family with the family paths the grammar claims, not the vocabulary's whole family", () => {
		const property = armsAt(map, 'expression.member', 'property');
		expect(property).toContain('V.RequiredBy<V.Literal.Number.Integer.Octal<RustMap>, "content", never>');
		expect(property.some((arm) => arm.includes('V.Literal.Number.Integer.Big'))).toBe(false);
		expect(property.some((arm) => arm.includes('V.Literal.Number.Integer.Imaginary'))).toBe(false);
	});

	it('overrides a slot holding a supertype with the paths its subtypes read as, never the supertype path no node reads as', () => {
		const input = armsAt(map, 'attribute.content', 'input');
		expect(input).toContain('V.Element.Macro.TokenTree.Delimited.Paren<RustMap>');
		expect(input).not.toContain('V.Element.Macro.TokenTree.Delimited<RustMap>');
	});

	it('overrides only a path the grammar reads, and holds a family by the members it holds', () => {
		expect(entryOf(map, 'attribute.decorator')).toBeUndefined();
		const elements = armsAt(map, 'literal.string', 'elements');
		expect(elements).toContain('V.Literal.String.Text<RustMap>');
		expect(elements.some((arm) => arm.includes('V.Literal.String.Bytes'))).toBe(false);
	});

	it('registers the unclaimed kinds a read seat holds as their low-level nodes, and admits them by name', () => {
		expect(armsAt(map, 'declaration.extension', 'traitClause')).toEqual([
			'V.Unmapped<"rust:impl_item_negative_clause">',
			'V.Unmapped<"rust:impl_item_positive_clause">'
		]);
		const registry = map.slice(
			map.indexOf('declare module "@sittir/types/vocabulary" {'),
			map.indexOf('export type RustMapFits')
		);
		expect(registry.trimEnd().split('\n')).toEqual([
			'declare module "@sittir/types/vocabulary" {',
			'\tinterface UnmappedKinds {',
			'\t\treadonly "rust:impl_item_negative_clause": T.ImplItemNegativeClause.Parsed;',
			'\t\treadonly "rust:impl_item_positive_clause": T.ImplItemPositiveClause.Parsed;',
			'\t\treadonly "rust:use_wildcard_group": T.UseWildcardGroup.Parsed;',
			'\t}',
			'}'
		]);
	});
});

describe('emitGrammarMap, python', () => {
	let map: string;

	beforeAll(async () => {
		map = await mapOf('python');
	}, 120_000);

	it("overrides a slot holding a token claimed as a path with the text it reads as, not the path's view", () => {
		const content = armsAt(map, 'statement.import.from', 'content');
		expect(content).toContain('V.Text<PythonMap, "clause.import.wildcard">');
		expect(content).not.toContain('V.Clause.Import.Wildcard<PythonMap>');
	});

	it('overrides a text path with the texts the grammar reads at it', () => {
		expect(entryOf(map, 'clause.import.wildcard')).toContain(
			'\t\t\treadonly $text: PortableTexts["clause.import.wildcard"];'
		);
	});
});
