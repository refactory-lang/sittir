import { createInterface } from 'node:readline';
import { BindingsSyntaxError } from './facts.ts';
import { flagsModuleInProcess } from './flags-module.ts';
import { bindingPatternsInProcess, readBindingsInProcess, roundTripBindingsInProcess } from './pinned-reader.ts';
import { exportedStringsInProcess } from './pinned-typescript.ts';
import { vocabularyDeclaredInProcess, vocabularyFeatureIndexInProcess } from './pinned-vocabulary.ts';
import { PINNED_READER_MARKER, type PinnedInput, type PinnedOutput, type PinnedReaderMode, type PinnedReaderReply, type PinnedReaderRequest } from './read.ts';

const READS: { readonly [M in PinnedReaderMode]: (input: PinnedInput<M>) => Promise<PinnedOutput<M>> } = {
	facts: readBindingsInProcess,
	patterns: bindingPatternsInProcess,
	roundTrip: roundTripBindingsInProcess,
	flagsModule: flagsModuleInProcess,
	vocabularyDeclared: vocabularyDeclaredInProcess,
	vocabularyFeatureIndex: vocabularyFeatureIndexInProcess,
	exportedStrings: exportedStringsInProcess
};

const run = <M extends PinnedReaderMode>({ mode, input }: PinnedReaderRequest<M>): Promise<PinnedOutput<M>> => READS[mode](input);

async function answer(request: PinnedReaderRequest): Promise<PinnedReaderReply> {
	const { id } = request;
	try {
		return { id, value: await run(request) };
	} catch (error) {
		if (error instanceof BindingsSyntaxError) return { id, syntaxLines: error.lines };
		return { id, error: error instanceof Error ? (error.stack ?? error.message) : String(error) };
	}
}

let queue = Promise.resolve();
createInterface({ input: process.stdin })
	.on('line', (line) => {
		const request = JSON.parse(line) as PinnedReaderRequest;
		queue = queue.then(async () => {
			process.stdout.write(`${PINNED_READER_MARKER}${JSON.stringify(await answer(request))}\n`);
		});
	})
	.on('close', () => {
		void queue.then(() => process.exit(0));
	});
