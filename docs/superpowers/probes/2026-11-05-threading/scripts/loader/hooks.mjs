import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const esbuild = createRequire(process.env.THREADING_ESBUILD)('esbuild');

export async function resolve(specifier, context, next) {
	try {
		return await next(specifier, context);
	} catch (error) {
		if (error?.code === 'ERR_MODULE_NOT_FOUND' && specifier.endsWith('.js') && context.parentURL?.endsWith('.ts'))
			return next(`${specifier.slice(0, -3)}.ts`, context);
		throw error;
	}
}

export async function load(url, context, next) {
	if (!url.startsWith('file:') || !/\.[cm]?ts$/.test(url)) return next(url, context);
	const path = fileURLToPath(url);
	const { code } = await esbuild.transform(await readFile(path, 'utf8'), {
		loader: 'ts',
		format: 'esm',
		target: `node${process.versions.node}`,
		sourcefile: path,
		keepNames: false
	});
	return { format: 'module', source: code, shortCircuit: true };
}
