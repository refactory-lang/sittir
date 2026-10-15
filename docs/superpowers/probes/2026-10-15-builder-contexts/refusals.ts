// Each @ts-expect-error is a context refusal the types must report; each other line must check.
import { awaitE, block, breakS, call, exprS, fn, ident, paren, program, returnS, whileS } from './signatures-contexts.ts';

fn({ name: 'ok', async: true, body: block(exprS(awaitE(ident('p'))), returnS(ident('x'))) });
fn({ name: 'loop', body: block(whileS({ condition: paren(ident('c')), body: block(breakS()) })) });
// @ts-expect-error break outside a loop
fn({ name: 'bad', body: block(breakS()) });
// @ts-expect-error await outside an async function
fn({ name: 'bad', body: block(exprS(awaitE(ident('p')))) });
// @ts-expect-error a loop does not discharge await
fn({ name: 'bad', body: block(whileS({ condition: paren(awaitE(ident('c'))), body: block(breakS()) })) });
program(exprS(awaitE(call(ident('f')))));
// @ts-expect-error return at the top level
program(returnS());
// @ts-expect-error break at the top level, nested in a block
program(block(block(breakS())));
