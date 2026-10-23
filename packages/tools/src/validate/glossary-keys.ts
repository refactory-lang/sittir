import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import ts from 'typescript6';

export const GLOSSARY_TREES: readonly string[] = [
	'packages/codegen/src/',
	'packages/common/src/',
	'packages/tools/src/',
	'packages/types/src/'
];

export const GLOSSARY_DIR = 'docs/glossary';
export const DEFAULT_CEILINGS = 'packages/tools/glossary-key-ceilings.json';

export const VALID_CLASSES = ['ok-bare-unique', 'ok-owner-qualified'] as const;
export const BROKEN_CLASSES = [
	'ambiguous',
	'no-declaration',
	'wrong-owner',
	'dot-separated',
	'placeholder',
	'out-of-scope-file',
	'file-missing'
] as const;

export type ValidClass = (typeof VALID_CLASSES)[number];
export type BrokenClass = (typeof BROKEN_CLASSES)[number];
export type KeyClass = ValidClass | BrokenClass;
export type CountName = BrokenClass | 'undocumented';

export const COUNT_NAMES: readonly CountName[] = [...BROKEN_CLASSES, 'undocumented'];

export interface Declaration {
	readonly path: readonly string[];
	readonly exported: boolean;
}

export interface GlossaryKey {
	readonly key: string;
	readonly where: string;
}

export interface ClassifiedKey extends GlossaryKey {
	readonly class: KeyClass;
	readonly resolved?: string;
}

type Modifiable = ts.Node;
type ExportTest = (node: ts.Node, name: string) => boolean;

function hasModifier(node: Modifiable, kind: ts.SyntaxKind): boolean {
	return ts.canHaveModifiers(node) && (ts.getModifiers(node) ?? []).some((modifier) => modifier.kind === kind);
}

function nameOf(name: ts.Node | undefined): string | undefined {
	if (name === undefined) return undefined;
	if (
		ts.isIdentifier(name) ||
		ts.isStringLiteral(name) ||
		ts.isNumericLiteral(name) ||
		ts.isNoSubstitutionTemplateLiteral(name)
	) {
		return name.text;
	}
	if (
		ts.isComputedPropertyName(name) &&
		(ts.isStringLiteral(name.expression) || ts.isNoSubstitutionTemplateLiteral(name.expression))
	) {
		return name.expression.text;
	}
	return undefined;
}

function namesExportedByList(sourceFile: ts.SourceFile): ReadonlySet<string> {
	const names = new Set<string>();
	for (const statement of sourceFile.statements) {
		if (
			ts.isExportDeclaration(statement) &&
			statement.moduleSpecifier === undefined &&
			statement.exportClause !== undefined &&
			ts.isNamedExports(statement.exportClause)
		) {
			for (const element of statement.exportClause.elements) names.add((element.propertyName ?? element.name).text);
		}
		if (ts.isExportAssignment(statement) && ts.isIdentifier(statement.expression)) names.add(statement.expression.text);
	}
	return names;
}

function unwrapExpression(expression: ts.Expression | undefined): ts.Expression | undefined {
	let current = expression;
	while (
		current !== undefined &&
		(ts.isParenthesizedExpression(current) ||
			ts.isAsExpression(current) ||
			ts.isSatisfiesExpression(current) ||
			ts.isTypeAssertionExpression(current))
	) {
		current = current.expression;
	}
	return current;
}

