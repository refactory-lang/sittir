import { portableRuntime, type PortableCarry } from '@sittir/common/engine';
import { classifierOf } from '@sittir/common/portable';
import type { AnyUntypedNode, PortableStructure } from '@sittir/types';
import { createStrictNativeEngine, loadCorpusEntries, loadDelimiterSpellings, loadLanguageForGrammar, loadNodeModel, treeParser, type CorpusEntry } from './common.ts';
import { loadRenderReparseContext, renderReparse } from './read-render-parse.ts';

export type PortableRoundTripStage = 'read' | 'build' | 'render' | 'reparse' | 'ast';

export interface PortableRoundTripFailure {
	readonly entry: string;
	readonly stage: PortableRoundTripStage;
	readonly message: string;
	readonly rendered?: string;
}

export type PortableRoundTripCarry = PortableCarry & { readonly kind: string };

export interface PortableRoundTripCarried {
	readonly entry: string;
	readonly carries: readonly PortableRoundTripCarry[];
}

export interface PortableRoundTripArmless {
	readonly entry: string;
	readonly kind: string;
	readonly path: string;
}

export interface PortableRoundTripResult {
	readonly total: number;
	readonly pass: number;
	readonly astMatchPass: number;
	readonly spellingNormalized: number;
	readonly carried: readonly PortableRoundTripCarried[];
	readonly erred: readonly PortableRoundTripCarried[];
	readonly armless: readonly PortableRoundTripArmless[];
	readonly errors: readonly PortableRoundTripFailure[];
	readonly astMismatches: readonly PortableRoundTripFailure[];
}

const messageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error));

const isStructure = (value: unknown): value is PortableStructure => typeof value === 'object' && value !== null && typeof (value as { readonly $path?: unknown }).$path === 'string';

export async function runPortableRoundTrip(grammar: string, entries: readonly CorpusEntry[] = loadCorpusEntries(grammar)): Promise<PortableRoundTripResult | undefined> {
	using engine = await createStrictNativeEngine(grammar);
	if (engine.portable === undefined) return undefined;
	const runtime = await portableRuntime(engine);
	const classify = classifierOf(engine.portable);
	using parser = treeParser(await loadLanguageForGrammar(grammar));
	const ctx = await loadRenderReparseContext(grammar, parser, (node) => engine.render(node).toString());
	const { listSeparators, root } = await loadNodeModel(grammar);
	if (root === undefined) throw new Error(`portable round trip: the ${grammar} node model names no root kind`);
	let pass = 0;
	let astMatchPass = 0;
	let spellingNormalized = 0;
	const delimiters = await loadDelimiterSpellings(grammar);
	const errors: PortableRoundTripFailure[] = [];
	const astMismatches: PortableRoundTripFailure[] = [];
	const carried: PortableRoundTripCarried[] = [];
	const erred: PortableRoundTripCarried[] = [];
	const armless: PortableRoundTripArmless[] = [];
	for (const { name, source } of entries) {
		const carries: PortableRoundTripCarry[] = [];
		const faults: PortableRoundTripCarry[] = [];
		const structure = runtime.read(engine.parse(source), (node, carry) => {
			const kind = engine.trivia.kindName(node.$type);
			if (kind === undefined) throw new Error(`portable round trip: ${name} carries a node of kind ${node.$type}, which has no name`);
			(carry.reason === 'error' ? faults : carries).push({ kind, ...carry });
			const path = carry.reason === 'unclaimed' ? classify(node) : undefined;
			if (path !== undefined) armless.push({ entry: name, kind, path });
		});
		if (carries.length > 0) carried.push({ entry: name, carries });
		if (faults.length > 0) erred.push({ entry: name, carries: faults });
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
		using tree = parser.parse(source);
		try {
			const tolerance = { listSeparators, tolerated: [], delimiters, normalized: [] as string[] };
			const outcome = renderReparse(built, root, root, tree.root, true, ctx, tolerance);
			if (outcome.status === 'excluded') errors.push({ entry: name, stage: 'reparse', message: outcome.reason, rendered: outcome.rendered });
			else if (outcome.status === 'failed') errors.push({ entry: name, stage: 'reparse', message: outcome.message, rendered: outcome.rendered });
			else {
				pass++;
				if (outcome.astDiff === null) {
					astMatchPass++;
					if (tolerance.normalized.length > 0) spellingNormalized++;
				}
				else astMismatches.push({ entry: name, stage: 'ast', message: outcome.astDiff, rendered: outcome.rendered });
			}
		} catch (error) {
			errors.push({ entry: name, stage: 'render', message: messageOf(error) });
		}
	}
	return { total: entries.length, pass, astMatchPass, spellingNormalized, carried, erred, armless, errors, astMismatches };
}
