// Single source of truth: re-export the validator's resolution helpers so the
// CLI does not reimplement grammar/backend parsing.
export { resolveGrammars, resolveBackends, defaultTemplatesPath } from '@sittir/validator';
