---
name: "source-command-speckit-issuesync-before-specify"
description: "Sync linked issue status for before_specify hook."
---

# source-command-speckit-issuesync-before-specify

Use this skill when the user asks to run the migrated source command `speckit.issuesync.before-specify`.

## Command Template

Run:

```bash
bash .specify/extensions/workflows/scripts/bash/update-linked-issue.sh --event before_specify
```
