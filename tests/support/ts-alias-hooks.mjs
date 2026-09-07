/**
 * Lets `node --test` load the app's TypeScript modules directly.
 *
 * Node strips the types itself; the only thing it cannot do is resolve the two
 * conventions the source uses — the `@/` alias from `tsconfig.json`, and
 * extensionless imports. Both are rewritten here, but only for specifiers that
 * resolve inside `src/`, so the test runner's own paths are left alone.
 */
import { registerHooks } from "node:module";

const SRC = new URL("../../src/", import.meta.url);
const HAS_EXTENSION = /\.[cm]?[jt]sx?$|\.json$/;

registerHooks({
  resolve(specifier, context, nextResolve) {
    let target = specifier;

    if (target.startsWith("@/")) {
      target = new URL(target.slice(2), SRC).href;
    } else if (target.startsWith(".") && context.parentURL?.startsWith(SRC.href)) {
      target = new URL(target, context.parentURL).href;
    }

    if (target.startsWith(SRC.href) && !HAS_EXTENSION.test(target)) {
      target += ".ts";
    }

    return nextResolve(target, context);
  },
});
