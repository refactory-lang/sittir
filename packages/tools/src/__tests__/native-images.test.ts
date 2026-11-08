import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { coffBoundAtLoad, coffExports, coffImports, elfDataRelocations, imageFormat, machoBinds, nativeImagesMapped, nmSymbols, run, withPrefix } from '../native-images.ts';

const bytes = (...values: number[]): Uint8Array => Uint8Array.from([...values, 0, 0, 0, 0]);

describe('imageFormat', () => {
	it('reads the format from the magic bytes, whatever the file is named', () => {
		expect(imageFormat(bytes(0x7f, 0x45, 0x4c, 0x46), 'libsittir_engine.so')).toBe('elf');
		expect(imageFormat(bytes(0xcf, 0xfa, 0xed, 0xfe), 'sittir-python.darwin-arm64.node')).toBe('mach-o');
		expect(imageFormat(bytes(0x4d, 0x5a, 0x90, 0x00), 'sittir_engine.dll')).toBe('pe');
	});

	it('refuses a file that is no image, naming it', () => {
		expect(() => imageFormat(bytes(0x23, 0x21, 0x2f, 0x62), 'index.cjs')).toThrow(/index\.cjs is not an ELF, Mach-O or PE image/);
	});
});

describe('nmSymbols', () => {
	it('drops the leading underscore Mach-O gives every C name', () => {
		expect(nmSymbols('_ts_parser_new\n_ts_current_malloc\n__NSGetArgc\n', 'mach-o')).toEqual(['_NSGetArgc', 'ts_current_malloc', 'ts_parser_new']);
	});

	it('drops the version an ELF dynamic symbol carries', () => {
		expect(nmSymbols('ts_parser_new\nmemcpy@GLIBC_2.14\nmalloc@@GLIBC_2.2.5\n', 'elf')).toEqual(['malloc', 'memcpy', 'ts_parser_new']);
	});
});

describe('coff listings', () => {
	const exportsListing = [
		'File: sittir_engine.dll',
		'Format: COFF-x86-64',
		'Export {',
		'  Ordinal: 1',
		'  Name: ts_current_calloc',
		'  RVA: 0x1000',
		'}',
		'Export {',
		'  Ordinal: 2',
		'  Name: ts_parser_new',
		'  RVA: 0x2000',
		'}'
	].join('\n');
	const importsListing = [
		'File: sittir_python.node',
		'Import {',
		'  Name: sittir_engine.dll',
		'  ImportLookupTableRVA: 0x3000',
		'  Symbol: ts_current_malloc (0)',
		'  Symbol: ts_parser_new (12)',
		'}',
		'Import {',
		'  Name: KERNEL32.dll',
		'  Symbol: GetLastError (0)',
		'}'
	].join('\n');

	it('reads the export table names', () => {
		expect(coffExports(exportsListing)).toEqual(['ts_current_calloc', 'ts_parser_new']);
	});

	it('reads the imported symbol names, not the modules they come from', () => {
		expect(coffImports(importsListing)).toEqual(['GetLastError', 'ts_current_malloc', 'ts_parser_new']);
	});

	it('binds every import at load except a delay-loaded one', () => {
		const listing = [importsListing, 'DelayImport {', '  Name: dbghelp.dll', '  Symbol: SymInitializeW (0)', '}'].join('\n');
		expect(coffImports(listing)).toContain('SymInitializeW');
		expect(coffBoundAtLoad(listing)).toEqual(['GetLastError', 'ts_current_malloc', 'ts_parser_new']);
	});
});

