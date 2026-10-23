// The shared libraries this process has mapped, by path: vmmap on macOS,
// /proc/self/maps on Linux, the module list on Windows.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

/** Every mapped image whose path contains one of `needles`, each path once. */
export function mappedImages(needles) {
	let paths;
	if (process.platform === 'linux') {
		paths = readFileSync('/proc/self/maps', 'utf8')
			.split('\n')
			.map((line) => line.trim().split(/\s+/).slice(5).join(' '))
			.filter((path) => path.startsWith('/'));
	} else if (process.platform === 'darwin') {
		paths = execFileSync('vmmap', ['-w', String(process.pid)], { encoding: 'utf8', maxBuffer: 1 << 28 })
			.split('\n')
			.filter((line) => line.startsWith('__TEXT'))
			.map((line) => /SM=\S+\s+(\/.*)$/.exec(line)?.[1])
			.filter(Boolean);
	} else {
		paths = execFileSync('powershell', ['-NoProfile', '-Command', `(Get-Process -Id ${process.pid}).Modules | ForEach-Object { $_.FileName }`], {
			encoding: 'utf8'
		})
			.split(/\r?\n/)
			.map((line) => line.trim())
			.filter(Boolean);
	}
	const matching = paths.filter((path) => needles.some((needle) => path.toLowerCase().includes(needle)));
	return [...new Set(matching)].sort();
}
