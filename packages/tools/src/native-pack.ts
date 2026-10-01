export interface PackedBinding {
	readonly binaryName: string;
	readonly loader: string;
	readonly typings: string;
}

export function nativePackGaps(entries: readonly string[], binding: PackedBinding, suffixes: readonly string[]): string[] {
	const packed = new Set(entries.map((entry) => entry.replace(/^package\//, '')));
	return [binding.loader, binding.typings, ...suffixes.map((suffix) => `${binding.binaryName}.${suffix}.node`)]
		.map((file) => `native/${file}`)
		.filter((file) => !packed.has(file));
}

export function unexpectedNativeBinaries(entries: readonly string[], binding: PackedBinding, suffixes: readonly string[]): string[] {
	const required = new Set(suffixes.map((suffix) => `native/${binding.binaryName}.${suffix}.node`));
	return entries
		.map((entry) => entry.replace(/^package\//, ''))
		.filter((file) => file.startsWith('native/') && file.endsWith('.node') && !required.has(file));
}
