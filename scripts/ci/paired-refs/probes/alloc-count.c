// Probe only, preloaded (LD_PRELOAD): counts this thread's allocations,
// frees, bytes allocated and bytes freed through glibc's malloc family, and
// exports them as probe_alloc_counts, which the probe build reads by dlsym.
#define _GNU_SOURCE
#include <errno.h>
#include <malloc.h>
#include <stddef.h>
#include <stdint.h>

extern void *__libc_malloc(size_t);
extern void __libc_free(void *);
extern void *__libc_calloc(size_t, size_t);
extern void *__libc_realloc(void *, size_t);
extern void *__libc_memalign(size_t, size_t);

static __thread uint64_t counts[4] __attribute__((tls_model("initial-exec")));

static inline void allocated(void *at) {
  if (at) {
    counts[0]++;
    counts[2] += malloc_usable_size(at);
  }
}

static inline void freeing(void *at) {
  if (at) {
    counts[1]++;
    counts[3] += malloc_usable_size(at);
  }
}

void probe_alloc_counts(uint64_t out[4]) {
  for (int i = 0; i < 4; i++) out[i] = counts[i];
}

void *malloc(size_t size) {
  void *at = __libc_malloc(size);
  allocated(at);
  return at;
}

void free(void *at) {
  freeing(at);
  __libc_free(at);
}

void *calloc(size_t n, size_t size) {
  void *at = __libc_calloc(n, size);
  allocated(at);
  return at;
}

void *realloc(void *old, size_t size) {
  freeing(old);
  void *at = __libc_realloc(old, size);
  if (size) allocated(at);
  return at;
}

void *memalign(size_t align, size_t size) {
  void *at = __libc_memalign(align, size);
  allocated(at);
  return at;
}

void *aligned_alloc(size_t align, size_t size) {
  return memalign(align, size);
}

int posix_memalign(void **out, size_t align, size_t size) {
  void *at = __libc_memalign(align, size);
  if (!at) return ENOMEM;
  allocated(at);
  *out = at;
  return 0;
}
