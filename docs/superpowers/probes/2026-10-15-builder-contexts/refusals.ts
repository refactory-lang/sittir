// Each @ts-expect-error is a context refusal the types must report; each other line must check.
import { awaitE, block, breakS, continueS, exprS, fn, genFn, ident, labeled, newTarget, paren, program, returnS, whileS, yieldE } from './signatures-contexts.ts';

fn({ name: 'loop', body: block(whileS({ condition: paren(ident('c')), body: block(breakS(), continueS()) })) });
fn({ name: 'labeledBreak', body: block(labeled({ label: 'a', body: block(breakS()) })) });
genFn({ name: 'gen', body: block(exprS(yieldE(ident('x'))), returnS()) });
fn({ name: 'meta', body: block(exprS(newTarget())) });
// Accepted: no async function kind exists yet, so every function body provides Await.
fn({ name: 'awaits', body: block(exprS(awaitE(ident('p')))) });
program(exprS(awaitE(ident('p'))));

// @ts-expect-error break outside a loop
fn({ name: 'bad', body: block(breakS()) });
// @ts-expect-error continue in a labeled block that is not a loop
fn({ name: 'bad', body: block(labeled({ label: 'a', body: block(continueS()) })) });
// @ts-expect-error yield in a function that is not a generator
fn({ name: 'bad', body: block(exprS(yieldE(ident('x')))) });
// @ts-expect-error a loop does not discharge yield
fn({ name: 'bad', body: block(whileS({ condition: paren(yieldE(ident('c'))), body: block(breakS()) })) });
// @ts-expect-error return at the top level
program(returnS());
// @ts-expect-error new.target at the top level
program(exprS(newTarget()));
// @ts-expect-error break at the top level, nested in blocks
program(block(block(breakS())));
