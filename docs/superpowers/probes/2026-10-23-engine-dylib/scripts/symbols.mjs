// What a built image links and exports: its install name or soname, its
// search path, the libraries it needs, and the tree-sitter runtime symbols
// (`ts_*`) it defines and leaves undefined.
//
// macOS: nm and otool. Linux: nm -D and readelf. Windows: llvm-readobj from
// the rustup `llvm-tools` component (the export and import tables).
import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const run = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 28 });
const runtime = (names) => names.filter((name) => /^_?ts_/.test(name));
const allocator = (names) => runtime(names).filter((name) => /ts_current_/.test(name)).map((name) => name.replace(/^_/, '')).sort();

function llvmTool(tool) {
	const sysroot = run('rustc', ['--print', 'sysroot']).trim();
	const host = /^host: (.+)$/m.exec(run('rustc', ['-vV']))[1];
	const dir = join(sysroot, 'lib', 'rustlib', host, 'bin');
	const file = readdirSync(dir).find((name) => name === `${tool}.exe` || name === tool);
	if (!file) throw new Error(`${tool} not in ${dir}: rustup component add llvm-tools`);
	return join(dir, file);
}

/** The link facts of one image. */
export function linkFacts(image) {
	if (process.platform === 'darwin') {
		const loads = run('otool', ['-l', image]);
		return {
			id: run('otool', ['-D', image]).split('\n')[1]?.trim() || null,
			rpaths: [...loads.matchAll(/cmd LC_RPATH\n\s+cmdsize \d+\n\s+path (\S+)/g)].map((m) => m[1]),
			needs: run('otool', ['-L', image]).split('\n').slice(1).map((line) => line.trim().split(' ')[0]).filter(Boolean),
			definesRuntime: runtime(run('nm', ['-gU', image]).split('\n').map((line) => line.trim().split(/\s+/)[2]).filter(Boolean)).length,
			needsRuntime: runtime(run('nm', ['-u', image]).split('\n').map((line) => line.trim())).length,
			needsAllocator: allocator(run('nm', ['-u', image]).split('\n').map((line) => line.trim()))
		};
	}
	if (process.platform === 'linux') {
		const dynamic = run('readelf', ['-d', image]);
		const symbols = (flag) => run('nm', ['-D', flag, image]).split('\n').map((line) => line.trim().split(/\s+/).pop()).filter(Boolean);
		return {
			id: /\(SONAME\).*\[(.+)\]/.exec(dynamic)?.[1] ?? null,
			rpaths: [...dynamic.matchAll(/\((?:RUNPATH|RPATH)\).*\[(.+)\]/g)].map((m) => m[1]),
			needs: [...dynamic.matchAll(/\(NEEDED\).*\[(.+)\]/g)].map((m) => m[1]),
			definesRuntime: runtime(symbols('--defined-only')).length,
			needsRuntime: runtime(symbols('--undefined-only')).length,
			needsAllocator: allocator(symbols('--undefined-only'))
		};
	}
	const readobj = llvmTool('llvm-readobj');
	const exportsTable = run(readobj, ['--coff-exports', image]);
	const importsTable = run(readobj, ['--coff-imports', image]);
	const needs = [...importsTable.matchAll(/^\s*Name: (\S+\.(?:dll|DLL|node))$/gm)].map((m) => m[1]);
	const importedSymbols = [...importsTable.matchAll(/^\s*Symbol: (\S+)/gm)].map((m) => m[1]);
	return {
		id: null,
		rpaths: [],
		needs: [...new Set(needs)],
		definesRuntime: runtime([...exportsTable.matchAll(/^\s*Name: (\S+)$/gm)].map((m) => m[1])).length,
		needsRuntime: runtime(importedSymbols).length,
		needsAllocator: allocator(importedSymbols)
	};
}
