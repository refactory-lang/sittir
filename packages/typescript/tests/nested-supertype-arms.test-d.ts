/**
 * Type-level pins for supertypes nested under another supertype's arm: every
 * call HEAD accepted still type-checks, the nested arms are reachable under
 * each mount path, and each namespace is callable through its default.
 *
 * Compile-time only: `pnpm --filter @sittir/typescript type-check`.
 */

import { ir } from '@sittir/typescript';

// The calls HEAD accepted.
ir.number(42);
ir.number('42');
ir.number.hex(255);
ir.number.bigint('42');
ir.literalType.bigint('42');
ir.primaryType.literal.bigint('42');
ir.updateExpression.postfix({ argument: 'i', operator: '++' });
ir.updateExpression.prefix({ argument: 'i', operator: '++' });

// The bigint radix arms, and the decimal default under every mount path.
ir.number.bigint(42n);
ir.number.bigint.decimal(42n);
ir.number.bigint.hex(42n);
ir.number.bigint.binary(42n);
ir.number.bigint.octal(42n);
ir.numberBigint(42n);
ir.literalType.bigint(42n);
ir.literalType.bigint.hex(42n);
ir.primaryType.literal.bigint.octal(42n);
ir.primaryExpression.number.bigint(42n);
ir.propertyName.number.bigint.binary(42n);

// update_expression is callable through its postfix default, where it is
// declared and where it is mounted as a sub-factory arm.
ir.updateExpression({ argument: 'i', operator: '++' });
ir.expression.update({ argument: 'i', operator: '--' });
ir.parenthesizedExpression.typed.update({ type: 'T', expression: [{ argument: 'i', operator: '++' }] });
ir.parenthesizedExpression.typed.update.prefix({ type: 'T', expression: [{ argument: 'i', operator: '++' }] });
