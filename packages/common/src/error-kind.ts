/**
 * tree-sitter's builtin ERROR symbol: the kind of the node error recovery
 * wraps unparsable source in. Issued by tree-sitter, not by a grammar, so
 * every grammar's kind table carries it under this id and name.
 */
export const ERROR_KIND_ID = 65535;
export const ERROR_KIND_NAME = 'ERROR';
