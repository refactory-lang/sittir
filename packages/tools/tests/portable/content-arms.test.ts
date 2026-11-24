import { createEngine } from '@sittir/common';
import { portableRuntime, scopeBuilders } from '@sittir/common/engine';
import { describe, expect, it } from 'vitest';
import { portableBuild as pythonBuild } from '../../../python/src/portable/build.ts';
import { portableBuild as rustBuild } from '../../../rust/src/portable/build.ts';
import { portableBuild as typescriptBuild } from '../../../typescript/src/portable/build.ts';
import { languageByName } from '../../src/languages.ts';

const generated = { python: pythonBuild, rust: rustBuild, typescript: typescriptBuild } as const;

const builderAt = (scoped: unknown, path: string): ((input: never) => unknown) =>
	path.split('.').reduce((at, segment) => (at as Record<string, unknown>)[segment], scoped) as (input: never) => unknown;

const WRITTEN: readonly (readonly [grammar: keyof typeof generated, path: string, value: string, written: string])[] = [
	['rust', 'literal.string.escape', 'n', '\\n'],
	['rust', 'literal.string.escape', 'x41', '\\x41'],
	['rust', 'literal.string.escape', 'u{41}', '\\u{41}'],
	['rust', 'literal.string.escape', 'u0041', '\\u0041'],
	['rust', 'comment.block', 'x', '/*x*/'],
	['rust', 'comment.block', '', '/**/'],
	['rust', 'identifier.metavariable', 'x', '$x'],
	['python', 'literal.string.escape', 'n', '\\n'],
	['python', 'literal.string.escape', 'x41', '\\x41'],
	['python', 'literal.string.escape', '101', '\\101'],
	['python', 'literal.string.escape', 'N{DASH}', '\\N{DASH}'],
	['python', 'comment.line', ' x', '# x'],
	['typescript', 'literal.string.escape', 'n', '\\n'],
	['typescript', 'comment.line', ' x', '// x'],
	['typescript', 'comment.block', 'x', '/*x*/'],
	['typescript', 'comment.block.doc', '* hello', '/** hello*/']
];

const REFUSED: readonly (readonly [grammar: keyof typeof generated, path: string, value: string])[] = [
	['rust', 'literal.string.escape', 'x4'],
	['rust', 'literal.string.escape', 'u{}'],
	['python', 'literal.string.escape', 'x4'],
	['typescript', 'comment.block.doc', 'hello']
];

describe.each(['object', 'arena'] as const)('a path that builds its text through a content slot, on %s storage', (nodeStorage) => {
	it.each(WRITTEN)('%s %s from %j writes %j through the table and the generated builder', async (grammar, path, value, written) => {
		using engine = await createEngine(await languageByName(grammar), { api: 'strict', nodeStorage });
		const runtime = await portableRuntime(engine);
		const structure = { $path: path, $value: value };
		expect(String(engine.render(runtime.build(structure as never) as never)).trimEnd()).toBe(written);
		expect(String(engine.render(builderAt(scopeBuilders(engine, generated[grammar]), path)(structure as never) as never)).trimEnd()).toBe(written);
	});

	it.each(REFUSED)('%s %s refuses %j through the table and the generated builder', async (grammar, path, value) => {
		using engine = await createEngine(await languageByName(grammar), { api: 'strict', nodeStorage });
		const runtime = await portableRuntime(engine);
		const structure = { $path: path, $value: value };
		expect(() => runtime.build(structure as never)).toThrow();
		expect(() => builderAt(scopeBuilders(engine, generated[grammar]), path)(structure as never)).toThrow();
	});
});
