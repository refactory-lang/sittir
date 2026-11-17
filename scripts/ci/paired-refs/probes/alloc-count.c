// An allocation counter for the allocation count's local mode
// (run-phase-profile.py, MEASURE=allocs ALLOC_COUNTER=interposer).
//
// One shared library with two roles. Loaded at the benchmark's launch
// (DYLD_INSERT_LIBRARIES on macOS, LD_PRELOAD on Linux), it stands in for
// libc's malloc, calloc, realloc, posix_memalign, aligned_alloc, memalign and
// free. Required by the driver as a Node-API module, the same loaded image, it
// exports start(), stop(), take() and resolve(). Between start() and stop(),
// on the thread that called start() only, each allocation walks the frame
// pointers from here outward and adds its count and requested bytes to the
// slot of that call chain in a fixed table mapped at the first start(); a
// call chain that finds no free slot is counted as dropped, never lost
// silently. A free is counted, not placed. Nothing here allocates through
// malloc while counting.
#define NAPI_VERSION 8
#include <node_api.h>

#include <dlfcn.h>
#include <errno.h>
#include <pthread.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>
#include <sys/mman.h>

#define DEPTH 128
#define SLOTS (1u << 17)

enum { K_MALLOC, K_CALLOC, K_REALLOC, K_POSIX_MEMALIGN, K_ALIGNED_ALLOC, K_MEMALIGN, K_FREE, K_KINDS };
static const char *const KIND_NAMES[K_KINDS] = {"malloc", "calloc", "realloc", "posix_memalign", "aligned_alloc", "memalign", "free"};

typedef struct {
	uint64_t hash;
	uint64_t count;
	uint64_t bytes;
	uint32_t depth;
	uintptr_t frames[DEPTH];
} Slot;

static Slot *table;
static volatile int counting;
static pthread_t owner;
static int busy;
static uintptr_t stack_lo, stack_hi;
static uint64_t kinds[K_KINDS];
static uint64_t used, dropped_count, dropped_bytes;

static int on_stack(uintptr_t fp, uintptr_t lo, uintptr_t hi) {
	return fp >= lo && fp + 2 * sizeof(uintptr_t) <= hi && (fp & (sizeof(uintptr_t) - 1)) == 0;
}

static uintptr_t strip(uintptr_t address) {
#if defined(__aarch64__)
	return address & 0x0000ffffffffffffULL;
#else
	return address;
#endif
}

__attribute__((noinline)) static void record(int kind, size_t size) {
	if (!counting || busy || !pthread_equal(pthread_self(), owner)) return;
	busy = 1;
	kinds[kind]++;
	if (kind != K_FREE) {
		uintptr_t frames[DEPTH];
		uint32_t depth = 0;
		uintptr_t fp = (uintptr_t)__builtin_frame_address(0);
		uintptr_t segment = fp;
		while (depth < DEPTH && (on_stack(fp, stack_lo, stack_hi) || on_stack(fp, segment, segment + (16u << 20)))) {
			uintptr_t next = ((uintptr_t *)fp)[0];
			uintptr_t ret = strip(((uintptr_t *)fp)[1]);
			if (ret == 0) break;
			frames[depth++] = ret;
			if (next <= fp && !on_stack(next, stack_lo, stack_hi)) break;
			if (!on_stack(next, stack_lo, stack_hi) && !on_stack(next, segment, segment + (16u << 20))) break;
			if (on_stack(next, stack_lo, stack_hi) && !on_stack(fp, stack_lo, stack_hi)) segment = next;
			fp = next;
		}
		uint64_t hash = 1469598103934665603ULL;
		for (uint32_t i = 0; i < depth; i++) hash = (hash ^ frames[i]) * 1099511628211ULL;
		hash |= 1;
		uint32_t at = (uint32_t)(hash & (SLOTS - 1));
		int placed = 0;
		for (uint32_t probe = 0; probe < SLOTS; probe++, at = (at + 1) & (SLOTS - 1)) {
			Slot *slot = &table[at];
			if (slot->hash == 0) {
				slot->hash = hash;
				slot->depth = depth;
				memcpy(slot->frames, frames, depth * sizeof(uintptr_t));
				used++;
			} else if (slot->hash != hash || slot->depth != depth || memcmp(slot->frames, frames, depth * sizeof(uintptr_t)) != 0) {
				if (used < SLOTS * 3 / 4) continue;
				break;
			}
			slot->count++;
			slot->bytes += size;
			placed = 1;
			break;
		}
		if (!placed) {
			dropped_count++;
			dropped_bytes += size;
		}
	}
	busy = 0;
}

