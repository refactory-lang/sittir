import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { BOOTSTRAP_COMMAND, bootstrapDir, isBootstrapped } from '../bootstrap/bootstrap.ts';

export interface PinnedScm {
	readonly scm: typeof import('@sittir/scm');
	readonly common: typeof import('@sittir/common');
	readonly utils: typeof import('@sittir/common/utils');
}

let loaded: Promise<PinnedScm> | undefined;

async function importPinned(): Promise<PinnedScm> {
	const dir = bootstrapDir();
	if (!isBootstrapped(dir)) throw new Error(`the pinned @sittir/scm is not built at ${dir}; build it with \`${BOOTSTRAP_COMMAND}\``);
	const from = (path: string) => import(pathToFileURL(join(dir, path)).href);
	const [scm, common, utils] = await Promise.all([
		from('packages/scm/dist/index.js'),
		from('packages/common/dist/index.js'),
		from('packages/common/dist/utils.js')
	]);
	return { scm, common, utils };
}

export function loadPinnedScm(): Promise<PinnedScm> {
	loaded ??= importPinned();
	loaded.catch(() => {
		loaded = undefined;
	});
	return loaded;
}
