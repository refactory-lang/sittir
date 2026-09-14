import { ir, TSKindId, Delimiter, createEngine } from '@sittir/typescript';
import type {
	PrimaryType,
	Statement as TsStatement,
	TemplateChars,
	TemplateType,
	Type,
	NestedTypeIdentifier,
	Identifier,
	PropertySignature
} from '@sittir/typescript';
import { type Derivation, type MemberFacts, camel, childrenOf, commonPrefix, levelMembers, tsname } from './derive.ts';

export type TypeExpr =
	| { readonly k: 'ident'; readonly name: string }
	| { readonly k: 'ref'; readonly path: readonly string[]; readonly generic: boolean }
	| { readonly k: 'lookup'; readonly ns: string }
	| { readonly k: 'unmapped'; readonly name: string }
	| { readonly k: 'lit'; readonly text: string }
	| { readonly k: 'kw'; readonly name: 'string' | 'boolean' | 'number' | 'unknown' | 'never' }
	| { readonly k: 'array'; readonly of: TypeExpr }
	| { readonly k: 'union'; readonly of: readonly TypeExpr[] }
	| { readonly k: 'template'; readonly text: string };

export interface Member {
	readonly name: string;
	readonly optional: boolean;
	readonly type: TypeExpr;
	readonly trailing: readonly string[];
}

export interface Interface {
	readonly k: 'interface';
	readonly name: string;
	readonly extendsType: TypeExpr | null;
	readonly members: readonly Member[];
	readonly bodyLeading: readonly string[];
	readonly trailing: readonly string[];
	readonly generic: boolean;
	readonly keyParam: boolean;
	readonly leading: readonly string[];
}

export interface TypeAlias {
	readonly k: 'alias';
	readonly name: string;
	readonly value: TypeExpr;
}

export interface Namespace {
	readonly k: 'namespace';
	readonly name: string;
	readonly statements: readonly Statement[];
}

export type Statement = Interface | TypeAlias | Namespace;

export interface VocabularyFile {
	readonly name: string;
	readonly leading: readonly string[];
	readonly imports: readonly {
		readonly names: readonly string[] | null;
		readonly namespace: string | null;
		readonly from: string;
	}[];
	readonly statements: readonly Statement[];
}

const CONTAINER_ELEMENTS: Record<string, TypeExpr> = {
	parameters: { k: 'array', of: { k: 'ref', path: ['Declaration', 'Parameter'], generic: true } },
	formal_parameters: { k: 'array', of: { k: 'ref', path: ['Declaration', 'Parameter'], generic: true } },
	lambda_parameters: { k: 'array', of: { k: 'ref', path: ['Declaration', 'Parameter'], generic: true } },
	closure_parameters: { k: 'array', of: { k: 'ref', path: ['Declaration', 'Parameter'], generic: true } },
	type_parameters: { k: 'array', of: { k: 'ref', path: ['Declaration', 'TypeParameter'], generic: true } },
	type_arguments: { k: 'array', of: { k: 'lookup', ns: 'type' } },
	arguments: {
		k: 'array',
		of: {
			k: 'union',
			of: [
				{ k: 'lookup', ns: 'expression' },
				{ k: 'lookup', ns: 'element' }
			]
		}
	},
	argument_list: {
		k: 'array',
		of: {
			k: 'union',
			of: [
				{ k: 'lookup', ns: 'expression' },
				{ k: 'lookup', ns: 'element' },
				{ k: 'lookup', ns: 'argument' }
			]
		}
	},
	class_body: { k: 'array', of: { k: 'lookup', ns: 'declaration' } },
	declaration_list: { k: 'array', of: { k: 'lookup', ns: 'declaration' } },
	enum_body: { k: 'array', of: { k: 'ref', path: ['Declaration', 'EnumMember'], generic: true } },
	enum_variant_list: { k: 'array', of: { k: 'ref', path: ['Declaration', 'EnumMember'], generic: true } },
	field_declaration_list: { k: 'array', of: { k: 'ref', path: ['Declaration', 'Field'], generic: true } },
	suite_block: { k: 'ref', path: ['Statement', 'Block'], generic: true },
	simple_statements: { k: 'ref', path: ['Statement', 'Block'], generic: true },
	block: { k: 'ref', path: ['Statement', 'Block'], generic: true },
	type_annotation: { k: 'lookup', ns: 'type' },
	type_predicate_annotation: { k: 'ref', path: ['Type', 'Predicate'], generic: true },
	asserts_annotation: { k: 'ref', path: ['Type', 'Predicate', 'Asserts'], generic: true },
	omitting_type_annotation: { k: 'lookup', ns: 'type' },
	adding_type_annotation: { k: 'lookup', ns: 'type' },
	opting_type_annotation: { k: 'lookup', ns: 'type' },
	decorated_definition: { k: 'lookup', ns: 'declaration' },
	ambient_declaration: { k: 'lookup', ns: 'declaration' },
	labeled_statement: { k: 'lookup', ns: 'statement' },
	class_heritage: {
		k: 'array',
		of: {
			k: 'union',
			of: [
				{ k: 'lookup', ns: 'type' },
				{ k: 'lookup', ns: 'expression' }
			]
		}
	},
	switch_body: { k: 'array', of: { k: 'ref', path: ['Clause', 'Case'], generic: true } }
};

