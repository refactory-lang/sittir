import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';

export const CARGO_MESSAGE_FORMAT = '--message-format=json-render-diagnostics';

export interface CargoArtifact {
	readonly packageId: string;
	readonly manifestPath: string;
	readonly target: string;
	readonly kinds: readonly string[];
	readonly filenames: readonly string[];
}

export interface BuildScriptOutput {
	readonly packageId: string;
	readonly outDir: string;
}

interface CompilerArtifactMessage {
	readonly reason?: string;
	readonly package_id?: string;
	readonly out_dir?: string;
	readonly manifest_path?: string;
	readonly target?: { readonly name?: string; readonly kind?: readonly string[] };
	readonly filenames?: readonly string[];
}

function messageOf(line: string): CompilerArtifactMessage | undefined {
	if (!line.startsWith('{')) return undefined;
	try {
		return JSON.parse(line) as CompilerArtifactMessage;
	} catch {
		return undefined;
	}
}

function artifactOf(message: CompilerArtifactMessage): CargoArtifact | undefined {
	const { package_id: packageId, manifest_path: manifestPath, target, filenames } = message;
	if (message.reason !== 'compiler-artifact' || packageId === undefined || manifestPath === undefined || target?.name === undefined || target.kind === undefined || filenames === undefined) return undefined;
	return { packageId, manifestPath, target: target.name, kinds: target.kind, filenames };
}

export function parseCargoArtifacts(stdout: string): readonly CargoArtifact[] {
	return stdout
		.split('\n')
		.map(messageOf)
		.flatMap((message) => (message === undefined ? [] : [artifactOf(message)]))
		.filter((artifact): artifact is CargoArtifact => artifact !== undefined);
}

export function parseBuildScriptOutputs(stdout: string): readonly BuildScriptOutput[] {
	return stdout
		.split('\n')
		.map(messageOf)
		.flatMap((message) => (message?.reason === 'build-script-executed' && message.package_id !== undefined && message.out_dir !== undefined ? [{ packageId: message.package_id, outDir: message.out_dir }] : []));
}

export function buildScriptFile(artifacts: readonly CargoArtifact[], outputs: readonly BuildScriptOutput[], manifestPath: string, file: string): string {
	const ids = new Set(artifactsOf(artifacts, manifestPath).map((artifact) => artifact.packageId));
	const found = outputs.find((output) => ids.has(output.packageId));
	if (found === undefined) throw new Error(`cargo reported no build script output for ${manifestPath}`);
	const path = join(found.outDir, file);
	if (!existsSync(path)) throw new Error(`the build script of ${manifestPath} wrote no ${file} in ${found.outDir}`);
	return path;
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
