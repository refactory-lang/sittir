import { portableRuntime } from '@sittir/common/engine';
import type { AnyUntypedNode, PortableStructure } from '@sittir/types';
import { createStrictNativeEngine, loadCorpusEntries, loadLanguageForGrammar, loadNodeModel, type CorpusEntry } from './common.ts';
import { loadRenderReparseContext, renderReparse } from './read-render-parse.ts';

export type PortableRoundTripStage = 'read' | 'build' | 'render' | 'reparse' | 'ast';

export interface PortableRoundTripFailure {
	readonly entry: string;
	readonly stage: PortableRoundTripStage;
	readonly message: string;
	readonly rendered?: string;
}

export interface PortableRoundTripResult {
	readonly total: number;
	readonly pass: number;
	readonly astMatchPass: number;
	readonly errors: readonly PortableRoundTripFailure[];
	readonly astMismatches: readonly PortableRoundTripFailure[];
}

const messageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error));

const isStructure = (value: unknown): value is PortableStructure => typeof value === 'object' && value !== null && typeof (value as { readonly $path?: unknown }).$path === 'string';

export async function runPortableRoundTrip(grammar: string, entries: readonly CorpusEntry[] = loadCorpusEntries(grammar)): Promise<PortableRoundTripResult | undefined> {
	const engine = await createStrictNativeEngine(grammar);
	if (engine.portable === undefined) return undefined;
	const runtime = await portableRuntime(engine);
	const { Parser, lang } = await loadLanguageForGrammar(grammar);
	const parser = new Parser();
	parser.setLanguage(lang);
	const ctx = await loadRenderReparseContext(grammar, parser, (node) => engine.render(node).toString());
	const { listSeparators, root } = await loadNodeModel(grammar);
	if (root === undefined) throw new Error(`portable round trip: the ${grammar} node model names no root kind`);
	let pass = 0;
	let astMatchPass = 0;
	const errors: PortableRoundTripFailure[] = [];
	const astMismatches: PortableRoundTripFailure[] = [];
	for (const { name, source } of entries) {
		const structure = runtime.read(engine.parse(source));
		if (!isStructure(structure)) {
			errors.push({ entry: name, stage: 'read', message: 'the root reads as no vocabulary path' });
			continue;
		}
		let built: AnyUntypedNode;
		try {
			built = runtime.build(structure) as AnyUntypedNode;
		} catch (error) {
			errors.push({ entry: name, stage: 'build', message: messageOf(error) });
			continue;
		}
		const tree = parser.parse(source);
		try {
			const outcome = renderReparse(built, root, root, tree?.rootNode ?? null, true, ctx, { listSeparators, tolerated: [] });
			if (outcome.status === 'excluded') errors.push({ entry: name, stage: 'reparse', message: outcome.reason, rendered: outcome.rendered });
			else if (outcome.status === 'failed') errors.push({ entry: name, stage: 'reparse', message: outcome.message, rendered: outcome.rendered });
			else {
				pass++;
				if (outcome.astDiff === null) astMatchPass++;
				else astMismatches.push({ entry: name, stage: 'ast', message: outcome.astDiff, rendered: outcome.rendered });
			}
		} catch (error) {
			errors.push({ entry: name, stage: 'render', message: messageOf(error) });
		} finally {
			tree?.delete();
		}
	}
	return { total: entries.length, pass, astMatchPass, errors, astMismatches };
}
