---
name: "source-command-speckit-issuesync-after-plan"
description: "Sync linked issue status for after_plan hook."
---

# source-command-speckit-issuesync-after-plan

Use this skill when the user asks to run the migrated source command `speckit.issuesync.after-plan`.

## Command Template

Run:

```bash
bash .specify/extensions/workflows/scripts/bash/update-linked-issue.sh --event after_plan
```
