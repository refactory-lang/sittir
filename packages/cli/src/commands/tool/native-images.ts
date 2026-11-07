import { type CommandModule, defineCommand } from '../../framework/command-module.ts';

export const nativeImages: CommandModule = {
	name: 'native-images',
	describe: 'List the symbols each built native image (ELF, Mach-O or PE) defines and imports, as JSON',
	register: (program) => {
		defineCommand(program, nativeImages)
			.argument('<images...>', 'Image files to read: an addon, the engine library or any shared library')
			.option('--defined <prefix>', 'List the defined (exported) symbols that start with <prefix>')
			.option('--imported <prefix>', 'List the imported symbols that start with <prefix>')
			.addHelpText(
				'after',
				"\nWith neither option, both lists hold every symbol. llvm-nm and llvm-readobj come from $LLVM_NM and $LLVM_READOBJ, then the pinned Rust toolchain's llvm-tools."
			)
			.action(async (images: string[], opts: { defined?: string; imported?: string }) => {
				const { nativeImages: runNativeImages } = await import('@sittir/tools');
				const code = await runNativeImages({ images, defined: opts.defined, imported: opts.imported });
				if (code !== 0) process.exitCode = code;
			});
	}
};