#if defined(__APPLE__)
#define REAL_MALLOC malloc
#define REAL_CALLOC calloc
#define REAL_REALLOC realloc
#define REAL_FREE free
static void *counted_malloc(size_t n) {
	record(K_MALLOC, n);
	return malloc(n);
}
static void *counted_calloc(size_t count, size_t n) {
	record(K_CALLOC, count * n);
	return calloc(count, n);
}
static void *counted_realloc(void *p, size_t n) {
	record(K_REALLOC, n);
	return realloc(p, n);
}
static void counted_free(void *p) {
	record(K_FREE, 0);
	free(p);
}
static int counted_posix_memalign(void **out, size_t align, size_t n) {
	record(K_POSIX_MEMALIGN, n);
	return posix_memalign(out, align, n);
}
static void *counted_aligned_alloc(size_t align, size_t n) {
	record(K_ALIGNED_ALLOC, n);
	return aligned_alloc(align, n);
}
#define INTERPOSE(replacement, original)                                                                                     \
	__attribute__((used)) static const struct {                                                                             \
		const void *with;                                                                                                    \
		const void *in_place_of;                                                                                             \
	} interpose_##original __attribute__((section("__DATA,__interpose"))) = {(const void *)&replacement, (const void *)&original};
INTERPOSE(counted_malloc, malloc)
INTERPOSE(counted_calloc, calloc)
INTERPOSE(counted_realloc, realloc)
INTERPOSE(counted_free, free)
INTERPOSE(counted_posix_memalign, posix_memalign)
INTERPOSE(counted_aligned_alloc, aligned_alloc)

static void bounds(void) {
	pthread_t self = pthread_self();
	stack_hi = (uintptr_t)pthread_get_stackaddr_np(self);
	stack_lo = stack_hi - pthread_get_stacksize_np(self);
}
#else
extern void *__libc_malloc(size_t);
extern void *__libc_calloc(size_t, size_t);
extern void *__libc_realloc(void *, size_t);
extern void __libc_free(void *);
extern void *__libc_memalign(size_t, size_t);

void *malloc(size_t n) {
	record(K_MALLOC, n);
	return __libc_malloc(n);
}
void *calloc(size_t count, size_t n) {
	record(K_CALLOC, count * n);
	return __libc_calloc(count, n);
}
void *realloc(void *p, size_t n) {
	record(K_REALLOC, n);
	return __libc_realloc(p, n);
}
void free(void *p) {
	record(K_FREE, 0);
	__libc_free(p);
}
int posix_memalign(void **out, size_t align, size_t n) {
	record(K_POSIX_MEMALIGN, n);
	if (align < sizeof(void *) || (align & (align - 1)) != 0) return EINVAL;
	void *p = __libc_memalign(align, n);
	if (p == NULL && n != 0) return ENOMEM;
	*out = p;
	return 0;
}
void *aligned_alloc(size_t align, size_t n) {
	record(K_ALIGNED_ALLOC, n);
	return __libc_memalign(align, n);
}
void *memalign(size_t align, size_t n) {
	record(K_MEMALIGN, n);
	return __libc_memalign(align, n);
}

static void bounds(void) {
	pthread_attr_t attr;
	void *address;
	size_t size;
	if (pthread_getattr_np(pthread_self(), &attr) == 0 && pthread_attr_getstack(&attr, &address, &size) == 0) {
		stack_lo = (uintptr_t)address;
		stack_hi = stack_lo + size;
	}
	pthread_attr_destroy(&attr);
}
#endif

