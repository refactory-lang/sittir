import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript6';

export interface VocabularyMember {
	readonly optional: boolean;
	readonly flag: boolean;
}

export interface VocabularyKind {
	readonly name: string;
	readonly own: ReadonlyMap<string, VocabularyMember>;
	readonly parent: string | undefined;
}

export interface Vocabulary {
	readonly kinds: ReadonlyMap<string, VocabularyKind>;
	readonly flags: ReadonlySet<string>;
	members(path: string): ReadonlyMap<string, VocabularyMember>;
}

interface Declared {
	readonly name: string;
	readonly path: string;
	readonly own: Map<string, VocabularyMember>;
	readonly parentName: string | undefined;
}

export function readVocabulary(dir: string): Vocabulary {
	const declared: Declared[] = [];
	for (const file of readdirSync(dir).filter((f) => f.endsWith('.ts'))) {
		const source = ts.createSourceFile(file, readFileSync(join(dir, file), 'utf8'), ts.ScriptTarget.Latest, true);
		collect(source.statements, [], declared);
	}
	const pathByName = new Map(declared.map((d) => [d.name, d.path]));
	const kinds = new Map<string, VocabularyKind>(
		declared.map((d) => [d.path, { name: d.name, own: d.own, parent: d.parentName === undefined ? undefined : pathByName.get(d.parentName) }])
	);
	const members = (path: string): ReadonlyMap<string, VocabularyMember> => {
		const all = new Map<string, VocabularyMember>();
		for (let kind = kinds.get(path); kind !== undefined; kind = kind.parent === undefined ? undefined : kinds.get(kind.parent)) {
			for (const [name, member] of kind.own) if (!all.has(name)) all.set(name, member);
		}
		return all;
	};
	const flags = new Set(declared.flatMap((d) => [...d.own].flatMap(([name, member]) => (member.flag ? [name] : []))));
	return { kinds, flags, members };
}

const isFlag = (type: ts.TypeNode | undefined): boolean =>
	type !== undefined && ts.isTypeReferenceNode(type) && ts.isIdentifier(type.typeName) && type.typeName.text === 'Flag';

function collect(statements: ts.NodeArray<ts.Statement>, scope: readonly string[], out: Declared[]): void {
	for (const statement of statements) {
		if (ts.isModuleDeclaration(statement) && statement.body !== undefined && ts.isModuleBlock(statement.body)) {
			collect(statement.body.statements, [...scope, statement.name.text], out);
			continue;
		}
		if (!ts.isInterfaceDeclaration(statement)) continue;
		const name = [...scope, statement.name.text].join('.');
		let path: string | undefined;
		const own = new Map<string, VocabularyMember>();
		for (const member of statement.members) {
			if (!ts.isPropertySignature(member) || !ts.isIdentifier(member.name)) continue;
			if (member.name.text === '$kind') {
				const type = member.type;
				if (type !== undefined && ts.isLiteralTypeNode(type) && ts.isStringLiteral(type.literal)) path = type.literal.text;
				continue;
			}
			own.set(member.name.text, { optional: member.questionToken !== undefined, flag: isFlag(member.type) });
		}
		if (path === undefined) continue;
		out.push({ name, path, own, parentName: parentNameOf(statement) });
	}
}

function parentNameOf(declaration: ts.InterfaceDeclaration): string | undefined {
	for (const clause of declaration.heritageClauses ?? []) {
		for (const type of clause.types) {
			const found = vocabularyReference(type);
			if (found !== undefined) return found;
		}
	}
	return undefined;
}

function vocabularyReference(node: ts.Node): string | undefined {
	if (ts.isTypeReferenceNode(node) && ts.isQualifiedName(node.typeName)) {
		const text = node.typeName.getText();
		if (text.startsWith('V.')) return text.slice(2);
	}
	return ts.forEachChild(node, vocabularyReference);
}
