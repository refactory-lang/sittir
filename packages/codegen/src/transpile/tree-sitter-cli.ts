import { execFileSync, type StdioOptions } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);

function treeSitterCliPath(): string {
	const manifestPath = require.resolve('tree-sitter-cli/package.json');
	const manifest: { bin: Record<string, string> } = JSON.parse(readFileSync(manifestPath, 'utf8'));
	return join(dirname(manifestPath), manifest.bin['tree-sitter']!);
}

export function runTreeSitterCli(args: readonly string[], cwd: string, stdio: StdioOptions): void {
	execFileSync(process.execPath, [treeSitterCliPath(), ...args], { cwd, stdio });
}
