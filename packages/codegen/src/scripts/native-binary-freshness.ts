import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

export interface HostBinaryFreshness {
	rel: string;
	binaryMtimeMs: number;
	newestInputMtimeMs: number;
	newestInputRel: string;
	stale: boolean;
}

function walkMtimes(root: string, repoRoot: string, newest: { mtimeMs: number; rel: string }): void {
	if (!existsSync(root)) return;
	const stat = statSync(root);
	if (stat.isFile()) {
		if (stat.mtimeMs > newest.mtimeMs) {
			newest.mtimeMs = stat.mtimeMs;
			newest.rel = root.slice(repoRoot.length + 1);
		}
		return;
	}
	if (stat.isDirectory()) {
		for (const name of readdirSync(root)) walkMtimes(join(root, name), repoRoot, newest);
	}
}

export function hostBinaryFreshnessFor(repoRoot: string, grammar: string): HostBinaryFreshness[] {
	const crateDir = join(repoRoot, `rust/crates/sittir-${grammar}`);
	if (!existsSync(crateDir)) return [];
	const binaries = readdirSync(crateDir).filter((name) => name.endsWith('.node'));
	if (binaries.length === 0) return [];

	const newest = { mtimeMs: 0, rel: '' };
	walkMtimes(join(crateDir, 'src'), repoRoot, newest);
	walkMtimes(join(crateDir, 'templates'), repoRoot, newest);

	return binaries.map((name) => {
		const binaryMtimeMs = statSync(join(crateDir, name)).mtimeMs;
		return {
			rel: `rust/crates/sittir-${grammar}/${name}`,
			binaryMtimeMs,
			newestInputMtimeMs: newest.mtimeMs,
			newestInputRel: newest.rel,
			stale: binaryMtimeMs < newest.mtimeMs
		};
	});
}

export function assertNativeBinaryFresh(repoRoot: string, grammar: string): void {
	const stale = hostBinaryFreshnessFor(repoRoot, grammar).filter((b) => b.stale);
	if (stale.length === 0) return;
	const lines = stale.map(
		(b) =>
			`  ${b.rel} is OLDER than ${b.newestInputRel} — the binary was built before the current ` +
			`generated sources/templates and would validate stale code.`
	);
	throw new Error(
		`Stale native binary for grammar '${grammar}':\n${lines.join('\n')}\n` +
			`Rebuild it:\n  pnpm exec tsx packages/cli/src/cli.ts gen --grammar ${grammar} --all --output packages/${grammar}/src\n` +
			`(or: pnpm -C rust/crates/sittir-${grammar} run build)`
	);
}
