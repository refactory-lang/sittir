import { nativeEngineOf, type LayoutWork, type NativeEngineLike, type NativeModuleLike, type StoredLayout } from '@sittir/common/engine';
import { treeOf } from '@sittir/common/utils';
import { requireGrammarModule } from '../grammar-internals.ts';
import { loadCorpusEntries } from './common.ts';

/** A corpus entry whose stored layout was refused. */
export interface LayoutRefusal {
	readonly entry: string;
	readonly message: string;
}

export interface StoredLayoutResult {
	/** What every entry stores of its layout apart from its read-time options, summed. */
	readonly stored: StoredLayout;
	readonly refused: readonly LayoutRefusal[];
}

export async function nativeBackendOf(grammar: string): Promise<NativeModuleLike> {
	const status = (await requireGrammarModule(grammar, 'backend.ts')).getActiveBackend();
	if (status.name !== 'native') throw new Error(`the native backend of '${grammar}' is not active`);
	return status.native;
}

/** A function parsing a source with `grammar`'s native engine and handing its tree id to `use`, disposing the tree after. */
export async function withTreeOf(grammar: string): Promise<<T>(source: string, use: (engine: NativeEngineLike, treeId: number) => T) => T> {
	const native = await nativeBackendOf(grammar);
	const engine = nativeEngineOf(native);
	return (source, use) => {
		const { treeId } = JSON.parse(engine.parse(source)) as { treeId: number };
		try {
			return use(engine, treeId);
		} finally {
			native.disposeTree(treeId);
		}
	};
}

/** A function reading the work done so far by the layout reads of the tree a parsed node belongs to (`NativeEngineLike.layoutWork`). */
export async function layoutWorkOf(grammar: string): Promise<(node: object) => LayoutWork> {
	const native = await nativeBackendOf(grammar);
	const engine = nativeEngineOf(native);
	return (node) => {
		const treeId = treeOf(node)?.id;
		if (treeId === undefined) throw new Error('layout work: the node names no live tree');
		return engine.layoutWork(treeId);
	};
}

/** What `source` stores of its layout apart from its read-time options (`NativeEngineLike.storedLayout`). */
export async function storedLayoutOf(grammar: string): Promise<(source: string) => StoredLayout> {
	const withTree = await withTreeOf(grammar);
	return (source) => withTree(source, (engine, treeId) => engine.storedLayout(treeId));
}

/** What every corpus entry of `grammar` stores of its layout apart from its read-time options, summed, and the entries refused. */
export async function runStoredLayout(grammar: string): Promise<StoredLayoutResult> {
	const storedOf = await storedLayoutOf(grammar);
	const stored = { slots: 0, separators: 0 };
	const refused: LayoutRefusal[] = [];
	for (const { name, source } of loadCorpusEntries(grammar)) {
		try {
			const { slots, separators } = storedOf(source);
			stored.slots += slots;
			stored.separators += separators;
		} catch (error) {
			refused.push({ entry: name, message: error instanceof Error ? error.message : String(error) });
		}
	}
	return { stored, refused };
}
