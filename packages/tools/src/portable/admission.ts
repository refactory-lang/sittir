import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript6';
import { REPO_ROOT } from '@sittir/codegen/grammars';
import { bindingGrammars } from '@sittir/codegen/bindings';
import { rawGroupOf, type ExactSet } from '@sittir/codegen';
import { portableTypedPath, writeTypedModule } from './conformance.ts';

export interface AdmissionSite {
	readonly site: string;
	readonly grammars: readonly string[];
	readonly members: readonly string[];
	readonly excess: readonly string[];
}

export interface AdmissionOwnSlot {
	readonly grammar: string;
	readonly member: string;
	readonly excess: readonly string[];
}

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
	readonly sites: number;
	readonly roleArmed: number;
	readonly untyped: readonly string[];
	readonly overAdmitting: readonly AdmissionSite[];
	readonly ownSlots: readonly AdmissionOwnSlot[];
	readonly members: readonly AdmissionMember[];
	readonly raw: readonly AdmissionRaw[];
}

export const excessOf = (admitted: ReadonlySet<string>, exact: Pick<ExactSet, 'kinds'>): readonly string[] => {
	const held = new Set(exact.kinds);
	return [...admitted].filter((kind) => !held.has(kind)).sort();
};

function typeAliases(file: string, name: string, aliases: readonly string[]): ReadonlyMap<number, Set<string>> {
	const census = join(file, '..', name);
	const text = `import type * as V from '../../types/src/vocabulary/index.ts';\nimport type { Ctx } from './portable.typed.ts';\n${aliases.map((alias, i) => `export type A${i} = ${alias};`).join('\n')}\n`;
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

interface Declared {
	readonly node: ts.TypeNode;
	readonly site: string;
	readonly owner: string;
}

interface Arm {
	readonly kind: 'vocab' | 'role' | 'other';
	readonly text: string;
}

interface Row {
	readonly path: string;
	readonly member: string;
	readonly declared: Declared | undefined;
	readonly yields: Map<string, Set<string>>;
}

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

const vocabularyFiles = (dir: string): string[] =>
	readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) return vocabularyFiles(path);
		return path.endsWith('.ts') && entry.name !== 'augment.ts' ? [path] : [];
	});

const nameOf = (name: ts.PropertyName): string => (ts.isStringLiteral(name) ? name.text : name.getText());

function readDeclarations(): {
	readonly members: ReadonlyMap<string, { readonly parents: string[]; readonly members: Map<string, Declared> }>;
	readonly slots: ReadonlyMap<string, Declared>;
} {
	const members = new Map<string, { parents: string[]; members: Map<string, Declared> }>();
	const slots = new Map<string, Declared>();
	for (const file of vocabularyFiles(VOCABULARY_DIR)) {
		const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.ESNext, true);
		const siteOf = (node: ts.Node): string =>
			`${relative(REPO_ROOT, file)}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1}`;
		const visit = (node: ts.Node, namespace: readonly string[]): void => {
			if (ts.isModuleDeclaration(node) && node.body !== undefined && ts.isModuleBlock(node.body)) {
				for (const statement of node.body.statements) visit(statement, [...namespace, node.name.getText()]);
				return;
			}
			if (!ts.isInterfaceDeclaration(node)) return;
			const qname = [...namespace, node.name.text].join('.');
			const entry = members.get(qname) ?? members.set(qname, { parents: [], members: new Map() }).get(qname)!;
			for (const clause of node.heritageClauses ?? []) {
				const collect = (n: ts.Node): void => {
					const match = /^V\.([\w.]+)</.exec(n.getText());
					if (ts.isTypeReferenceNode(n) && match !== null) entry.parents.push(match[1]!);
					ts.forEachChild(n, collect);
				};
				collect(clause);
			}
			for (const member of node.members) {
				if (!ts.isPropertySignature(member) || member.type === undefined) continue;
				const name = nameOf(member.name);
				if (!entry.members.has(name))
					entry.members.set(name, { node: member.type, site: siteOf(member), owner: qname });
				if (qname !== 'GrammarContext' || name !== 'slots') continue;
				const find = (n: ts.Node): ts.TypeLiteralNode | undefined =>
					ts.isTypeLiteralNode(n) ? n : ts.forEachChild(n, find);
				for (const path of find(member.type)?.members ?? []) {
					if (!ts.isPropertySignature(path) || path.type === undefined || !ts.isTypeLiteralNode(path.type)) continue;
					for (const slot of path.type.members)
						if (ts.isPropertySignature(slot) && slot.type !== undefined)
							slots.set(`${nameOf(path.name)}#${nameOf(slot.name)}`, {
								node: slot.type,
								site: siteOf(slot),
								owner: qname
							});
				}
			}
		};
		for (const statement of source.statements) visit(statement, []);
	}
	return { members, slots };
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

