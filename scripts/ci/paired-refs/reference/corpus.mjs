// A corpus written by fetch-corpora.py, read back with every file's sha256
// checked, and the tools measured on it: sittir's TypeScript engine and oxfmt,
// both loaded from the measured tree (oxfmt at the version its lockfile pins).
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export function loadCorpus(manifestPath) {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const dir = path.join(path.dirname(manifestPath), manifest.name);
  const sources = manifest.files.map(({ path: file, sha256 }) => {
    const data = readFileSync(path.join(dir, ...file.split('/')));
    assert.equal(createHash('sha256').update(data).digest('hex'), sha256, `${manifest.name} ${file}: changed since it was fetched`);
    return data.toString('utf8');
  });
  return { manifest, dir, paths: manifest.files.map((f) => f.path), sources, bytes: manifest.files.reduce((n, f) => n + f.bytes, 0) };
}

export async function loadSittir(tree, nodeStorage) {
  const language = (await import(pathToFileURL(path.join(tree, 'packages/typescript/dist/index.js')).href)).default;
  return language.createEngine({ nodeStorage });
}

const packageOf = (tree, name) => {
  const require = createRequire(path.join(tree, 'package.json'));
  const manifest = require.resolve(`${name}/package.json`);
  return { dir: path.dirname(manifest), version: JSON.parse(readFileSync(manifest, 'utf8')).version, require };
};

export async function loadOxfmt(tree) {
  const { version, require } = packageOf(tree, 'oxfmt');
  const { format } = await import(pathToFileURL(require.resolve('oxfmt')).href);
  return { format, version };
}

export const oxlintOf = (tree) => {
  const { dir, version } = packageOf(tree, 'oxlint');
  return { bin: path.join(dir, 'bin', 'oxlint'), version };
};
