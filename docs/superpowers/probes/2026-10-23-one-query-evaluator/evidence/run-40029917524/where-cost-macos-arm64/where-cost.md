Corpus: python 3.14.7 standard library; repository files at 5bc3c68cf. Median of 7 runs.

### Rows (ms; results)

| row | kind matches | native | native-id | native-es | spans | scm | scm-es | js | native-id walk only | scm query only |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| python argparse.py: def: name eq format_help | 144 | 2.25 (3) | 2.12 (3) | 2.16 (3) | 2.44 (3) | 4.24 (3) | 4.37 (3) | 2.57 (3) | 2.26 (0) | 2.71 (3) |
| python argparse.py: def: name match ^_ | 144 | 2.41 (107) | 2.57 (107) | 2.64 (107) | 2.85 (107) | 4.72 (107) | 4.75 (107) | 2.60 (107) | 2.71 (0) | 2.72 (107) |
| python argparse.py: def: name match ^_ and not ^__ | 144 | 2.61 (68) | 2.81 (68) | 2.76 (68) | 2.88 (68) | 4.67 (68) | 4.70 (68) | 2.40 (68) | 2.62 (0) | 2.68 (68) |
| python argparse.py: def: name eq add_argument or returnType . | 144 | 2.44 (2) | 2.68 (2) | 2.70 (2) | 2.85 (2) | 4.37 (2) | 4.34 (2) | 2.59 (2) | 2.70 (0) | 2.78 (2) |
| python argparse.py: call: function eq isinstance | 657 | 2.58 (9) | 2.97 (9) | 2.98 (9) | 3.57 (9) | 6.45 (9) | 6.31 (9) | 3.09 (9) | 2.88 (0) | 4.57 (9) |
| python argparse.py: call: function match ^self\. | 657 | 3.00 (155) | 3.13 (155) | 3.10 (155) | 3.69 (155) | 6.93 (155) | 6.98 (155) | 3.41 (155) | 3.09 (0) | 4.75 (155) |
| python json/decoder.py: def: name eq format_help | 9 | 0.32 (0) | 0.28 (0) | 0.29 (0) | 0.31 (0) | 0.36 (0) | 0.36 (0) | 0.32 (0) | 0.29 (0) | 0.36 (0) |
| python json/decoder.py: def: name match ^_ | 9 | 0.35 (4) | 0.30 (4) | 0.31 (4) | 0.31 (4) | 0.60 (4) | 0.57 (4) | 0.32 (4) | 0.29 (0) | 0.36 (4) |
| python json/decoder.py: def: name match ^_ and not ^__ | 9 | 0.39 (1) | 0.31 (1) | 0.30 (1) | 0.32 (1) | 0.60 (1) | 0.59 (1) | 0.34 (1) | 0.29 (0) | 0.37 (1) |
| python json/decoder.py: def: name eq add_argument or returnType . | 9 | 0.36 (0) | 0.29 (0) | 0.30 (0) | 0.32 (0) | 0.37 (0) | 0.37 (0) | 0.32 (0) | 0.29 (0) | 0.36 (0) |
| python json/decoder.py: call: function eq isinstance | 75 | 0.35 (0) | 0.33 (0) | 0.33 (0) | 0.43 (0) | 0.60 (0) | 0.61 (0) | 0.45 (0) | 0.32 (0) | 0.59 (0) |
| python json/decoder.py: call: function match ^self\. | 75 | 0.40 (2) | 0.33 (2) | 0.34 (2) | 0.42 (2) | 0.81 (2) | 0.83 (2) | 0.42 (2) | 0.34 (0) | 0.59 (2) |
| typescript emitters/wrap.ts: member: property eq length | 224 | 0.70 (1) | 0.67 (1) | 0.70 (1) | 1.06 (1) | 1.39 (1) | 1.39 (1) | 1.14 (1) | 0.72 (0) | 0.87 (1) |
| typescript emitters/wrap.ts: member: object match ^this\. | 224 | 0.81 (5) | 0.69 (5) | 0.69 (5) | 0.92 (5) | 2.78 (5) | 2.85 (5) | 0.97 (5) | 0.68 (0) | 2.27 (5) |
| typescript common/src/engine.ts: member: property eq length | 83 | 0.42 (1) | 0.39 (1) | 0.39 (1) | 0.50 (1) | 0.71 (1) | 0.71 (1) | 0.57 (1) | 0.39 (0) | 0.46 (1) |
| typescript common/src/engine.ts: member: object match ^this\. | 83 | 0.45 (0) | 0.39 (0) | 0.40 (0) | 0.52 (0) | 1.03 (0) | 1.02 (0) | 0.50 (0) | 0.38 (0) | 1.00 (0) |
| rust sittir-core/src/read.rs: fn: name match ^read | 148 | 2.30 (8) | 2.19 (8) | 2.17 (8) | 2.47 (8) | 4.36 (8) | 4.29 (8) | 2.47 (8) | 2.17 (0) | 2.65 (8) |
| rust sittir-core/src/read.rs: field: field eq kind | 358 | 2.36 (3) | 2.28 (3) | 2.28 (3) | 2.76 (3) | 4.34 (3) | 4.32 (3) | 3.09 (3) | 2.26 (0) | 2.72 (3) |
| rust sittir-core/src/render.rs: fn: name match ^read | 48 | 0.43 (1) | 0.36 (1) | 0.36 (1) | 0.42 (1) | 0.76 (1) | 0.74 (1) | 0.43 (1) | 0.37 (0) | 0.46 (1) |
| rust sittir-core/src/render.rs: field: field eq kind | 48 | 0.38 (0) | 0.35 (0) | 0.35 (0) | 0.43 (0) | 0.47 (0) | 0.48 (0) | 0.46 (0) | 0.35 (0) | 0.47 (0) |