const SLOT_REF = /^G\['slots'\]\['([^']+)'\]\['(\w+)'\]$/;
const ROLE_REF = /^G\['(\w+)'\]$/;
const VOCAB_REF = /^V\.[\w.]+<G>$/;

function armsOf(node: ts.TypeNode, slots: ReadonlyMap<string, Declared>): Arm[] {
	const out: Arm[] = [];
	const visit = (n: ts.TypeNode): void => {
		if (ts.isParenthesizedTypeNode(n)) return visit(n.type);
		if (ts.isUnionTypeNode(n)) return n.types.forEach(visit);
		if (ts.isArrayTypeNode(n)) return visit(n.elementType);
		const text = n.getText();
		const slot = SLOT_REF.exec(text);
		if (slot !== null) {
			const declared = slots.get(`${slot[1]}#${slot[2]}`);
			return declared === undefined ? void out.push({ kind: 'other', text }) : visit(declared.node);
		}
		const role = ROLE_REF.exec(text);
		if (role !== null) return void out.push({ kind: 'role', text: role[1]! });
		if (ts.isTypeReferenceNode(n) && /^(gate\.)?RequiredBy</.test(text) && n.typeArguments !== undefined)
			return visit(n.typeArguments[0]!);
		out.push(VOCAB_REF.test(text) ? { kind: 'vocab', text: text.slice(0, -'<G>'.length) } : { kind: 'other', text });
	};
	visit(node);
	return out;
}

function readsUnder(yields: ReadonlyMap<string, ReadonlySet<string>>, path: string, member: string): ReadonlySet<string> | undefined {
	const under = [...yields].filter(([key]) => {
		const [at, name] = key.split('#');
		return name === member && (at === path || at!.startsWith(`${path}.`));
	});
	return under.length === 0 ? undefined : new Set(under.flatMap(([, kinds]) => [...kinds]));
}

const vocabViewName = (type: ts.TypeNode | undefined): string | undefined =>
	/VocabViews\[['"]([^'"]+)['"]\]/.exec(type?.getText() ?? '')?.[1];

