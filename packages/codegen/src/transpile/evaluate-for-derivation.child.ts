import { evaluateUnboundDsl } from '../compiler/evaluate.ts';
import { DERIVATION_INPUTS_MARKER, derivationInputsOf } from './evaluate-for-derivation.ts';

const entryPath = process.argv[2];
if (entryPath === undefined) throw new Error('evaluate-for-derivation.child: missing grammar entry path');
process.stdout.write(DERIVATION_INPUTS_MARKER + JSON.stringify(derivationInputsOf(await evaluateUnboundDsl(entryPath))));
