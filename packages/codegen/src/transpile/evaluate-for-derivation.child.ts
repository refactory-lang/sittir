import { evaluateDsl, evaluateUnboundDsl } from '../compiler/evaluate.ts';
import { DERIVATION_INPUTS_MARKER, derivationInputsOf, type DerivationInputs } from './evaluate-for-derivation.ts';

const entryPath = process.argv[2];
if (entryPath === undefined) throw new Error('evaluate-for-derivation.child: missing grammar entry path');
const inputs: DerivationInputs = {
	base: derivationInputsOf(await evaluateUnboundDsl(entryPath)),
	bound: derivationInputsOf(await evaluateDsl(entryPath))
};
process.stdout.write(DERIVATION_INPUTS_MARKER + JSON.stringify(inputs));
