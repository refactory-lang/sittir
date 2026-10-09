use sittir_core::read::{Depth, ReadCtx, ReadRoot};
use sittir_rust::render::RenderRoot;
use std::process::Command;

const TWO_MIB: usize = 2 * 1024 * 1024;

/// The nesting levels the stack is measured at.
const LEVELS: [usize; 4] = [1, 10, 40, 200];

/// What the typed read may cost in stack, pinned per target and profile from
/// the measured values (frames are fixed at compile time, so there is no jitter
/// to pad for). Each only tightens. A target with no row fails with its own
/// measurement, so pinning it is one edit.
struct Ceilings {
    os: &'static str,
    arch: &'static str,
    release: bool,
    limit: Limit,
}

/// A row's gate. `Levels` pins the least stack, in KiB, at each of `LEVELS`;
/// the slope between two levels is not gated, since one level's 8 KiB search
/// granularity swings it. `Slope` is a row whose per-level values no run has
/// reported yet: the bytes per level from 40 to 200 levels and the root (one
/// level) cost.
enum Limit {
    Levels([usize; 4]),
    Slope { bytes_per_level: f64, root_kib: usize },
}

const CEILINGS: &[Ceilings] = &[
    Ceilings { os: "macos", arch: "aarch64", release: true, limit: Limit::Levels([23, 39, 71, 263]) },
    Ceilings { os: "macos", arch: "aarch64", release: false, limit: Limit::Levels([151, 183, 311, 999]) },
    Ceilings { os: "linux", arch: "x86_64", release: false, limit: Limit::Slope { bytes_per_level: 5632.0, root_kib: 400 } },
];

/// The deepest entry of the rust corpus by parse-tree depth, saved as a probe
/// input by `corpus-depth.ts --write`. Its least stack is printed, not gated.
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

fn read_on_thread(probe: Probe, stack: usize) {
    let source = probe.source();
    std::thread::Builder::new()
        .stack_size(stack)
        .spawn(move || {
            let tree = parse(&source);
            let ctx = ReadCtx::new(&source, 1);
            RenderRoot::read_root(&mut tree.walk(), &ctx, Depth::All).unwrap();
        })
        .unwrap()
        .join()
        .unwrap_or_else(|_| panic!("the typed read failed"));
}

#[test]
fn a_nesting_of_250_levels_reads_on_two_mib() {
    read_on_thread(Probe::Nested(250), TWO_MIB);
}

/// A child of the depth test: reads `STACK_PROBE` on a thread of `STACK_KIB`
/// KiB, and aborts if that overflows. A plain run of the suite has neither
/// variable and passes.
#[test]
fn stack_probe_child() {
    let Ok(probe) = std::env::var("STACK_PROBE") else { return };
    let kib: usize = std::env::var("STACK_KIB").unwrap().parse().unwrap();
    read_on_thread(Probe::from_env(&probe), kib * 1024);
}

/// Whether the typed read reads `probe` on a stack of `kib` KiB: the child
/// test ran (it reports one test passed) and did not overflow.
fn survives(probe: Probe, kib: usize) -> bool {
    let output = Command::new(std::env::current_exe().unwrap())
        .args(["--exact", "stack_probe_child", "--test-threads=1"])
        .env("STACK_PROBE", probe.env())
        .env("STACK_KIB", kib.to_string())
        .output()
        .unwrap();
    output.status.success() && String::from_utf8_lossy(&output.stdout).contains("1 passed")
}

/// The least stack, in KiB, on which the typed read reads `probe`, found by
/// running the child on smaller and larger stacks.
fn least_stack_kib(probe: Probe) -> usize {
    let (mut lo, mut hi) = (16, 16 * 1024);
    assert!(survives(probe, hi), "the typed read overflows {hi} KiB reading {probe:?}, or the probe did not run");
    while hi - lo > 8 {
        let mid = (lo + hi) / 2;
        if survives(probe, mid) {
            hi = mid;
        } else {
            lo = mid;
        }
    }
    hi
}

/// The typed read's least stack at each of `LEVELS`, held to its target's
/// pinned ceilings. The measured levels, both slopes and the deepest corpus
/// entry's least stack are printed, not gated.
#[test]
fn the_typed_read_stays_within_its_pinned_stack_ceilings() {
    let typed = LEVELS.map(|n| least_stack_kib(Probe::Nested(n)));
    assert!(typed[3] > typed[2] && typed[2] > typed[0], "the least stack must grow with the nesting: {typed:?}");
    let slope = |from: usize, to: usize| (typed[to] - typed[from]) as f64 * 1024.0 / (LEVELS[to] - LEVELS[from]) as f64;
    let release = !cfg!(debug_assertions);
    let (os, arch) = (std::env::consts::OS, std::env::consts::ARCH);
    let profile = if release { "release" } else { "dev" };
    println!(
        "{os}/{arch} {profile}: least stack KiB at {LEVELS:?} levels: {typed:?}; {:.0} B per level from 40 to 200, {:.0} from 1 to 200",
        slope(2, 3),
        slope(0, 3)
    );
    println!("least stack KiB reading the deepest corpus entry: {}", least_stack_kib(Probe::Input(DEEPEST)));
    let Some(pinned) = CEILINGS.iter().find(|row| row.os == os && row.arch == arch && row.release == release) else {
        panic!("no stack ceilings are pinned for {os}/{arch} ({profile} profile); measured {typed:?} KiB at {LEVELS:?} levels: add a row to CEILINGS");
    };
    match pinned.limit {
        Limit::Levels(ceilings) => {
            for ((level, kib), ceiling) in LEVELS.iter().zip(typed).zip(ceilings) {
                assert!(kib <= ceiling, "typed {kib} KiB at {level} levels exceeds {ceiling} KiB; measured {typed:?}");
            }
        }
        Limit::Slope { bytes_per_level, root_kib } => {
            assert!(slope(2, 3) <= bytes_per_level, "typed {:.0} B per level exceeds {bytes_per_level:.0} B; measured {typed:?}", slope(2, 3));
            assert!(typed[0] <= root_kib, "typed root cost {} KiB exceeds {root_kib} KiB; measured {typed:?}", typed[0]);
        }
    }
}