describe('machoBinds', () => {
	it('reads the non-lazy bind table, dropping the leading underscore and a weak import mark', () => {
		const listing = [
			'sittir-scm.darwin-arm64.node:',
			'',
			'Bind table:',
			'segment  section            address    type       addend dylib            symbol',
			'__DATA_CONST __got              0x00784EF8 pointer         0 libsittir_engine __RNvNtCsgVoQTOcMGm4_13sittir_engine5stamp6LOADED',
			'__DATA_CONST __const            0x00762A98 pointer         0 libsittir_engine _ts_current_free',
			'__DATA_CONST __got              0x00784F08 pointer         0 libSystem        _dladdr (weak_import)'
		].join('\n');
		expect(machoBinds(listing)).toEqual(['_RNvNtCsgVoQTOcMGm4_13sittir_engine5stamp6LOADED', 'dladdr', 'ts_current_free']);
	});
});

describe('elfDataRelocations', () => {
	it('keeps the symbols a relocation other than a PLT slot names, without their version', () => {
		const listing = [
			'Relocations [',
			'  Section (8) .rela.dyn {',
			'    0x3DF8 R_X86_64_RELATIVE - 0x1130',
			'    0x3FD8 R_X86_64_GLOB_DAT _RNvNtCs1_13sittir_engine5stamp6LOADED 0x0',
			'    0x3FE0 R_AARCH64_GLOB_DAT __cxa_finalize@GLIBC_2.2.5 0x0',
			'  }',
			'  Section (9) .rela.plt {',
			'    0x4018 R_X86_64_JUMP_SLOT ts_parser_new 0x0',
			'  }',
			']'
		].join('\n');
		expect(elfDataRelocations(listing)).toEqual(['_RNvNtCs1_13sittir_engine5stamp6LOADED', '__cxa_finalize']);
	});
});

describe('withPrefix', () => {
	it('keeps the names that start with the prefix', () => {
		expect(withPrefix(['ts_current_free', 'ts_parser_new', 'malloc'], 'ts_current_')).toEqual(['ts_current_free']);
	});
});

describe('--stamp', () => {
	it('reports the engine stamp each image holds, reading no symbol table', async () => {
		const image = join(mkdtempSync(join(tmpdir(), 'sittir-images-')), 'addon.node');
		writeFileSync(image, Buffer.concat([Buffer.from([0x7f, 0x45, 0x4c, 0x46]), Buffer.from('sittir-engine-stamp:0.1.0@a\0')]));
		const log = vi.spyOn(console, 'log').mockImplementation(() => {});
		try {
			expect(await run({ images: [image], stamp: true })).toBe(0);
			expect(JSON.parse(log.mock.calls[0]![0] as string)).toEqual([{ image, format: 'elf', stamp: '0.1.0@a' }]);
		} finally {
			log.mockRestore();
		}
	});
});

describe('nativeImagesMapped', () => {
	it('keeps the engine, std and addon images a process mapped, in the order it mapped them', () => {
		const mapped = [
			'/usr/lib/libc.so.6',
			'/w/node_modules/sittir-python-linux-x64-gnu/sittir-python.linux-x64-gnu.node',
			'/w/node_modules/sittir-python-linux-x64-gnu/libsittir_engine.so',
			'/w/node_modules/sittir-python-linux-x64-gnu/libstd-0a1b2c3d4e5f6789.so',
			'/usr/lib/libstdc++.so.6',
			'/w/node_modules/sittir-rust-linux-x64-gnu/sittir-rust.linux-x64-gnu.node'
		];
		expect(nativeImagesMapped(mapped, 'linux-x64-gnu')).toEqual([
			{ image: mapped[1], kind: 'addon' },
			{ image: mapped[2], kind: 'engine' },
			{ image: mapped[3], kind: 'std' },
			{ image: mapped[5], kind: 'addon' }
		]);
	});

	it("names the engine by the platform's library name", () => {
		const mapped = ['C:\\w\\sittir_engine.dll', 'C:\\w\\libsittir_engine.so', 'C:\\w\\std-0a1b2c3d4e5f6789.dll'];
		expect(nativeImagesMapped(mapped, 'win32-x64-msvc')).toEqual([
			{ image: mapped[0], kind: 'engine' },
			{ image: mapped[2], kind: 'std' }
		]);
	});
});
