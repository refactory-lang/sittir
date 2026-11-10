import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { filesUnder } from '../util/files.ts';

const C_SOURCE = /\.(?:c|cc|h)$/;

export function parserSourceFiles(src: string): string[] {
	const files = new Set(filesUnder(src));
	for (const file of files) {
		if (!C_SOURCE.test(file)) continue;
		for (const included of quotedIncludesOf(readFileSync(file, 'utf8'))) {
			const path = resolve(dirname(file), included);
			if (existsSync(path)) files.add(path);
		}
	}
	return [...files];
}

export function quotedIncludesOf(source: string): string[] {
	return [...source.matchAll(/^\s*#include\s+"([^"]+)"/gm)].map((match) => match[1]!);
}
