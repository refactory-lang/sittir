import { nativeBuildEnv } from '@sittir/codegen/grammars';

const target = process.argv[2];
if (target === undefined) {
	console.error('usage: native-rustflags <target>');
	process.exit(1);
}
console.log(nativeBuildEnv(target, process.env).RUSTFLAGS ?? '');
