import { type CommandModule, defineCommand } from '../../framework/command-module.ts';

export const encodeStack: CommandModule = {
	name: 'encode-stack',
	describe:
		"Check each built release addon's whole-encode stack, RECURSION_LIMIT levels and the one-time frames, against ENCODE_STACK_BUDGET",
	register: (program) => {
		defineCommand(program, encodeStack)
			.argument('[grammars...]', 'Grammars whose built addons to check (default: every stable grammar)', [])
			.option('--addon <paths...>', 'Unstripped addon files to check instead of the copy each release build keeps (sittir-<grammar>.<platform>.node)')
			.option(
				'--objdump <path>',
				"llvm-objdump to disassemble with (default: $LLVM_OBJDUMP, then the pinned Rust toolchain's llvm-tools)"
			)
			.option('--paths', 'Print every costliest path, not only those over budget')
			.option('--json', 'Print the measurements as JSON')
			.action(
				async (grammars: string[], opts: { addon?: string[]; objdump?: string; paths?: boolean; json?: boolean }) => {
					const { encodeStack: runEncodeStack } = await import('@sittir/tools');
					const code = await runEncodeStack({
						grammars,
						addons: opts.addon,
						objdump: opts.objdump,
						paths: opts.paths ?? false,
						json: opts.json ?? false
					});
					if (code !== 0) process.exitCode = code;
				}
			);
	}
};
