// node section-hashes.mjs <old binary> <new binary> [<label>]
//
// Hashes every section of two builds of one binary and holds the allocated
// ones (what the loader maps: ELF SHF_ALLOC, every Mach-O section, a COFF
// section not marked discardable) to byte equality. A COFF section's content
// is its VirtualSize bytes; its raw data past them is file-alignment padding,
// listed as its own unallocated row. Prints a markdown table of
// every section and exits 1 when an allocated section differs, is missing on
// one side, or the formats differ. Sections nothing maps (symbol and string
// tables, debug sections) are listed but may differ: stripping removes them.
// The section list comes from the pinned toolchain's llvm-readobj.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const [oldFile, newFile, label = ''] = process.argv.slice(2);
if (!oldFile || !newFile) throw new Error('usage: section-hashes.mjs <old binary> <new binary> [<label>]');

function readobj() {
	if (process.env.LLVM_READOBJ) return process.env.LLVM_READOBJ;
	const sysroot = execFileSync('rustc', ['--print', 'sysroot'], { encoding: 'utf8' }).trim();
	const host = /^host: (.+)$/m.exec(execFileSync('rustc', ['-vV'], { encoding: 'utf8' }))?.[1];
	const tool = join(sysroot, 'lib', 'rustlib', host ?? '', 'bin', process.platform === 'win32' ? 'llvm-readobj.exe' : 'llvm-readobj');
	if (!host || !existsSync(tool)) throw new Error(`no llvm-readobj in ${tool}: add the toolchain's llvm-tools component`);
	return tool;
}

const number = (text) => (text.startsWith('0x') ? Number.parseInt(text.slice(2), 16) : Number.parseInt(text, 10));

function sections(file) {
	const text = execFileSync(readobj(), ['--sections', file], { encoding: 'utf8', maxBuffer: 1 << 28 });
	const format = /^Format: (.+)$/m.exec(text)?.[1] ?? 'unknown';
	const kind = /^elf/i.test(format) ? 'elf' : /mach-o/i.test(format) ? 'macho' : /coff/i.test(format) ? 'coff' : 'unknown';
	const bytes = readFileSync(file);
	const out = [];
	let current;
	let list;
	for (const raw of text.split('\n')) {
		const line = raw.trim();
		if (line === 'Section {') {
			current = { fields: {}, flags: [] };
			continue;
		}
		if (!current) continue;
		if (list) {
			if (line === ']') list = undefined;
			else current.flags.push(line.split(' ')[0]);
			continue;
		}
		if (/^(Flags|Characteristics|Attributes) \[/.test(line)) {
			list = true;
			continue;
		}
		if (line === '}') {
			out.push(...describe(kind, current, bytes));
			current = undefined;
			continue;
		}
		const at = line.indexOf(': ');
		if (at > 0) current.fields[line.slice(0, at)] = line.slice(at + 2);
	}
	return { format, kind, sections: out };
}

function describe(kind, { fields, flags }, bytes) {
	const first = (value) => (value ?? '').split(' ')[0];
	let name = first(fields.Name);
	let allocated;
	let offset;
	let size;
	let data = true;
	let padding = 0;
	if (kind === 'elf') {
		allocated = flags.includes('SHF_ALLOC');
		offset = number(first(fields.Offset));
		size = number(first(fields.Size));
		data = first(fields.Type) !== 'SHT_NOBITS';
	} else if (kind === 'macho') {
		name = `${first(fields.Segment)},${name}`;
		allocated = true;
		offset = number(first(fields.Offset));
		size = number(first(fields.Size));
		data = !/ZeroFill/i.test(fields.Type ?? '') && offset > 0;
	} else if (kind === 'coff') {
		allocated = !flags.includes('IMAGE_SCN_MEM_DISCARDABLE');
		offset = number(first(fields.PointerToRawData));
		const raw = number(first(fields.RawDataSize));
		size = Math.min(number(first(fields.VirtualSize)), raw);
		padding = raw - size;
		data = size > 0;
	} else throw new Error(`unknown binary format ${kind}`);
	const hash = (from, length) => createHash('sha256').update(bytes.subarray(from, from + length)).digest('hex');
	const section = { name, allocated, size, sha256: data ? hash(offset, size) : `no file data (${size} bytes)` };
	return padding > 0 ? [section, { name: `${name} file padding`, allocated: false, size: padding, sha256: hash(offset + size, padding) }] : [section];
}

const before = sections(oldFile);
const after = sections(newFile);
const problems = [];
if (before.format !== after.format) problems.push(`format ${before.format} -> ${after.format}`);
const keyed = (list) => {
	const map = new Map();
	const seen = new Map();
	for (const section of list.sections) {
		const count = seen.get(section.name) ?? 0;
		seen.set(section.name, count + 1);
		map.set(count ? `${section.name}#${count}` : section.name, section);
	}
	return map;
};
const oldMap = keyed(before);
const newMap = keyed(after);
const rows = [];
for (const name of [...new Set([...oldMap.keys(), ...newMap.keys()])]) {
	const a = oldMap.get(name);
	const b = newMap.get(name);
	const allocated = (a ?? b).allocated;
	const same = a !== undefined && b !== undefined && a.sha256 === b.sha256 && a.size === b.size;
	if (allocated && !same) problems.push(`${name}: ${a ? `${a.size} ${a.sha256.slice(0, 16)}` : 'absent'} -> ${b ? `${b.size} ${b.sha256.slice(0, 16)}` : 'absent'}`);
	rows.push(`| ${name} | ${allocated ? 'yes' : 'no'} | ${a?.size ?? '—'} | ${b?.size ?? '—'} | ${a?.sha256.slice(0, 16) ?? '—'} | ${b?.sha256.slice(0, 16) ?? '—'} | ${same ? 'same' : allocated ? '**DIFFERS**' : 'differs (stripped)'} |`);
}
console.log(`### ${label || newFile} (${after.format})\n`);
console.log('| section | allocated | old size | new size | old sha256 | new sha256 | |');
console.log('| --- | --- | --- | --- | --- | --- | --- |');
for (const row of rows) console.log(row);
console.log(problems.length ? `\n**${problems.length} allocated difference(s):** ${problems.join('; ')}\n` : '\nEvery allocated section is byte-identical.\n');
process.exitCode = problems.length ? 1 : 0;
