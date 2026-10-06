use sittir_core::read::{Depth, ReadCtx, ReadRoot};
use sittir_core::read_untyped_node::{read_untyped_node, NoMint, ReadDepth};
use sittir_rust::render::RenderRoot;
use std::process::Command;

const TWO_MIB: usize = 2 * 1024 * 1024;

/// What the typed read may cost in stack, pinned from the measured values
/// rounded up to the search's granularity. Each only tightens.
const RELEASE_BYTES_PER_LEVEL: f64 = 1536.0;
const DEV_BYTES_PER_LEVEL: f64 = 5632.0;
const RELEASE_ROOT_KIB: usize = 96;
const DEV_ROOT_KIB: usize = 384;

fn nested(n: usize) -> String {
    format!("fn f() {{ {}1{}; }}", "(".repeat(n), ")".repeat(n))
}

fn parse(source: &str) -> tree_sitter::Tree {
    let mut parser = tree_sitter::Parser::new();
    parser.set_language(&sittir_rust::language()).unwrap();
    parser.parse(source, None).unwrap()
}

fn read_on_thread(reader: &'static str, n: usize, stack: usize) {
    let source = nested(n);
    std::thread::Builder::new()
        .name(reader.into())
        .stack_size(stack)
        .spawn(move || {
            let tree = parse(&source);
            if reader == "today" {
                read_untyped_node(&tree, &source, None, None, ReadDepth::Deep, &sittir_rust::RustGrammar, &mut NoMint);
            } else {
                let ctx = ReadCtx::new(&source, 1);
                RenderRoot::read_root(&mut tree.walk(), &ctx, Depth::All).unwrap();
            }
        })
        .unwrap()
        .join()
        .unwrap_or_else(|_| panic!("the {reader} read failed"));
}

#[test]
fn a_nesting_today_reads_does_not_overflow_the_typed_read() {
    let n = 250;
    read_on_thread("today", n, TWO_MIB);
    read_on_thread("typed", n, TWO_MIB);
}

/// A child of the depth test: reads `STACK_N` nested parentheses with the
/// reader `STACK_READER` on a thread of `STACK_KIB` KiB, and aborts if that
/// overflows. A plain run of the suite has none of the variables and passes.
#[test]
fn stack_probe_child() {
    let Ok(n) = std::env::var("STACK_N") else { return };
    let reader = match std::env::var("STACK_READER").unwrap().as_str() {
        "today" => "today",
        _ => "typed",
    };
    let kib: usize = std::env::var("STACK_KIB").unwrap().parse().unwrap();
    read_on_thread(reader, n.parse().unwrap(), kib * 1024);
}

/// The least stack, in KiB, on which `reader` reads `n` nested parentheses,
/// found by running the child on smaller and larger stacks.
fn least_stack_kib(reader: &str, n: usize) -> usize {
    let exe = std::env::current_exe().unwrap();
    let survives = |kib: usize| {
        Command::new(&exe)
            .args(["--exact", "stack_probe_child", "--test-threads=1"])
            .env("STACK_N", n.to_string())
            .env("STACK_READER", reader)
            .env("STACK_KIB", kib.to_string())
            .output()
            .unwrap()
            .status
            .success()
    };
    let (mut lo, mut hi) = (16, 16 * 1024);
    assert!(survives(hi), "{reader} overflows {hi} KiB at {n} levels");
    while hi - lo > 8 {
        let mid = (lo + hi) / 2;
        if survives(mid) {
            hi = mid;
        } else {
            lo = mid;
        }
    }
    hi
}

/// The most nested parentheses `reader` reads on a stack of `kib` KiB.
fn max_levels(reader: &str, kib: usize) -> usize {
    let exe = std::env::current_exe().unwrap();
    let survives = |n: usize| {
        Command::new(&exe)
            .args(["--exact", "stack_probe_child", "--test-threads=1"])
            .env("STACK_N", n.to_string())
            .env("STACK_READER", reader)
            .env("STACK_KIB", kib.to_string())
            .output()
            .unwrap()
            .status
            .success()
    };
    let (mut lo, mut hi) = (1, 8192);
    assert!(survives(lo), "{reader} overflows {kib} KiB at one level");
    while hi - lo > 4 {
        let mid = (lo + hi) / 2;
        if survives(mid) {
            lo = mid;
        } else {
            hi = mid;
        }
    }
    lo
}

/// The measured guarantee: per nesting level the typed read costs no more
/// stack than today's in both profiles, and in release it reads at least as
/// deep on 2 MiB. Its fixed root cost is higher than today's, so in the dev
/// profile it reads about fifteen levels fewer on 2 MiB; the root cost is
/// pinned as a ceiling that only tightens.
#[test]
fn the_typed_read_costs_no_more_stack_per_level_than_today_s() {
    let levels = [1, 10, 40, 200];
    let cost = |reader: &str| levels.map(|n| least_stack_kib(reader, n));
    let (typed, today) = (cost("typed"), cost("today"));
    let per_level = |kib: [usize; 4]| (kib[3] - kib[2]) as f64 * 1024.0 / (levels[3] - levels[2]) as f64;
    let (typed_per_level, today_per_level) = (per_level(typed), per_level(today));
    eprintln!("least stack KiB at {levels:?} levels: typed {typed:?}, today {today:?}");
    eprintln!("bytes per level: typed {typed_per_level:.0}, today {today_per_level:.0}");
    assert!(typed_per_level <= today_per_level, "typed {typed_per_level:.0} B per level, today {today_per_level:.0} B");
    let (per_level_ceiling, root_ceiling) =
        if cfg!(debug_assertions) { (DEV_BYTES_PER_LEVEL, DEV_ROOT_KIB) } else { (RELEASE_BYTES_PER_LEVEL, RELEASE_ROOT_KIB) };
    assert!(typed_per_level <= per_level_ceiling, "typed {typed_per_level:.0} B per level exceeds {per_level_ceiling:.0} B");
    assert!(typed[0] <= root_ceiling, "typed root cost {} KiB exceeds {root_ceiling} KiB", typed[0]);
    if !cfg!(debug_assertions) {
        let (typed_depth, today_depth) = (max_levels("typed", 2048), max_levels("today", 2048));
        eprintln!("levels on 2 MiB: typed {typed_depth}, today {today_depth}");
        assert!(typed_depth >= today_depth, "typed reads {typed_depth} levels on 2 MiB, today {today_depth}");
    }
}
