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
