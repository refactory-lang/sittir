---
description: Capture a recent design decision as an Architecture Decision Record
argument-hint: <slug>
---

Create an ADR for the recent design decision discussed in this conversation.

Slug: `$ARGUMENTS` (kebab-case, required — if empty, ask the user for one before proceeding)

## Procedure

1. **Locate the template.** Read `docs/adr/TEMPLATE.md`. If it does not exist, stop and tell the user to create it first — do not invent a template inline.

2. **Find the next ADR number.** List `docs/adr/NNNN-*.md` files, pick the next zero-padded 4-digit number.

3. **Mine the conversation.** Scan the recent exchange for:
   - The **forcing constraint** — the sentence from the user (or observed reality) that collapsed other options. Must be a real quote or paraphrase with clear provenance, not invented rationale.
   - **Alternatives considered** — only those actually discussed. Do not manufacture alternatives to pad the doc.
   - **The decision** — what was agreed to, in one paragraph.
   - **Principles applied** — reference `docs/design-principles.md` by ID if it exists. Do not invent principle names.
   - **Consequences** — what this enables and what it costs. Be specific.
   - **Verification** — how we'd know this decision was wrong later.

4. **Check git state.** Run `git diff` and `git log --oneline -20` to see if any code already reflects the decision. Link commits/files in the Consequences section when relevant.

5. **Write** `docs/adr/NNNN-$ARGUMENTS.md` using the template. Leave sections empty with a `_TBD_` marker rather than filling them with speculation.

6. **Report** the file path and a one-line summary. Do not commit — the user decides when.

## Strict rules

- Do not invent alternatives, principles, or forcing constraints. If you cannot find one in the conversation, mark it `_TBD_` and say so.
- Do not expand scope. An ADR captures one decision. If the conversation covered several, ask which one to capture.
- Do not rewrite existing ADRs. If `$ARGUMENTS` collides with an existing slug, stop and ask.