export function enumerateDeclarations(file: string, source: string): readonly Declaration[] {
	const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
	const listed = namesExportedByList(sourceFile);
	const found = new Map<string, Declaration>();
	const add = (path: readonly string[], exported: boolean): void => {
		const id = path.join('::');
		const prior = found.get(id);
		if (prior === undefined || (exported && !prior.exported)) found.set(id, { path, exported });
	};

	const typeMembers = (type: ts.TypeNode | undefined, path: readonly string[], exported: boolean): void => {
		if (type === undefined) return;
		if (ts.isParenthesizedTypeNode(type)) typeMembers(type.type, path, exported);
		else if (ts.isUnionTypeNode(type) || ts.isIntersectionTypeNode(type))
			for (const member of type.types) typeMembers(member, path, exported);
		else if (ts.isTypeLiteralNode(type)) signatures(type.members, path, exported);
	};

	const signatures = (members: ts.NodeArray<ts.TypeElement>, path: readonly string[], exported: boolean): void => {
		for (const member of members) {
			if (
				!ts.isPropertySignature(member) &&
				!ts.isMethodSignature(member) &&
				!ts.isGetAccessorDeclaration(member) &&
				!ts.isSetAccessorDeclaration(member)
			)
				continue;
			const name = nameOf(member.name);
			if (name === undefined) continue;
			const own = [...path, name];
			add(own, exported);
			if (ts.isPropertySignature(member)) typeMembers(member.type, own, exported);
		}
	};

	const classMembers = (node: ts.ClassLikeDeclaration, path: readonly string[], exported: boolean): void => {
		for (const member of node.members) {
			if (ts.isConstructorDeclaration(member)) {
				add([...path, 'constructor'], exported);
				for (const parameter of member.parameters) {
					const name = nameOf(parameter.name);
					const modifiers = ts.getModifiers(parameter) ?? [];
					if (name !== undefined && modifiers.length > 0 && !hasModifier(parameter, ts.SyntaxKind.PrivateKeyword))
						add([...path, name], exported);
				}
				continue;
			}
			if (
				!ts.isMethodDeclaration(member) &&
				!ts.isGetAccessorDeclaration(member) &&
				!ts.isSetAccessorDeclaration(member) &&
				!ts.isPropertyDeclaration(member)
			)
				continue;
			const name = nameOf(member.name);
			if (name === undefined || hasModifier(member, ts.SyntaxKind.PrivateKeyword)) continue;
			const own = [...path, name];
			add(own, exported);
			if (ts.isPropertyDeclaration(member)) typeMembers(member.type, own, exported);
		}
	};

	const objectMembers = (expression: ts.Expression | undefined, path: readonly string[], exported: boolean): void => {
		const literal = unwrapExpression(expression);
		if (literal === undefined || !ts.isObjectLiteralExpression(literal)) return;
		for (const property of literal.properties) {
			if (ts.isSpreadAssignment(property)) continue;
			const name = ts.isShorthandPropertyAssignment(property) ? property.name.text : nameOf(property.name);
			if (name === undefined) continue;
			const own = [...path, name];
			add(own, exported);
			if (ts.isPropertyAssignment(property)) objectMembers(property.initializer, own, exported);
		}
	};

	const visit = (statements: ts.NodeArray<ts.Statement>, prefix: readonly string[], isExported: ExportTest): void => {
		for (const statement of statements) {
			if (ts.isFunctionDeclaration(statement) && statement.name !== undefined) {
				add([...prefix, statement.name.text], isExported(statement, statement.name.text));
			} else if (ts.isClassDeclaration(statement) && statement.name !== undefined) {
				const path = [...prefix, statement.name.text];
				const exported = isExported(statement, statement.name.text);
				add(path, exported);
				classMembers(statement, path, exported);
			} else if (ts.isInterfaceDeclaration(statement)) {
				const path = [...prefix, statement.name.text];
				const exported = isExported(statement, statement.name.text);
				add(path, exported);
				signatures(statement.members, path, exported);
			} else if (ts.isTypeAliasDeclaration(statement)) {
				const path = [...prefix, statement.name.text];
				const exported = isExported(statement, statement.name.text);
				add(path, exported);
				typeMembers(statement.type, path, exported);
			} else if (ts.isEnumDeclaration(statement)) {
				const path = [...prefix, statement.name.text];
				const exported = isExported(statement, statement.name.text);
				add(path, exported);
				for (const member of statement.members) {
					const name = nameOf(member.name);
					if (name !== undefined) add([...path, name], exported);
				}
			} else if (ts.isVariableStatement(statement)) {
				const constant = (statement.declarationList.flags & ts.NodeFlags.Const) !== 0;
				for (const declaration of statement.declarationList.declarations) {
					if (!ts.isIdentifier(declaration.name)) continue;
					const path = [...prefix, declaration.name.text];
					const exported = isExported(statement, declaration.name.text);
					add(path, exported);
					if (constant) objectMembers(declaration.initializer, path, exported);
				}
			} else if (
				ts.isModuleDeclaration(statement) &&
				ts.isIdentifier(statement.name) &&
				statement.body !== undefined &&
				ts.isModuleBlock(statement.body)
			) {
				const path = [...prefix, statement.name.text];
				const exported = isExported(statement, statement.name.text);
				add(path, exported);
				visit(
					statement.body.statements,
					path,
					(node, name) => exported && hasModifier(node, ts.SyntaxKind.ExportKeyword) && name !== ''
				);
			}
		}
	};

	visit(sourceFile.statements, [], (node, name) => hasModifier(node, ts.SyntaxKind.ExportKeyword) || listed.has(name));
	return [...found.values()];
}

function isTestFile(path: string): boolean {
	return path.split('/').includes('__tests__') || /\.(test|spec)(-d)?\.ts$/.test(path);
}

