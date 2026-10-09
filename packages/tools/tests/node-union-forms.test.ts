import { join } from 'node:path';
import ts from 'typescript6';
import { describe, expect, it } from 'vitest';
import { allGrammars, grammarPackageDir, grammarTypePrefix, type GrammarName } from '@sittir/codegen/grammars';

const constituents = (type: ts.Type): readonly ts.Type[] => (type.isUnion() ? type.types : [type]);

function kindsWithDataAndParsed(grammar: GrammarName): { kinds: number; both: string[] } {
	const dir = grammarPackageDir(grammar);
	const config = ts.readConfigFile(join(dir, 'tsconfig.json'), ts.sys.readFile);
	const options = ts.parseJsonConfigFileContent(config.config, ts.sys, dir).options;
	const file = join(dir, 'src', 'types.ts');
	const program = ts.createProgram([file], { ...options, noEmit: true });
	const checker = program.getTypeChecker();
	const source = program.getSourceFile(file)!;
	const declared = (name: string): ts.Type => {
		const statement = source.statements.find(
			(s): s is ts.TypeAliasDeclaration | ts.InterfaceDeclaration =>
				(ts.isTypeAliasDeclaration(s) || ts.isInterfaceDeclaration(s)) && s.name.text === name
		)!;
		return checker.getTypeAtLocation(statement.name);
	};
	const members = new Set(constituents(declared(`${grammarTypePrefix(grammar)}Node`)));
	const namespaces = checker.getPropertiesOfType(declared('NamespaceMap'));
	const both: string[] = [];
	for (const namespace of namespaces) {
		const forms = checker.getTypeOfSymbol(namespace);
		const formType = (name: string) => {
			const form = forms.getProperty(name);
			return form === undefined ? undefined : checker.getTypeOfSymbol(form);
		};
		const node = formType('Node');
		const parsed = formType('Parsed');
		if (node === undefined || parsed === undefined || node === parsed) continue;
		const inUnion = (form: ts.Type) => constituents(form).some((t) => members.has(t));
		if (inUnion(node) && inUnion(parsed)) both.push(checker.typeToString(node));
	}
	return { kinds: namespaces.length, both };
}

describe("a grammar's node union", () => {
	for (const grammar of allGrammars()) {
		it(`${grammar}: no kind contributes both its data Node and its Parsed form`, () => {
			const { kinds, both } = kindsWithDataAndParsed(grammar);
			expect(kinds).toBeGreaterThan(10);
			expect(both).toEqual([]);
		}, 120000);
	}
});
