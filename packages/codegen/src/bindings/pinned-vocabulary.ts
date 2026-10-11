import type { GenericType, InterfaceDeclaration, Program, TypescriptAPI } from '@sittir/typescript';
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
	collect(engine.parse(code, { depth: Infinity }).statements(), [], declared, { K, text });
	return declared;
}

type Statement = ReturnType<Program.Parsed['statements']>[number];

type TypeNode = Exclude<ReturnType<NonNullable<ReturnType<GenericType.Parsed['typeArguments']>>['types']>[number], number | undefined>;

const isNode = <T>(value: T): value is Exclude<T, number | undefined> => typeof value === 'object' && value !== null;

function collect(statements: readonly Statement[], scope: readonly string[], out: VocabularyDeclaration[], source: Source): void {
	const { K, text } = source;
	for (const statement of statements) {
		if (!isNode(statement)) continue;
		const node = statement.$type === K.ExportStatementDefaultDeclaration ? statement.content() : statement;
		if (!isNode(node)) continue;
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
	const parentName = heritage === undefined ? undefined : [heritage.types()].flat().filter(isNode).map((type) => vocabularyReference(type, source)).find((name) => name !== undefined);
	out.push({ name: [...scope, text(declaration.name())].join('.'), path, own, ...(parentName === undefined ? {} : { parentName }) });
}

function vocabularyReference(type: TypeNode, source: Source): string | undefined {
	const { K, text } = source;
	if (type.$type !== K.GenericType) return undefined;
	const name = type.name();
	if (name.$type === K.NestedTypeIdentifier && text(name).startsWith('V.')) return text(name).slice(2);
	for (const argument of (type.typeArguments()?.types() ?? []).filter(isNode)) {
		const found = vocabularyReference(argument, source);
		if (found !== undefined) return found;
	}
	return undefined;
}
