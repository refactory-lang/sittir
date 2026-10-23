Corpus: python 3.14.8 standard library; repository files at 5bc3c68cf. Median of 7 runs.

### Rows (ms; results)

| row | kind matches | native | native-id | native-es | spans | scm | scm-es | js | native-id walk only | scm query only |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| python argparse.py: def: name eq format_help | 144 | 1.62 (3) | 1.49 (3) | 1.48 (3) | 1.71 (3) | 3.55 (3) | 3.53 (3) | 1.80 (3) | 1.49 (0) | 2.66 (3) |
| python argparse.py: def: name match ^_ | 144 | 1.69 (107) | 1.55 (107) | 1.54 (107) | 1.66 (107) | 3.89 (107) | 3.92 (107) | 1.75 (107) | 1.54 (0) | 2.63 (107) |
| python argparse.py: def: name match ^_ and not ^__ | 144 | 1.70 (68) | 1.56 (68) | 1.57 (68) | 1.66 (68) | 3.85 (68) | 3.87 (68) | 1.70 (68) | 1.56 (0) | 2.66 (68) |
| python argparse.py: def: name eq add_argument or returnType . | 144 | 1.60 (2) | 1.51 (2) | 1.51 (2) | 1.69 (2) | 3.58 (2) | 3.58 (2) | 1.66 (2) | 1.51 (0) | 2.66 (2) |
| python argparse.py: call: function eq isinstance | 657 | 1.72 (9) | 1.67 (9) | 1.67 (9) | 2.18 (9) | 5.98 (9) | 6.02 (9) | 2.28 (9) | 1.68 (0) | 5.07 (9) |
| python argparse.py: call: function match ^self\. | 657 | 2.03 (155) | 1.84 (155) | 1.82 (155) | 2.27 (155) | 6.41 (155) | 6.40 (155) | 2.36 (155) | 1.79 (0) | 5.19 (155) |
| python json/decoder.py: def: name eq format_help | 9 | 0.22 (0) | 0.20 (0) | 0.20 (0) | 0.21 (0) | 0.36 (0) | 0.36 (0) | 0.24 (0) | 0.20 (0) | 0.37 (0) |
| python json/decoder.py: def: name match ^_ | 9 | 0.26 (4) | 0.21 (4) | 0.21 (4) | 0.22 (4) | 0.49 (4) | 0.49 (4) | 0.23 (4) | 0.20 (0) | 0.37 (4) |
| python json/decoder.py: def: name match ^_ and not ^__ | 9 | 0.28 (1) | 0.21 (1) | 0.21 (1) | 0.22 (1) | 0.48 (1) | 0.48 (1) | 0.23 (1) | 0.21 (0) | 0.36 (1) |
| python json/decoder.py: def: name eq add_argument or returnType . | 9 | 0.25 (0) | 0.20 (0) | 0.20 (0) | 0.22 (0) | 0.37 (0) | 0.37 (0) | 0.23 (0) | 0.20 (0) | 0.37 (0) |
| python json/decoder.py: call: function eq isinstance | 75 | 0.25 (0) | 0.23 (0) | 0.23 (0) | 0.31 (0) | 0.66 (0) | 0.65 (0) | 0.34 (0) | 0.22 (0) | 0.66 (0) |
| python json/decoder.py: call: function match ^self\. | 75 | 0.29 (2) | 0.23 (2) | 0.23 (2) | 0.30 (2) | 0.76 (2) | 0.76 (2) | 0.31 (2) | 0.23 (0) | 0.65 (2) |
| typescript emitters/wrap.ts: member: property eq length | 224 | 0.49 (1) | 0.45 (1) | 0.45 (1) | 0.64 (1) | 1.04 (1) | 1.03 (1) | 0.75 (1) | 0.46 (0) | 0.79 (1) |
| typescript emitters/wrap.ts: member: object match ^this\. | 224 | 0.53 (5) | 0.47 (5) | 0.47 (5) | 0.64 (5) | 2.97 (5) | 2.95 (5) | 0.73 (5) | 0.46 (0) | 2.81 (5) |
| typescript common/src/engine.ts: member: property eq length | 83 | 0.30 (1) | 0.27 (1) | 0.27 (1) | 0.34 (1) | 0.60 (1) | 0.59 (1) | 0.37 (1) | 0.27 (0) | 0.44 (1) |
| typescript common/src/engine.ts: member: object match ^this\. | 83 | 0.30 (0) | 0.26 (0) | 0.26 (0) | 0.35 (0) | 1.18 (0) | 1.18 (0) | 0.37 (0) | 0.26 (0) | 1.18 (0) |
| rust sittir-core/src/read.rs: fn: name match ^read | 148 | 1.52 (8) | 1.44 (8) | 1.43 (8) | 1.59 (8) | 3.55 (8) | 3.58 (8) | 1.83 (8) | 1.45 (0) | 2.59 (8) |
| rust sittir-core/src/read.rs: field: field eq kind | 358 | 1.55 (3) | 1.49 (3) | 1.49 (3) | 1.91 (3) | 3.58 (3) | 3.60 (3) | 1.94 (3) | 1.52 (0) | 2.73 (3) |
| rust sittir-core/src/render.rs: fn: name match ^read | 48 | 0.33 (1) | 0.24 (1) | 0.24 (1) | 0.30 (1) | 0.62 (1) | 0.61 (1) | 0.31 (1) | 0.24 (0) | 0.47 (1) |
| rust sittir-core/src/render.rs: field: field eq kind | 48 | 0.27 (0) | 0.23 (0) | 0.23 (0) | 0.29 (0) | 0.49 (0) | 0.50 (0) | 0.32 (0) | 0.23 (0) | 0.47 (0) |

