import { beforeAll, describe, expect, it } from 'vitest';
import { generate } from '../../../../compiler/generate.ts';
import type { PortableTypedOutput } from '../typed.ts';

let typed: PortableTypedOutput;

beforeAll(async () => {
	const generated = await generate({ grammar: 'rust', outputDir: '/tmp/sittir-portable-typed-rust/src' });
	if (generated.portableTyped === undefined) throw new Error('rust emitted no typed module');
	typed = generated.portableTyped;
}, 120_000);

const factoryOf = (source: string, name: string): readonly string[] => {
	const body = new RegExp(`function ${name}\\(n: T\\.FunctionItem\\.Parsed, set = 0\\): VocabViews\\["declaration\\.function"\\] \\{\\n\\treturn \\{ (.*) \\};\\n\\}`).exec(source);
	if (body?.[1] === undefined) throw new Error(`no factory ${name}`);
	return body[1].split(', ');
};

describe('emitPortableTyped', () => {
	it("declares rust's declaration.function as the view form of its interface", () => {
		expect(typed.source).toContain('\t"declaration.function": ViewForm<V.Declaration.Function<Ctx>>;');
	});

	it('prints each read entry as a literal whose only data member is $type, naming member functions written once, its symbol keys last', () => {
		const name = /function (FunctionItemAsDeclarationFunction\d*)\(n: T\.FunctionItem\.Parsed/.exec(typed.source)?.[1];
		expect(name).toBeDefined();
		const fields = factoryOf(typed.source, name!);
		const [type, ...members] = fields.slice(0, -2);
		expect(type).toBe('$type: kindOf(n)');
		expect(fields.slice(-2)).toEqual(['[low]: n', '[flags]: set']);
		expect(members.length).toBeGreaterThan(0);
		for (const member of members) {
			const [key, value] = member.split(': ');
			expect(value === 'none' || value === `${name}$${key}`, member).toBe(true);
			if (value !== 'none') expect(typed.source.split(`function ${value}(this: Held<T.FunctionItem.Parsed>)`).length - 1, value).toBe(1);
		}
	});

	it('reads a member through the declared read and the reader its route names', () => {
		const name = /function (FunctionItemAsDeclarationFunction\d*)\(n: T\.FunctionItem\.Parsed/.exec(typed.source)?.[1];
		expect(typed.source).toContain(`function ${name}$name(this: Held<T.FunctionItem.Parsed>) {\n\treturn read(this[low].name());\n}`);
	});

	it('types a container whose slot holds only a list as that list, since an empty one reads as []', () => {
		expect(typed.source).toContain('type VK_EnumVariantList = VK_EnumVariantListElements;');
		expect(typed.source).toContain('type VK_Arguments = VK_ArgumentsElements;');
		expect(typed.source).toContain('type VK_BlockCommentDocInner = VK_BlockCommentContent | undefined;');
	});

	it("reads a member through each of its routes in the route table's order, and an absent list as []", () => {
		const name = /function (FunctionItemAsDeclarationFunction\d*)\(n: T\.FunctionItem\.Parsed/.exec(typed.source)?.[1];
		expect(typed.source).toContain(
			`function ${name}$parameters(this: Held<T.FunctionItem.Parsed>) {\n\treturn read(of(this[low].parameters().elements(), TSKindId.ParametersElements)?.items()) ?? read(of(this[low].parameters().elements(), TSKindId.ParametersElementsReceiver)?.parametersElementsReceiverGroup()?.elements()?.items()) ?? [];\n}`
		);
	});

	it("types a slot holding a family as the family paths the grammar claims, not the vocabulary's whole family", () => {
		const property = /\treadonly ["']expression\.member["']: \{\n(?:\t\t[^\n]*\n)*?\t\treadonly property: ([^\n]*);/.exec(typed.source)?.[1];
		expect(property).toContain('V.Literal.Number.Integer.Octal<Ctx>');
		expect(property).not.toContain('V.Literal.Number.Integer.Big');
		expect(property).not.toContain('V.Literal.Number.Integer.Imaginary');
	});

	it('types a slot holding a supertype by the paths its subtypes read as, never the supertype path no node reads as', () => {
		const input = /\treadonly ["']attribute\.content["']: \{\n\t\treadonly input: ([^\n]*);/.exec(typed.source)?.[1];
		expect(input).toContain('V.Element.Macro.TokenTree.Delimited.Paren<Ctx>');
		expect(input).not.toContain('V.Element.Macro.TokenTree.Delimited<Ctx>');
	});

	it('builds a role from the paths its kinds read as, never a path claimed only by a supertype or shadowed by a refinement', () => {
		const element = /\treadonly element:((?:\n\t\t\|[^\n]*)+|[^\n]*);/.exec(typed.source.slice(typed.source.indexOf('export interface Ctx')))?.[1];
		expect(element).toContain('V.Element.Macro.TokenTree.Delimited.Paren<Ctx>');
		expect(element).not.toContain('V.Element.Macro.TokenTree.Delimited<Ctx>');
		expect(element).not.toContain('V.Element.Macro.TokenTree<Ctx>');
	});

	it('emits an own slot only for a path the grammar reads, and holds a family by the members it holds', () => {
		const own = typed.source.slice(typed.source.indexOf('interface OwnSlots {'), typed.source.indexOf('\n}\n', typed.source.indexOf('interface OwnSlots {')));
		expect(own).not.toMatch(/\treadonly ["']attribute\.decorator["']: \{/);
		const elements = /\treadonly ["']literal\.string["']: \{\n\t\treadonly elements: ([^\n]*);/.exec(own)?.[1];
		expect(elements).toContain('V.Literal.String.Text<Ctx>');
		expect(elements).not.toContain('V.Literal.String.Bytes');
	});

	it('types a slot holding a kind by the paths that kind reads as, never by the other kinds read under its claim path', () => {
		const right = /\treadonly ["']clause\.macro\.rule["']: \{\n\t\treadonly left: [^\n]*;\n\t\treadonly right: ([^\n]*);/.exec(typed.source)?.[1];
		expect(right?.split(' | ').sort()).toEqual(['V.Element.Macro.TokenTree.Brace<Ctx>', 'V.Element.Macro.TokenTree.Bracket<Ctx>', 'V.Element.Macro.TokenTree.Paren<Ctx>']);
	});

	it('reads a list slot without a fallback, since its accessor always returns a list', () => {
		expect(typed.source).not.toMatch(/read\(this\[low\]\.attributes\(\)\) \?\? \[\]/);
		expect(typed.source).toMatch(/return read\(this\[low\]\.attributes\(\)\);/);
	});

	it("types an entry's node by what its claim tests present, and reads through that guarantee", () => {
		const held = /type (ConstItemAsDeclarationConstantPublicRestricted\d+)\$Held = /.exec(typed.source)?.[1];
		expect(typed.source).toContain(
			`type ${held}$Held = Present<T.ConstItem.Parsed, { readonly visibilityModifier: [never, { readonly content: [TSKindId.VisibilityModifierPub, { readonly visibilityModifierPubScope: [never, { readonly content: [TSKindId.VisibilityModifierPubScopeInPath, {}]; }]; }]; }]; }>;`
		);
		expect(typed.source).toContain(`function ${held}(n: ${held}$Held, set = 0)`);
		expect(typed.source).toContain(
			`function ${held}$scope(this: Held<${held}$Held>) {\n\treturn read(of(of(this[low].visibilityModifier().content(), TSKindId.VisibilityModifierPub).visibilityModifierPubScope().content(), TSKindId.VisibilityModifierPubScopeInPath).path());`
		);
	});

	it('writes no route through a kind the claim rules out: a restricted scope reads through the in-path form only', () => {
		expect(typed.source).toMatch(
			/function VisibilityModifierPubAsModifierVisibilityPublicRestricted(\d+)\$scope\(this: Held<VisibilityModifierPubAsModifierVisibilityPublicRestricted\1\$Held>\) \{\n\treturn read\(of\(this\[low\]\.visibilityModifierPubScope\(\)\.content\(\), TSKindId\.VisibilityModifierPubScopeInPath\)\.path\(\)\);\n\}/
		);
	});

	it('reads text and a boolean as themselves, since only a kind id or a node reads as a view', () => {
		expect(typed.source).toContain('\t\t\t\t: N extends string | boolean\n\t\t\t\t\t? N\n\t\t\t\t\t: unknown;');
		expect(typed.source).toContain('return read(this[low].suffix());');
	});

	it('reads an absent value and a hole as themselves', () => {
		expect(typed.source).toContain('export type ViewOf<N> = N extends undefined | null\n\t? N\n');
	});

	it('skips no read: every read entry has a typed surface and every member a path', () => {
		expect(typed.unemitted).toEqual([]);
	});

	it("reads rust's implements through the positive clause only: a negative clause says the type does not implement the trait", () => {
		const body = /function ImplItemBodyAsDeclarationExtensionConformance\d*\$implements\([^)]*\) \{([\s\S]*?)\n\}/.exec(typed.source)?.[1];
		expect(body).toContain('TSKindId.ImplItemPositiveClause');
		expect(body).not.toContain('TSKindId.ImplItemNegativeClause');
	});

	it('types a kind by the entries its node can read as: a receiver, never the parameter its own test refines', () => {
		expect(typed.source).toContain('type VK_ReceiverParameterDeclaration = VocabViews["declaration.parameter.receiver"];');
	});

	it('fills the unmapped table with the unclaimed kinds each read seat holds, keyed by namespace and member', () => {
		const table = /\treadonly unmapped: \{\n([\s\S]*?)\n\t\};/.exec(typed.source)?.[1];
		expect(table?.split('\n')).toEqual([
			'\t\treadonly "clause": {',
			"\t\t\treadonly useWildcardGroup: V.Unmapped<'rust:use_wildcard_group'>;",
			'\t\t};',
			'\t\treadonly "declaration": {',
			"\t\t\treadonly traitClause: V.Unmapped<'rust:impl_item_negative_clause'> | V.Unmapped<'rust:impl_item_positive_clause'>;",
			'\t\t};'
		]);
		expect(typed.source).toContain('type UnmappedKeys = Fit<"clause" | "declaration", V.NamespaceOf<keyof Slots>>;');
	});

	it('reads a claim on a name the parser shows once, as the kind it shows', () => {
		expect(typed.unemitted.filter((u) => u.kind === 'let_chain')).toEqual([]);
		expect(typed.source.match(/function LetChainAsClauseLetChain\d*\(/g)).toHaveLength(1);
	});
});

describe('emitPortableTyped, python', () => {
	let python: PortableTypedOutput;

	beforeAll(async () => {
		const generated = await generate({ grammar: 'python', outputDir: '/tmp/sittir-portable-typed-python/src' });
		if (generated.portableTyped === undefined) throw new Error('python emitted no typed module');
		python = generated.portableTyped;
	}, 120_000);

	it.each(['VK_Subscripts', 'VK_Subjects'])('types %s, a list claimed by its own separator, as its claim or the one value it holds when the claim fails', (alias) => {
		const type = new RegExp(`type ${alias} = (.*);`).exec(python.source)?.[1];
		expect(type?.startsWith('VocabViews["expression.collection.tuple.bare"] | ')).toBe(true);
		expect(type).not.toContain('readonly');
	});
});

describe('emitPortableTyped over python', () => {
	let python: PortableTypedOutput;

	beforeAll(async () => {
		const generated = await generate({ grammar: 'python', outputDir: '/tmp/sittir-portable-typed-python/src' });
		if (generated.portableTyped === undefined) throw new Error('python emitted no typed module');
		python = generated.portableTyped;
	}, 120_000);

	it('types a slot holding a token claimed as a path by the text it reads as, not by the path\'s view', () => {
		const content = /\treadonly ["']statement\.import\.from["']: \{\n\t\treadonly content: ([^\n]*);/.exec(python.source)?.[1];
		expect(content).toContain(`Ctx['texts']["clause.import.wildcard"]`);
		expect(content).not.toContain('V.Clause.Import.Wildcard<Ctx>');
	});
});
