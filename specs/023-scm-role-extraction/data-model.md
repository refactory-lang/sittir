# Data Model: SCM Role Extraction & Trivia

## Entities

### SCMCapture

Extracted from a `.scm` query file. One per `@capture` annotation.

| Field | Type | Description |
|---|---|---|
| kindName | string | The node kind matched by the pattern (e.g., `line_comment`) |
| captureName | string | The full capture name (e.g., `comment`, `comment.documentation`) |
| captureBase | string | The base capture name before `.` (e.g., `comment`) |

### TriviaRoleMap

Per-grammar mapping from the `trivia` role to the set of kinds that fulfill it.

| Field | Type | Description |
|---|---|---|
| grammar | string | Grammar name (`rust`, `typescript`, `python`) |
| triviaKinds | string[] | Kind names classified as trivia (e.g., `['line_comment', 'block_comment']`) |

### NodeTrivia

Runtime property on `AnyNodeData`.

| Field | Type | Description |
|---|---|---|
| leading | AnyNodeData[] (optional) | Comment nodes rendered before this node |
| trailing | AnyNodeData[] (optional) | Comment nodes rendered after this node |

## Relationships

```
highlights.scm  →  SCMCapture[]  →  TriviaRoleMap
                                         ↓
                                   withMethods.$trivia() signature
                                         ↓
                                   NodeTrivia on AnyNodeData
                                         ↓
                                   render() trivia wrapper
```

## Validation Rules

- `triviaKinds` must all be valid kind names in the grammar's `nodeMap`
- `NodeTrivia.leading` and `NodeTrivia.trailing` items must have `$type` matching a trivia kind (enforced at type level, not runtime)
- `$trivia` is optional — absence means no trivia attached
