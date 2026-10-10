import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript6';

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url));
export const VOCABULARY_DIR = join(ROOT, 'packages', 'types', 'src', 'vocabulary');
export const AUGMENTATION = 'augment.ts';
export const FEATURES = 'features';

export interface Member {
	readonly name: string;
	readonly optional: boolean;
	readonly type: string;
}

export interface Declared {
	readonly qname: string;
	readonly path: string | undefined;
	readonly parent: string | undefined;
	readonly members: readonly Member[];
}

export interface DeclaredKind extends Declared {
	readonly path: string;
}

export const isKind = (d: Declared): d is DeclaredKind => d.path !== undefined;

export const byCodepoint = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

export interface Feature {
	readonly name: string;
	readonly key: string;
	readonly parents: readonly string[];
	readonly dir: string;
	readonly stubs: readonly Declared[];
	readonly unexported: readonly string[];
}

export interface VocabularySource {
	readonly kinds: readonly DeclaredKind[];
	readonly modules: ReadonlyMap<string, string>;
	readonly enumerations: ReadonlyMap<string, string>;
	readonly features: readonly Feature[];
}

export const ENUMERATION = 'Beneath';

export function readVocabularySource(dir: string): VocabularySource {
	const kinds: DeclaredKind[] = [];
	const modules = new Map<string, string>();
	const enumerations = new Map<string, string>();
	for (const file of readdirSync(dir)
		.filter((f) => f.endsWith('.ts') && f !== AUGMENTATION)
		.sort(byCodepoint)) {
		const source = parse(file, readFileSync(join(dir, file), 'utf8'));
		for (const d of readDeclared(source).filter(isKind)) {
			kinds.push(d);
			modules.set(d.qname.replace(/\..*$/, ''), file);
		}
		for (const [name, root] of readEnumerations(source)) enumerations.set(name, root);
	}
	const root = join(dir, FEATURES);
	return { kinds, modules, enumerations, features: existsSync(root) ? readFeatures(root) : [] };
}

const printer = ts.createPrinter({ removeComments: true });

const parse = (file: string, text: string): ts.SourceFile => ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);

function readEnumerations(source: ts.SourceFile): [string, string][] {
	return source.statements.flatMap((s): [string, string][] => {
		if (!ts.isTypeAliasDeclaration(s) || !ts.isTypeReferenceNode(s.type) || !ts.isIdentifier(s.type.typeName) || s.type.typeName.text !== ENUMERATION) return [];
		const root = s.type.typeArguments?.[1];
		return root !== undefined && ts.isLiteralTypeNode(root) && ts.isStringLiteral(root.literal) ? [[s.name.text, root.literal.text]] : [];
	});
}

function readDeclared(source: ts.SourceFile): Declared[] {
	const out: Declared[] = [];
	const visit = (statements: ts.NodeArray<ts.Statement>, scope: readonly string[]): void => {
		for (const statement of statements) {
			if (ts.isModuleDeclaration(statement) && ts.isIdentifier(statement.name) && statement.body !== undefined && ts.isModuleBlock(statement.body)) {
				visit(statement.body.statements, [...scope, statement.name.text]);
			} else if (ts.isInterfaceDeclaration(statement)) {
				out.push(declared(statement, [...scope, statement.name.text].join('.'), source));
			}
		}
	};
	visit(source.statements, []);
	return out;
}

function declared(statement: ts.InterfaceDeclaration, qname: string, source: ts.SourceFile): Declared {
	let path: string | undefined;
	const members: Member[] = [];
	for (const member of statement.members) {
		if (!ts.isPropertySignature(member) || !ts.isIdentifier(member.name)) continue;
		if (member.name.text === '$kind') {
			const type = member.type;
			if (type !== undefined && ts.isLiteralTypeNode(type) && ts.isStringLiteral(type.literal)) path = type.literal.text;
			continue;
		}
		members.push({
			name: member.name.text,
			optional: member.questionToken !== undefined,
			type: member.type === undefined ? 'any' : printer.printNode(ts.EmitHint.Unspecified, member.type, source)
		});
	}
	return { qname, path, parent: parentOf(statement), members };
}

function parentOf(declaration: ts.InterfaceDeclaration): string | undefined {
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

function readFeatures(root: string): Feature[] {
	const out: Feature[] = [];
	const visit = (dir: string): void => {
		for (const entry of readdirSync(join(root, dir), { withFileTypes: true }).sort((a, b) => byCodepoint(a.name, b.name))) {
			if (!entry.isDirectory()) continue;
			const sub = dir === '' ? entry.name : posix.join(dir, entry.name);
			out.push(readFeature(root, sub));
			visit(sub);
		}
	};
	visit('');
	return out;
}

function readFeature(root: string, dir: string): Feature {
	const abs = join(root, dir);
	const index = parse('index.ts', readFileSync(join(abs, 'index.ts'), 'utf8'));
	const [marker] = index.statements.filter(ts.isInterfaceDeclaration).flatMap((declaration) => {
		const key = markerKey(declaration);
		return key === undefined ? [] : [{ declaration, key }];
	});
	if (marker === undefined) throw new Error(`features/${dir}/index.ts declares no marker interface`);
	const exported = new Set(
		index.statements.flatMap((s) =>
			ts.isExportDeclaration(s) && s.exportClause === undefined && s.moduleSpecifier !== undefined && ts.isStringLiteral(s.moduleSpecifier)
				? [s.moduleSpecifier.text]
				: []
		)
	);
	const files = readdirSync(abs)
		.filter((f) => f.endsWith('.ts') && f !== 'index.ts')
		.sort(byCodepoint);
	return {
		name: marker.declaration.name.text,
		key: marker.key,
		parents: (marker.declaration.heritageClauses ?? []).flatMap((clause) => clause.types.map((type) => type.expression.getText(index))),
		dir,
		stubs: files.flatMap((file) => readDeclared(parse(file, readFileSync(join(abs, file), 'utf8')))),
		unexported: files.filter((file) => !exported.has(`./${file}`))
	};
}

function markerKey(declaration: ts.InterfaceDeclaration): string | undefined {
	const [member, ...rest] = declaration.members;
	if (member === undefined || rest.length > 0 || !ts.isPropertySignature(member) || member.type === undefined) return undefined;
	if (!ts.isLiteralTypeNode(member.type) || member.type.literal.kind !== ts.SyntaxKind.TrueKeyword) return undefined;
	return ts.isIdentifier(member.name) || ts.isStringLiteral(member.name) ? member.name.text : undefined;
}
