/**
 * Shows: the layout table itself, row by row, for the smallest render that
 *   has a breakable list (fixtures/tiny.rs: one call with two arguments), once
 *   where it fits and once where it must break.
 * Needs:  fixtures (make-fixtures.sh) and the validation variant built for
 *   rust (SITTIR_LAYOUT_DUMP is its switch).
 * Run (from the root of the checkout to measure):
 *   SITTIR_LAYOUT_DUMP=1 ./node_modules/.bin/tsx <probes>/example-table-dump.mts [width...]   default: 100 20
 * Prints (stderr): per width, the table's rows as the writer filled them,
 *   then the rendering.
 */
import { engineFor, fixture } from './root.mts';

const node = await fixture('rebuild-tiny-rs.ts', 'rebuildTiny');
const widths = process.argv.length > 2 ? process.argv.slice(2).map(Number) : [100, 20];
for (const width of widths) {
	const engine = await engineFor('rust', { width });
	console.error(`WIDTH ${width}`);
	console.error(String(engine.render(node as never)));
}
