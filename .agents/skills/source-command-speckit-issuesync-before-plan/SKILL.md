---
name: "source-command-speckit-issuesync-before-plan"
description: "Sync linked issue status for before_plan hook."
---

# source-command-speckit-issuesync-before-plan

Use this skill when the user asks to run the migrated source command `speckit.issuesync.before-plan`.

## Command Template

Run:

```bash
bash .specify/extensions/workflows/scripts/bash/update-linked-issue.sh --event before_plan
```
