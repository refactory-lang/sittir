use sittir_core::codec::{Height, RECURSION_LIMIT};
use sittir_core::read::{Depth, ReadCtx, ReadRoot};
use sittir_rust::render::RenderRoot;
use std::process::Command;

const TWO_MIB: usize = 2 * 1024 * 1024;

/// The nesting levels the stack is measured at.
const LEVELS: [usize; 4] = [1, 10, 40, 200];

/// What the typed read may cost in stack, pinned per target and profile from
/// the measured values (frames are fixed at compile time, so there is no jitter
/// to pad for): the least stack, in KiB, at each of `LEVELS`. The slope between
/// two levels is not gated, since one level's 8 KiB search granularity swings
/// it. Each only tightens. A target with no row fails with its own
/// measurement, so pinning it is one edit.
struct Ceilings {
    os: &'static str,
    arch: &'static str,
    release: bool,
    levels: [usize; 4],
}

const CEILINGS: &[Ceilings] = &[
    Ceilings { os: "macos", arch: "aarch64", release: true, levels: [7, 7, 39, 199] },
    Ceilings { os: "macos", arch: "aarch64", release: false, levels: [39, 71, 167, 727] },
    Ceilings { os: "linux", arch: "x86_64", release: true, levels: [23, 31, 63, 207] },
    Ceilings { os: "linux", arch: "x86_64", release: false, levels: [55, 87, 183, 703] },
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

/// Reads `probe` on a thread of `stack` bytes and ends the read there with
/// `end`: how many segments the read moved to.
fn read_on_thread(probe: Probe, stack: usize, end: fn(RenderRoot)) -> usize {
    let source = probe.source();
    std::thread::Builder::new()
        .stack_size(stack)
        .spawn(move || {
            let tree = parse(&source);
            let mut ctx = ReadCtx::new(&source, sittir_core::types::TreeId(1), <sittir_rust::render::AnyNode as sittir_core::read::ReadNode>::shows);
            end(RenderRoot::read_root(&mut tree.walk(), &mut ctx, Depth::All).unwrap());
            sittir_core::stack::segments_grown()
        })
        .unwrap()
        .join()
        .unwrap_or_else(|_| panic!("the typed read failed"))
}

#[test]
fn a_nesting_of_250_levels_reads_on_two_mib() {
    assert_eq!(read_on_thread(Probe::Nested(250), TWO_MIB, drop), 0);
}

/// A Worker thread's stack: the read outgrows it and moves to segments; the
/// drop, which recurses in place, fits it.
const FOUR_MIB: usize = 4 * 1024 * 1024;

#[test]
fn a_nesting_of_10000_levels_reads_past_and_drops_on_four_mib() {
    assert!(read_on_thread(Probe::Nested(10_000), FOUR_MIB, drop) > 0);
}

/// Takes a read apart a level at a time (`codec::release`), as a render
/// ends with its decoded input.
fn release(root: RenderRoot) {
    sittir_core::codec::release::<sittir_rust::render::node::TriviaNode, _>(root);
}

#[test]
fn a_nesting_of_100000_levels_reads_and_is_released_on_four_mib() {
    assert!(read_on_thread(Probe::Nested(100_000), FOUR_MIB, release) > 0);
}

/// The height a read stamps on the root of `probe`.
fn root_height(probe: Probe) -> Option<u16> {
    let source = probe.source();
    std::thread::Builder::new()
        .stack_size(FOUR_MIB)
        .spawn(move || {
            let tree = parse(&source);
            let mut ctx = ReadCtx::new(&source, sittir_core::types::TreeId(1), <sittir_rust::render::AnyNode as sittir_core::read::ReadNode>::shows);
            let root = RenderRoot::read_root(&mut tree.walk(), &mut ctx, Depth::All).unwrap();
            let height = Height::tallest(&root);
            release(root);
            height
        })
        .unwrap()
        .join()
        .unwrap_or_else(|_| panic!("the typed read failed"))
}

/// The root of `fn f() { 1; }` stands this high above its literal; each
/// parenthesis around the literal stamps the root one higher.
const ROOT_ABOVE_NESTING: u16 = 5;

/// The deepest nesting deep-trees.test.ts reads whole by the same source,
/// every nesting below it too.
const WHOLE_READ_CHAINS: u16 = 300;

/// The nestings whose root stands just under, at and just over the codec's
/// recursion limit, each within the chains deep-trees.test.ts reads whole.
#[test]
fn a_read_stamps_the_root_one_higher_for_each_level_and_saturates() {
    assert_eq!(root_height(Probe::Nested(0)), Some(ROOT_ABOVE_NESTING));
    let boundary = [RECURSION_LIMIT - 1, RECURSION_LIMIT, RECURSION_LIMIT + 1].map(|height| height - ROOT_ABOVE_NESTING);
    assert!(boundary.iter().all(|&levels| levels <= WHOLE_READ_CHAINS), "the whole-read chains reach past the recursion limit");
    for levels in [1, 10].into_iter().chain(boundary) {
        assert_eq!(root_height(Probe::Nested(usize::from(levels))), Some(ROOT_ABOVE_NESTING + levels));
    }
    assert_eq!(root_height(Probe::Nested(100_000)), Some(u16::MAX), "a nesting past u16::MAX levels saturates");
}

/// A child of the depth test: reads `STACK_PROBE` on a thread of `STACK_KIB`
/// KiB, and fails if the read moved to a segment or overflowed. A plain run
/// of the suite has neither variable and passes.
#[test]
fn stack_probe_child() {
    let Ok(probe) = std::env::var("STACK_PROBE") else { return };
    let kib: usize = std::env::var("STACK_KIB").unwrap().parse().unwrap();
    assert_eq!(read_on_thread(Probe::from_env(&probe), kib * 1024, drop), 0, "the read moved to a segment");
}

/// Whether the typed read reads `probe` in place on a stack of `kib` KiB:
/// the child test ran (it reports one test passed), never moved to a
/// segment, and did not overflow.
fn survives(probe: Probe, kib: usize) -> bool {
    let output = Command::new(std::env::current_exe().unwrap())
        .args(["--exact", "stack_probe_child", "--test-threads=1"])
        .env("STACK_PROBE", probe.env())
        .env("STACK_KIB", kib.to_string())
        .output()
        .unwrap();
    output.status.success() && String::from_utf8_lossy(&output.stdout).contains("1 passed")
}

/// The least stack, in KiB, the typed read of `probe` uses in place: the
/// least thread stack on which it reads without moving to a segment, found
/// by running the child on smaller and larger stacks, less the red zone each
/// step keeps free.
fn least_stack_kib(probe: Probe) -> usize {
    let (mut lo, mut hi) = (16, 16 * 1024);
    assert!(survives(probe, hi), "the typed read overflows {hi} KiB reading {probe:?}, or the probe did not run");
    while hi - lo > 8 {
        let mid = usize::midpoint(lo, hi);
        if survives(probe, mid) {
            hi = mid;
        } else {
            lo = mid;
        }
    }
    hi - sittir_core::stack::RED_ZONE / 1024
}

/// The typed read's least stack at each of `LEVELS`, held to its target's
/// pinned ceilings. The measured levels, both slopes and the deepest corpus
/// entry's least stack are printed, not gated.
#[test]
fn the_typed_read_stays_within_its_pinned_stack_ceilings() {
    let typed = LEVELS.map(|n| least_stack_kib(Probe::Nested(n)));
    assert!(typed[3] > typed[2] && typed[2] > typed[0], "the least stack must grow with the nesting: {typed:?}");
    let kib = |n: usize| f64::from(u32::try_from(n).unwrap());
    let slope = |from: usize, to: usize| kib(typed[to] - typed[from]) * 1024.0 / kib(LEVELS[to] - LEVELS[from]);
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
    for ((level, kib), ceiling) in LEVELS.iter().zip(typed).zip(pinned.levels) {
        assert!(kib <= ceiling, "typed {kib} KiB at {level} levels exceeds {ceiling} KiB; measured {typed:?}");
    }
}
