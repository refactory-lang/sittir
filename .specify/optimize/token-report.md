# Token Usage Report

**Date**: 2026-04-14
**Estimation**: chars ÷ 4.0 (approximate)

## Governance Files (always-loaded)

| File | Chars | Est. Tokens | Load Timing | Notes |
|---|---|---|---|---|
| CLAUDE.md | 6,040 | ~1,510 | Always | Project instructions |
| .specify/memory/constitution.md | 5,996 | ~1,499 | Always | Direct content (no redirect) |
| AGENTS.md | — | — | — | Not present |
| .github/copilot-instructions.md | — | — | — | Not present |
| .ai/rules/*.md | — | — | — | Directory not present |

**Baseline governance total**: 12,036 chars / ~3,009 tokens

## Extension Commands (loaded per invocation)

| Extension | Total Chars | Est. Tokens |
|---|---|---|
| workflows | 275,415 | ~68,854 |
| review | 50,754 | ~12,689 |
| optimize | 47,542 | ~11,886 |
| superb | 37,915 | ~9,479 |
| sync | 30,414 | ~7,604 |
| verify | 17,302 | ~4,326 |
| git | 14,147 | ~3,537 |
| doctor | 3,178 | ~795 |
| **Total** | **476,667** | **~119,170** |

Largest workflows files:
- extensions/DEVELOPMENT.md (~4,064 tok)
- commands/incorporate.md (~3,470 tok)
- README.md (~3,407 tok)
- templates/hotfix/README.md (~3,252 tok)
- templates/refactor/README.md (~3,232 tok)
- templates/deprecate/README.md (~3,154 tok)
- templates/cleanup/README.md (~2,976 tok)

## Per-Session Token Budget

| Session Type | Tokens | % of 8K | % of 32K | % of 128K | % of 200K | % of 1M |
|---|---|---|---|---|---|---|
| Baseline (governance only) | 3,009 | 37.6% | 9.4% | 2.4% | 1.5% | 0.3% |
| + single small command (~1K) | ~4,009 | 50.1% | 12.5% | 3.1% | 2.0% | 0.4% |
| + workflows invocation | ~71,863 | — | — | 56.1% | 35.9% | 7.2% |

## Historical Trend
First run — no prior report. Re-run periodically to track growth.

## Optimization Suggestions

1. **Workflows templates — lift to lazy-load** (~15K tok savings per workflows call). Five template README files total ~15,600 tok and are reference material; they do not need to load on every `/speckit.workflows.*` invocation.
2. **Audit CLAUDE.md / constitution.md overlap** (~500 tok baseline savings). Both describe architecture; deduping would shrink the every-session baseline.
3. **Optimize extension internal audit** (~12K tok). Three optimize subcommands (run/tokens/learn) are each ~4K tok; consider whether shared preamble could be factored.

## Notes
- Baseline governance budget is healthy (1.5% of 200K context).
- Primary risk is workflows invocation cost (~36% of 200K).
- No governance files duplicate the constitution beyond CLAUDE.md overlap.
