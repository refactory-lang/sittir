import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

const ts = await createEngine(typescript);

ts.build.identifier('for');
ts.build.identifier('class');
ts.build.memberExpression.strict({ object: ts.build.identifier('Symbol'), optionalChain: ts.kinds.Dot, property: ts.build.identifier('for') });
