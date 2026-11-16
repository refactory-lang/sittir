import { beforeAll, describe, expect, it } from 'vitest';
import { generate } from '../../../../compiler/generate.ts';
import { tmpdir } from 'node:os';

const mapOf = async (grammar: string): Promise<string> => {
	const generated = await generate({ grammar, outputDir: `${tmpdir()}/sittir-grammar-map-${grammar}/src` });
	if (generated.portableTyped === undefined) throw new Error(`${grammar} emitted no typed module`);
	return generated.portableTyped.map;
};

const entryOf = (map: string, path: string): string | undefined => {
	const start = map.indexOf(`\t\treadonly "${path}": {\n`);
	return start < 0 ? undefined : map.slice(start, map.indexOf('\n\t\t};', start));
};

const typeAt = (map: string, path: string, member: string): string => {
	const line = entryOf(map, path)
		?.split('\n')
		.find((candidate) => candidate.startsWith(`\t\t\treadonly ${member}: `));
	if (line === undefined) throw new Error(`no override at ${path}.${member}`);
	return line.slice(`\t\t\treadonly ${member}: `.length, -1);
};

const armsAt = (map: string, path: string, member: string): readonly string[] => typeAt(map, path, member).split(' | ');

const flagsAt = (map: string, path: string): string => {
	const block = map.slice(map.indexOf('\treadonly flags: {\n'));
	const line = block.split('\n').find((candidate) => candidate.startsWith(`\t\treadonly "${path}": `));
	if (line === undefined) throw new Error(`no flags at ${path}`);
	return line.slice(`\t\treadonly "${path}": `.length, -1);
};

