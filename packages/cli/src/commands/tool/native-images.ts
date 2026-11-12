import type { Command } from 'commander';
import { type CommandModule, defineCommand } from '../../framework/command-module.ts';

export const nativeImages: CommandModule = {
	name: 'native-images',
	describe: 'List the symbols each built native image (ELF, Mach-O or PE) defines, imports and binds at load, the engine stamp it holds, or the native images a process mapped, as JSON',
	register: (program) => {
		defineCommand(program, nativeImages)
			.argument('[images...]', 'Image files to read: an addon, the engine library or any shared library')
			.option(
				'--mapped <script>',
				'Run <script> in a fresh Node process, then list the addon, engine and std images the process mapped, in the order it mapped them, with the engine stamp each engine holds. Takes no images'
			)
			.option('--defined <prefix>', 'List the defined (exported) symbols that start with <prefix>')
			.option('--imported <prefix>', 'List the imported symbols that start with <prefix>')
			.option(
				'--bound-at-load <prefix>',
				'List the imported symbols that start with <prefix> and that the loader binds when it maps the image, whatever its binding mode: a Mach-O non-lazy bind, an ELF relocation other than a PLT slot, a PE import that is not delay-loaded'
			)
			.option('--stamp', 'Report the engine stamp the image holds; fails, naming the image, unless it holds exactly one')
			.addHelpText(
				'after',
				"\nWith none of the options, the defined and imported lists hold every symbol. llvm-nm and llvm-readobj come from $LLVM_NM and $LLVM_READOBJ, then the pinned Rust toolchain's llvm-tools, then xcrun on macOS."
			)
			.action(async (images: string[], opts: { defined?: string; imported?: string; boundAtLoad?: string; stamp?: boolean; mapped?: string }, command: Command) => {
				if ((opts.mapped === undefined) === (images.length === 0)) command.error('native-images takes image files or --mapped <script>, not both or neither');
				const { nativeImages: runNativeImages } = await import('@sittir/tools');
				const code = await runNativeImages({ images, ...opts });
				if (code !== 0) process.exitCode = code;
			});
	}
};