### Per node in hand (µs per node; nodes answering differently from native)

| row | nodes | native | native-id | scm | js holds | js compiled |
| --- | --- | --- | --- | --- | --- | --- |
| python argparse.py: def: name eq format_help | 144 | 2.85 (0) | 1.63 (0) | 1.50 (0) | 0.37 (0) | 0.38 (0) |
| python argparse.py: def: name match ^_ | 144 | 8.51 (0) | 1.50 (0) | 1.47 (0) | 0.52 (0) | 0.36 (0) |
| python argparse.py: def: name match ^_ and not ^__ | 144 | 15.99 (0) | 1.81 (0) | 1.47 (0) | 1.18 (0) | 0.91 (0) |
| python argparse.py: def: name eq add_argument or returnType . | 144 | 20.61 (0) | 1.73 (0) | 1.50 (0) | 0.53 (0) | 0.44 (0) |
| python argparse.py: call: function eq isinstance | 657 | 3.27 (0) | 1.90 (0) | 6.47 (0) | 1.02 (0) | 0.65 (0) |
| python argparse.py: call: function match ^self\. | 657 | 10.03 (0) | 2.06 (0) | 6.60 (0) | 0.81 (0) | 0.72 (0) |
| python json/decoder.py: def: name eq format_help | 9 | 2.49 (0) | 1.24 (0) | 1.31 (0) | 0.21 (0) | 0.22 (0) |
| python json/decoder.py: def: name match ^_ | 9 | 8.57 (0) | 1.28 (0) | 1.37 (0) | 0.32 (0) | 0.23 (0) |
| python json/decoder.py: def: name match ^_ and not ^__ | 9 | 15.85 (0) | 1.42 (0) | 1.35 (0) | 0.50 (0) | 0.39 (0) |
| python json/decoder.py: def: name eq add_argument or returnType . | 9 | 20.42 (0) | 1.51 (0) | 1.40 (0) | 0.48 (0) | 0.38 (0) |
| python json/decoder.py: call: function eq isinstance | 75 | 3.27 (0) | 1.78 (0) | 6.12 (0) | 0.36 (0) | 0.34 (0) |
| python json/decoder.py: call: function match ^self\. | 75 | 9.40 (0) | 1.86 (0) | 6.41 (0) | 0.44 (0) | 0.36 (0) |
| typescript emitters/wrap.ts: member: property eq length | 224 | 3.42 (0) | 1.86 (0) | 1.76 (0) | 0.62 (0) | 0.57 (0) |
| typescript emitters/wrap.ts: member: object match ^this\. | 224 | 8.93 (0) | 1.84 (0) | 12.47 (0) | 0.47 (0) | 0.33 (0) |
| typescript common/src/engine.ts: member: property eq length | 83 | 3.77 (0) | 2.21 (0) | 1.91 (0) | 0.55 (0) | 0.49 (0) |
| typescript common/src/engine.ts: member: object match ^this\. | 83 | 9.99 (0) | 2.31 (0) | 12.76 (0) | 0.43 (0) | 0.27 (0) |
| rust sittir-core/src/read.rs: fn: name match ^read | 148 | 10.01 (0) | 2.82 (0) | 1.76 (0) | 0.65 (0) | 0.52 (0) |
| rust sittir-core/src/read.rs: field: field eq kind | 358 | 3.66 (0) | 2.03 (0) | 1.86 (0) | 0.58 (0) | 0.54 (0) |
| rust sittir-core/src/render.rs: fn: name match ^read | 48 | 10.56 (0) | 1.85 (0) | 1.71 (0) | 0.61 (0) | 0.46 (0) |
| rust sittir-core/src/render.rs: field: field eq kind | 48 | 4.27 (0) | 1.96 (0) | 1.84 (0) | 0.68 (0) | 0.65 (0) |