function isGeneratedSource(source: string): boolean {
	return source.startsWith('// Auto-generated');
}

function walkTs(root: string, directory: string, out: string[]): void {
	for (const entry of readdirSync(join(root, directory))) {
		const relativePath = `${directory}${entry}`;
		if (statSync(join(root, relativePath)).isDirectory()) {
			if (entry !== 'node_modules' && entry !== 'dist') walkTs(root, `${relativePath}/`, out);
		} else if (entry.endsWith('.ts') && !entry.endsWith('.d.ts') && !isTestFile(relativePath)) {
			out.push(relativePath);
		}
	}
}

export function inGlossaryTrees(file: string): boolean {
	return file.endsWith('.ts') && GLOSSARY_TREES.some((tree) => file.startsWith(tree));
}

export function enumerateTrees(root: string): ReadonlyMap<string, readonly Declaration[]> {
	const files: string[] = [];
	for (const tree of GLOSSARY_TREES) if (existsSync(join(root, tree))) walkTs(root, tree, files);
	const byFile = new Map<string, readonly Declaration[]>();
	for (const file of files.sort()) {
		const source = readFileSync(join(root, file), 'utf8');
		if (!isGeneratedSource(source)) byFile.set(file, enumerateDeclarations(file, source));
	}
	return byFile;
}

