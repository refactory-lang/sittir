import v8 from 'node:v8';
import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createEngine } from '@sittir/common';
import { PLAIN_KINDS, toNodeData } from '@sittir/common/utils';
import { loadSlotReaders, wrappedNodesOf } from '../validate/common.ts';

v8.setFlagsFromString('--allow-natives-syntax');
const hasFastProperties = new Function('o', 'return %HasFastProperties(o)') as (o: object) => boolean;
const root = resolve(import.meta.dirname, '../../../..');

interface Engine {
	readonly build: any;
	parse(source: string, options?: { depth?: number }): unknown;
	render(node: unknown): unknown;
}

const best = (fn: () => void, rounds: number): number => {
	let min = Infinity;
	for (let round = 0; round < rounds; round++) {
		const start = performance.now();
		fn();
		min = Math.min(min, performance.now() - start);
	}
	return min;
};

const engineOf = async (grammar: string): Promise<Engine> => {
	const language = (await import(pathToFileURL(resolve(root, `packages/${grammar}/src/index.ts`)).href)).default;
	return (await createEngine(language)) as unknown as Engine;
};

const built = async (): Promise<void> => {
	const rs = await engineOf('rust');
	const b = rs.build;
	const chain = (depth: number): unknown =>
		depth === 0
			? b.identifier('a')
			: b.binaryExpression({ left: chain(depth - 1), operator: '+', right: b.callExpression({ function: b.identifier('f'), arguments: b.arguments(b.identifier('x'), b.identifier('y')) }) });
	const trees = Array.from({ length: 400 }, () => b.letDeclaration({ pattern: b.identifier('v'), value: chain(6) }));
	const readers = await loadSlotReaders('rust');
	const nodes = trees.flatMap((tree) => wrappedNodesOf(tree, readers));
	console.log(`built trees: ${nodes.length} nodes, ${nodes.filter(hasFastProperties).length} with fast properties`);
	const render = best(() => trees.forEach((tree) => rs.render(tree)), 8);
	console.log(`engine.render over built trees: ${((render * 1000) / nodes.length).toFixed(2)} us per node`);
	const x = b.identifier('x');
	const make = (fn: () => unknown) => (best(() => { for (let i = 0; i < 10000; i++) fn(); }, 15) * 1e6) / 10000;
	console.log(`build binaryExpression: ${make(() => b.binaryExpression({ left: x, operator: '+', right: x })).toFixed(0)} ns`);
	console.log(`build arguments(x, x, x): ${make(() => b.arguments(x, x, x)).toFixed(0)} ns`);
	console.log(`build identifier: ${make(() => b.identifier('x')).toFixed(0)} ns`);
};

const parsed = async (grammar: string, file: string): Promise<void> => {
	const engine = await engineOf(grammar);
	const tree = engine.parse(readFileSync(resolve(root, file), 'utf8'), { depth: Infinity });
	const nodes = wrappedNodesOf(tree, await loadSlotReaders(grammar));
	console.log(`${grammar} ${file}: ${nodes.length} nodes, ${nodes.filter(hasFastProperties).length} with fast properties`);
	console.log(`  toNodeData(root): ${(best(() => toNodeData(tree as Parameters<typeof toNodeData>[0], PLAIN_KINDS), 8) * 1000).toFixed(0)} us`);
	console.log(`  engine.render(untouched root): ${(best(() => engine.render(tree), 8) * 1000).toFixed(0)} us`);
};

if (import.meta.url === `file://${process.argv[1]}`) {
	await built();
	await parsed('rust', 'rust/crates/sittir-core/src/engine.rs');
	await parsed('typescript', 'packages/common/src/create-engine.ts');
}
