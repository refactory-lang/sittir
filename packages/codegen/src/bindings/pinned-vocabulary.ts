import type {
	AmbientDeclaration,
	ExportStatementDefaultDeclaration,
	ExportStatementDefaultDeclarationDefaultKw,
	ExpressionStatement,
	ExportStatementDefaultFrom,
	ExtendsTypeClause,
	InterfaceDeclaration,
	PropertySignature
} from '@sittir/typescript';
import { isNode, parsedTypescript, type Kinds, type Span, type Statement, type TypescriptSource } from './pinned-typescript.ts';
import { type Declared, type FeatureIndex, FLAG, type Member, REFINED_BY } from './vocabulary.ts';

interface Source extends Omit<TypescriptSource, 'spelled'> {
	readonly text: (item: object | number) => string;
}

function identifier(name: { readonly $type: number } | number, kinds: readonly number[], source: Source): string {
	const spelled = source.text(name);
	if (typeof name !== 'number' && !kinds.includes(name.$type)) throw new Error(`vocabulary: ${spelled} is not a plain identifier; name members and namespaces by identifiers`);
	return spelled;
}

async function parsed(code: string): Promise<{ readonly statements: readonly Statement[]; readonly source: Source }> {
	const { statements, source } = await parsedTypescript(code);
	const text = (item: object | number): string => {
		const spelled = source.spelled(item);
		if (typeof item !== 'number' && spelled.includes('\\')) throw new Error(`vocabulary: ${spelled} spells a name with an escape; spell it plainly, as the reader compares names as written`);
		return spelled;
	};
	return { statements, source: { K: source.K, engine: source.engine, span: source.span, text } };
}

export async function vocabularyDeclaredInProcess(code: string): Promise<Declared[]> {
	const { statements, source } = await parsed(code);
	const declared: Declared[] = [];
	collect(statements, [], declared, source);
	return declared;
}

export async function vocabularyFeatureIndexInProcess(code: string): Promise<FeatureIndex> {
	const { statements, source } = await parsed(code);
	const { K, text } = source;
	let marker: FeatureIndex['marker'] = null;
	const exports: string[] = [];
	for (const statement of statements) {
		if (isNode(statement) && statement.$type === K.ExportStatementDefaultFrom) {
			const from = exportedFrom(statement, source);
			if (from !== undefined) exports.push(from);
			continue;
		}
		const node = unwrap(statement, K);
		if (marker !== null || node?.$type !== K.InterfaceDeclaration) continue;
		const key = markerKey(node, source);
		if (key !== undefined) marker = { name: text(node.name()), key, parents: heritageNames(node.extendsTypeClause(), source) };
	}
	return { marker, exports };
}

type Wrapped =
	| Statement
	| ReturnType<ExportStatementDefaultDeclaration.Parsed['content']>
	| ReturnType<ExportStatementDefaultDeclarationDefaultKw.Parsed['content']>
	| ReturnType<AmbientDeclaration.Parsed['content']>
	| ReturnType<ExpressionStatement.Parsed['expression']>;

function unwrap(node: Wrapped, K: Kinds): Exclude<Wrapped, number | undefined> | undefined {
	if (!isNode(node)) return undefined;
	switch (node.$type) {
		case K.ExportStatementDefaultDeclaration:
		case K.ExportStatementDefaultDeclarationDefaultKw:
		case K.AmbientDeclaration:
			return unwrap(node.content(), K);
		case K.ExpressionStatement:
			return unwrap(node.expression(), K);
		default:
			return node;
	}
}

function collect(statements: readonly Statement[], scope: readonly string[], out: Declared[], source: Source): void {
	const { K } = source;
	for (const statement of statements) {
		const node = unwrap(statement, K);
		if (node === undefined) continue;
		if (node.$type === K.InternalModule || node.$type === K.Module) {
			const name = node.name();
			if (isNode(name) && (name.$type === K.StringSingle || name.$type === K.StringDouble)) {
				const augmented: Declared[] = [];
				collect(node.body()?.statements() ?? [], scope, augmented, source);
				const kind = augmented.find((d) => d.path !== undefined);
				if (kind !== undefined) throw new Error(`vocabulary: the kind ${kind.path} is declared inside the module augmentation ${source.text(name)}; declare a kind in a namespace`);
				continue;
			}
			collect(node.body()?.statements() ?? [], [...scope, identifier(name, [K.Identifier, K.NestedIdentifier], source)], out, source);
			continue;
		}
		if (node.$type === K.InterfaceDeclaration) declare(node, scope, out, source);
	}
}

