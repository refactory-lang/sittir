import { realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { BOOTSTRAP_COMMAND, bootstrapDir, isBootstrapped } from './bootstrap.ts';

export interface PinnedBuild {
	readonly scm: typeof import('@sittir/scm');
	readonly typescript: typeof import('@sittir/typescript');
	readonly common: typeof import('@sittir/common');
	readonly utils: typeof import('@sittir/common/utils');
}

let loaded: Promise<PinnedBuild> | undefined;

async function importPinned(): Promise<PinnedBuild> {
	const dir = bootstrapDir();
	if (!isBootstrapped(dir)) throw new Error(`the pinned build is not built at ${dir}; build it with \`${BOOTSTRAP_COMMAND}\``);
	const resolvedCommon = createRequire(join(dir, 'packages/typescript/dist/index.js')).resolve('@sittir/common');
	const pinnedCommon = realpathSync(join(dir, 'packages/common'));
	if (!resolvedCommon.startsWith(pinnedCommon + sep)) {
		throw new Error(
			`pinned-build-unpinned: the pinned build's @sittir/common resolves to ${resolvedCommon}, outside ${pinnedCommon}, so this process runs the pin against another copy of @sittir/common. Read the pin in a child process under TSX_TSCONFIG_PATH=packages/codegen/tsconfig.pinned.json, as bindings/read.ts does, or run under node`
		);
	}
	const from = (path: string) => import(pathToFileURL(join(dir, path)).href);
	const [scm, typescript, common, utils] = await Promise.all([
		from('packages/scm/dist/index.js'),
		from('packages/typescript/dist/index.js'),
		from('packages/common/dist/index.js'),
		from('packages/common/dist/utils.js')
	]);
	return { scm, typescript, common, utils };
}

export function loadPinnedBuild(): Promise<PinnedBuild> {
	loaded ??= importPinned();
	loaded.catch(() => {
		loaded = undefined;
	});
	return loaded;
}
