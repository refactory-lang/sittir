1. Get rid of all the `--- IGNORE ---` comments in the code.
2. Get rid of all unused imports in the code. Run oxlint --fix on the code to remove unused imports and fix formatting issues. Run oxfmt . on the code to fix formatting issues.
3. Remove all tests that verify that deprecated features are actually deprecated
4. Remove all calls to deprecated functions in code, and remove the deprecated functions themselves.
5. Remove all calls to js engine in code, and remove the js engine itself.
6. Remove any silently deprecated features in code, and remove the deprecated features themselves.
7. Remove any silent failures in code, and remove the silent failures themselves. Remove any silent warnings in code, and remove the silent warnings themselves.
8. Make validate commands generate diagnostic report for all failures and warnings.
9. Exclude .jinja files from js package output (should be rust only at this point)
10. Remove references to "VARIANT" type in code, and remove the VARIANT type itself.
11. Fix the type errors in generated `wrap.ts` (e.g. `SliceGroup1`/`Yield` in packages/python/src/wrap.ts: missing properties like `_comparison_operator`, `_boolean_operator`, `_expression_list`, and an excess `$other` property) — these come from the emitter that generates `wrap.ts`, not the file itself (never hand-edit generated output; fix the codegen emitter and regenerate). Doesn't block `validate:native`/codegen (tsx doesn't type-check, and `dist/wrap.js` still emits despite the errors), but `wrap.ts` is live code on the native read path (`readNode`/`TreeHandle` is backend-polymorphic, not JS-dispatch-only), so it should actually be fixed, not just tolerated.
12. Consolidate all single-phase methods (functions only ever called by one compiler phase — verify with infigraph's `find_all_references`/`trace_callers`, not grep) into the phase file they belong to. Use lsproxy (not manual edit) for the actual move. After each move, confirm the moved function is NOT exported from its new home unless something outside that phase genuinely still needs it.