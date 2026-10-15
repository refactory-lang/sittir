# Slot routes: coverage and cost

Two measurements behind reading a `where` plan's slots through the generated
reader's routing instead of matching field names and child kinds.

## Coverage (`coverage.py`, `coverage.txt`)

Every kind with query slots, by how its transport reads them:

| grammar    | routed | interior | envelope |
|------------|-------:|---------:|---------:|
| python     | 147    | 14       | 3        |
| regex      | 28     | 1        | 2        |
| rust       | 208    | 15       | 3        |
| scm        | 21     | 2        | 0        |
| typescript | 200    | 15       | 6        |

A routed kind routes its children one at a time. An interior kind is one
token, and each slot is a named group of its text. An envelope's one slot is
the node itself. Field-name matching found nothing for the last two: a token
has no children, and an envelope's content is not a child.

Run: `python3 coverage.py` from the repository root.

## Cost (`routes_cost.rs`, `routes_cost.txt`)

Every node of a large Rust file, routing its children five ways, best of 7,
release build. The query's walk ("router walk") routes each child on the stack
through the kind's router, within 10% of the old string compare, while
`routes_at`, which allocates a `Routed` per node, costs about 25% more.

Run: copy `routes_cost.rs` to `rust/crates/sittir-rust/examples/`, then
`cargo build --release -p sittir-rust --no-default-features --example routes_cost`
and `target/release/examples/routes_cost <file.rs> 7`.
