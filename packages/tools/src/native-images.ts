import { execFileSync } from 'node:child_process';
import { closeSync, openSync, readSync } from 'node:fs';
import { engineStampOf } from '@sittir/common/engine';
import { type LlvmTool, load } from './codegen-surface.ts';

export type ImageFormat = 'elf' | 'mach-o' | 'pe';

export type SymbolList = 'defined' | 'imported' | 'boundAtLoad';

const SYMBOL_LISTS: readonly SymbolList[] = ['defined', 'imported', 'boundAtLoad'];

export interface ImageQuery {
	readonly defined?: string;
	readonly imported?: string;
	readonly boundAtLoad?: string;
	readonly stamp?: boolean;
}

export interface NativeImagesOptions extends ImageQuery {
	readonly images: readonly string[];
}

export interface ImageSymbols {
	readonly image: string;
	readonly format: ImageFormat;
	readonly stamp?: string;
	readonly defined?: readonly string[];
	readonly imported?: readonly string[];
	readonly boundAtLoad?: readonly string[];
}

type SymbolTables = Readonly<Record<SymbolList, () => string[]>>;

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

interface CoffImport {
	readonly delayed: boolean;
	readonly symbol: string;
}

const coffImportTable = (listing: string): CoffImport[] =>
	[...listing.matchAll(/^(Import|DelayImport) \{$([\s\S]*?)^\}$/gm)].flatMap((block) =>
		[...block[2]!.matchAll(/^\s*Symbol: (\S+)/gm)].map((symbol) => ({ delayed: block[1] === 'DelayImport', symbol: symbol[1]! }))
	);

export function coffImports(listing: string): string[] {
	return unique(coffImportTable(listing).map((entry) => entry.symbol));
}

export function coffBoundAtLoad(listing: string): string[] {
	return unique(coffImportTable(listing).filter((entry) => !entry.delayed).map((entry) => entry.symbol));
}

export function machoBinds(listing: string): string[] {
	return unique([...listing.matchAll(/^\S+\s+\S+\s+0x[0-9A-Fa-f]+\s+\S+\s+-?\d+\s+\S+\s+(\S+)(?: \(weak_import\))?$/gm)].map((match) => match[1]!.replace(/^_/, '')));
}

export function elfDataRelocations(listing: string): string[] {
	return unique(
		[...listing.matchAll(/^\s*0x[0-9A-Fa-f]+ (R_\w+) (\S+)/gm)]
			.filter((match) => !match[1]!.endsWith('_JUMP_SLOT') && match[2] !== '-')
			.map((match) => match[2]!.replace(/@.*$/, ''))
	);
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
	const read = (tool: LlvmTool, args: readonly string[]): string =>
		execFileSync(native.llvmTool(tool), [...args, image], { encoding: 'utf8', maxBuffer: 1 << 28 });
	if (format === 'pe') {
		return {
			defined: () => coffExports(read('llvm-readobj', ['--coff-exports'])),
			imported: () => coffImports(read('llvm-readobj', ['--coff-imports'])),
			boundAtLoad: () => coffBoundAtLoad(read('llvm-readobj', ['--coff-imports']))
		};
	}
	const table = format === 'elf' ? '--dynamic' : '--extern-only';
	const imported = (): string[] => nmSymbols(read('llvm-nm', [table, '--undefined-only', '--just-symbol-name']), format);
	return {
		defined: () => nmSymbols(read('llvm-nm', [table, '--defined-only', '--just-symbol-name']), format),
		imported,
		boundAtLoad:
			format === 'mach-o'
				? () => machoBinds(read('llvm-objdump', ['--macho', '--bind']))
				: () => {
						const imports = new Set(imported());
						return elfDataRelocations(read('llvm-readobj', ['--relocs'])).filter((name) => imports.has(name));
					}
	};
}

export async function imageSymbols(image: string, query: ImageQuery): Promise<ImageSymbols> {
	const format = imageFormat(head(image), image);
	const prefixes: ImageQuery = SYMBOL_LISTS.some((list) => query[list] !== undefined) || query.stamp === true ? query : { defined: '', imported: '' };
	const listed = SYMBOL_LISTS.flatMap((list) => {
		const prefix = prefixes[list];
		return prefix === undefined ? [] : [[list, prefix] as const];
	});
	const lists: { -readonly [List in SymbolList]?: readonly string[] } = {};
	if (listed.length > 0) {
		const tables = await symbolTables(image, format);
		for (const [list, prefix] of listed) lists[list] = withPrefix(tables[list](), prefix);
	}
	return { image, format, ...(query.stamp === true ? { stamp: engineStampOf(image) } : {}), ...lists };
}

export async function run(opts: NativeImagesOptions): Promise<number> {
	const reports: ImageSymbols[] = [];
	for (const image of opts.images) reports.push(await imageSymbols(image, opts));
	console.log(JSON.stringify(reports, null, 2));
	return 0;
}
