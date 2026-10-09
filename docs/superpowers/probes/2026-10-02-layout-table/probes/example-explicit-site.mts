/**
 * Shows: that an explicitly set site wins over the pass. splice.rs is
 *   rendered at width 80 three ways: nothing set; the site after an argument
 *   list's `(` set to its default (tight), which the pass must then leave
 *   alone; and the separator site of an argument list set to newline, which
 *   breaks every such list whatever the width.
 * Needs:  fixtures (make-fixtures.sh) and a prototype variant built for rust.
 * Run (from the root of the checkout to measure):
 *   ./node_modules/.bin/tsx <probes>/example-explicit-site.mts [tight-arm-id newline-arm-id]
 *   The arms are whitespace kind ids, which change with the grammar:
 *   site-admission.py prints them (`168=tight … 171=newline` for rust at the
 *   measured commits, the defaults here).
 * Prints: per case, the `if !source.is_char_boundary` call and the
 *   `pub fn apply_edits` signature, each line prefixed with its length; or
 *   the error if the options are refused.
 */
import { engineFor, fixture } from './root.mts';

const tight = Number(process.argv[2] ?? 168);
const newline = Number(process.argv[3] ?? 171);
const node = await fixture('rebuild-splice-rs.ts', 'rebuildSplice');
const show = (label: string, text: string) => {
	console.log(`--- ${label}`);
	const lines = text.split('\n');
	const from = lines.findIndex((line) => line.includes('if !source.is_char_boundary'));
	lines.slice(from, from + 4).forEach((line) => console.log(`[${String(line.length).padStart(3)}] ${line}`));
	const sig = lines.findIndex((line) => line.includes('pub fn apply_edits'));
	lines.slice(sig, sig + 5).forEach((line) => console.log(`[${String(line.length).padStart(3)}] ${line}`));
};
for (const [label, options] of [
	['width 80', { width: 80 }],
	['width 80, (arguments)/"("/after set to its default (tight)', { width: 80, arguments: { lparen: { after: tight } } }],
	['width 80, (arguments_elements) separator after set to newline', { width: 80, argumentsElements: { element: { separator: { comma: { after: newline } } } } }]
] as const) {
	try {
		const engine = await engineFor('rust', options);
		show(label, String(engine.render(node as never)));
	} catch (error) {
		console.log(`--- ${label}: ${(error as Error).message.slice(0, 300)}`);
	}
}