describe('emitGrammarMap, rust', () => {
	let map: string;

	beforeAll(async () => {
		map = await mapOf('rust');
	}, 120_000);

	it("types a flag a container's own token sets on what it holds: an inner attribute item sets inner on its attribute", () => {
		expect(flagsAt(map, 'attribute')).toBe('"inner"');
	});

	it('declares the map over the grammar features and ends by asserting it fits the vocabulary', () => {
		expect(map).toContain(
			'export interface RustMap extends V.GrammarMap {\n\treadonly features: V.RustFeatures;\n\treadonly overrides: {\n'
		);
		expect(map.trimEnd().endsWith('export type RustMapFits = V.Assert<V.Fits<RustMap>>;')).toBe(true);
	});

	it("overrides a slot holding a family with the family paths the grammar claims, not the vocabulary's whole family", () => {
		const property = armsAt(map, 'expression.member', 'property');
		expect(property).toContain('V.Read<RustMap, "literal.number.integer.octal">');
		expect(property.some((arm) => arm.includes('"literal.number.integer.big"'))).toBe(false);
		expect(property.some((arm) => arm.includes('"literal.number.integer.imaginary"'))).toBe(false);
	});

	it('overrides a slot holding a supertype with the paths its subtypes read as, never the supertype path no node reads as', () => {
		const input = armsAt(map, 'attribute', 'input');
		expect(input).toContain('V.Read<RustMap, "element.macro.token_tree.delimited.paren">');
		expect(input).not.toContain('V.Read<RustMap, "element.macro.token_tree.delimited">');
	});

	it('overrides only a path the grammar reads, and holds a family by the members it holds', () => {
		expect(entryOf(map, 'attribute.decorator')).toBeUndefined();
		const elements = armsAt(map, 'literal.string', 'elements');
		expect(elements).toContain('V.Read<RustMap, "literal.string.text">');
		expect(elements.some((arm) => arm.includes('"literal.string.bytes'))).toBe(false);
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
		const names = armsAt(map, 'statement.import.from', 'names');
		expect(names).toContain('V.Text<PythonMap, "clause.import.wildcard">');
		expect(names).not.toContain('V.Read<PythonMap, "clause.import.wildcard">');
	});

	it('overrides a text path with the texts the grammar reads at it', () => {
		expect(entryOf(map, 'clause.import.wildcard')).toContain(
			'\t\t\treadonly $text: PortableTexts["clause.import.wildcard"];'
		);
	});

	it('overrides an inherited member at each path that instantiates it, by what that path reads', () => {
		expect(armsAt(map, 'expression.binary.arithmetic.add', 'left').length).toBeGreaterThan(0);
		expect(armsAt(map, 'expression.binary.comparison.less', 'left').length).toBeGreaterThan(0);
	});

	it('overrides a member the grammar never reads at a path as never', () => {
		expect(armsAt(map, 'literal.number.float.scientific', 'fraction')).toEqual(['never']);
	});

	it('reads a capture by the kind its pattern pins, not by the whole slot it sits in', () => {
		const doc = armsAt(map, 'declaration.class', 'doc');
		expect(doc.some((arm) => arm.includes('"literal.string'))).toBe(true);
		expect(doc.filter((arm) => /"(declaration|expression|statement)\./.test(arm))).toEqual([]);
	});

	it("reads a lexed pattern's text group as text", () => {
		expect(armsAt(map, 'literal.number.float', 'fraction')).toContain('string');
	});

	it('builds a path whose unnamed slot holds its text from its $value, with no member for that slot', () => {
		expect(typeAt(map, 'literal.string.escape', '$forms')).toBe('V.Form<"$value">');
		expect(entryOf(map, 'literal.string.escape')).not.toContain('content');
	});

	it('states the forms a path builds once, at the path, by the members each form states and leaves out', () => {
		expect(typeAt(map, 'declaration.constant', '$forms')).toBe(
			'V.Form<"name" | "value", "type"> | V.Form<"name" | "type", "value"> | V.Form<"name" | "type" | "value">'
		);
	});

	it('narrows a member a form tests by kind to the reads of those kinds', () => {
		const forms = typeAt(map, 'identifier.qualified', '$forms');
		expect(forms).toContain('V.Form<"name", never, { readonly qualifier?: V.Read<PythonMap, "identifier.qualified"> }>');
		expect(forms).toMatch(/V\.Form<"name", never, \{ readonly qualifier: V\.Read<PythonMap, "expression\./);
		expect(forms).not.toContain('V.Read<PythonMap, "type">');
	});

	it('states no forms where one of the path\'s builds tests nothing a type states', () => {
		expect(entryOf(map, 'statement.block') ?? '').not.toContain('$forms');
	});

	it("names each path's nodes by the kinds that read as that path, never a subpath's, and its flags from what its build arms set", () => {
		const nodes = map.slice(map.indexOf('\treadonly nodes: V.NodesOf<{\n'), map.indexOf('\n\t}, T.BoundByKindId, T.ParsedByKindId>;\n'));
		expect(nodes).toContain('\t\treadonly "identifier": TSKindId.Identifier;');
		expect(nodes).toContain('\t\treadonly "identifier.qualified": TSKindId.DottedName | TSKindId.MemberType;');
		const flags = map.slice(map.indexOf('\treadonly flags: {\n'), map.indexOf('\n\t};\n}', map.indexOf('\treadonly flags: {\n')));
		expect(flags).toContain('\t\treadonly "declaration.property.getter": "async" | "override";');
		expect(flags).toContain('\t\treadonly "declaration.constant": never;');
	});

	it("types a member no claim's level declares by what its routes read: a constant's value admits the node no path claims", () => {
		expect(armsAt(map, 'declaration.constant', 'value')).toContain('V.Unmapped<"python:as_pattern">');
		expect(armsAt(map, 'declaration.constant', 'name')).toEqual(['V.Read<PythonMap, "identifier">']);
	});

	it('takes bare text as the input of a path the grammar builds from text', () => {
		const inputs = map.slice(map.indexOf('\treadonly inputs: {\n'), map.indexOf('\n\t};\n', map.indexOf('\treadonly inputs: {\n')));
		expect(inputs).toContain('\t\treadonly "identifier": string;');
		expect(inputs).not.toContain('"declaration.constant"');
	});
});

describe('emitGrammarMap, typescript', () => {
	let map: string;

	beforeAll(async () => {
		map = await mapOf('typescript');
	}, 120_000);

	it('overrides no member of a path the vocabulary declares as text', () => {
		expect(entryOf(map, 'expression.call.import')?.split('\n').slice(1)).toEqual(['\t\t\treadonly $text: PortableTexts["expression.call.import"];']);
	});
});

describe('emitGrammarMap, typescript', () => {
	let map: string;

	beforeAll(async () => {
		map = await mapOf('typescript');
	}, 120_000);

	it("admits a root path that builds by its value's type at each path it builds through, with that value's type", () => {
		const inputs = map.slice(map.indexOf('\treadonly inputs: {\n'), map.indexOf('\n\t};\n', map.indexOf('\treadonly inputs: {\n')));
		expect(inputs).toContain('\t\treadonly "literal.number.float": { readonly $path: "literal.number"; readonly $value: number };');
		expect(inputs).toContain('\t\treadonly "literal.number.integer.big": { readonly $path: "literal.number"; readonly $value: bigint };');
		expect(inputs).toContain('\t\treadonly "literal.number": string;');
	});
});
