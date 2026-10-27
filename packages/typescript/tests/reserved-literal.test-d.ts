import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

const ts = await createEngine(typescript);
const tsStrict = await createEngine(typescript, { api: 'strict' });

ts.build.identifier('for');
ts.build.identifier('class');
tsStrict.build.memberExpression({ object: ts.build.identifier('Symbol'), optionalChain: ts.kinds.Dot, property: ts.build.identifier('for') });
