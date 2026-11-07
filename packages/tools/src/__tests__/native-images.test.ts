import { describe, expect, it } from 'vitest';
import { coffExports, coffImports, imageFormat, nmSymbols, withPrefix } from '../native-images.ts';

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
});

describe('withPrefix', () => {
	it('keeps the names that start with the prefix', () => {
		expect(withPrefix(['ts_current_free', 'ts_parser_new', 'malloc'], 'ts_current_')).toEqual(['ts_current_free']);
	});
});
