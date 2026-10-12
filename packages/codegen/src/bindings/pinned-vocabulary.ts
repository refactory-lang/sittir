import type {
	AmbientDeclaration,
	ExportStatementDefaultDeclaration,
	ExportStatementDefaultDeclarationDefaultKw,
	ExpressionStatement,
	ExtendsTypeClause,
	InterfaceDeclaration,
	Program,
	TypescriptAPI
} from '@sittir/typescript';
import type { Engine } from '@sittir/types';
import { loadPinnedBuild, type PinnedBuild } from '../bootstrap/pinned.ts';
import type { VocabularyDeclaration, VocabularyMember } from './vocabulary.ts';

type Kinds = Awaited<ReturnType<PinnedBuild['typescript']['default']['load']>>['kinds'];

interface Reader {
	readonly K: Kinds;
	readonly engine: Engine<TypescriptAPI>;
	readonly pinned: PinnedBuild;
}

let reader: Promise<Reader> | undefined;

function typescriptReader(): Promise<Reader> {
	reader ??= (async () => {
		const pinned = await loadPinnedBuild();
		return { K: (await pinned.typescript.default.load()).kinds, engine: await pinned.common.createEngine(pinned.typescript.default), pinned };
	})();
	reader.catch(() => {
		reader = undefined;
	});
	return reader;
}

interface Source {
	readonly K: Kinds;
	readonly engine: Engine<TypescriptAPI>;
	readonly text: (item: object | number) => string;
}

export async function vocabularyDeclarationsInProcess(code: string): Promise<VocabularyDeclaration[]> {
	const { K, engine, pinned } = await typescriptReader();
	const slice = pinned.common.spanSlicer(code);
	const text = (item: object | number): string => {
		if (typeof item === 'number') return String(engine.render(item));
		const span = pinned.utils.spanOf(item);
		return span === undefined ? '' : slice(span);
	};
	const declared: VocabularyDeclaration[] = [];
	collect(engine.parse(code, { depth: Infinity }).statements(), [], declared, { K, engine, text });
	return declared;
}

type Statement = ReturnType<Program.Parsed['statements']>[number];

const isNode = <T>(value: T): value is Exclude<T, number | undefined> => typeof value === 'object' && value !== null;

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

function collect(statements: readonly Statement[], scope: readonly string[], out: VocabularyDeclaration[], source: Source): void {
	const { K, text } = source;
	for (const statement of statements) {
		const node = unwrap(statement, K);
		if (node === undefined) continue;
		if (node.$type === K.InternalModule) {
			collect(node.body()?.statements() ?? [], [...scope, text(node.name())], out, source);
			continue;
		}
		if (node.$type === K.InterfaceDeclaration) declare(node, scope, out, source);
	}
}

function declare(declaration: InterfaceDeclaration.Parsed, scope: readonly string[], out: VocabularyDeclaration[], source: Source): void {
	const { K, text } = source;
	let path: string | undefined;
	const own: [string, VocabularyMember][] = [];
	for (const member of declaration.body().content()?.members() ?? []) {
		if (member.$type !== K.PropertySignature) continue;
		const name = text(member.name());
		const annotation = member.type()?.type();
		const type = isNode(annotation) ? annotation : undefined;
		if (name === '$kind') {
			if (type?.$type === K.LiteralType) path = text(type).slice(1, -1);
			continue;
		}
		own.push([name, { optional: member.optional() !== undefined, flag: type?.$type === K.TypeIdentifier && text(type) === 'Flag' }]);
	}
	if (path === undefined) return;
	const heritage = declaration.extendsTypeClause();
	const parentName = heritage === undefined ? undefined : vocabularyReference(heritage, source);
	out.push({ name: [...scope, text(declaration.name())].join('.'), path, own, ...(parentName === undefined ? {} : { parentName }) });
}

function vocabularyReference(heritage: ExtendsTypeClause.Parsed, source: Source): string | undefined {
	const { K, engine, text } = source;
	for (const name of engine.query(heritage).$descendants.ofType(K.NestedTypeIdentifier)) {
		const reference = text(name);
		if (reference.startsWith('V.')) return reference.slice(2);
	}
	return undefined;
}
