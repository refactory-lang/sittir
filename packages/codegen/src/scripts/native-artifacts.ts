import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';

export const CARGO_MESSAGE_FORMAT = '--message-format=json-render-diagnostics';

export interface CargoArtifact {
	readonly manifestPath: string;
	readonly target: string;
	readonly kinds: readonly string[];
	readonly filenames: readonly string[];
}

interface CompilerArtifactMessage {
	readonly reason?: string;
	readonly manifest_path?: string;
	readonly target?: { readonly name?: string; readonly kind?: readonly string[] };
	readonly filenames?: readonly string[];
}

function artifactOf(line: string): CargoArtifact | undefined {
	if (!line.startsWith('{')) return undefined;
	let message: CompilerArtifactMessage;
	try {
		message = JSON.parse(line) as CompilerArtifactMessage;
	} catch {
		return undefined;
	}
	const { manifest_path: manifestPath, target, filenames } = message;
	if (message.reason !== 'compiler-artifact' || manifestPath === undefined || target?.name === undefined || target.kind === undefined || filenames === undefined) return undefined;
	return { manifestPath, target: target.name, kinds: target.kind, filenames };
}

export function parseCargoArtifacts(stdout: string): readonly CargoArtifact[] {
	return stdout
		.split('\n')
		.map(artifactOf)
		.filter((artifact): artifact is CargoArtifact => artifact !== undefined);
}

function artifactsOf(artifacts: readonly CargoArtifact[], manifestPath: string): readonly CargoArtifact[] {
	return artifacts.filter((artifact) => resolve(artifact.manifestPath) === resolve(manifestPath));
}

export function artifactFile(artifacts: readonly CargoArtifact[], manifestPath: string, file: string): string {
	const found = artifactsOf(artifacts, manifestPath)
		.flatMap((artifact) => artifact.filenames)
		.find((named) => basename(named) === file);
	if (found === undefined) throw new Error(`cargo named no ${file} among the artifacts it built for ${manifestPath}`);
	return found;
}

const DYNAMIC_LIBRARY = /\.(dll|so|dylib)$/;

function sameFile(left: string, right: string): boolean {
	const [a, b] = [statSync(left, { bigint: true }), statSync(right, { bigint: true })];
	if (a.dev === b.dev && a.ino === b.ino) return true;
	return a.size === b.size && readFileSync(left).equals(readFileSync(right));
}

export function linkerMapFile(artifacts: readonly CargoArtifact[], manifestPath: string, packageName: string): string {
	const library = artifactsOf(artifacts, manifestPath).find((artifact) => artifact.kinds.includes('cdylib'));
	const image = library?.filenames.find((named) => DYNAMIC_LIBRARY.test(named));
	if (library === undefined || image === undefined) throw new Error(`cargo built no cdylib for ${manifestPath}`);
	const buildRoot = join(dirname(image), 'build', packageName);
	const unit = existsSync(buildRoot)
		? readdirSync(buildRoot)
				.map((hash) => join(buildRoot, hash, 'out', basename(image)))
				.find((candidate) => existsSync(candidate) && sameFile(candidate, image))
		: undefined;
	if (unit === undefined) throw new Error(`${image}, which cargo named for ${packageName}, is no build output of it: its linker map cannot be placed`);
	return join(dirname(unit), `${library.target.replaceAll('-', '_')}.map`);
}
