// The engines the side tests render through, one per construction, and a
// chain of comments each nested one side deeper than the one before it.
// Also runs on its own, as `node --import tsx side-nesting.mts <construction>
// <route> <length> <chain|ring>` or as a Worker given those as its
// `workerData.sideNesting`: it reports the render as one JSON line, or as the
// Worker's message. A separate process or thread, because a side nested past
// what the native stack holds ends the process rather than throwing.
import { fileURLToPath } from 'node:url';
import { parentPort, workerData } from 'node:worker_threads';
import { createEngine } from '@sittir/common';
import { useRecordConstruction } from '@sittir/common/engine';
import arena from '../src/arena.ts';
import rust from '../src/index.ts';

export const objects = await createEngine(rust);
export type Engine = typeof objects;
export const records = (await arena.createEngine()) as Engine;
useRecordConstruction(records, await import('../src/factories/records.ts'));
export const constructions: readonly [string, Engine][] = [
	['objects', objects],
	['arena objects', (await arena.createEngine()) as Engine],
	['records', records]
];

/** Where a comment of the chain holds the next: in its own leading side, or in its content's. */
export type Route = 'own' | 'content';

type Sided = { readonly $trivia: { leading(...items: never[]): unknown; trailing(...items: never[]): unknown } };

/**
 * A statement whose trailing side holds the first of `length` comments, each
 * the next one's holder along `route`, the last holding the first again when
 * `ring` is set, rendered.
 */
export function nestedComments(rs: Engine, route: Route, length: number, ring: boolean): string {
	const b = rs.build;
	const contents = Array.from({ length }, (_, at) => b.blockCommentRegular(` ${at} `));
	const comments = contents.map((content) => b.blockComment(content));
	const holders = (route === 'own' ? comments : contents) as unknown as Sided[];
	const held = comments as unknown as never[];
	for (let at = 0; at + 1 < length; at += 1) holders[at]!.$trivia.leading(held[at + 1]!);
	if (ring) holders[length - 1]!.$trivia.leading(held[0]!);
	const statement = b.expressionStatement(b.identifier('x')) as unknown as Sided & { $render(): string };
	statement.$trivia.trailing(held[0]!);
	return statement.$render();
}

/** What a run reports: the render's text, or its refusal. */
export type Reported = { readonly text: string } | { readonly refusal: string };

function report([name, route, length, shape]: readonly [string, Route, number, 'chain' | 'ring']): Reported {
	const rs = constructions.find(([label]) => label === name)?.[1];
	if (rs === undefined) throw new Error(`no construction ${name}`);
	try {
		return { text: nestedComments(rs, route, length, shape === 'ring') };
	} catch (error) {
		return { refusal: (error as Error).message };
	}
}

const given = (workerData as { readonly sideNesting?: readonly [string, Route, number, 'chain' | 'ring'] } | null)?.sideNesting;
if (given !== undefined) parentPort?.postMessage(report(given));
else if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const [name = 'records', route = 'own', length = '64', shape = 'chain'] = process.argv.slice(2);
	console.log(JSON.stringify(report([name, route as Route, Number(length), shape as 'chain' | 'ring'])));
}