export function readKeys(root: string): readonly GlossaryKey[] {
	const directory = join(root, GLOSSARY_DIR);
	if (!existsSync(directory)) return [];
	const keys: GlossaryKey[] = [];
	for (const entry of readdirSync(directory).sort()) {
		if (!entry.endsWith('.md') || entry === 'README.md') continue;
		let fence: string | undefined;
		readFileSync(join(directory, entry), 'utf8')
			.split('\n')
			.forEach((line, index) => {
				const opener = /^\s*(`{3,}|~{3,})/.exec(line)?.[1];
				if (opener !== undefined) {
					if (fence === undefined) fence = opener;
					else if (opener[0] === fence[0] && opener.length >= fence.length) fence = undefined;
					return;
				}
				if (fence !== undefined) return;
				const key = /^### `([^`]+)`/.exec(line)?.[1];
				if (key !== undefined && key.includes('::')) keys.push({ key, where: `${GLOSSARY_DIR}/${entry}:${index + 1}` });
			});
	}
	return keys;
}

function namesDeclaration(path: readonly string[], segments: readonly string[]): boolean {
	return segments.length === 1
		? path[path.length - 1] === segments[0]
		: path.length === segments.length && path.every((segment, index) => segment === segments[index]);
}

export interface Classification {
	readonly class: KeyClass;
	readonly resolved?: readonly string[];
}

export function classifyKey(
	key: string,
	root: string,
	declarations: ReadonlyMap<string, readonly Declaration[]>
): Classification {
	const split = key.indexOf('::');
	const file = key.slice(0, split);
	const qualifier = key.slice(split + 2);
	if (!inGlossaryTrees(file)) return { class: 'out-of-scope-file' };
	if (!existsSync(join(root, file))) return { class: 'file-missing' };
	const segments = qualifier.split('::');
	const name = segments[segments.length - 1]!;
	if (name === '<unknown>') return { class: 'placeholder' };
	if (qualifier.includes('.')) return { class: 'dot-separated' };
	const own = declarations.get(file) ?? [];
	const matches = own.filter((declaration) => namesDeclaration(declaration.path, segments));
	if (matches.length === 1)
		return { class: segments.length === 1 ? 'ok-bare-unique' : 'ok-owner-qualified', resolved: matches[0]!.path };
	if (matches.length > 1) return { class: 'ambiguous' };
	if (segments.length > 1 && own.some((declaration) => declaration.path[declaration.path.length - 1] === name))
		return { class: 'wrong-owner' };
	return { class: 'no-declaration' };
}

export interface Measurement {
	readonly counts: Readonly<Record<CountName, number>>;
	readonly valid: Readonly<Record<ValidClass, number>>;
	readonly keys: readonly ClassifiedKey[];
	readonly undocumented: readonly string[];
	readonly headings: number;
	readonly exported: number;
}

export function measure(root: string): Measurement {
	const declarations = enumerateTrees(root);
	const keys: ClassifiedKey[] = [];
	const resolved = new Set<string>();
	for (const { key, where } of readKeys(root)) {
		const result = classifyKey(key, root, declarations);
		keys.push({ key, where, class: result.class });
		if (result.resolved !== undefined)
			resolved.add(`${key.slice(0, key.indexOf('::'))}::${result.resolved.join('::')}`);
	}
	const undocumented: string[] = [];
	let exported = 0;
	for (const [file, own] of declarations) {
		for (const declaration of own) {
			if (!declaration.exported) continue;
			exported += 1;
			const id = `${file}::${declaration.path.join('::')}`;
			if (!resolved.has(id)) undocumented.push(id);
		}
	}
	const tally = (names: readonly KeyClass[]): Record<string, number> =>
		Object.fromEntries(names.map((name) => [name, keys.filter((entry) => entry.class === name).length]));
	return {
		counts: { ...tally(BROKEN_CLASSES), undocumented: undocumented.length } as Record<CountName, number>,
		valid: tally(VALID_CLASSES) as Record<ValidClass, number>,
		keys,
		undocumented,
		headings: keys.length,
		exported
	};
}

export type Ceilings = Readonly<Partial<Record<CountName, number>>>;

export interface Regression {
	readonly name: CountName;
	readonly count: number;
	readonly ceiling: number | undefined;
}

export function compareWithCeilings(
	counts: Readonly<Record<CountName, number>>,
	ceilings: Ceilings
): readonly Regression[] {
	return COUNT_NAMES.flatMap((name) => {
		const ceiling = ceilings[name];
		return ceiling === undefined || counts[name] > ceiling ? [{ name, count: counts[name], ceiling }] : [];
	});
}

export function loweredCeilings(
	counts: Readonly<Record<CountName, number>>,
	ceilings: Ceilings
): Record<CountName, number> {
	return Object.fromEntries(
		COUNT_NAMES.map((name) => [
			name,
			ceilings[name] === undefined ? counts[name] : Math.min(ceilings[name]!, counts[name])
		])
	) as Record<CountName, number>;
}

export interface GlossaryKeysOptions {
	update?: boolean;
	table?: boolean;
	undocumented?: boolean;
	json?: boolean;
	ceilings?: string;
	root?: string;
}

export async function run(opts: GlossaryKeysOptions = {}): Promise<number> {
	const root = resolve(opts.root ?? process.cwd());
	const ceilingsPath = resolve(root, opts.ceilings ?? DEFAULT_CEILINGS);
	const measurement = measure(root);
	const existing: Ceilings = existsSync(ceilingsPath)
		? (JSON.parse(readFileSync(ceilingsPath, 'utf8')) as Ceilings)
		: {};

	if (opts.update) {
		const lowered = loweredCeilings(measurement.counts, existing);
		writeFileSync(ceilingsPath, `${JSON.stringify(lowered, null, '\t')}\n`, 'utf8');
		console.log(`glossary-keys: ceilings written to ${relative(root, ceilingsPath)}`);
	} else if (!existsSync(ceilingsPath)) {
		console.error(`glossary-keys: no ceilings at ${relative(root, ceilingsPath)} — run with --update to create them`);
		return 1;
	}

	const ceilings: Ceilings = opts.update ? loweredCeilings(measurement.counts, existing) : existing;
	const regressions = compareWithCeilings(measurement.counts, ceilings);

	if (opts.json) {
		console.log(
			JSON.stringify({ counts: measurement.counts, valid: measurement.valid, ceilings, regressions }, null, 1)
		);
	} else {
		console.log(`glossary-keys — ${measurement.headings} keys, ${measurement.exported} exported declarations`);
		for (const name of VALID_CLASSES) console.log(`${name}\t${measurement.valid[name]}`);
		console.log('class\tcount\tceiling');
		for (const name of COUNT_NAMES) console.log(`${name}\t${measurement.counts[name]}\t${ceilings[name] ?? '-'}`);
		if (opts.table) {
			console.log('');
			for (const entry of measurement.keys)
				if (entry.class !== 'ok-bare-unique' && entry.class !== 'ok-owner-qualified')
					console.log(`${entry.class}\t${entry.key}\t${entry.where}`);
		}
		if (opts.undocumented) {
			console.log('');
			for (const id of measurement.undocumented) console.log(`undocumented\t${id}`);
		}
	}

	if (regressions.length > 0) {
		console.error('');
		for (const entry of regressions) {
			console.error(
				entry.ceiling === undefined
					? `RATCHET-REGRESSION: ${entry.name} has no ceiling (${entry.count}) — run with --update to create them`
					: `RATCHET-REGRESSION: ${entry.name} ${entry.count} > ceiling ${entry.ceiling} — a count may only fall; repair the keys or document the declarations, never raise the ceiling`
			);
		}
		return 1;
	}
	if (!opts.json) console.log('glossary-keys: ratchet OK (no count exceeds its ceiling)');
	return 0;
}
