import type { Program, TypescriptAPI } from '@sittir/typescript';
import type { Engine } from '@sittir/types';
import { loadPinnedBuild, type PinnedBuild } from '../bootstrap/pinned.ts';

export type Kinds = Awaited<ReturnType<PinnedBuild['typescript']['default']['load']>>['kinds'];

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

export interface Span {
	readonly start: number;
	readonly end: number;
}

export interface TypescriptSource {
	readonly K: Kinds;
	readonly engine: Engine<TypescriptAPI>;
	readonly spelled: (item: object | number) => string;
	readonly span: (item: object) => Span | undefined;
}

export type Statement = ReturnType<Program.Parsed['statements']>[number];

export const isNode = <T>(value: T): value is Exclude<T, number | undefined> => typeof value === 'object' && value !== null;

export async function parsedTypescript(code: string): Promise<{ readonly statements: readonly Statement[]; readonly source: TypescriptSource }> {
	const { K, engine, pinned } = await typescriptReader();
	const slice = pinned.common.spanSlicer(code);
	const spelled = (item: object | number): string => {
		if (typeof item === 'number') return String(engine.render(item));
		const span = pinned.utils.spanOf(item);
		return span === undefined ? '' : slice(span);
	};
	return { statements: engine.parse(code, { depth: Infinity, errors: 'throw' }).statements(), source: { K, engine, spelled, span: pinned.utils.spanOf } };
}

export async function exportedStringsInProcess(code: string): Promise<Record<string, string>> {
	const { statements, source } = await parsedTypescript(code);
	const { K, spelled } = source;
	const strings: Record<string, string> = {};
	for (const statement of statements) {
		if (!isNode(statement) || statement.$type !== K.ExportStatementDefaultDeclaration) continue;
		const declaration = statement.content();
		if (declaration.$type !== K.LexicalDeclaration) continue;
		for (const declarator of declaration.declarators()) {
			if (declarator.$type !== K.VariableDeclaratorPlain) continue;
			const name = declarator.name();
			const value = declarator.value();
			if (name.$type === K.Identifier && isNode(value) && value.$type === K.StringDouble) strings[spelled(name)] = JSON.parse(spelled(value)) as string;
		}
	}
	return strings;
}
