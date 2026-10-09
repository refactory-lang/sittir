import { createInterface } from 'node:readline';
import { BindingsSyntaxError } from './facts.ts';
import { bindingPatterns, readBindings, roundTripBindings } from './pinned-reader.ts';
import { PINNED_READER_MARKER, type PinnedReaderReply, type PinnedReaderRequest } from './read.ts';

const READS = { facts: readBindings, patterns: bindingPatterns, roundTrip: roundTripBindings };

async function answer({ id, mode, text }: PinnedReaderRequest): Promise<PinnedReaderReply> {
	try {
		return { id, value: await READS[mode](text) };
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