### Regex dialect: python function names café, x٣, plain, naïve_ünïcode

| pattern | native (Rust regex) | native (regress, u) | JavaScript holds (u) | scm #match? (Rust binding) | scm #es-match? (regress) | scm #match? (web-tree-sitter) |
| --- | --- | --- | --- | --- | --- | --- |
| `^\w+$` | 4 | 1 | 1 | 4 | 1 | 1 |
| `\d` | 1 | 0 | 0 | 1 | 0 | 0 |
| `\b\w` | 4 | 4 | 4 | 4 | 4 | 4 |
| `^[\p{L}\p{N}_]+$` | 4 | 4 | 4 | 4 | 4 | 0 |
| `\p{Nd}` | 1 | 1 | 1 | 1 | 1 | 0 |
| `^na` | 1 | 1 | 1 | 1 | 1 | 1 |
| `^[a-z]+$` | 1 | 1 | 1 | 1 | 1 | 1 |

### scm coverage (python cases; counts native / scm)

| construct | native | scm | refused or noted |
| --- | --- | --- | --- |
| field eq | 1 | 1 |  |
| field match | 2 | 2 |  |
| not match, one value | 2 | 2 | function_definition slot 1: a negated test holds natively when no value passes, absent included; scm tests each captured value on its own (exact where the slot holds at most one value) and a negated field covers absence |
| present (field) | 1 | 1 |  |
| not present (field) | 3 | 3 |  |
| not match, optional slot | 3 | 3 | function_definition slot 4: a negated test holds natively when no value passes, absent included; scm tests each captured value on its own (exact where the slot holds at most one value) and a negated field covers absence |
| and across slots | 1 | 1 |  |
| or across slots | 2 | 2 |  |
| and on one slot, one value | 1 | 1 | function_definition slot 1: 2 literals on one slot share its capture, so they test one value together; the native plan tests each against any value (exact where the slot holds one value) |
| not match, several values | 1 | 2 | import_list slot 0: a negated test holds natively when no value passes, absent included; scm tests each captured value on its own (exact where the slot holds at most one value) and a negated field covers absence |
| and on one slot, several values | 1 | 0 | import_list slot 0: 2 literals on one slot share its capture, so they test one value together; the native plan tests each against any value (exact where the slot holds one value) |
| present (unfielded) | 1 | 1 |  |
| not present (unfielded) | 0 | gap | decorated_definition slot 0: absence of a slot routed by kind or by several fields; scm negates only a field |
| is on a slot's values | 1 | 1 |  |
| is on the node itself | 2 | 2 |  |
| child step | 1 | 1 |  |
| anchored child step | 1 | gap | call slot 0: an anchored child step (first, last, only) counts the slot's values; scm's `.` anchors to the parent's named children |

### scm census: every (kind, slot) of the slot tables, as a presence test

| grammar | pairs | compiled | with a note | refused, by reason |
| --- | --- | --- | --- | --- |
| python | 272 | 235 | 1 | 31× an interior slot is a group of a token's text, not a node; 3× a hidden kind is never a node of the tree; 3× an envelope's slot is the node itself or its hidden child |
| typescript | 506 | 471 | 1 | 28× an interior slot is a group of a token's text, not a node; 6× an envelope's slot is the node itself or its hidden child; 1× a hidden kind is never a node of the tree |
| rust | 439 | 409 | 0 | 24× an interior slot is a group of a token's text, not a node; 4× an envelope's slot is the node itself or its hidden child; 2× a hidden kind is never a node of the tree |

### Built nodes: 2000 built python calls, half `self.gN()`, condition `function match ^self\.`

| evaluation | µs per node | holds on |
| --- | --- | --- |
| js holds, one text meaning ($text, else span; none for a built compound) | 0.61 | 0 |
| js holds, rendered text | 4.92 | 1000 |
| render only | 2.70 | 2000 |
| render + parse | 30.70 | 2000 |
| render + parse + scm | 62.72 | 1000 |

### Reparse alone: corpus nodes whose source text parses back, alone, to one node of the same kind with no error

| grammar | kind | nodes | reparsed |
| --- | --- | --- | --- |
| python | call | 657 | 657 |
| python | function_definition | 144 | 144 |
| python | keyword_argument | 126 | 0 |
| typescript | member_expression | 224 | 224 |
| rust | function_item | 48 | 48 |
| rust | field_expression | 48 | 0 |

