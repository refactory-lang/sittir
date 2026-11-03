// Run with `node --import tsx <object|arena> <render|read|decode> <levels>
// <main|worker>`: builds and renders a rust expression nested <levels>
// parentheses deep (render), reads a type nesting tuple types <levels> deep
// at depth Infinity and renders it (read), or hands the native
// render a wire value nested <levels> deep, so the addon decodes and releases
// it with no JS walk in front (decode), on the main thread or a Worker.
// Prints one JSON line: `{ ok: true }`, or the JS error it refused with. A
// child process, because a native stack overflow ends the process.
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { createEngine } from '../../src/index.ts';
import rust from '../../../rust/src/index.ts';

interface Case {
	storage: 'object' | 'arena';
	side: 'render' | 'read' | 'decode';
	levels: number;
}

type Outcome = { ok: true } | { ok: false; refusal: string };

type NativeRender = (engine: object, node: object, ...rest: unknown[]) => string;

const native = createRequire(import.meta.url)('../../../rust/native/index.cjs') as { render: NativeRender };
const render = native.render;
let lastRender: [object, object] | undefined;
native.render = (engine, node, ...rest) => {
	lastRender = [engine, node];
	return render(engine, node, ...rest);
};

function expect(actual: string, expected: string): void {
	if (actual !== expected) throw new Error(`rendered ${actual.length} characters, expected ${expected.length}`);
}

function nestedWire(rs: any, levels: number): { engine: object; wire: object } {
	rs.render(rs.build.parenthesizedExpression(rs.build.integerLiteral('1'))).toString();
	const [engine, shell] = lastRender as [object, Record<string, unknown>];
	const [key] = Object.keys(shell).filter((name) => typeof shell[name] === 'object');
	let wire = shell[key as string] as object;
	for (let at = 0; at < levels; at += 1) wire = { ...shell, [key as string]: wire };
	return { engine, wire };
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
		} else {
			const { engine, wire } = nestedWire(rs, levels);
			expect(render(engine, wire), parens);
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