const LAYOUT = new Set([
	'terminator',
	'automaticSemicolon',
	'separator',
	'stringStart',
	'stringEnd',
	'stringOpen',
	'stringClose',
	'newline',
	'hashBangLine',
	'shebang'
]);

const refOf = (path: string): TypeExpr => ({ k: 'ref', path: path.split('.').map(tsname), generic: true });
const setOf = (path: string): TypeExpr => ({
	k: 'ref',
	path: [...path.split('.').map(tsname), 'Kinds'],
	generic: true
});

function typeOfMember(
	d: Derivation,
	kinds: ReadonlySet<string>
): { readonly type: TypeExpr; readonly dropped: readonly string[] } {
	const byns = new Map<string, Set<string>>();
	for (const k of kinds) {
		if (k.includes('.') && !k.startsWith('text:') && !k.startsWith('literal:') && !k.startsWith('<')) {
			const ns = k.split('.')[0] ?? k;
			(byns.get(ns) ?? byns.set(ns, new Set()).get(ns))?.add(k);
		}
	}
	const remaining = new Set(kinds);
	const all = new Set([...d.allvocab, ...d.prefixes]);
	for (const [ns, ks] of byns) {
		if (remaining.has(ns)) {
			for (const k of ks) remaining.delete(k);
			continue;
		}
		if (ks.size < 2) continue;
		const prefix = commonPrefix([...ks].sort()) ?? ns;
		if (prefix === ns) {
			for (const k of ks) remaining.delete(k);
			remaining.add(ns);
		} else if ([...all].some((o) => o.startsWith(`${prefix}.`))) {
			for (const k of ks) remaining.delete(k);
			remaining.add(`set:${prefix}`);
		}
	}
	const out: TypeExpr[] = [];
	const dropped: string[] = [];
	const seen = new Set<string>();
	const add = (_key: string, t: TypeExpr): void => {
		const key = JSON.stringify(t);
		if (seen.has(key)) return;
		seen.add(key);
		out.push(t);
	};
	for (const k of [...remaining].sort()) {
		if (k === 'boolean' || k === 'string' || k === 'number') add(k, { k: 'kw', name: k });
		else if (k.startsWith('text:')) add(k, { k: 'lit', text: k.slice(5) });
		else if (k.startsWith('literal:')) dropped.push(k);
		else if (k.startsWith('<')) {
			const gk = k.slice(1, -1).split(':', 2)[1] ?? '';
			const container = CONTAINER_ELEMENTS[gk];
			if (container) add(gk, container);
			else {
				add(k, { k: 'unmapped', name: k.slice(1, -1) });
				dropped.push(k);
			}
		} else if (k.startsWith('set:')) add(k, setOf(k.slice(4)));
		else if (!k.includes('.')) add(k, { k: 'lookup', ns: k });
		else add(k, refOf(k));
	}
	if (out.length === 0) return { type: { k: 'kw', name: 'unknown' }, dropped };
	const first = out[0];
	return { type: out.length === 1 && first ? first : { k: 'union', of: out }, dropped };
}

