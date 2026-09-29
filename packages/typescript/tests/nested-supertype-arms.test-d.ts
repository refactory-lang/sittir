/**
 * Type-level pins for supertypes nested under another supertype's arm: every
 * call HEAD accepted still type-checks, the nested arms are reachable under
 * each mount path, and each namespace is callable through its default.
 *
 * Compile-time only: `pnpm --filter @sittir/typescript type-check`.
 */

import typescript from '@sittir/typescript';
import { createEngine } from '@sittir/common';

const ts = await createEngine(typescript);

// The calls HEAD accepted.
ts.build.number(42);
ts.build.number('42');
ts.build.number.hex(255);
ts.build.number.bigint('42');
ts.build.literalType.bigint('42');
ts.build.primaryType.literal.bigint('42');
ts.build.updateExpression.postfix({ argument: 'i', operator: '++' });
ts.build.updateExpression.prefix({ argument: 'i', operator: '++' });

// The bigint radix arms, and the decimal default under every mount path.
ts.build.number.bigint(42n);
ts.build.number.bigint.decimal(42n);
ts.build.number.bigint.hex(42n);
ts.build.number.bigint.binary(42n);
ts.build.number.bigint.octal(42n);
ts.build.numberBigint(42n);
ts.build.literalType.bigint(42n);
ts.build.literalType.bigint.hex(42n);
ts.build.primaryType.literal.bigint.octal(42n);
ts.build.primaryExpression.number.bigint(42n);
ts.build.number.bigint.binary(42n);

// update_expression is callable through its postfix default, where it is
// declared and where it is mounted as a sub-factory arm.
ts.build.updateExpression({ argument: 'i', operator: '++' });
ts.build.expression.update({ argument: 'i', operator: '--' });
ts.build.parenthesizedExpression.typed.update({ type: 'T', expression: [{ argument: 'i', operator: '++' }] });
ts.build.parenthesizedExpression.typed.update.prefix({ type: 'T', expression: [{ argument: 'i', operator: '++' }] });
