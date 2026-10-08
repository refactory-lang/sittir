/**
 * Measures: the native writer's own time per render and the layout table's
 *   size, with the JavaScript side and the napi decode left out. The timer
 *   sits inside the writer and is switched on by SITTIR_LAYOUT_STATS=1.
 * Needs:  fixtures (make-fixtures.sh) and a prototype variant built for rust
 *   and typescript (the switch is the prototype's; master ignores it).
 * Run (from the root of the checkout to measure):
 *   SITTIR_LAYOUT_STATS=1 ./node_modules/.bin/tsx <probes>/writer-stats.mts off 100 2> run-1.log
 *   Repeat for as many runs as wanted, then: python3 <probes>/writer-stats.py run-*.log
 * Prints (stderr): per file and width, `TARGET <file> <width>`, then one
 *   `LAYOUT off total_ns=…` or `LAYOUT on walk_ns=… finish_ns=… total_ns=…
 *   out=… text=… rows=… seams=… lists=… breakable=… broken=… table_bytes=…`
 *   line per render (400 renders after 300 warm-up renders), then `END`.
 */
import { FILES, engineFor, fixture } from './root.mts';

const widths = process.argv.slice(2).map((arg) => (arg === 'off' ? undefined : Number(arg)));
for (const [grammar, name, file, exportName, base] of FILES) {
	const node = await fixture(file, exportName);
	for (const width of widths) {
		const engine = await engineFor(grammar, { ...base, ...(width === undefined ? {} : { width }) });
		for (let i = 0; i < 300; i++) String(engine.render(node as never));
		console.error(`TARGET ${name} ${width ?? 'off'}`);
		for (let i = 0; i < 400; i++) String(engine.render(node as never));
		console.error('END');
	}
}
