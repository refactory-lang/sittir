import { flagMembers, runPinned } from '@sittir/codegen/bindings';

export async function printFlagsModule(names: Iterable<string>): Promise<string> {
	return runPinned('flagsModule', flagMembers(names));
}
