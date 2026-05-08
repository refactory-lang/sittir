import { readFileSync, writeFileSync } from 'node:fs';
import { createEngine, ir, replace, wrap } from '@sittir/rust';

export function rewritePrintlnCalls(files: Iterable<string>) {
	const engine = createEngine();
	const changedFiles: string[] = [];

	for (const file of files) {
		const source = readFileSync(file, 'utf8');
		const tree = engine.parseAndRead(source);
		const matches = engine.findAndRead(source, 'println!($...ARGS)');
		if (!matches.length) continue;

		const edits = matches.map((match) =>
			replace(
				match,
				ir.macroInvocation.from({
					macro: 'log::info!',
					args: wrap(match, tree).arguments()
				})
			)
		);

		writeFileSync(file, engine.applyEdits(source, edits));
		changedFiles.push(file);
	}

	return changedFiles;
}
