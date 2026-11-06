import { spawnSync } from 'node:child_process';
import { copyFile, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';

const directory = fileURLToPath(new URL('native/', import.meta.url));
const releaseProfile = (await readFile(new URL('../../../../../Cargo.toml', import.meta.url), 'utf8'))
  .split(/(?=^\[)/m)
  .find((section) => section.startsWith('[profile.release]'));
if (releaseProfile === undefined) throw new Error('workspace release profile is missing');
const profileDirectory = await mkdtemp(join(tmpdir(), 'sittir-eager-profile-'));
let built: ReturnType<typeof spawnSync>;
try {
  const config = join(profileDirectory, 'profile.toml');
  await writeFile(config, releaseProfile);
  built = spawnSync(
    'cargo',
    ['--config', config, 'build', '--locked', '--release', '--manifest-path', join(directory, 'Cargo.toml')],
    {
      stdio: 'inherit'
    }
  );
} finally {
  await rm(profileDirectory, { recursive: true });
}
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
    releaseProfileSha256: createHash('sha256').update(releaseProfile).digest('hex'),
    sha256: createHash('sha256')
      .update(await readFile(output))
      .digest('hex')
  })
);
