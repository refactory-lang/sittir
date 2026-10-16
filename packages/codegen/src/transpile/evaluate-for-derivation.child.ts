import { evaluateDsl } from '../compiler/evaluate.ts';
import { DERIVATION_INPUTS_MARKER, derivationInputsOf, type DerivationInputs } from './evaluate-for-derivation.ts';

const [basePath, boundPath] = process.argv.slice(2);
if (basePath === undefined || boundPath === undefined) throw new Error('evaluate-for-derivation.child: give the paths of layer 1 and the top layer');
const inputs: DerivationInputs = {
	base: derivationInputsOf(await evaluateDsl(basePath)),
	bound: derivationInputsOf(await evaluateDsl(boundPath))
};
process.stdout.write(DERIVATION_INPUTS_MARKER + JSON.stringify(inputs));