const grammarTag = (gs: ReadonlySet<string> | undefined): string =>
	[...(gs ?? [])]
		.map((g) => g.charAt(0))
		.sort()
		.join('');

function memberDecl(d: Derivation, v: string, name: string, f: MemberFacts): Member {
	const { type, dropped } = typeOfMember(d, f.kinds);
	let t: TypeExpr = type;
	if (f.multiple && t.k !== 'array') {
		const arr: TypeExpr = { k: 'array', of: t };
		t = f.scalar ? { k: 'union', of: [t, arr] } : arr;
	}
	const trailing: string[] = [];
	const claimers = d.claimers.get(v);
	if (claimers === undefined || [...f.grammars].sort().join() !== [...claimers].sort().join())
		trailing.push(`// ${grammarTag(f.grammars)} only`);
	if (dropped.length > 0) trailing.push(`// unmapped: ${dropped.join(' ')}`);
	return { name, optional: f.optional, type: t, trailing };
}

function emitLevel(d: Derivation, v: string): Statement[] {
	const seg = v.split('.').at(-1) ?? v;
	const name = tsname(seg);
	const parentPath = v.split('.').slice(0, -1).join('.');
	const sameTop = parentPath !== '' && parentPath.split('.')[0] === v.split('.')[0];
	const out: Statement[] = [];
	const kids = childrenOf(d, v);
	const claimedBy = grammarTag(d.claimers.get(v));
	const holes = d.holes.get(v);
	const refinement = d.refinements.get(v);
	if (holes && !refinement) {
		const ext =
			parentPath !== '' && (d.allvocab.has(parentPath) || d.prefixes.has(parentPath)) ? refOf(parentPath) : null;
		out.push({
			k: 'interface',
			name,
			extendsType: ext,
			members: [...holes]
				.sort(([a], [b]) => a.localeCompare(b))
				.map(([m, t]) => ({
					name: m,
					optional: false,
					type: t === 'string' ? { k: 'kw', name: 'string' } : { k: 'template', text: t.slice(1, -1) },
					trailing: []
				})),
			bodyLeading: [],
			trailing: [`// claimed by ${claimedBy} content-derived`],
			generic: true,
			keyParam: false,
			leading: []
		});
		if (kids.length === 0) return out;
	} else if (refinement) {
		const base = d.allvocab.has(parentPath) ? parentPath : refinement.parent;
		out.push({
			k: 'interface',
			name,
			extendsType: refOf(base),
			members: [...refinement.literals].map(([f, ts]) => ({
				name: camel(f),
				optional: false,
				type:
					ts.size === 1
						? { k: 'lit', text: [...ts][0] ?? '' }
						: { k: 'union', of: [...ts].sort().map((t) => ({ k: 'lit', text: t })) },
				trailing: []
			})),
			bodyLeading: [],
			trailing: [],
			generic: true,
			keyParam: false,
			leading: []
		});
	} else {
		const mems = levelMembers(d, v);
		const ext = sameTop ? refOf(parentPath) : null;
		const members: Member[] = [];
		for (const [cm, f] of [...mems].sort(([a], [b]) => a.localeCompare(b))) {
			if (LAYOUT.has(cm)) continue;
			members.push(memberDecl(d, v, cm, f));
		}
		out.push({
			k: 'interface',
			name,
			extendsType: ext,
			members,
			bodyLeading: claimedBy !== '' && members.length > 0 ? [`// claimed by ${claimedBy}`] : [],
			trailing: claimedBy !== '' && members.length === 0 ? [`// claimed by ${claimedBy}`] : [],
			generic: true,
			keyParam: false,
			leading: []
		});
	}
	if (kids.length > 0) {
		const statements: Statement[] = kids.flatMap((k) => emitLevel(d, k));
		const claimed = [...d.allvocab].filter((o) => o === v || o.startsWith(`${v}.`)).sort();
		statements.push({
			k: 'alias',
			name: 'Kinds',
			value:
				claimed.length === 0
					? { k: 'kw', name: 'never' }
					: claimed.length === 1
						? refOf(claimed[0] ?? v)
						: { k: 'union', of: claimed.map(refOf) }
		});
		out.push({ k: 'namespace', name, statements });
	}
	return out;
}

