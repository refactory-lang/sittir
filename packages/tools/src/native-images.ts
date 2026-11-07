import { execFileSync } from 'node:child_process';
import { closeSync, openSync, readSync } from 'node:fs';
import { load } from './codegen-surface.ts';

export type ImageFormat = 'elf' | 'mach-o' | 'pe';

export interface NativeImagesOptions {
	readonly images: readonly string[];
	readonly defined?: string;
	readonly imported?: string;
}

export interface ImageSymbols {
	readonly image: string;
	readonly format: ImageFormat;
	readonly defined?: readonly string[];
	readonly imported?: readonly string[];
}

interface SymbolTables {
	readonly defined: () => string[];
	readonly imported: () => string[];
}

const MAGIC: readonly (readonly [ImageFormat, readonly number[]])[] = [
	['elf', [0x7f, 0x45, 0x4c, 0x46]],
	['mach-o', [0xcf, 0xfa, 0xed, 0xfe]],
	['pe', [0x4d, 0x5a]]
];

export function imageFormat(head: Uint8Array, image: string): ImageFormat {
	const format = MAGIC.find(([, magic]) => magic.every((byte, i) => head[i] === byte))?.[0];
	if (format === undefined) throw new Error(`${image} is not an ELF, Mach-O or PE image`);
	return format;
}

const unique = (names: readonly string[]): string[] => [...new Set(names)].sort();

export function nmSymbols(listing: string, format: 'elf' | 'mach-o'): string[] {
	const names = listing
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line !== '');
	return unique(names.map((name) => (format === 'mach-o' ? name.replace(/^_/, '') : name.replace(/@.*$/, ''))));
}

export function coffExports(listing: string): string[] {
	return unique([...listing.matchAll(/^\s*Name: (\S+)$/gm)].map((match) => match[1]!));
}

export function coffImports(listing: string): string[] {
	return unique([...listing.matchAll(/^\s*Symbol: (\S+)/gm)].map((match) => match[1]!));
}

export const withPrefix = (names: readonly string[], prefix: string): string[] => names.filter((name) => name.startsWith(prefix));

function head(image: string): Uint8Array {
	const fd = openSync(image, 'r');
	try {
		const bytes = new Uint8Array(4);
		readSync(fd, bytes, 0, bytes.length, 0);
		return bytes;
	} finally {
		closeSync(fd);
	}
}

async function symbolTables(image: string, format: ImageFormat): Promise<SymbolTables> {
	const native = await load('nativeBinaryFreshness');
	const read = (tool: string, args: readonly string[]): string => execFileSync(tool, [...args, image], { encoding: 'utf8', maxBuffer: 1 << 28 });
	if (format === 'pe') {
		const readobj = native.llvmTool('llvm-readobj');
		return { defined: () => coffExports(read(readobj, ['--coff-exports'])), imported: () => coffImports(read(readobj, ['--coff-imports'])) };
	}
	const nm = native.llvmTool('llvm-nm');
	const table = format === 'elf' ? '--dynamic' : '--extern-only';
	return {
		defined: () => nmSymbols(read(nm, [table, '--defined-only', '--just-symbol-name']), format),
		imported: () => nmSymbols(read(nm, [table, '--undefined-only', '--just-symbol-name']), format)
	};
}

export async function run(opts: NativeImagesOptions): Promise<number> {
	const prefixes = opts.defined === undefined && opts.imported === undefined ? { defined: '', imported: '' } : opts;
	const reports: ImageSymbols[] = [];
	for (const image of opts.images) {
		const format = imageFormat(head(image), image);
		const tables = await symbolTables(image, format);
		reports.push({
			image,
			format,
			...(prefixes.defined === undefined ? {} : { defined: withPrefix(tables.defined(), prefixes.defined) }),
			...(prefixes.imported === undefined ? {} : { imported: withPrefix(tables.imported(), prefixes.imported) })
		});
	}
	console.log(JSON.stringify(reports, null, 2));
	return 0;
}
