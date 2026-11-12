// Usage: node admit.mjs <tree> <corpora-dir>
// Admits the files of each corpus fetch-corpora.py wrote that both parsers
// accept, so every tool is measured on the same bytes: sittir's TypeScript
// parse reports no ERROR or MISSING region ($errors), and oxfmt's format()
// reports no error. Writes <corpora-dir>/<name>.admitted.json (the pin, the
// admitted files and the refused ones with each parser's error count) and
// prints one line per corpus.
import { readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { loadCorpus, loadOxfmt, loadSittir } from './corpus.mjs';

const [tree, dir] = process.argv.slice(2).map((p) => path.resolve(p));
const engine = await loadSittir(tree, 'object');
const { format, version } = await loadOxfmt(tree);
try {
  for (const name of readdirSync(dir).filter((f) => f.endsWith('.json') && !f.endsWith('.admitted.json')).sort()) {
    const { manifest, sources } = loadCorpus(path.join(dir, name));
    const admitted = [];
    const refused = [];
    for (const [i, file] of manifest.files.entries()) {
      const sittirErrors = engine.parse(sources[i]).$errors.length;
      const oxfmtErrors = (await format(file.path, sources[i], {})).errors.length;
      if (sittirErrors === 0 && oxfmtErrors === 0) admitted.push(file);
      else refused.push({ ...file, sittirErrors, oxfmtErrors });
    }
    const bytes = admitted.reduce((n, f) => n + f.bytes, 0);
    writeFileSync(path.join(dir, name.replace(/\.json$/, '.admitted.json')), JSON.stringify({ ...manifest, oxfmt: version, files: admitted, refused }, null, 1) + '\n');
    console.log(`${manifest.name} ${manifest.commit.slice(0, 12)}: ${admitted.length} of ${manifest.files.length} files admitted, ${(bytes / 1e6).toFixed(2)} MB; refused by sittir ${refused.filter((f) => f.sittirErrors).length}, by oxfmt ${refused.filter((f) => f.oxfmtErrors).length}`);
  }
} finally {
  engine.dispose();
}
