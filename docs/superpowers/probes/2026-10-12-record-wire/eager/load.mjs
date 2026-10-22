import { createRequire } from 'node:module';
import { Storage } from './runtime.mjs';
import { builders, wrap } from './builders.mjs';
import { format, grammarNative } from './grammar-format.mjs';

export { grammarNative } from './grammar-format.mjs';

const require = createRequire(import.meta.url);
export const native = require('./native/eager-builder-probe.node');

export function setup(mode, firstWords = 4096) {
	const store = new Storage(mode, format, wrap, native, firstWords);
	return { store, build: builders(store) };
}

export function functionCase(build, name) {
	return build.function_item({ name: build.identifier(name), parameters: build.parameters(), body: build.block() });
}

const parser = new grammarNative.SittirEngine();

export function parseDeep(text) {
	const parsed = JSON.parse(parser.parse(text));
	try {
		if (parsed.errors.length !== 0) throw new Error('rendered function has parse errors');
		if (parser.hydrateRecord(parsed.treeId, 0, Infinity) === null) throw new Error('deep parse has no root record');
		return parsed.treeId;
	} catch (error) {
		grammarNative.disposeTree(parsed.treeId);
		throw error;
	}
}

export function disposeTrees(trees) {
	for (const tree of trees) grammarNative.disposeTree(tree);
}
