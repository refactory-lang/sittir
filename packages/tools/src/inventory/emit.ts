import typescript from '@sittir/typescript';
import { createEngine } from '@sittir/common';
import { Delimiter } from '@sittir/common/utils';
import type {
	Identifier,
	ImportStatement,
	InternalModule,
	NestedTypeIdentifier,
	PrimaryType,
	Program,
	PropertySignature,
	Statement,
	StatementBlock,
	TemplateChars,
	TemplateType,
	Type,
	TypeIdentifier
} from '@sittir/typescript';
import { type Derivation, type MemberFacts, camel, childrenOf, commonPrefix, levelMembers, tsname } from './derive.ts';

const engine = await createEngine(typescript);
const { build: ir, kinds: TSKindId } = engine;

type TypeNode = Type.Bound | TypeIdentifier.Types;
type Arm = PrimaryType.Bound | TypeIdentifier.Types;
type Name = Identifier.Bound | NestedTypeIdentifier.Bound;
type Heritage = Name | ReturnType<typeof ir.genericType>;
type CommentNode = ReturnType<typeof ir.comment.line> | ReturnType<typeof ir.comment.block>;
type ExportNode = ReturnType<typeof ir.exportStatement.default.declaration>;
type Context = 'G' | 'BaseContext';

export interface VocabularyFile {
	readonly name: string;
	readonly program: Program.Bound;
}

interface Scope {
	readonly context: Context;
	subKind: boolean;
}

const KEYWORDS = {
	string: TSKindId.StringKeyword,
	boolean: TSKindId.BooleanKeyword,
	number: TSKindId.NumberKeyword
} as const;

