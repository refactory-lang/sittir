/**
 * Type-level pins for the escaped char literal supertype nested under
 * char_literal's escaped arm: every call HEAD accepted still type-checks, the
 * nested arms are reachable under each mount path, and a supertype arm that
 * already existed is reachable as a sub-factory arm.
 *
 * Compile-time only: `pnpm --filter @sittir/rust type-check`.
 */

import { ir } from '@sittir/rust';

// The calls HEAD accepted.
ir.charLiteral('a');
ir.charLiteral.plain('a');
ir.charLiteral.escaped('\\n');
ir.literal.char('a');

// The nested arms, with simple the default.
ir.charLiteral.escaped.simple('\\n');
ir.charLiteral.escaped.unicodeFixed('\\u0041');
ir.charLiteral.escaped.unicodeBraced('\\u{41}');
ir.charLiteral.escaped.hex('\\x41');
ir.charLiteralEscaped('\\t');
ir.literal.char.escaped.hex('\\x41');
ir.literalPattern.char.escaped('\\n');

// A supertype arm that already existed, now reachable as a sub-factory arm.
ir.nonSpecialToken.integer.hex(255);
ir.nonSpecialToken.char.plain('a');
