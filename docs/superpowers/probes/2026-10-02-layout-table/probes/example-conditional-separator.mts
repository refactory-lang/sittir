/**
 * Shows: the conditional trailing separator. Three struct literals in
 *   splice.rs are built with "trailing separator only when the list is
 *   broken"; the region is printed at several widths so the separator can be
 *   seen appearing with the line breaks and gone when the list fits.
 * Needs:  fixtures (make-fixtures.sh) and the measured variant of the
 *   prototype built for rust (the validation variant has no conditional
 *   separator).
 * Run (from the root of the checkout to measure):
 *   ./node_modules/.bin/tsx <probes>/example-conditional-separator.mts [width...]   default: off 100 90 80 70
 * Prints: per width, the lines from `for e in &edits` to the next comment,
 *   each prefixed with its length.
 */
import { engineFor, fixture } from './root.mts';

const node = await fixture('rebuild-splice-cond-rs.ts', 'rebuildSpliceConditional');
const widths = process.argv.length > 2 ? process.argv.slice(2) : ['off', '100', '90', '80', '70'];
for (const arg of widths) {
	const engine = await engineFor('rust', arg === 'off' ? {} : { width: Number(arg) });
	const lines = String(engine.render(node as never)).split('\n');
	console.log(`--- width ${arg}`);
	const from = lines.findIndex((line) => line.includes('for e in &edits'));
	const to = lines.findIndex((line, i) => i > from && line.includes('Sort descending'));
	lines.slice(from, to).forEach((line) => console.log(`[${String(line.length).padStart(3)}] ${line}`));
}
