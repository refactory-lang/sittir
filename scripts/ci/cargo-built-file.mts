// Usage: tsx scripts/ci/cargo-built-file.mts <cargo-messages.json> <manifest-path> <file>
//
// Prints the path of <file>, which the build script of the package at
// <manifest-path> wrote, from the messages `cargo build
// --message-format=json-render-diagnostics` printed for that build.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildScriptFile, parseBuildScriptOutputs, parseCargoArtifacts } from '../../packages/codegen/src/scripts/native-artifacts.ts';

const [messages, manifest, file] = process.argv.slice(2);
if (messages === undefined || manifest === undefined || file === undefined) throw new Error('usage: cargo-built-file.mts <cargo-messages.json> <manifest-path> <file>');
const stdout = readFileSync(messages, 'utf8');
console.log(buildScriptFile(parseCargoArtifacts(stdout), parseBuildScriptOutputs(stdout), resolve(manifest), file).replaceAll('\\', '/'));
