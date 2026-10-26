import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const storageBenchCliTimeout = 300_000;
export const storageBenchTestTimeout = storageBenchCliTimeout + 30_000;

export async function reportFor(args: string[]) {
	const directory = await mkdtemp(join(tmpdir(), 'sittir-storage-smoke-'));
	try {
		const output = join(directory, 'report.json');
		await promisify(execFile)(
			process.execPath,
			[
				'--import',
				'tsx',
				fileURLToPath(new URL('../../cli/src/cli.ts', import.meta.url)),
				'tool',
				'bench-storage',
				...args,
				'--output',
				output
			],
			{ timeout: storageBenchCliTimeout }
		);
		return JSON.parse(await readFile(output, 'utf8'));
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
}
