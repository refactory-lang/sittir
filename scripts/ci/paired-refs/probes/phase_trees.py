# What the phase scripts (run-phase-profile.py, run-phase-time.py,
# run-phase-flat.py) share: the trees named on their command line and the
# unstripped copy of a tree's addon.
import subprocess
from pathlib import Path

FRESHNESS = 'packages/codegen/src/scripts/native-binary-freshness.ts'


# <name>=<tree>[@<storage>]..., each tree once under the first name given for
# it, unless every name is kept.
def namedTrees(args, everyName=False):
    trees = {}
    for arg in args:
        name, spec = arg.split('=', 1)
        tree = Path(spec.partition('@')[0]).resolve()
        if everyName or tree not in trees.values():
            trees[name] = tree
    return trees


# The tree's own unstrippedReleaseBinary: the copy held to its release build's
# stamp, which a process loads through NAPI_RS_NATIVE_LIBRARY_PATH.
def unstrippedCopy(tree, grammar):
    script = ('const [root, grammar] = process.argv.slice(1); '
              f'const stamps = await import(`${{root}}/{FRESHNESS}`); '
              'console.log(stamps.unstrippedReleaseBinary(root, grammar, stamps.hostBinaryName(grammar)));')
    found = subprocess.run(['node', '--input-type=module', '-e', script, str(tree), grammar], check=True, stdout=subprocess.PIPE, text=True)
    return Path(found.stdout.strip()).resolve()
