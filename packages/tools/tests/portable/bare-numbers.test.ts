import { createEngine } from '@sittir/common';
import { portableRuntime, scopeBuilders } from '@sittir/common/engine';
import { describe, expect, it } from 'vitest';
import { TSKindId as PythonKindId } from '../../../python/src/kinds.ts';
import { portableBuild as pythonBuild } from '../../../python/src/portable/build.ts';
import { portableBuild as rustBuild } from '../../../rust/src/portable/build.ts';
import { TSKindId as RustKindId } from '../../../rust/src/kinds.ts';
import { TSKindId as TypeScriptKindId } from '../../../typescript/src/kinds.ts';
import { portableBuild as typescriptBuild } from '../../../typescript/src/portable/build.ts';
import { languageByName } from '../../src/languages.ts';

const generated: Readonly<Record<string, { readonly statement: { readonly return: (input: never) => unknown } }>> = { python: pythonBuild };

describe('a bare number in a slot that builds numbers is a number', () => {
	it.each([
		['python', 1, 'return 1'],
		['python', 1.5, 'return 1.5'],
		['python', PythonKindId.True, `return ${PythonKindId.True}`],
		['python', PythonKindId.None, `return ${PythonKindId.None}`],
		['rust', 1, 'return 1'],
		['rust', 1.5, 'return 1.5'],
		['rust', RustKindId.BooleanLiteral, `return ${RustKindId.BooleanLiteral}`],
		['typescript', 1, 'return 1'],
		['typescript', 1.5, 'return 1.5'],
		['typescript', 10n, 'return 10n'],
		['typescript', TypeScriptKindId.True, `return ${TypeScriptKindId.True}`]
	] as const)('%s expression: %s builds %j', async (grammar, value, rendered) => {
		using engine = await createEngine(await languageByName(grammar), { api: 'strict' });
		const runtime = await portableRuntime(engine);
		const structure = { $path: 'statement.return', expression: value };
		expect(engine.render(runtime.build(structure as never) as never).toString().replace(/;$/, '')).toBe(rendered);
		const module = generated[grammar];
		if (module !== undefined) expect(engine.render(scopeBuilders(engine, module).statement.return(structure as never) as never).toString()).toBe(rendered);
	});

	it('refuses a bigint where the slot builds no bigint', async () => {
		using engine = await createEngine(await languageByName('rust'), { api: 'strict' });
		const runtime = await portableRuntime(engine);
		expect(() => runtime.build({ $path: 'statement.return', expression: 10n } as never)).toThrow(/^portable build: statement\.return's expression builds no bigint number$/);
	});
});

describe('a bare number in a slot with no number taker', () => {
	const builds: Readonly<Record<string, object>> = { python: pythonBuild, rust: rustBuild, typescript: typescriptBuild };
	it.each([
		['python', 'declaration.function', PythonKindId.Identifier],
		['python', 'declaration.function', 1.5],
		['rust', 'declaration.module', RustKindId.Identifier],
		['typescript', 'declaration.module', TypeScriptKindId.Identifier]
	] as const)('%s %s refuses %s as its name', async (grammar, path, value) => {
		using engine = await createEngine(await languageByName(grammar), { api: 'strict' });
		const runtime = await portableRuntime(engine);
		const structure = { $path: path, name: value };
		const scalar = Number.isSafeInteger(value) ? 'integer' : 'float';
		expect(() => runtime.build(structure as never)).toThrow(`portable build: ${path}'s name builds no ${scalar} number`);
		const [namespace, kind] = path.split('.') as [string, string];
		const scoped = scopeBuilders(engine, builds[grammar]!) as Record<string, Record<string, (input: never) => unknown>>;
		expect(() => scoped[namespace]![kind]!(structure as never)).toThrow(`${path}.name builds no ${scalar} number`);
	});
});
