// Stands in for a grammar's external scanner: it allocates the way a
// generated scanner does, through tree_sitter/alloc.h.
#include <stdint.h>

#include "tree_sitter/alloc.h"

int toy_scanner_roundtrip(void) {
  char *buffer = ts_malloc(16);
  if (buffer == NULL) return 0;
  buffer[0] = 'x';
  buffer = ts_realloc(buffer, 64);
  int kept = buffer != NULL && buffer[0] == 'x';
  ts_free(buffer);
  return kept;
}

uintptr_t toy_scanner_malloc_slot(void) { return (uintptr_t)&ts_current_malloc; }
