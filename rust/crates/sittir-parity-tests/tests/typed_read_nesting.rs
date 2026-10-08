use sittir_core::read::{Depth, ReadCtx, ReadRoot};
use sittir_core::read_untyped_node::{read_untyped_node, NoMint, ReadDepth};
use sittir_rust::render::RenderRoot;
use std::process::Command;

const TWO_MIB: usize = 2 * 1024 * 1024;

/// What the typed read may cost in stack, pinned per target and profile from
/// the measured values rounded up to the search's granularity (frames are fixed
/// at compile time, so there is no jitter to pad for). Each only tightens. A
/// target with no row fails with its own measurement, so pinning it is one edit.
struct Ceilings {
    os: &'static str,
    arch: &'static str,
    release: bool,
    bytes_per_level: f64,
    root_kib: usize,
}

const CEILINGS: &[Ceilings] = &[
    Ceilings { os: "macos", arch: "aarch64", release: true, bytes_per_level: 1229.0, root_kib: 23 },
    Ceilings { os: "macos", arch: "aarch64", release: false, bytes_per_level: 4301.0, root_kib: 151 },
    Ceilings { os: "linux", arch: "x86_64", release: false, bytes_per_level: 5632.0, root_kib: 400 },
];

/// The deepest entry of the rust corpus by parse-tree depth, saved as a probe
/// input by `corpus-depth.ts --write`.
/// Its least stack is printed beside the nesting's, not gated.
const DEEPEST: &str = "rust-deepest.txt";

/// What a stack probe reads: `n` nested parentheses, or a saved probe input.
#[derive(Clone, Copy, Debug)]
enum Probe {
    Nested(usize),
    Input(&'static str),
}

impl Probe {
    fn source(self) -> String {
        match self {
            Probe::Nested(n) => format!("fn f() {{ {}1{}; }}", "(".repeat(n), ")".repeat(n)),
            Probe::Input(name) => {
                let path = format!(
                    "{}/../../../docs/superpowers/probes/2026-10-01-shared-arena/stack/inputs/{name}",
                    env!("CARGO_MANIFEST_DIR")
                );
                std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("{path}: {e}"))
            }
        }
    }

    fn env(self) -> String {
        match self {
            Probe::Nested(n) => format!("nested:{n}"),
            Probe::Input(name) => format!("input:{name}"),
        }
    }

    fn from_env(value: &str) -> Probe {
        match value.split_once(':') {
            Some(("nested", n)) => Probe::Nested(n.parse().unwrap()),
            Some(("input", name)) if name == DEEPEST => Probe::Input(DEEPEST),
            _ => panic!("unknown stack probe {value}"),
        }
    }
}

fn parse(source: &str) -> tree_sitter::Tree {
    let mut parser = tree_sitter::Parser::new();
    parser.set_language(&sittir_rust::language()).unwrap();
    parser.parse(source, None).unwrap()
}

fn read_on_thread(reader: &'static str, probe: Probe, stack: usize) {
    let source = probe.source();
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
    read_on_thread("today", Probe::Nested(n), TWO_MIB);
    read_on_thread("typed", Probe::Nested(n), TWO_MIB);
}

/// A child of the depth test: reads `STACK_PROBE` with the reader
/// `STACK_READER` on a thread of `STACK_KIB` KiB, and aborts if that
/// overflows. A plain run of the suite has none of the variables and passes.
#[test]
fn stack_probe_child() {
    let Ok(probe) = std::env::var("STACK_PROBE") else { return };
    let reader = match std::env::var("STACK_READER").unwrap().as_str() {
        "today" => "today",
        _ => "typed",
    };
    let kib: usize = std::env::var("STACK_KIB").unwrap().parse().unwrap();
    read_on_thread(reader, Probe::from_env(&probe), kib * 1024);
}

/// Whether `reader` reads `probe` on a stack of `kib` KiB: the child test ran
/// (it reports one test passed) and did not overflow.
fn survives(reader: &str, probe: Probe, kib: usize) -> bool {
    let output = Command::new(std::env::current_exe().unwrap())
        .args(["--exact", "stack_probe_child", "--test-threads=1"])
        .env("STACK_PROBE", probe.env())
        .env("STACK_READER", reader)
        .env("STACK_KIB", kib.to_string())
        .output()
        .unwrap();
    output.status.success() && String::from_utf8_lossy(&output.stdout).contains("1 passed")
}