export function vocabularyFiles(d: Derivation): VocabularyFile[] {
	const tops = [...new Set([...d.allvocab].map((v) => v.split('.')[0] ?? v))].sort();
	const files: VocabularyFile[] = [];
	for (const top of tops) {
		const statements = emitLevel(d, top);
		if (![...d.allvocab, ...d.prefixes].some((o) => o.startsWith(`${top}.`))) {
			statements.push({
				k: 'namespace',
				name: tsname(top),
				statements: [{ k: 'alias', name: 'Kinds', value: refOf(top) }]
			});
		}
		files.push({
			name: top,
			leading: ["// Generated from the grammars' bindings.scm and slot models. Do not edit."],
			imports: [
				{ names: ['GrammarContext'], namespace: null, from: './context.ts' },
				{ names: null, namespace: 'V', from: './index.ts' }
			],
			statements
		});
	}
	const contextMembers = (value: (t: string) => TypeExpr): Member[] =>
		tops.map((t) => ({ name: t, optional: false, type: value(t), trailing: [] }));
	files.push({
		name: 'context',
		leading: ["// Generated from the grammars' bindings.scm. Do not edit."],
		imports: [{ names: null, namespace: 'V', from: './index.ts' }],
		statements: [
			{
				k: 'interface',
				name: 'GrammarContext',
				extendsType: null,
				members: contextMembers(() => ({ k: 'kw', name: 'unknown' })),
				bodyLeading: [],
				trailing: [],
				generic: false,
				keyParam: false,
				leading: [
					"/** The typemap: one key per top-level namespace, projecting to that namespace's kind-set for a grammar. */"
				]
			},
			{
				k: 'interface',
				name: 'Unmapped',
				extendsType: null,
				members: [{ name: '$unmapped', optional: false, type: { k: 'ident', name: 'K' }, trailing: [] }],
				bodyLeading: [],
				trailing: [],
				generic: false,
				keyParam: true,
				leading: ['/** A grammar kind a member admits that no binding claims yet; the name says which. */']
			},
			{
				k: 'interface',
				name: 'BaseContext',
				extendsType: { k: 'ident', name: 'GrammarContext' },
				members: contextMembers((t) => ({ k: 'ref', path: [tsname(t), 'Kinds'], generic: true })),
				bodyLeading: [],
				trailing: [],
				generic: false,
				keyParam: false,
				leading: ["/** The permissive closure: every namespace's full kind-set. */"]
			}
		]
	});
	return files;
}

const escapeSingle = (text: string): string =>
	text.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
const str = (text: string) => ir.string.single.strict(ir.unescapedSingleStringFragment(escapeSingle(text)));

function nestedName(path: readonly string[]): Identifier | ReturnType<typeof ir.nestedIdentifier.strict> {
	const [head, ...rest] = path;
	let acc: Identifier | ReturnType<typeof ir.nestedIdentifier.strict> = ir.identifier(head ?? '');
	for (const seg of rest) acc = ir.nestedIdentifier.strict({ object: acc, property: ir.identifier(seg) });
	return acc;
}

function extendsIr(
	t: TypeExpr,
	base: boolean
): Identifier | NestedTypeIdentifier | ReturnType<typeof ir.genericType.strict> {
	if (t.k === 'ident') return ir.identifier(t.name);
	if (t.k === 'ref') {
		const name = typeName(['V', ...t.path]);
		return t.generic
			? ir.genericType.strict({
					name,
					typeArguments: ir.typeArguments.strict(
						{ delimiter: Delimiter.None },
						ir.identifier(base ? 'BaseContext' : 'G')
					)
				})
			: name;
	}
	throw new Error(`bindings-inventory: an interface extends a name, not a ${t.k}`);
}