#define CALL(call)                                                                                                             \
	do {                                                                                                                       \
		if ((call) != napi_ok) {                                                                                               \
			napi_throw_error(env, NULL, "alloc-count: " #call " failed");                                                      \
			return NULL;                                                                                                       \
		}                                                                                                                      \
	} while (0)

static napi_value number(napi_env env, double value) {
	napi_value out;
	napi_create_double(env, value, &out);
	return out;
}

static napi_value start(napi_env env, napi_callback_info info) {
	(void)info;
	if (counting) {
		napi_throw_error(env, NULL, "alloc-count: already counting");
		return NULL;
	}
	if (table == NULL) {
		void *mapped = mmap(NULL, SLOTS * sizeof(Slot), PROT_READ | PROT_WRITE, MAP_PRIVATE | MAP_ANON, -1, 0);
		if (mapped == MAP_FAILED) {
			napi_throw_error(env, NULL, "alloc-count: the table could not be mapped");
			return NULL;
		}
		table = mapped;
	}
	owner = pthread_self();
	bounds();
	__atomic_store_n(&counting, 1, __ATOMIC_SEQ_CST);
	return NULL;
}

static napi_value stop(napi_env env, napi_callback_info info) {
	(void)env;
	(void)info;
	__atomic_store_n(&counting, 0, __ATOMIC_SEQ_CST);
	return NULL;
}

static napi_value take(napi_env env, napi_callback_info info) {
	(void)info;
	if (counting) {
		napi_throw_error(env, NULL, "alloc-count: take() while counting");
		return NULL;
	}
	napi_value result, stacks, kindCounts, dropped;
	CALL(napi_create_object(env, &result));
	CALL(napi_create_array(env, &stacks));
	uint32_t n = 0;
	for (uint32_t at = 0; table != NULL && at < SLOTS; at++) {
		Slot *slot = &table[at];
		if (slot->hash == 0) continue;
		napi_value stack, frames;
		CALL(napi_create_object(env, &stack));
		CALL(napi_create_array_with_length(env, slot->depth, &frames));
		for (uint32_t i = 0; i < slot->depth; i++) CALL(napi_set_element(env, frames, i, number(env, (double)slot->frames[i])));
		CALL(napi_set_named_property(env, stack, "count", number(env, (double)slot->count)));
		CALL(napi_set_named_property(env, stack, "bytes", number(env, (double)slot->bytes)));
		CALL(napi_set_named_property(env, stack, "ips", frames));
		CALL(napi_set_element(env, stacks, n++, stack));
	}
	CALL(napi_create_object(env, &kindCounts));
	for (int kind = 0; kind < K_KINDS; kind++) CALL(napi_set_named_property(env, kindCounts, KIND_NAMES[kind], number(env, (double)kinds[kind])));
	CALL(napi_create_object(env, &dropped));
	CALL(napi_set_named_property(env, dropped, "count", number(env, (double)dropped_count)));
	CALL(napi_set_named_property(env, dropped, "bytes", number(env, (double)dropped_bytes)));
	CALL(napi_set_named_property(env, result, "stacks", stacks));
	CALL(napi_set_named_property(env, result, "kinds", kindCounts));
	CALL(napi_set_named_property(env, result, "dropped", dropped));
	CALL(napi_set_named_property(env, result, "slots", number(env, SLOTS)));
	CALL(napi_set_named_property(env, result, "depth", number(env, DEPTH)));
	if (table != NULL) memset(table, 0, SLOTS * sizeof(Slot));
	memset(kinds, 0, sizeof kinds);
	used = dropped_count = dropped_bytes = 0;
	return result;
}

static napi_value resolve(napi_env env, napi_callback_info info) {
	size_t argc = 1;
	napi_value argv[1], list, out;
	CALL(napi_get_cb_info(env, info, &argc, argv, NULL, NULL));
	list = argv[0];
	uint32_t length;
	CALL(napi_get_array_length(env, list, &length));
	CALL(napi_create_array_with_length(env, length, &out));
	for (uint32_t i = 0; i < length; i++) {
		napi_value element, entry, text;
		double ip;
		CALL(napi_get_element(env, list, i, &element));
		CALL(napi_get_value_double(env, element, &ip));
		Dl_info found;
		CALL(napi_create_object(env, &entry));
		if (dladdr((const void *)(uintptr_t)ip, &found) != 0 && found.dli_fname != NULL) {
			CALL(napi_create_string_utf8(env, found.dli_fname, NAPI_AUTO_LENGTH, &text));
			CALL(napi_set_named_property(env, entry, "image", text));
			CALL(napi_set_named_property(env, entry, "offset", number(env, (double)((uintptr_t)ip - (uintptr_t)found.dli_fbase))));
			if (found.dli_sname != NULL) {
				CALL(napi_create_string_utf8(env, found.dli_sname, NAPI_AUTO_LENGTH, &text));
				CALL(napi_set_named_property(env, entry, "symbol", text));
				CALL(napi_set_named_property(env, entry, "symbolOffset", number(env, (double)((uintptr_t)ip - (uintptr_t)found.dli_saddr))));
			}
		}
		CALL(napi_set_element(env, out, i, entry));
	}
	return out;
}

NAPI_MODULE_INIT() {
	napi_property_descriptor exported[] = {
		{"start", NULL, start, NULL, NULL, NULL, napi_default, NULL},
		{"stop", NULL, stop, NULL, NULL, NULL, napi_default, NULL},
		{"take", NULL, take, NULL, NULL, NULL, napi_default, NULL},
		{"resolve", NULL, resolve, NULL, NULL, NULL, napi_default, NULL},
	};
	napi_define_properties(env, exports, sizeof exported / sizeof exported[0], exported);
	return exports;
}
