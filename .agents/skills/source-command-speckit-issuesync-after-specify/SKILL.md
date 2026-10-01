---
name: "source-command-speckit-issuesync-after-specify"
description: "Sync linked issue status for after_specify hook."
---

# source-command-speckit-issuesync-after-specify

Use this skill when the user asks to run the migrated source command `speckit.issuesync.after-specify`.

## Command Template

Run:

```bash
bash .specify/extensions/workflows/scripts/bash/update-linked-issue.sh --event after_specify
```