function typeName(path: readonly string[]): Identifier | NestedTypeIdentifier {
	const last = path.at(-1) ?? '';
	const module = path.slice(0, -1);
	return module.length === 0
		? ir.identifier(last)
		: ir.nestedTypeIdentifier.strict({ module: nestedName(module), name: ir.identifier(last) });
}

const KEYWORDS = {
	string: TSKindId.StringKeyword,
	boolean: TSKindId.BooleanKeyword,
	number: TSKindId.NumberKeyword,
	unknown: TSKindId.UnknownKeyword,
	never: TSKindId.NeverKeyword
} as const;

function toPrimary(t: TypeExpr, base: boolean): PrimaryType {
	switch (t.k) {
		case 'ident':
			return ir.identifier(t.name);
		case 'kw':
			return ir.parenthesizedType.strict(KEYWORDS[t.name]);
		case 'lit':
			return ir.literalType.strict(str(t.text));
		case 'lookup':
			return ir.lookupType.strict({ type: ir.identifier('G'), indexType: ir.literalType.strict(str(t.ns)) });
		case 'unmapped':
			return ir.genericType.strict({
				name: ir.nestedTypeIdentifier.strict({ module: ir.identifier('V'), name: ir.identifier('Unmapped') }),
				typeArguments: ir.typeArguments.strict({ delimiter: Delimiter.None }, ir.literalType.strict(str(t.name)))
			});
		case 'ref': {
			const name = typeName(['V', ...t.path]);
			if (!t.generic) return name;
			return ir.genericType.strict({
				name,
				typeArguments: ir.typeArguments.strict({ delimiter: Delimiter.None }, ir.identifier(base ? 'BaseContext' : 'G'))
			});
		}
		case 'array':
			return ir.arrayType.strict(
				t.of.k === 'union' ? ir.parenthesizedType.strict(toIr(t.of, base)) : toPrimary(t.of, base)
			);
		case 'union':
			return ir.parenthesizedType.strict(toIr(t, base));
		case 'template': {
			const chunks = t.text.split('${string}');
			const parts: (TemplateChars | TemplateType)[] = [];
			chunks.forEach((c, i) => {
				if (c !== '') parts.push(ir.templateChars(c));
				if (i < chunks.length - 1) parts.push(ir.templateType.strict(TSKindId.StringKeyword));
			});
			return ir.templateLiteralType.strict(...parts);
		}
	}
}

function toIr(t: TypeExpr, base: boolean): Type {
	if (t.k === 'kw') return KEYWORDS[t.name];
	if (t.k !== 'union') return toPrimary(t, base);
	const parts = t.of.map((p) => toIr(p, base));
	let acc: Type = parts[0] ?? KEYWORDS.never;
	for (const p of parts.slice(1)) acc = ir.unionType.strict({ left: acc, right: p });
	return acc;
}

const typeParams = () =>
	ir.typeParameters.strict(
		{ delimiter: Delimiter.None },
		ir.typeParameter.strict({
			name: ir.identifier('G'),
			constraint: ir.constraint.strict({ type: ir.identifier('GrammarContext'), content: TSKindId.ExtendsKeyword })
		})
	);
const keyParams = () =>
	ir.typeParameters.strict(
		{ delimiter: Delimiter.None },
		ir.typeParameter.strict({
			name: ir.identifier('K'),
			constraint: ir.constraint.strict({ type: TSKindId.StringKeyword, content: TSKindId.ExtendsKeyword })
		})
	);

interface Trivia {
	leading?: string[];
	trailing?: string[];
}

function trivia(leading: readonly string[], trailing: readonly string[]): Trivia | null {
	if (leading.length === 0 && trailing.length === 0) return null;
	const t: Trivia = {};
	if (leading.length > 0) t.leading = [...leading];
	if (trailing.length > 0) t.trailing = [...trailing];
	return t;
}