/// The least stack, in KiB, on which `reader` reads `probe`, found by running
/// the child on smaller and larger stacks.
fn least_stack_kib(reader: &str, probe: Probe) -> usize {
    let (mut lo, mut hi) = (16, 16 * 1024);
    assert!(survives(reader, probe, hi), "{reader} overflows {hi} KiB reading {probe:?}, or the probe did not run");
    while hi - lo > 8 {
        let mid = (lo + hi) / 2;
        if survives(reader, probe, mid) {
            hi = mid;
        } else {
            lo = mid;
        }
    }
    hi
}

/// The most nested parentheses `reader` reads on a stack of `kib` KiB.
fn max_levels(reader: &str, kib: usize) -> usize {
    let (mut lo, mut hi) = (1, 8192);
    assert!(survives(reader, Probe::Nested(lo), kib), "{reader} overflows {kib} KiB at one level, or the probe did not run");
    while hi - lo > 4 {
        let mid = (lo + hi) / 2;
        if survives(reader, Probe::Nested(mid), kib) {
            lo = mid;
        } else {
            hi = mid;
        }
    }
    lo
}

/// The measured guarantee, in both profiles: per nesting level the typed read
/// costs no more stack than today's, and at 200 nested levels it needs no more
/// stack than today's. In release it reads at least as deep on 2 MiB. Its
/// fixed root cost is higher than today's, so a shallow source, the deepest
/// corpus entry included, needs more stack than today's; that cost is printed,
/// not gated. The root and per-level costs are pinned per target and profile
/// as ceilings that only tighten.
#[test]
fn the_typed_read_costs_no_more_stack_per_level_than_today_s() {
    let levels = [1, 10, 40, 200];
    let cost = |reader: &str| levels.map(|n| least_stack_kib(reader, Probe::Nested(n)));
    let (typed, today) = (cost("typed"), cost("today"));
    let per_level = |kib: [usize; 4]| {
        assert!(kib[3] > kib[2] && kib[2] > kib[0], "the least stack must grow with the nesting: {kib:?}");
        (kib[3] - kib[2]) as f64 * 1024.0 / (levels[3] - levels[2]) as f64
    };
    let (typed_per_level, today_per_level) = (per_level(typed), per_level(today));
    eprintln!("least stack KiB at {levels:?} levels: typed {typed:?}, today {today:?}");
    eprintln!("bytes per level: typed {typed_per_level:.0}, today {today_per_level:.0}");
    assert!(typed_per_level <= today_per_level, "typed {typed_per_level:.0} B per level, today {today_per_level:.0} B");
    let deepest = |reader: &str| least_stack_kib(reader, Probe::Input(DEEPEST));
    let (typed_deepest, today_deepest) = (deepest("typed"), deepest("today"));
    eprintln!("least stack KiB reading the deepest corpus entry: typed {typed_deepest}, today {today_deepest}");
    assert!(typed[3] <= today[3], "typed {} KiB at {} levels exceeds today's {} KiB", typed[3], levels[3], today[3]);
    let release = !cfg!(debug_assertions);
    let (os, arch) = (std::env::consts::OS, std::env::consts::ARCH);
    let Some(pinned) = CEILINGS.iter().find(|row| row.os == os && row.arch == arch && row.release == release) else {
        panic!(
            "no stack ceilings are pinned for {os}/{arch} ({} profile); measured typed root {} KiB, {typed_per_level:.0} B per level: add a row to CEILINGS",
            if release { "release" } else { "dev" },
            typed[0],
        );
    };
    let (per_level_ceiling, root_ceiling) = (pinned.bytes_per_level, pinned.root_kib);
    assert!(typed_per_level <= per_level_ceiling, "typed {typed_per_level:.0} B per level exceeds {per_level_ceiling:.0} B");
    assert!(typed[0] <= root_ceiling, "typed root cost {} KiB exceeds {root_ceiling} KiB", typed[0]);
    if !cfg!(debug_assertions) {
        let (typed_depth, today_depth) = (max_levels("typed", 2048), max_levels("today", 2048));
        eprintln!("levels on 2 MiB: typed {typed_depth}, today {today_depth}");
        assert!(typed_depth >= today_depth, "typed reads {typed_depth} levels on 2 MiB, today {today_depth}");
    }
}
