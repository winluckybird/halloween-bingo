import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
const local = createRequire(import.meta.url);
export function dependency(name) {
  try { return local(name); } catch (error) {
    const bundled = process.env.CODEX_NODE_MODULES || 'C:/Users/Lucky/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
    if (!existsSync(bundled)) throw error;
    return createRequire(`${bundled}/package.json`)(name);
  }
}