function memberIr(m: Member, base: boolean, leading: readonly string[]): PropertySignature {
	const built = ir.propertySignature.strict({
		readonlyMarker: true,
		name: ir.identifier(m.name),
		...(m.optional ? { optionalMarker: true } : {}),
		type: ir.typeAnnotation.strict(toIr(m.type, base))
	});
	const t = trivia(leading, m.trailing);
	return t ? built.$trivia(t) : built;
}

function interfaceIr(s: Interface, base: boolean): TsStatement {
	const [first, ...rest] = s.members;
	const members = first
		? ir.objectTypeContent.strict(
				{ delimiter: Delimiter.Trailing, separator: TSKindId.Semi },
				memberIr(first, base, s.bodyLeading),
				...rest.map((m) => memberIr(m, base, []))
			)
		: undefined;
	const decl = ir.interfaceDeclaration.strict({
		name: ir.identifier(s.name),
		...(s.generic ? { typeParameters: typeParams() } : s.keyParam ? { typeParameters: keyParams() } : {}),
		...(s.extendsType ? { extendsTypeClause: ir.extendsTypeClause.strict(extendsIr(s.extendsType, base)) } : {}),
		body: ir.objectType.strict({ opening: TSKindId.Lbrace, ...(members ? { members } : {}), closing: TSKindId.Rbrace })
	});
	const built = ir.exportStatement.strict(ir.exportStatementDefault.declaration.strict({ content: decl }));
	const t = trivia(s.leading, s.trailing);
	return t ? built.$trivia(t) : built;
}

function statementIr(s: Statement, base: boolean): TsStatement {
	switch (s.k) {
		case 'interface':
			return interfaceIr(s, base);
		case 'alias':
			return ir.exportStatement.strict(
				ir.exportStatementDefault.declaration.strict({
					content: ir.typeAliasDeclaration.strict({
						name: ir.identifier(s.name),
						typeParameters: typeParams(),
						value: toIr(s.value, base),
						terminator: TSKindId.Semi
					})
				})
			);
		case 'namespace':
			return ir.exportStatement.strict(
				ir.exportStatementDefault.declaration.strict({
					content: ir.internalModule.strict({
						name: ir.identifier(s.name),
						body: ir.statementBlock.strict({ statements: s.statements.map((x) => statementIr(x, base)) })
					})
				})
			);
	}
}

function importIr(imp: VocabularyFile['imports'][number], leading: readonly string[]): TsStatement {
	const [first, ...rest] = (imp.names ?? []).map((n) => ir.importSpecifier.strict({ content: ir.identifier(n) }));
	const clause =
		imp.namespace !== null
			? ir.importClause.strict(ir.namespaceImport.strict(ir.identifier(imp.namespace)))
			: ir.importClause.strict(
					first ? ir.namedImports.strict({ delimiter: Delimiter.None }, first, ...rest) : ir.namedImports.strict()
				);
	const built = ir.importStatement.clauseFrom.strict({
		importClause: TSKindId.TypeKeyword,
		fromClause: { importClause: clause, source: str(imp.from) },
		terminator: TSKindId.Semi
	});
	const t = trivia(leading, []);
	return t ? built.$trivia(t) : built;
}

export function renderVocabularyFile(file: VocabularyFile): string {
	const base = file.name === 'context';
	const statements: TsStatement[] = [
		...file.imports.map((imp, i) => importIr(imp, i === 0 ? file.leading : [])),
		...file.statements.map((s) => statementIr(s, base))
	];
	const program = ir.program.strict({ statements });
	const engine = createEngine();
	return engine.render(program).toString();
}

export function renderIndexFile(files: readonly VocabularyFile[]): string {
	const tops = files.filter((f) => f.name !== 'context').map((f) => f.name);
	return [
		"// Generated from the grammars' bindings.scm. Do not edit.",
		...tops.map((t) => `export * from './${t}.ts';`),
		"export type { GrammarContext, BaseContext, Unmapped } from './context.ts';",
		''
	].join('\n');
}
