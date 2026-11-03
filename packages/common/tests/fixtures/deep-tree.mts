// Run with `node --import tsx <object|arena> <render|read|decode|refuse>
// <levels> <main|worker>`: builds and renders a rust expression nested
// <levels> parentheses deep (render), reads a type nesting tuple types
// <levels> deep at depth Infinity and renders it (read), or hands the native
// render a wire value with no JS walk in front: one nested <levels> deep,
// which the addon decodes and releases (decode), or a tuple whose first item
// is nested <levels> deep and whose second is malformed, which the addon
// refuses after decoding the first (refuse). On the main thread or a Worker.
// Prints one JSON line: `{ ok: true }`, or the JS error it refused with. A
// child process, because a native stack overflow ends the process.
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { createEngine } from '../../src/index.ts';
import rust from '../../../rust/src/index.ts';

interface Case {
	storage: 'object' | 'arena';
	side: 'render' | 'read' | 'decode' | 'refuse';
	levels: number;
}

type Outcome = { ok: true } | { ok: false; refusal: string };

type NativeRender = (engine: object, node: object, ...rest: unknown[]) => string;

const native = createRequire(import.meta.url)('../../../rust/native/index.cjs') as { render: NativeRender };
const render = native.render;
type Wire = Record<string, unknown>;
let lastRender: [object, Wire] | undefined;
native.render = (engine, node, ...rest) => {
	lastRender = [engine, node as Wire];
	return render(engine, node, ...rest);
};

function expect(actual: string, expected: string): void {
	if (actual !== expected) throw new Error(`rendered ${actual.length} characters, expected ${expected.length}`);
}

const isWire = (value: unknown): value is Wire => value !== null && typeof value === 'object' && !Array.isArray(value);

function wireOf(rendered: () => unknown): [object, Wire] {
	rendered();
	return lastRender as [object, Wire];
}

function nest(shell: Wire, levels: number, from?: Wire): Wire {
	const key = Object.keys(shell).find((name) => isWire(shell[name])) as string;
	let wire = from ?? (shell[key] as Wire);
	for (let at = 0; at < levels; at += 1) wire = { ...shell, [key]: wire };
	return wire;
}

function itemPair(value: unknown): unknown[] | undefined {
	if (Array.isArray(value)) {
		if (value.length === 2 && isWire(value[0]) && Object.values(value[0]).some((child) => isWire(child) && child._content === '1')) return value;
		return value.map(itemPair).find((found) => found !== undefined);
	}
	return isWire(value) ? Object.values(value).map(itemPair).find((found) => found !== undefined) : undefined;
}

async function run({ storage, side, levels }: Case): Promise<Outcome> {
	const rs: any = await createEngine(rust, { nodeStorage: storage });
	try {
		const parens = `${'('.repeat(levels)}1${')'.repeat(levels)}`;
		if (side === 'render') {
			let expression = rs.build.integerLiteral('1');
			for (let at = 0; at < levels; at += 1) expression = rs.build.parenthesizedExpression(expression);
			expect(rs.build.expressionStatement(expression).$render(), `${parens};`);
		} else if (side === 'read') {
			const source = `type T = ${'('.repeat(levels)}u8${',)'.repeat(levels)};\n`;
			expect(rs.render(rs.parse(source, { depth: Infinity })).toString(), source);
		} else if (side === 'decode') {
			const [engine, shell] = wireOf(() => rs.render(rs.build.parenthesizedExpression(rs.build.integerLiteral('1'))).toString());
			expect(render(engine, nest(shell, levels)), parens);
		} else {
			const [engine, root] = wireOf(() => rs.render(rs.parse('fn f() { ((1), 2); }\n', { depth: Infinity }).$snapshot()).toString());
			const pair = itemPair(root) as [Wire, unknown];
			pair[0] = nest(pair[0], levels, pair[0]);
			pair[1] = { $type: 'not a kind' };
			render(engine, root);
		}
		return { ok: true };
	} catch (error) {
		return { ok: false, refusal: String((error as Error).stack ?? error).split('\n')[0] ?? '' };
	} finally {
		rs.dispose();
	}
}

if (isMainThread) {
	const [storage, side, levels, thread] = process.argv.slice(2);
	const args = { storage, side, levels: Number(levels) } as Case;
	const outcome =
		thread === 'worker'
			? await new Promise<Outcome>((resolve, reject) => {
					const worker = new Worker(fileURLToPath(import.meta.url), {
						workerData: args,
						execArgv: ['--import', 'tsx']
					});
					worker.once('message', resolve);
					worker.once('error', reject);
				})
			: await run(args);
	console.log(JSON.stringify(outcome));
} else {
	parentPort?.postMessage(await run(workerData as Case));
}