function declare(declaration: InterfaceDeclaration.Parsed, scope: readonly string[], out: Declared[], source: Source): void {
	const { K, text } = source;
	let path: string | undefined;
	const members: Member[] = [];
	for (const member of declaration.body().content()?.members() ?? []) {
		if (member.$type !== K.PropertySignature) continue;
		const name = identifier(member.name(), [K.PropertyIdentifier], source);
		const typed = member.type();
		const annotation = typed?.type();
		if (name === '$kind') {
			const literal = isNode(annotation) && annotation.$type === K.LiteralType ? annotation.content() : undefined;
			if (isNode(literal) && (literal.$type === K.StringSingle || literal.$type === K.StringDouble)) path = text(literal).slice(1, -1);
			continue;
		}
		members.push({
			name,
			optional: member.optional(),
			type: annotation === undefined ? 'any' : text(annotation),
			flag: isNode(annotation) && annotation.$type === K.TypeIdentifier && text(annotation) === FLAG,
			references: typed === undefined ? [] : references(typed, source),
			literals: annotation === undefined ? [] : (stringLiterals(annotation, source) ?? [])
		});
	}
	const heritage = declaration.extendsTypeClause();
	const parent = heritage === undefined ? undefined : vocabularyReference(heritage, source);
	const refines = heritage === undefined ? undefined : refinedValue(heritage, source);
	out.push({
		qname: [...scope, text(declaration.name())].join('.'),
		path,
		parent,
		refines,
		members
	});
}

function vocabularyReference(heritage: ExtendsTypeClause.Parsed, source: Source, within?: Span): string | undefined {
	const { K, engine, text, span } = source;
	for (const name of engine.query(heritage).$descendants.ofType(K.NestedTypeIdentifier)) {
		const at = span(name);
		if (within !== undefined && (at === undefined || at.start < within.start || at.end > within.end)) continue;
		const reference = text(name);
		if (reference.startsWith('V.')) return reference.slice(2);
	}
	return undefined;
}

type PropertySignatureType = NonNullable<ReturnType<PropertySignature.Parsed['type']>>;

type Annotation = ReturnType<PropertySignatureType['type']>;

function stringLiterals(type: Annotation, source: Source): string[] | undefined {
	const { K, text } = source;
	if (!isNode(type)) return undefined;
	if (type.$type === K.UnionType) {
		const left = type.left();
		const lefts = left === undefined ? [] : stringLiterals(left, source);
		const rights = stringLiterals(type.right(), source);
		return lefts === undefined || rights === undefined ? undefined : [...lefts, ...rights];
	}
	if (type.$type !== K.LiteralType) return undefined;
	const literal = type.content();
	return isNode(literal) && (literal.$type === K.StringSingle || literal.$type === K.StringDouble) ? [text(literal).slice(1, -1)] : undefined;
}

type HeritageType = ReturnType<ExtendsTypeClause.Parsed['types']>[number];

function refinedValue(heritage: ExtendsTypeClause.Parsed, source: Source): string | undefined {
	const { K, text } = source;
	for (const type of [heritage.types()].flat()) {
		if (!isNode(type) || type.$type !== K.GenericType || text(type.name()) !== REFINED_BY) continue;
		const value = type.typeArguments()?.types()[1];
		const within = isNode(value) ? source.span(value) : undefined;
		return within === undefined ? undefined : vocabularyReference(heritage, source, within);
	}
	return undefined;
}

function heritageNames(heritage: ExtendsTypeClause.Parsed | undefined, source: Source): string[] {
	const { K, text } = source;
	return heritage === undefined ? [] : [heritage.types()].flat().flatMap((type: HeritageType) => (!isNode(type) ? [] : [text(type.$type === K.GenericType ? type.name() : type)]));
}

function markerKey(declaration: InterfaceDeclaration.Parsed, source: Source): string | undefined {
	const { K, text } = source;
	const [member, ...rest] = declaration.body().content()?.members() ?? [];
	if (member === undefined || rest.length > 0 || member.$type !== K.PropertySignature) return undefined;
	const annotation = member.type()?.type();
	if (!isNode(annotation) || annotation.$type !== K.LiteralType || text(annotation) !== 'true') return undefined;
	const name = member.name();
	if (typeof name === 'number' || name.$type === K.PropertyIdentifier) return text(name);
	return name.$type === K.StringSingle || name.$type === K.StringDouble ? text(name).slice(1, -1) : undefined;
}

function exportedFrom(statement: ExportStatementDefaultFrom.Parsed, source: Source): string | undefined {
	const { K, text } = source;
	const star = statement.content();
	return isNode(star) && star.$type === K.ExportStatementDefaultFromStarFrom ? text(star.source()).slice(1, -1) : undefined;
}

function references(typed: PropertySignatureType, source: Source): string[] {
	const { K, engine, text } = source;
	return [...engine.query(typed).$descendants.ofType(K.GenericType)].flatMap((generic) => {
		const name = generic.name();
		const spelled = name.$type === K.NestedTypeIdentifier ? text(name) : '';
		return spelled.startsWith('V.') ? [spelled.slice(2)] : [];
	});
}