const ESCAPED_CONTENT: Record<string, string> = { '\\': '\\', "'": "'", '\n': 'n', '\r': 'r', '\t': 't' };
const str = (text: string) =>
	ir.string.single(
		...text
			.split(/([\\'\n\r\t])/)
			.filter((piece) => piece !== '')
			.map((piece) =>
				piece in ESCAPED_CONTENT ? ir.escapeSequence(ESCAPED_CONTENT[piece]!) : ir.unescapedSingleStringFragment(piece)
			)
	);

const lineComment = (text: `//${string}`): CommentNode => ir.comment.line(text, false);
const blockComment = (text: `/*${string}*/`): CommentNode => ir.comment.block(text, false);

type Triviable<N> = {
	readonly $trivia: { leading(...items: CommentNode[]): N; trailing(...items: CommentNode[]): N };
};

function withTrivia<N extends Triviable<N>>(
	node: N,
	leading: readonly CommentNode[],
	trailing: readonly CommentNode[]
): N {
	const led = leading.length > 0 ? node.$trivia.leading(...leading) : node;
	return trailing.length > 0 ? led.$trivia.trailing(...trailing) : led;
}

function typeName(path: readonly string[]): Name {
	const [head, ...rest] = path.slice(0, -1);
	const last = ir.identifier(path.at(-1) ?? '');
	if (head === undefined) return last;
	let module: Identifier.Bound | ReturnType<typeof ir.nestedIdentifier> = ir.identifier(head);
	for (const seg of rest) module = ir.nestedIdentifier({ object: module, property: ir.identifier(seg) });
	return ir.nestedTypeIdentifier({ module, name: last });
}

const generic = (name: Name, argument: Arm | TypeNode) =>
	ir.genericType({ name, typeArguments: ir.typeArguments(argument) });

const pathOf = (vocab: string): string[] => vocab.split('.').map(tsname);
const vocabRef = (path: readonly string[], scope: Scope) =>
	generic(typeName(['V', ...path]), ir.identifier(scope.context));
const lookup = (ns: string): Arm => ir.lookupType({ type: ir.identifier('G'), indexType: ir.literalType(str(ns)) });
const literal = (text: string): Arm => ir.literalType(str(text));

function unionOf(arms: readonly (Arm | TypeNode)[]): TypeNode {
	const [first, ...rest] = arms;
	if (first === undefined) return TSKindId.UnknownKeyword;
	let acc: TypeNode = first;
	for (const arm of rest) acc = ir.unionType({ left: acc, right: arm });
	return acc;
}

const primary = (arm: Arm): Arm => (typeof arm === 'number' ? ir.parenthesizedType(arm) : arm);

function listOf(arms: readonly Arm[]): Arm {
	const [only] = arms;
	return ir.arrayType(arms.length === 1 && only !== undefined ? primary(only) : ir.parenthesizedType(unionOf(arms)));
}

const literalUnion = (texts: Iterable<string>): TypeNode => unionOf([...texts].sort().map(literal));

function subKindOf(path: string, scope: Scope): Heritage {
	scope.subKind = true;
	return generic(ir.identifier('SubKindOf'), vocabRef(pathOf(path), scope));
}

function elementArm(element: string, scope: Scope): { readonly key: string; readonly arm: Arm } {
	return element.includes('.')
		? { key: `ref:${pathOf(element).join('.')}`, arm: vocabRef(pathOf(element), scope) }
		: { key: `lookup:${element}`, arm: lookup(element) };
}


function collapsedKinds(d: Derivation, kinds: ReadonlySet<string>): string[] {
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
	return [...remaining].sort();
}

function memberArms(d: Derivation, kinds: ReadonlySet<string>, scope: Scope): { arms: Arm[]; dropped: string[] } {
	const arms: Arm[] = [];
	const dropped: string[] = [];
	const seen = new Set<string>();
	const add = (key: string, arm: Arm): void => {
		if (seen.has(key)) return;
		seen.add(key);
		arms.push(arm);
	};
	for (const k of collapsedKinds(d, kinds)) {
		if (k === 'boolean' || k === 'string' || k === 'number') add(`kw:${k}`, KEYWORDS[k]);
		else if (k.startsWith('text:')) add(`lit:${k.slice(5)}`, literal(k.slice(5)));
		else if (k.startsWith('literal:')) dropped.push(k);
		else if (k.startsWith('<')) {
			const name = k.slice(1, -1);
			add(`unmapped:${name}`, generic(typeName(['V', 'Unmapped']), literal(name)));
			dropped.push(k);
		} else if (k.startsWith('set:')) {
			const path = [...pathOf(k.slice(4)), 'Any'];
			add(`ref:${path.join('.')}`, vocabRef(path, scope));
		} else {
			const { key, arm } = elementArm(k, scope);
			add(key, arm);
		}
	}
	return { arms, dropped };
}

const grammarTag = (gs: ReadonlySet<string> | undefined): string =>
	[...(gs ?? [])]
		.map((g) => g.charAt(0))
		.sort()
		.join('');

function signature(
	name: string,
	type: TypeNode,
	optional: boolean,
	trailing: readonly CommentNode[] = []
): PropertySignature.Bound {
	const built = ir.propertySignature({
		readonly: true,
		name,
		...(optional ? { optional: true } : {}),
		type: ir.typeAnnotation(type)
	});
	return withTrivia(built, [], trailing);
}

const kindSignature = (v: string): PropertySignature.Bound => signature('$kind', literal(v), false);

function memberSignature(
	d: Derivation,
	v: string,
	name: string,
	f: MemberFacts,
	scope: Scope
): PropertySignature.Bound | null {
	const { arms, dropped } = memberArms(d, f.kinds, scope);
	const [only] = arms;
	const single = arms.length === 1 && only !== undefined;
	let type: TypeNode = unionOf(arms);
	if (f.multiple && !(single && typeof only !== 'number' && only.$type === TSKindId.ArrayType)) {
		const list = listOf(arms.length === 0 ? [TSKindId.UnknownKeyword] : arms);
		type = f.scalar ? ir.unionType({ left: type, right: list }) : list;
	} else if (arms.length === 0) return null;
	const trailing: CommentNode[] = [];
	const claimers = d.claimers.get(v);
	if (claimers === undefined || [...f.grammars].sort().join() !== [...claimers].sort().join())
		trailing.push(lineComment(`// ${grammarTag(f.grammars)} only`));
	if (dropped.length > 0) trailing.push(lineComment(`// unmapped: ${dropped.join(' ')}`));
	return signature(name, type, f.optional, trailing);
}

const typeParameters = () =>
	ir.typeParameters(
		ir.typeParameter({
			name: 'G',
			constraint: { type: 'GrammarContext', content: TSKindId.ExtendsKeyword }
		})
	);

const keyParameters = () =>
	ir.typeParameters(
		ir.typeParameter({
			name: ir.identifier('K'),
			constraint: ir.constraint({ type: TSKindId.StringKeyword, content: TSKindId.ExtendsKeyword })
		})
	);

interface InterfaceSpec {
	readonly name: string;
	readonly typeParameters?: ReturnType<typeof typeParameters>;
	readonly heritage?: Heritage | null;
	readonly members: readonly PropertySignature.Bound[];
	readonly bodyLeading?: readonly CommentNode[];
	readonly leading?: readonly CommentNode[];
	readonly trailing?: readonly CommentNode[];
}

function exportInterface(spec: InterfaceSpec): ExportNode {
	const [first, ...rest] = spec.members;
	const members =
		first === undefined
			? undefined
			: ir.objectTypeContent(
					{ delimiter: Delimiter.Trailing, separator: TSKindId.Semi },
					withTrivia(first, spec.bodyLeading ?? [], []),
					...rest
				);
	const decl = ir.interfaceDeclaration({
		name: ir.identifier(spec.name),
		...(spec.typeParameters ? { typeParameters: spec.typeParameters } : {}),
		...(spec.heritage ? { extendsTypeClause: ir.extendsTypeClause(spec.heritage) } : {}),
		body: ir.objectType({ opening: TSKindId.Lbrace, ...(members ? { members } : {}), closing: TSKindId.Rbrace })
	});
	return withTrivia(ir.exportStatement.default.declaration({ content: decl }), spec.leading ?? [], spec.trailing ?? []);
}

const exportAlias = (name: string, value: TypeNode): ExportNode =>
	ir.exportStatement.default.declaration({
		content: ir.typeAliasDeclaration(
			{ name: ir.identifier(name), typeParameters: typeParameters(), value },
			{ terminator: TSKindId.Semi }
		)
	});

function exportNamespace(name: string, statements: readonly ExportNode[]): ExportNode {
	const body: StatementBlock.Bound = ir.statementBlock().$with.statements(...statements);
	const module: InternalModule.Bound = ir.internalModule({ name: ir.identifier(name), body });
	return ir.exportStatement.default.declaration({ content: module });
}

function emitLevel(d: Derivation, v: string, scope: Scope): ExportNode[] {
	const name = tsname(v.split('.').at(-1) ?? v);
	const parentPath = v.split('.').slice(0, -1).join('.');
	const sameTop = parentPath !== '' && parentPath.split('.')[0] === v.split('.')[0];
	const out: ExportNode[] = [];
	const kids = childrenOf(d, v);
	const claimedBy = grammarTag(d.claimers.get(v));
	const holes = d.holes.get(v);
	const refinement = d.refinements.get(v);
	if (holes && !refinement) {
		const extendsParent = parentPath !== '' && (d.allvocab.has(parentPath) || d.prefixes.has(parentPath));
		out.push(
			exportInterface({
				name,
				typeParameters: typeParameters(),
				heritage: extendsParent ? subKindOf(parentPath, scope) : null,
				members: [
					kindSignature(v),
					...[...holes]
						.sort(([a], [b]) => a.localeCompare(b))
						.map(([m, t]) => signature(m, t === 'string' ? KEYWORDS.string : templateType(t.slice(1, -1)), false))
				],
				trailing: [lineComment(`// claimed by ${claimedBy} content-derived`)]
			})
		);
		if (kids.length === 0) return out;
	} else if (refinement) {
		out.push(
			exportInterface({
				name,
				typeParameters: typeParameters(),
				heritage: subKindOf(d.allvocab.has(parentPath) ? parentPath : refinement.parent, scope),
				members: [
					kindSignature(v),
					...[...refinement.literals].map(([f, texts]) => signature(camel(f), literalUnion(texts), false))
				]
			})
		);
	} else {
		const heritage = sameTop ? subKindOf(parentPath, scope) : null;
		const members = [kindSignature(v)];
		for (const [member, f] of [...levelMembers(d, v)].sort(([a], [b]) => a.localeCompare(b))) {
			const built = memberSignature(d, v, member, f, scope);
			if (built !== null) members.push(built);
		}
		const claim = claimedBy === '' ? [] : [lineComment(`// claimed by ${claimedBy}`)];
		out.push(
			exportInterface({
				name,
				typeParameters: typeParameters(),
				heritage,
				members,
				bodyLeading: members.length > 0 ? claim : [],
				trailing: members.length === 0 ? claim : []
			})
		);
	}
	if (kids.length > 0) {
		const statements = kids.flatMap((k) => emitLevel(d, k, scope));
		const claimed = [...d.allvocab].filter((o) => o === v || o.startsWith(`${v}.`)).sort();
		statements.push(
			exportAlias(
				'Any',
				claimed.length === 0 ? TSKindId.NeverKeyword : unionOf(claimed.map((c) => vocabRef(pathOf(c), scope)))
			)
		);
		out.push(exportNamespace(name, statements));
	}
	return out;
}

function templateType(text: string): Arm {
	const chunks = text.split('${string}');
	const parts: (TemplateChars.Bound | TemplateType.Bound)[] = [];
	chunks.forEach((chunk, i) => {
		if (chunk !== '') parts.push(ir.templateChars(chunk));
		if (i < chunks.length - 1) parts.push(ir.templateType(TSKindId.StringKeyword));
	});
	return ir.templateLiteralType(...parts);
}

function importNames(names: readonly string[], from: string): ImportStatement.Bound {
	const [first, ...rest] = names.map((n) => ir.importSpecifier.name({ name: ir.identifier(n) }));
	const clause = ir.importClause(first ? ir.namedImports(first, ...rest) : ir.namedImports());
	return ir.importStatement
		.clauseFrom({ importClause: TSKindId.TypeKeyword, fromClause: { importClause: clause, source: str(from) } })
		.$with.terminator(TSKindId.Semi);
}

function importNamespace(alias: string, from: string): ImportStatement.Bound {
	const clause = ir.importClause.namespaceImport(alias);
	return ir.importStatement
		.clauseFrom({ importClause: TSKindId.TypeKeyword, fromClause: { importClause: clause, source: str(from) } })
		.$with.terminator(TSKindId.Semi);
}

function program(
	header: `//${string}`,
	imports: readonly ImportStatement.Bound[],
	statements: readonly Statement.Bound[]
): Program.Bound {
	const [first, ...rest] = imports;
	const all: Statement.Bound[] = [
		...(first === undefined ? [] : [withTrivia(first, [lineComment(header)], []), ...rest]),
		...statements
	];
	return ir.program({ statements: all });
}

function namespaceFile(d: Derivation, top: string): VocabularyFile {
	const scope: Scope = { context: 'G', subKind: false };
	const statements = emitLevel(d, top, scope);
	if (![...d.allvocab, ...d.prefixes].some((o) => o.startsWith(`${top}.`)))
		statements.push(exportNamespace(tsname(top), [exportAlias('Any', vocabRef(pathOf(top), scope))]));
	const imports = [
		importNames(['GrammarContext'], './context.ts'),
		...(scope.subKind ? [importNames(['SubKindOf'], './utils.ts')] : []),
		importNamespace('V', './index.ts')
	];
	return {
		name: top,
		program: program("// Generated from the grammars' bindings.scm and slot models. Do not edit.", imports, statements)
	};
}

function contextFile(tops: readonly string[]): VocabularyFile {
	const scope: Scope = { context: 'BaseContext', subKind: false };
	const statements = [
		exportInterface({
			name: 'GrammarContext',
			members: tops.map((t) => signature(t, TSKindId.UnknownKeyword, false)),
			leading: [
				blockComment(
					"/** The typemap: one key per top-level namespace, projecting to that namespace's kind-set for a grammar. */"
				)
			]
		}),
		exportInterface({
			name: 'Unmapped',
			typeParameters: keyParameters(),
			members: [signature('$unmapped', ir.identifier('K'), false)],
			leading: [blockComment('/** A grammar kind a member admits that no binding claims yet; the name says which. */')]
		}),
		exportInterface({
			name: 'BaseContext',
			heritage: ir.identifier('GrammarContext'),
			members: tops.map((t) => signature(t, vocabRef([tsname(t), 'Any'], scope), false)),
			leading: [blockComment("/** The permissive closure: every namespace's full kind-set. */")]
		})
	];
	return {
		name: 'context',
		program: program(
			"// Generated from the grammars' bindings.scm. Do not edit.",
			[importNamespace('V', './index.ts')],
			statements
		)
	};
}

export function vocabularyFiles(d: Derivation): VocabularyFile[] {
	const tops = [...new Set([...d.allvocab].map((v) => v.split('.')[0] ?? v))].sort();
	return [...tops.map((top) => namespaceFile(d, top)), contextFile(tops)];
}

export function indexFile(files: readonly VocabularyFile[]): VocabularyFile {
	const reexports = files
		.filter((f) => f.name !== 'context')
		.map((f) =>
			ir.exportStatement.default.from.starFrom(str(`./${f.name}.ts`)).$with.automaticSemicolon(TSKindId.Semi)
		);
	const context = ir.exportStatement.typeExport(
		{
			exportClause: ['GrammarContext', 'BaseContext', 'Unmapped'].map((n) =>
				ir.exportSpecifier({ name: ir.identifier(n) })
			),
			source: str('./context.ts')
		},
		{ terminator: TSKindId.Semi }
	);
	const [first, ...rest] = reexports;
	const statements =
		first === undefined
			? [context]
			: [
					withTrivia(first, [lineComment("// Generated from the grammars' bindings.scm. Do not edit.")], []),
					...rest,
					context
				];
	return { name: 'index', program: ir.program({ statements }) };
}

const RENDER_OPTIONS = {
	program: { statements: { exportStatementDefaultFrom: { after: TSKindId.Newline } } }
} as const;

export function renderVocabularyFile(file: VocabularyFile): string {
	return engine.render(file.program, RENDER_OPTIONS).toString();
}
