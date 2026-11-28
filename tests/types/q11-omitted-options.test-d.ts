import * as typescript from '../../packages/typescript/src/factories/objects.ts';
import * as python from '../../packages/python/src/factories/objects.ts';
import * as rust from '../../packages/rust/src/factories/objects.ts';

typescript.buildClassStaticBlock();
typescript.buildClassStaticBlock(undefined);
typescript.buildClassStaticBlock(undefined, {});

typescript.buildFinallyClause();
typescript.buildFinallyClause(undefined);
// @ts-expect-error the value form of a finally clause takes no options
typescript.buildFinallyClause(undefined, {});

typescript.buildAmbientDeclarationGlobal();
typescript.buildAmbientDeclarationGlobal(undefined);
// @ts-expect-error an ambient declaration global takes no options
typescript.buildAmbientDeclarationGlobal(undefined, {});

typescript.buildTypeQueryCallExpression();
typescript.buildTypeQueryCallExpression(undefined);
// @ts-expect-error a type query call expression takes no options
typescript.buildTypeQueryCallExpression(undefined, {});

python.buildSuiteBlock();
python.buildSuiteBlock(undefined);
// @ts-expect-error a suite block takes no options
python.buildSuiteBlock(undefined, {});

python.buildSuiteBlockClassDeclaration();
python.buildSuiteBlockClassDeclaration(undefined);
// @ts-expect-error a suite block class declaration takes no options
python.buildSuiteBlockClassDeclaration(undefined, {});

rust.buildConstBlock();
rust.buildConstBlock(undefined);
// @ts-expect-error a const block takes no options
rust.buildConstBlock(undefined, {});

rust.buildUnsafeBlock();
rust.buildUnsafeBlock(undefined);
// @ts-expect-error an unsafe block takes no options
rust.buildUnsafeBlock(undefined, {});

rust.buildTryBlock();
rust.buildTryBlock(undefined);
// @ts-expect-error a try block takes no options
rust.buildTryBlock(undefined, {});