### Per node in hand (µs per node; nodes answering differently from native)

| row | nodes | native | native-id | scm | js holds | js compiled |
| --- | --- | --- | --- | --- | --- | --- |
| python argparse.py: def: name eq format_help | 144 | 3.43 (0) | 2.06 (0) | 1.73 (0) | 0.35 (0) | 0.35 (0) |
| python argparse.py: def: name match ^_ | 144 | 11.07 (0) | 2.05 (0) | 1.76 (0) | 0.41 (0) | 0.29 (0) |
| python argparse.py: def: name match ^_ and not ^__ | 144 | 20.70 (0) | 2.35 (0) | 1.78 (0) | 0.63 (0) | 0.49 (0) |
| python argparse.py: def: name eq add_argument or returnType . | 144 | 27.13 (0) | 2.33 (0) | 1.84 (0) | 0.52 (0) | 0.48 (0) |
| python argparse.py: call: function eq isinstance | 657 | 4.79 (0) | 3.18 (0) | 7.13 (0) | 0.48 (0) | 0.48 (0) |
| python argparse.py: call: function match ^self\. | 657 | 13.70 (0) | 3.18 (0) | 7.10 (0) | 0.43 (0) | 0.38 (0) |
| python json/decoder.py: def: name eq format_help | 9 | 2.94 (0) | 1.50 (0) | 1.43 (0) | 0.23 (0) | 0.23 (0) |
| python json/decoder.py: def: name match ^_ | 9 | 10.68 (0) | 1.56 (0) | 1.46 (0) | 0.29 (0) | 0.23 (0) |
| python json/decoder.py: def: name match ^_ and not ^__ | 9 | 18.85 (0) | 1.77 (0) | 1.49 (0) | 0.44 (0) | 0.36 (0) |
| python json/decoder.py: def: name eq add_argument or returnType . | 9 | 25.55 (0) | 1.85 (0) | 1.56 (0) | 0.38 (0) | 0.36 (0) |
| python json/decoder.py: call: function eq isinstance | 75 | 4.26 (0) | 2.63 (0) | 6.55 (0) | 0.33 (0) | 0.32 (0) |
| python json/decoder.py: call: function match ^self\. | 75 | 12.21 (0) | 2.64 (0) | 6.48 (0) | 0.38 (0) | 0.33 (0) |
| typescript emitters/wrap.ts: member: property eq length | 224 | 4.82 (0) | 2.91 (0) | 2.48 (0) | 0.78 (0) | 0.71 (0) |
| typescript emitters/wrap.ts: member: object match ^this\. | 224 | 11.73 (0) | 2.69 (0) | 11.66 (0) | 0.58 (0) | 0.46 (0) |
| typescript common/src/engine.ts: member: property eq length | 83 | 5.45 (0) | 3.84 (0) | 2.69 (0) | 0.49 (0) | 0.50 (0) |
| typescript common/src/engine.ts: member: object match ^this\. | 83 | 13.39 (0) | 3.79 (0) | 12.38 (0) | 0.45 (0) | 0.36 (0) |
| rust sittir-core/src/read.rs: fn: name match ^read | 148 | 12.74 (0) | 2.45 (0) | 2.06 (0) | 0.45 (0) | 0.37 (0) |
| rust sittir-core/src/read.rs: field: field eq kind | 358 | 5.67 (0) | 3.21 (0) | 2.45 (0) | 0.62 (0) | 0.59 (0) |
| rust sittir-core/src/render.rs: fn: name match ^read | 48 | 12.91 (0) | 2.41 (0) | 1.95 (0) | 0.47 (0) | 0.36 (0) |
| rust sittir-core/src/render.rs: field: field eq kind | 48 | 5.15 (0) | 2.80 (0) | 2.27 (0) | 0.50 (0) | 0.51 (0) |

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
| js holds, one text meaning ($text, else span; none for a built compound) | 0.72 | 0 |
| js holds, rendered text | 5.39 | 1000 |
| render only | 2.89 | 2000 |
| render + parse | 31.36 | 2000 |
| render + parse + scm | 67.05 | 1000 |

### Reparse alone: corpus nodes whose source text parses back, alone, to one node of the same kind with no error

| grammar | kind | nodes | reparsed |
| --- | --- | --- | --- |
| python | call | 657 | 657 |
| python | function_definition | 144 | 144 |
| python | keyword_argument | 126 | 0 |
| typescript | member_expression | 224 | 224 |
| rust | function_item | 48 | 48 |
| rust | field_expression | 48 | 0 |

