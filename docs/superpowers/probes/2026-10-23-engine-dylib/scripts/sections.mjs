// What an image's bytes are, from its section table (`size -m` on macOS,
// `size -A` on Linux): machine code, Rust crate metadata (`.rustc`, read
// only by rustc when a crate links against the library), symbol and string
// tables (what the loader binds, plus `__LINKEDIT` on macOS), and the rest.
import { execFileSync } from 'node:child_process';
import { statSync } from 'node:fs';

const CODE = new Set(['__text', '__stubs', '.text', '.plt', '.plt.got', '.plt.sec']);
const METADATA = new Set(['.rustc']);
const SYMBOLS = new Set(['.dynsym', '.dynstr', '.gnu.hash', '.hash', '.symtab', '.strtab', '.gnu.version', '.gnu.version_r', '.gnu.version_d']);

/** Bytes of `file` by kind: { file, code, metadata, symbols, rest }. */
export function sections(file) {
	const result = { file: statSync(file).size, code: 0, metadata: 0, symbols: 0 };
	const add = (name, bytes) => {
		if (CODE.has(name)) result.code += bytes;
		else if (METADATA.has(name)) result.metadata += bytes;
		else if (SYMBOLS.has(name)) result.symbols += bytes;
	};
	if (process.platform === 'darwin') {
		const table = execFileSync('size', ['-m', file], { encoding: 'utf8' });
		for (const [, name, bytes, zerofill] of table.matchAll(/^\s*Section (\S+): (\d+)( \(zerofill\))?$/gm)) if (!zerofill) add(name, Number(bytes));
		result.symbols += Number(/^Segment __LINKEDIT: (\d+)$/m.exec(table)?.[1] ?? 0);
	} else {
		const table = execFileSync('size', ['-A', file], { encoding: 'utf8' });
		for (const [, name, bytes] of table.matchAll(/^(\S+)\s+(\d+)\s+\d+$/gm)) if (name !== '.bss' && name !== '.tbss') add(name, Number(bytes));
	}
	result.rest = result.file - result.code - result.metadata - result.symbols;
	return result;
}
