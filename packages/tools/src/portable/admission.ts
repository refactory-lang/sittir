import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript6';
import { REPO_ROOT } from '@sittir/codegen/grammars';
import { bindingGrammars } from '@sittir/codegen/bindings';
import { PORTABLE_MAP_FILE, grammarMapName, rawGroupOf, type ExactSet } from '@sittir/codegen';
import { portableTypedPath, writeTypedModule } from './conformance.ts';

export interface AdmissionMember {
	readonly grammar: string;
	readonly path: string;
	readonly member: string;
	readonly excess: readonly string[];
}

export interface AdmissionRaw {
	readonly grammar: string;
	readonly kind: number;
	readonly value: number;
}

export interface AdmissionReport {
	readonly untyped: readonly string[];
	readonly members: readonly AdmissionMember[];
	readonly raw: readonly AdmissionRaw[];
}

export const excessOf = (admitted: ReadonlySet<string>, exact: Pick<ExactSet, 'kinds'>): readonly string[] => {
	const held = new Set(exact.kinds);
	return [...admitted].filter((kind) => !held.has(kind)).sort();
};

const VOCABULARY_DIR = join(REPO_ROOT, 'packages/types/src/vocabulary');

const COMPILER_OPTIONS: ts.CompilerOptions = {
	strict: true,
	noEmit: true,
	allowImportingTsExtensions: true,
	target: ts.ScriptTarget.ESNext,
	module: ts.ModuleKind.ESNext,
	moduleResolution: ts.ModuleResolutionKind.Bundler,
	skipLibCheck: true
};

function typeAliases(file: string, map: string, aliases: readonly string[]): ReadonlyMap<number, Set<string>> {
	const census = join(file, '..', '__members.ts');
	const text = `import type * as V from '../../types/src/vocabulary/index.ts';\nimport type { ${map} } from '../src/${PORTABLE_MAP_FILE}';\n${aliases.map((alias, i) => `export type A${i} = ${alias};`).join('\n')}\n`;
	const host = ts.createCompilerHost(COMPILER_OPTIONS);
	const getSourceFile = host.getSourceFile.bind(host);
	const fileExists = host.fileExists.bind(host);
	host.getSourceFile = (at, version) => (at === census ? ts.createSourceFile(at, text, version) : getSourceFile(at, version));
	host.fileExists = (at) => at === census || fileExists(at);
	const program = ts.createProgram([census], COMPILER_OPTIONS, host);
	const checker = program.getTypeChecker();
	const out = new Map<number, Set<string>>();
	for (const alias of program.getSourceFile(census)!.statements.filter(ts.isTypeAliasDeclaration))
		out.set(Number(alias.name.text.slice(1)), kindsOf(checker, checker.getTypeAtLocation(alias.name), new Set()));
	return out;
}

const vocabularyFiles = (dir: string): string[] =>
	readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) return vocabularyFiles(path);
		return path.endsWith('.ts') && entry.name !== 'augment.ts' ? [path] : [];
	});

function untypedSlots(): string[] {
	const out: string[] = [];
	for (const file of vocabularyFiles(VOCABULARY_DIR)) {
		const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.ESNext, true);
		const visit = (node: ts.Node): void => {
			if (ts.isTypeReferenceNode(node) && node.typeName.getText() === 'Slot' && node.typeArguments?.length === 4) {
				const [, path, member, fallback] = node.typeArguments;
				const arms = ts.isUnionTypeNode(fallback!) ? fallback.types : [fallback!];
				if (arms.some((arm) => arm.kind === ts.SyntaxKind.UnknownKeyword)) out.push(`${relative(REPO_ROOT, file)}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1} ${path!.getText().slice(1, -1)}.${member!.getText().slice(1, -1)}`);
			}
			ts.forEachChild(node, visit);
		};
		visit(source);
	}
	return [...new Set(out)].sort();
}

function kindsOf(checker: ts.TypeChecker, type: ts.Type, out: Set<string>): Set<string> {
	if (type.isUnion()) for (const t of type.types) kindsOf(checker, t, out);
	else if (checker.isArrayType(type) || checker.isTupleType(type))
		for (const t of checker.getTypeArguments(type as ts.TypeReference)) kindsOf(checker, t, out);
	else {
		const kind = type.getProperty('$kind');
		if (kind !== undefined) {
			const value = checker.getNonNullableType(checker.getTypeOfSymbol(kind));
			for (const t of value.isUnion() ? value.types : [value]) if (t.isStringLiteral()) out.add(t.value);
		}
	}
	return out;
}

const nameOf = (name: ts.PropertyName, source: ts.SourceFile): string => (ts.isStringLiteral(name) ? name.text : name.getText(source));

export async function portableAdmission(grammars: readonly string[] = bindingGrammars()): Promise<AdmissionReport> {
	const members: AdmissionMember[] = [];
	const raw: AdmissionRaw[] = [];
	for (const grammar of grammars) {
		const typed = await writeTypedModule(grammar);
		if (typed === undefined) continue;
		const file = portableTypedPath(grammar);
		const map = grammarMapName(grammar);
		const program = ts.createProgram([file], COMPILER_OPTIONS);
		const source = program.getSourceFile(file)!;
		const qnames = new Map<string, string>();
		const view = new RegExp(`^ViewForm<V\\.([\\w.]+)<${map}>>`);
		for (const statement of source.statements)
			if (ts.isInterfaceDeclaration(statement) && statement.name.text === 'VocabViews')
				for (const member of statement.members) {
					const qname = ts.isPropertySignature(member) ? view.exec(member.type?.getText(source) ?? '')?.[1] : undefined;
					if (ts.isPropertySignature(member) && qname !== undefined) qnames.set(nameOf(member.name, source), qname);
				}
		const pairs = [...typed.exact].flatMap(([path, at]) => (qnames.has(path) ? [...at].map(([member, set]) => ({ path, member, set })) : []));
		const admittedBy = typeAliases(file, map, pairs.map(({ path, member }) => `V.${qnames.get(path)!}<${map}>['${member}']`));
		pairs.forEach(({ path, member, set }, i) => {
			const excess = excessOf(admittedBy.get(i) ?? new Set(), set);
			if (excess.length > 0) members.push({ grammar, path, member, excess });
		});
		const groups = { kind: 0, value: 0 };
		for (const [, at] of typed.exact) for (const [, set] of at) for (const arm of set.raw) groups[rawGroupOf(arm.reasons)]++;
		raw.push({ grammar, ...groups });
	}
	return { untyped: untypedSlots(), members, raw };
}

export function formatAdmission(report: AdmissionReport): string {
	const lines = [`${report.untyped.length} member defaults admit unknown`];
	for (const site of report.untyped) lines.push(`  ${site}`);
	for (const grammar of new Set(report.raw.map((r) => r.grammar))) {
		const over = report.members.filter((m) => m.grammar === grammar);
		const raw = report.raw.find((r) => r.grammar === grammar)!;
		lines.push(`${grammar}: ${over.length} members admit a kind outside their exact set; raw-node arms ${raw.kind} per kind, ${raw.value} per value`);
		for (const m of over) lines.push(`  ${m.path}.${m.member}: ${m.excess.join(' ')}`);
	}
	return lines.join('\n');
}

export interface PortableAdmissionOptions {
	readonly grammars?: readonly string[];
}

export async function run(options: PortableAdmissionOptions = {}): Promise<number> {
	process.stdout.write(`${formatAdmission(await portableAdmission(options.grammars))}\n`);
	return 0;
}
