import { stripTypeScriptTypes } from 'node:module';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT } from '../../grammars.ts';

const Q11 = [
	{ lang: 'typescript', names: ['buildClassStaticBlock', 'buildFinallyClause', 'buildAmbientDeclarationGlobal', 'buildTypeQueryCallExpression'] },
	{ lang: 'python', names: ['buildSuiteBlock', 'buildSuiteBlockClassDeclaration'] },
	{ lang: 'rust', names: ['buildConstBlock', 'buildUnsafeBlock', 'buildTryBlock'] }
] as const;

const STORAGES = ['objects', 'records'] as const;

const OPTIONS = { marker: 'kept' };

type Recorded = { readonly builder: string; readonly args: readonly unknown[] };

function emittedFunction(text: string, name: string): string {
	const start = text.indexOf(`export function ${name}(...args`);
	if (start < 0) throw new Error(`no ${name} in the shipped factories`);
	const end = text.indexOf('\n}\n', start) + 2;
	return stripTypeScriptTypes(text.slice(start, end)).replace(/^export /m, '');
}

function callWrapper(text: string, name: string, args: readonly unknown[]): Recorded[] {
	const body = emittedFunction(text, name);
	const referenced = [...new Set(body.match(/\b_?build[A-Z]\w*/g) ?? [])].filter((n) => n !== name);
	const recorded: Recorded[] = [];
	const stubs = referenced.map((builder) => (...callArgs: unknown[]) => {
		recorded.push({ builder, args: callArgs });
		return { $type: builder, args: callArgs };
	});
	const kinds = new Proxy({}, { get: (_target, key) => String(key) });
	const wrapper = new Function(...referenced, 'TSKindId', `${body}\nreturn ${name};`)(...stubs, kinds) as (...a: unknown[]) => unknown;
	wrapper(...args);
	return recorded;
}

describe('a Q11 wrapper given no input builds its default and keeps any options passed', () => {
	for (const { lang, names } of Q11) {
		for (const storage of STORAGES) {
			const text = readFileSync(join(REPO_ROOT, `packages/${lang}/src/factories/${storage}.ts`), 'utf8');
			for (const name of names) {
				describe(`${lang} ${storage} ${name}`, () => {
					it('takes an explicit undefined input as omitted', () => {
						const recorded = callWrapper(text, name, [undefined]);
						expect(recorded.filter((r) => r.builder.startsWith('_'))).toHaveLength(1);
						const inner = recorded.filter((r) => !r.builder.startsWith('_'));
						if (emittedFunction(text, name).includes('...args.slice(1)')) {
							for (const call of inner) expect(call.args).not.toContain(undefined);
						} else {
							for (const call of inner) expect(call.args[0]).toBeUndefined();
						}
					});

					it('keeps the options passed alongside an undefined input', () => {
						const recorded = callWrapper(text, name, [undefined, OPTIONS]);
						expect(recorded.some((r) => r.args.includes(OPTIONS))).toBe(true);
					});

					it('builds the default with no arguments', () => {
						const recorded = callWrapper(text, name, []);
						expect(recorded.filter((r) => r.builder.startsWith('_'))).toHaveLength(1);
					});
				});
			}
		}
	}
});

