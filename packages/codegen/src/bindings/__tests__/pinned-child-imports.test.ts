import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { expect, it } from 'vitest';
import { REPO_ROOT } from '../../grammars.ts';
import { moduleClosure, runtimeSpecifiers } from '../../scripts/module-closure.ts';
import { CHILD_ENTRY } from '../read.ts';

type Export = string | { readonly import?: string };

const exportTarget = (specifier: string): string | undefined => {
	const [, name, ...rest] = specifier.split('/');
	const manifest = JSON.parse(readFileSync(join(REPO_ROOT, 'packages', name!, 'package.json'), 'utf8')) as { readonly exports?: Readonly<Record<string, Export>> };
	const target = manifest.exports?.[rest.length === 0 ? '.' : `./${rest.join('/')}`];
	return typeof target === 'string' ? target : target?.import;
};

it("loads every workspace module the pinned reader's child runs from its package's source, never its build", () => {
	const built = moduleClosure(REPO_ROOT, [relative(REPO_ROOT, CHILD_ENTRY)]).flatMap((file) =>
		runtimeSpecifiers(readFileSync(join(REPO_ROOT, file), 'utf8'))
			.filter((specifier) => specifier.startsWith('@sittir/') && exportTarget(specifier)?.startsWith('./src/') !== true)
			.map((specifier) => `${file}: ${specifier} -> ${exportTarget(specifier)}`)
	);
	expect(built).toEqual([]);
});
