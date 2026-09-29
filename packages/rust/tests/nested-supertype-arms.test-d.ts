/**
 * Type-level pins for the escaped char literal supertype nested under
 * char_literal's escaped arm: every call HEAD accepted still type-checks, the
 * nested arms are reachable under each mount path, and a supertype arm that
 * already existed is reachable as a sub-factory arm.
 *
 * Compile-time only: `pnpm --filter @sittir/rust type-check`.
 */

import rust from '@sittir/rust';
import { createEngine } from '@sittir/common';

const rs = await createEngine(rust);

// The calls HEAD accepted.
rs.build.charLiteral('a');
rs.build.charLiteral.plain('a');
rs.build.charLiteral.escaped('\\n');
rs.build.literal.char('a');

// The nested arms, with simple the default.
rs.build.charLiteral.escaped.simple('\\n');
rs.build.charLiteral.escaped.unicodeFixed('\\u0041');
rs.build.charLiteral.escaped.unicodeBraced('\\u{41}');
rs.build.charLiteral.escaped.hex('\\x41');
rs.build.charLiteralEscaped('\\t');
rs.build.literal.char.escaped.hex('\\x41');
rs.build.literalPattern.char.escaped('\\n');

// A supertype arm that already existed, now reachable as a sub-factory arm.
rs.build.nonSpecialToken.integer.hex(255);
rs.build.nonSpecialToken.char.plain('a');
