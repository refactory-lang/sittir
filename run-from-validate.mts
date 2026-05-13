import { validateFrom, formatFromReport } from './packages/codegen/src/validate/from.ts';
const r = await validateFrom('rust', 'native');
console.log(formatFromReport(r));
