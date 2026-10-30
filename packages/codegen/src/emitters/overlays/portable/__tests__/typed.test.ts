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
	const body = new RegExp(`function ${name}\\(n: T\\.FunctionItem\\.Parsed, set = 0\\): VocabViews\\['declaration\\.function'\\] \\{\\n\\treturn \\{ (.*) \\};\\n\\}`).exec(source);
	if (body?.[1] === undefined) throw new Error(`no factory ${name}`);
	return body[1].split(', ');
};

describe('emitPortableTyped', () => {
	it("declares rust's declaration.function as the view form of its interface", () => {
		expect(typed.source).toContain("\t'declaration.function': ViewForm<V.Declaration.Function<Ctx>>;");
	});

	it('prints each read entry as a literal whose only data member is $type, naming member functions written once', () => {
		const name = /function (FunctionItemAsDeclarationFunction\d*)\(n: T\.FunctionItem\.Parsed/.exec(typed.source)?.[1];
		expect(name).toBeDefined();
		const [type, held, flags, ...members] = factoryOf(typed.source, name!);
		expect([type, held, flags]).toEqual(['$type: kindOf(n)', '[low]: n', '[flags]: set']);
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

	it('reports what it skipped with the reason', () => {
		expect(typed.unemitted).toContainEqual({ kind: 'let_chain', vocab: 'clause.let.chain', reason: 'no typed surface' });
	});
});
