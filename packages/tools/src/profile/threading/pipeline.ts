import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { sourceSpans } from '@sittir/common';
import { spanOf } from '@sittir/common/utils';
import type { ByteSpan, NodeStorage } from '@sittir/types';
import {
	loadKindNameFromId,
	loadNativeEngine,
	loadSlotAccessorOf,
	parseNativeTree,
	readNodeOf,
	useValidationNodeStorage,
	walkWrappedTree
} from '../../validate/common.ts';
import { nativeBackendOf } from '../../validate/layout-runs.ts';

export const stages = ['io', 'parse', 'read', 'walk', 'transform', 'render'] as const;
export type Stage = (typeof stages)[number];

const LINT_KINDS = new Set([
	'debugger_statement',
	'with_statement',
	'empty_statement',
	'non_null_expression',
	'as_expression',
	'ternary_expression'
]);

export interface PipelineOptions {
	storage: NodeStorage;
	files: string;
	warmup: number;
	rounds: number;
	limit?: number;
	loopStage?: Stage;
	loopSeconds?: number;
	yieldEvery?: number;
}

export interface PipelineRound {
	milliseconds: Record<Stage, number>;
	files: number;
	bytes: number;
	visited: number;
	identifiers: number;
	lint: number;
	errors: number;
	renderedBytes: number;
	renderedSha256: string;
	identical: number;
	refused: { path: string; stage: Stage; error: string }[];
}

function zero(): Record<Stage, number> {
	return Object.fromEntries(stages.map((stage) => [stage, 0])) as Record<Stage, number>;
}

export async function pipeline(options: PipelineOptions) {
	useValidationNodeStorage(options.storage);
	const engine = await loadNativeEngine('typescript');
	const readNode = await readNodeOf('typescript');
	const accessorOf = await loadSlotAccessorOf('typescript');
	const kindName = await loadKindNameFromId('typescript');
	const backend = await nativeBackendOf('typescript');
	const paths = readFileSync(options.files, 'utf8')
		.split('\n')
		.filter(Boolean)
		.slice(0, options.limit);

	const once = async (): Promise<PipelineRound> => {
		const milliseconds = zero();
		const hash = createHash('sha256');
		const round: PipelineRound = {
			milliseconds,
			files: 0,
			bytes: 0,
			visited: 0,
			identifiers: 0,
			lint: 0,
			errors: 0,
			renderedBytes: 0,
			renderedSha256: '',
			identical: 0,
			refused: []
		};
		for (const path of paths) {
			if (options.yieldEvery !== 0 && round.files % (options.yieldEvery ?? 1) === 0) await new Promise((resolve) => setImmediate(resolve));
			let stage: Stage = 'io';
			try {
				let at = performance.now();
				const lap = (next: Stage): void => {
					const now = performance.now();
					milliseconds[stage] += now - at;
					at = now;
					stage = next;
				};
				const source = readFileSync(path, 'utf8');
				lap('parse');
				const handle = parseNativeTree(engine, source);
				lap('read');
				let root: unknown;
				if (handle.records !== undefined) handle.records.hydrate(0, Infinity);
				else root = readNode(handle, undefined, Infinity);
				lap('walk');
				const identifiers: ByteSpan[] = [];
				const visit = (node: { readonly $type: number }): void => {
					round.visited++;
					const kind = kindName(node.$type);
					if (LINT_KINDS.has(kind)) round.lint++;
					else if (kind === 'ERROR') round.errors++;
					else if (kind === 'identifier') {
						const span = spanOf(node);
						if (span !== undefined) identifiers.push(span);
					}
				};
				if (handle.records !== undefined) for (const node of handle.records.candidates(0)) visit(node);
				else walkWrappedTree(root, accessorOf, visit);
				lap('transform');
				const spans = sourceSpans(source);
				const renamed = new Map<string, string>();
				for (const span of identifiers) {
					const text = spans.slice(span);
					if (!renamed.has(text)) renamed.set(text, `${text}$`);
				}
				round.identifiers += identifiers.length;
				lap('render');
				const rendered =
					handle.records !== undefined
						? handle.records.renderCandidate(0)
						: engine.render(root as Parameters<typeof engine.render>[0]).toString();
				lap('io');
				round.files++;
				round.bytes += spans.byteLength;
				round.renderedBytes += Buffer.byteLength(rendered);
				round.identical += Number(rendered === source);
				hash.update(`${path}\0${rendered.length}\0`).update(rendered);
				if (process.env.THREADING_TRACE === '1') {
					(globalThis as { gc?: () => void }).gc?.();
					const { heapUsed, external, rss } = process.memoryUsage();
					const trees = backend.treeMemory();
					process.stderr.write(`${round.files}\t${spans.byteLength}\t${(heapUsed / 2 ** 20).toFixed(0)}\t${(external / 2 ** 20).toFixed(0)}\t${(rss / 2 ** 20).toFixed(0)}\t${backend.liveTreeCount()}\t${(trees.counted / 2 ** 20).toFixed(1)}\t${(trees.reported / 2 ** 20).toFixed(1)}\t${path}\n`);
				}
			} catch (error) {
				round.refused.push({ path, stage, error: String(error).slice(0, 200) });
			}
		}
		round.renderedSha256 = hash.digest('hex');
		return round;
	};

	if (options.loopStage !== undefined) {
		const until = performance.now() + (options.loopSeconds ?? 10) * 1000;
		while (performance.now() < until) await once();
		return { storage: options.storage, pid: process.pid, looped: options.loopStage };
	}
	for (let i = 0; i < options.warmup; i++) await once();
	const rounds: PipelineRound[] = [];
	for (let i = 0; i < options.rounds; i++) {
		(globalThis as { gc?: () => void }).gc?.();
		rounds.push(await once());
	}
	const memory = process.memoryUsage();
	return {
		storage: options.storage,
		pid: process.pid,
		node: process.version,
		buildProfile: engine.diagnostics.buildProfile,
		peakRssBytes: process.resourceUsage().maxRSS * 1024,
		memory,
		rounds
	};
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const options = JSON.parse(process.argv[2] ?? '{}') as PipelineOptions;
	process.stdout.write(`${JSON.stringify(await pipeline(options))}\n`);
}
