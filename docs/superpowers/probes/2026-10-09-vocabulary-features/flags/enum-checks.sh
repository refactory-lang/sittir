#!/bin/bash
# The enum candidate's questions, run from the repository root: bash <this file>.
# 1. Does tsc accept a feature module that adds a member to the enum by module augmentation?
# 2. At run time, does the added member exist? An augmentation is ambient and emits nothing.
# 3. Do two declarations of one enum in one module merge at run time?
# 4. Does Node's strip-only loader, which loads every grammar, accept an enum? And --erasableSyntaxOnly?
set -u
HERE=$(cd "$(dirname "$0")/enum" && pwd)
ROOT=$(git -C "$HERE" rev-parse --show-toplevel)
echo "1. tsc on the augmentation:"; "$ROOT/node_modules/.bin/tsc" -p "$HERE/tsconfig.json" && echo "   accepted"
echo "2, 3. run with tsx:"; (cd "$HERE" && "$ROOT/node_modules/.bin/tsx" use.ts | sed 's/^/   /')
echo "4. Node strip-only:"; node "$HERE/flags.ts" 2>&1 | sed -n 's/^\(SyntaxError.*\)/   \1/p'
echo "   --erasableSyntaxOnly:"; "$ROOT/node_modules/.bin/tsc" --ignoreConfig --noEmit --erasableSyntaxOnly --module nodenext --moduleResolution nodenext "$HERE/flags.ts" | sed 's/^/   /'
exit 0
