import { spawnSync } from 'node:child_process';
import { copyFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';

const directory = fileURLToPath(new URL('native/', import.meta.url));
const built = spawnSync('cargo', ['build', '--locked', '--release', '--manifest-path', join(directory, 'Cargo.toml')], {
  stdio: 'inherit'
});
if (built.status !== 0) process.exit(built.status ?? 1);
const target =
  process.env.CARGO_TARGET_DIR === undefined ? join(directory, 'target') : resolve(process.env.CARGO_TARGET_DIR);
const library =
  process.platform === 'darwin'
    ? 'libeager_builder_probe.dylib'
    : process.platform === 'win32'
      ? 'eager_builder_probe.dll'
      : 'libeager_builder_probe.so';
const output = join(directory, 'eager-builder-probe.node');
await copyFile(join(target, 'release', library), output);
console.log(
  JSON.stringify({
    output,
    sha256: createHash('sha256')
      .update(await readFile(output))
      .digest('hex')
  })
);
