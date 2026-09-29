import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const SCRATCH = join(fileURLToPath(new URL('.', import.meta.url)), '.readme-snippets');

const READMES = ['README.md', ...['rust', 'python', 'typescript', 'types'].map((name) => `packages/${name}/README.md`)];

// A fence preceded by this line shows a shape rather than a program, and is not run.
const ILLUSTRATIVE = '<!-- snippet: illustrative -->';

// A statement `expr; // "text"` (or `// true`, `// false`, `// 3`) in a snippet states the value of `expr`; the gate asserts it. A boolean or number may be followed by `, prose`.
const EXPECTED_VALUE = /^(?!(?:import|const|let|export|if|for|function|type|interface)\b)(.+?);\s*\/\/ (".*"|(?:true|false|-?\d+(?:\.\d+)?)(?=$|, ))(?:, .*)?$/;

function tsBlocks(markdown: string): string[] {
	return [...markdown.matchAll(/(^.*\n)?```ts\n([\s\S]*?)```/gm)]
		.filter((match) => match[1]?.trim() !== ILLUSTRATIVE)
		.map((match) => match[2]!);
}

function withAssertions(block: string): string {
	const body = block
		.split('\n')
		.map((line) => line.replace(EXPECTED_VALUE, (_, expr: string, literal: string) => `expect(${expr}).toEqual(${literal});`))
		.join('\n');
	return `import { expect } from 'vitest';\n${body}`;
}

interface Snippet {
	readonly readme: string;
	readonly index: number;
	readonly heading: string;
	readonly file: string;
}

function writeSnippets(): Snippet[] {
	rmSync(SCRATCH, { recursive: true, force: true });
	mkdirSync(SCRATCH, { recursive: true });
	const snippets = READMES.flatMap((readme) =>
		tsBlocks(readFileSync(join(ROOT, readme), 'utf8')).map((block, at): Snippet => {
			const index = at + 1;
			const file = join(SCRATCH, `${readme.replace(/\/?README\.md$/, '').replace('packages/', '') || 'root'}-${index}.ts`);
			writeFileSync(file, withAssertions(block));
			return { readme, index, heading: block.split('\n').find((line) => line.trim() !== '') ?? '', file };
		})
	);
	writeFileSync(
		join(SCRATCH, 'tsconfig.json'),
		JSON.stringify({
			extends: '../../../tsconfig.json',
			compilerOptions: {
				noEmit: true,
				types: ['node'],
				composite: false,
				declaration: false,
				declarationMap: false,
				incremental: false
			},
			include: ['./*.ts']
		})
	);
	return snippets;
}

describe('the package README snippets', () => {
	const snippets = writeSnippets();
	afterAll(() => rmSync(SCRATCH, { recursive: true, force: true }));

	for (const readme of READMES) {
		it(`${readme} has snippets`, () => {
			expect(snippets.filter((snippet) => snippet.readme === readme).length).toBeGreaterThan(0);
		});
	}

	for (const snippet of snippets) {
		it(`run: ${snippet.readme} snippet ${snippet.index} (${snippet.heading.slice(0, 50)})`, async () => {
			await import(pathToFileURL(snippet.file).href);
		});
	}

	it('type-check as written', () => {
		const tsc = join(dirname(createRequire(import.meta.url).resolve('typescript/package.json')), 'bin', 'tsc');
		try {
			execFileSync(process.execPath, [tsc, '-p', join(SCRATCH, 'tsconfig.json')], { encoding: 'utf8', stdio: 'pipe' });
		} catch (error) {
			throw new Error(`a README snippet does not type-check:\n${(error as { stdout?: string }).stdout ?? String(error)}`);
		}
	}, 120_000);
});
