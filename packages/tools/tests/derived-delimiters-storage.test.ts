import { afterAll, describe, expect, it, vi } from 'vitest';
import { createEngine } from '@sittir/common';
import { languageByName } from '../src/languages.ts';
import { releaseTrackedEngines } from './helpers/track-engines.ts';

vi.mock('@sittir/common', async (importOriginal) => (await import('./helpers/track-engines.ts')).trackingEngines(await importOriginal<typeof import('@sittir/common')>()));
afterAll(releaseTrackedEngines);

type Rendered = { $render(): unknown };
type Builder = Record<string, (...args: unknown[]) => Rendered>;
type Engine = { readonly build: Builder; parse(source: string): unknown; render(node: unknown): { toString(): string } };
type Edited = { readonly $with: Record<string, (...items: unknown[]) => Rendered> };

const STORAGES = ['object', 'arena'] as const;

async function enginesOf(grammar: string): Promise<Record<(typeof STORAGES)[number], Engine>> {
	const language = await languageByName(grammar);
	const [object, arena] = await Promise.all(STORAGES.map((nodeStorage) => createEngine(language, { nodeStorage })));
	return { object: object as unknown as Engine, arena: arena as unknown as Engine };
}

const rendered = (node: Rendered): string => String(node.$render());

const pythonString = (engine: Engine, source: string): Edited =>
	(engine.parse(`${source}\n`) as { statements(): readonly { statements(): readonly { content(): Edited }[] }[] }).statements()[0]!.statements()[0]!.content();

const rustRawString = (engine: Engine, source: string): Edited =>
	(engine.parse(`const X: &str = ${source};\n`) as { statements(): readonly { value(): Edited }[] }).statements()[0]!.value();

type Case = readonly [name: string, run: (engine: Engine) => string, expected: string];

const PYTHON: readonly Case[] = [
	['a built string takes the preferred quote', (e) => rendered(e.build.string!({ contents: [e.build.stringContent!('abc')] })), '"abc"'],
	['a built string moves off a quote its content holds', (e) => rendered(e.build.string!({ contents: [e.build.stringContent!('a"b')] })), `'a"b'`],
	['a built string with a line break takes a triple quote', (e) => rendered(e.build.string!({ contents: [e.build.stringContent!('a\nb')] })), '"""a\nb"""'],
	['a built string falls back from a preferred quote it cannot keep', (e) => rendered(e.build.string!({ contents: [e.build.stringContent!("it's")] }, { quote: "'" })), `"it's"`],
	['a built string keeps its prefix', (e) => rendered(e.build.string!({ prefix: 'rb', contents: [e.build.stringContent!('x')] })), 'rb"x"'],
	['a read string keeps its quote while its edited content fits it', (e) => rendered(pythonString(e, "'a'").$with.contents!(e.build.stringContent!('b'))), "'b'"],
	['a read string re-prepares its quote when the edited content holds it', (e) => rendered(pythonString(e, "'a'").$with.contents!(e.build.stringContent!("it's"))), `"it's"`],
	['a read string with an opaque prefix keeps its source bytes when edited', (e) => rendered(pythonString(e, 'bf"y"').$with.contents!(e.build.stringContent!('z'))), 'bf"z"'],
	...[`x = 'a"b'\n`, 'x = """doc"""\n', 'x = BR"x"\n', 'x = bf"x"\n'].map((source): Case => [`reads and renders ${JSON.stringify(source)}`, (e) => e.render(e.parse(source)).toString(), source])
];

const RUST: readonly Case[] = [
	['a built raw string takes the shortest hash run its content fits', (e) => rendered(e.build.rawStringLiteral!({ prefix: 'br', stringContent: e.build.rawStringLiteralContent!('a"#b') })), 'br##"a"#b"##'],
	['a read raw string keeps its hash run while its edited content fits it', (e) => rendered(rustRawString(e, 'r#"a"#').$with.stringContent!(e.build.rawStringLiteralContent!('b'))), 'r#"b"#'],
	['a read raw string grows its hash run when the edited content holds its closer', (e) => rendered(rustRawString(e, 'r#"a"#').$with.stringContent!(e.build.rawStringLiteralContent!('x"#y'))), 'r##"x"#y"##'],
	...['fn f() { let x = r##"a"##; }\n', 'fn f() { let x = br#"a"b"#; }\n'].map((source): Case => [`reads and renders ${JSON.stringify(source)}`, (e) => e.render(e.parse(source)).toString(), source])
];

describe.each([
	['python', PYTHON],
	['rust', RUST]
] as const)('%s derived delimiters render the same bytes in object and arena storage', async (grammar, cases) => {
	const engines = await enginesOf(grammar);
	it.each(cases)('%s', (_name, run, expected) => {
		expect({ object: run(engines.object), arena: run(engines.arena) }).toEqual({ object: expected, arena: expected });
	});
});