export async function portableAdmission(grammars: readonly string[] = bindingGrammars()): Promise<AdmissionReport> {
	const { members, slots } = readDeclarations();
	const ancestors = (qname: string, seen = new Set<string>()): Set<string> => {
		if (seen.has(qname)) return seen;
		seen.add(qname);
		for (const parent of members.get(qname)?.parents ?? []) ancestors(parent, seen);
		return seen;
	};
	const declaredAt = (qname: string, member: string, seen = new Set<string>()): Declared | undefined => {
		if (seen.has(qname)) return undefined;
		seen.add(qname);
		const entry = members.get(qname);
		const own = entry?.members.get(member);
		if (own !== undefined) return own;
		for (const parent of entry?.parents ?? []) {
			const found = declaredAt(parent, member, seen);
			if (found !== undefined) return found;
		}
		return undefined;
	};
	const rows = new Map<string, Row>();
	const ownSlots: AdmissionOwnSlot[] = [];
	const overMembers: AdmissionMember[] = [];
	const raw: AdmissionRaw[] = [];
	const arms = new Set<string>();
	const typedFiles = new Map<string, string>();
	const declaredNodes = [...[...members.values()].flatMap((entry) => [...entry.members.values()]), ...slots.values()].map((declared) => declared.node);
	const roles = [...new Set(declaredNodes.flatMap((node) => armsOf(node, slots)).filter((arm) => arm.kind === 'role').map((arm) => arm.text))].sort();
	const roleAdmitted = new Map<string, Set<string>>();
	for (const grammar of grammars) {
		const typed = await writeTypedModule(grammar);
		if (typed === undefined) continue;
		const file = portableTypedPath(grammar);
		typedFiles.set(grammar, file);
		const program = ts.createProgram([file], COMPILER_OPTIONS);
		const checker = program.getTypeChecker();
		const source = program.getSourceFile(file)!;
		const qnames = new Map<string, string>();
		const factories = new Map<string, string>();
		const yields = new Map<string, Set<string>>();
		for (const statement of source.statements) {
			if (ts.isInterfaceDeclaration(statement) && statement.name.text === 'VocabViews')
				for (const view of statement.members) {
					const qname = /^ViewForm<V\.([\w.]+)<Ctx>>$/.exec(
						ts.isPropertySignature(view) ? (view.type?.getText() ?? '') : ''
					)?.[1];
					if (ts.isPropertySignature(view) && qname !== undefined) qnames.set(nameOf(view.name), qname);
				}
			if (ts.isFunctionDeclaration(statement) && statement.name !== undefined) {
				const path = vocabViewName(statement.type);
				if (path !== undefined) factories.set(statement.name.text, path);
			}
		}
		for (const statement of source.statements) {
			if (!ts.isFunctionDeclaration(statement) || statement.name === undefined) continue;
			const [factory, member] = statement.name.text.split('$');
			const path = factory === undefined ? undefined : factories.get(factory);
			if (path === undefined || member === undefined) continue;
			const key = `${path}#${member}`;
			const row = rows.get(key) ?? rows.set(key, { path, member, declared: undefined, yields: new Map() }).get(key)!;
			const at = row.yields.get(grammar) ?? row.yields.set(grammar, new Set()).get(grammar)!;
			kindsOf(checker, checker.getReturnTypeOfSignature(checker.getSignatureFromDeclaration(statement)!), at);
			yields.set(key, at);
		}
		for (const [key, row] of rows)
			if (row.declared === undefined && qnames.has(row.path))
				rows.set(key, { ...row, declared: declaredAt(qnames.get(row.path)!, row.member) });
		const own = source.statements.find(
			(s): s is ts.InterfaceDeclaration => ts.isInterfaceDeclaration(s) && s.name.text === 'OwnSlots'
		);
		for (const path of own?.members ?? []) {
			if (!ts.isPropertySignature(path) || path.type === undefined || !ts.isTypeLiteralNode(path.type)) continue;
			for (const slot of path.type.members) {
				if (!ts.isPropertySignature(slot) || slot.type === undefined) continue;
				const held = new Set<string>();
				const visit = (n: ts.TypeNode): void => {
					if (ts.isParenthesizedTypeNode(n)) return visit(n.type);
					if (ts.isUnionTypeNode(n)) return n.types.forEach(visit);
					if (ts.isArrayTypeNode(n)) return visit(n.elementType);
					if (!n.getText().startsWith('Ctx[')) kindsOf(checker, checker.getTypeFromTypeNode(n), held);
				};
				visit(slot.type);
				const read = readsUnder(yields, nameOf(path.name), nameOf(slot.name));
				if (read === undefined) continue;
				const excess = [...held].filter((kind) => !read.has(kind)).sort();
				if (excess.length > 0) ownSlots.push({ grammar, member: `${nameOf(path.name)}.${nameOf(slot.name)}`, excess });
			}
		}
		const pairs = [...typed.exact].flatMap(([path, at]) => (qnames.has(path) ? [...at].map(([member, set]) => ({ path, member, set })) : []));
		const admittedBy = typeAliases(file, '__members.ts', [
			...pairs.map(({ path, member }) => `V.${qnames.get(path)!}<Ctx>['${member}']`),
			...roles.map((role) => `Ctx['${role}']`)
		]);
		pairs.forEach(({ path, member, set }, i) => {
			const excess = excessOf(admittedBy.get(i) ?? new Set(), set);
			if (excess.length > 0) overMembers.push({ grammar, path, member, excess });
		});
		roles.forEach((role, i) => {
			const at = roleAdmitted.get(role) ?? roleAdmitted.set(role, new Set()).get(role)!;
			for (const kind of admittedBy.get(pairs.length + i) ?? []) at.add(kind);
		});
		const groups = { kind: 0, value: 0 };
		for (const [, at] of typed.exact) for (const [, set] of at) for (const arm of set.raw) groups[rawGroupOf(arm.reasons)]++;
		raw.push({ grammar, ...groups });
	}
	for (const row of rows.values())
		for (const arm of row.declared === undefined ? [] : armsOf(row.declared.node, slots))
			if (arm.kind === 'vocab') arms.add(arm.text);
	const admitted = new Map<string, Set<string>>();
	const [, file] = [...typedFiles][0] ?? [];
	if (file !== undefined) {
		const list = [...arms];
		for (const [i, kinds] of typeAliases(file, '__admission.ts', list.map((arm) => `${arm}<Ctx>`))) admitted.set(list[i]!, kinds);
	}
	const sites = new Map<string, { declared: Declared; rows: Row[] }>();
	for (const row of rows.values()) {
		if (row.declared === undefined) continue;
		const slot = SLOT_REF.exec(row.declared.node.getText().replace(/\[\]$/, ''));
		const site = (slot === null ? undefined : slots.get(`${slot[1]}#${slot[2]}`)?.site) ?? row.declared.site;
		(sites.get(site) ?? sites.set(site, { declared: row.declared, rows: [] }).get(site)!).rows.push(row);
	}
	const overAdmitting: AdmissionSite[] = [];
	const untyped: string[] = [];
	let roleArmed = 0;
	for (const [site, { declared, rows: at }] of [...sites].sort(([a], [b]) => a.localeCompare(b))) {
		const siteArms = armsOf(declared.node, slots);
		const siteRoles = siteArms.filter((arm) => arm.kind === 'role');
		if (siteRoles.length > 0) roleArmed++;
		if (siteArms.some((arm) => arm.kind === 'other' && arm.text === 'unknown')) untyped.push(site);
		const read = new Set(at.flatMap((row) => [...row.yields.values()].flatMap((set) => [...set])));
		for (const own of at)
			for (const row of rows.values())
				if (
					row.declared !== undefined &&
					row.member === own.member &&
					row.declared.owner !== own.declared!.owner &&
					ancestors(row.declared.owner).has(own.declared!.owner)
				)
					for (const set of row.yields.values()) for (const kind of set) read.add(kind);
		const excess = [
			...new Set([
				...siteArms.filter((arm) => arm.kind === 'vocab').flatMap((arm) => [...(admitted.get(arm.text) ?? [])]),
				...siteRoles.flatMap((arm) => [...(roleAdmitted.get(arm.text) ?? [])])
			])
		]
			.filter((kind) => !read.has(kind))
			.sort();
		if (excess.length > 0)
			overAdmitting.push({
				site,
				grammars: [...new Set(at.flatMap((row) => [...row.yields.keys()]))].sort(),
				members: at.map((row) => `${row.path}.${row.member}`).sort(),
				excess
			});
	}
	return { sites: sites.size, roleArmed, untyped, overAdmitting, ownSlots, members: overMembers, raw };
}

export function formatAdmission(report: AdmissionReport): string {
	const lines = [
		`${report.sites} read sites, ${report.roleArmed} role-armed; ${report.overAdmitting.length} admit a kind no read gives`
	];
	for (const site of report.overAdmitting)
		lines.push(
			`  ${site.site} [${site.grammars.join(',')}] ${site.members[0]}${site.members.length > 1 ? ` +${site.members.length - 1}` : ''}: ${site.excess.join(' ')}`
		);
	lines.push(`${report.untyped.length} read sites admit unknown`);
	for (const site of report.untyped) lines.push(`  ${site}`);
	lines.push(`${report.ownSlots.length} own slots hold a kind their reads never give`);
	for (const slot of report.ownSlots) lines.push(`  ${slot.grammar} ${slot.member}: ${slot.excess.join(' ')}`);
	for (const grammar of [...new Set(report.raw.map((r) => r.grammar))]) {
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
