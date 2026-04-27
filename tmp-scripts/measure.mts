import { validateFrom } from "../packages/codegen/src/validate/from.ts";
import { validateRoundTrip } from "../packages/codegen/src/validate/roundtrip.ts";
import { resolve } from "node:path";
const root = resolve(new URL("..", import.meta.url).pathname);
const tp = (g: string) => resolve(root, `packages/${g}/templates`);
for (const g of ["rust", "python", "typescript"] as const) {
  const rt = await validateRoundTrip(g, tp(g));
  const fr = await validateFrom(g);
  console.log(
    `${g}: rt=${rt.pass}/${rt.total} rtAst=${rt.astMatchPass}/${rt.total} from=${fr.pass}/${fr.total}`,
  );
}
