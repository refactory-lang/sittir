const TAG_NODE = 1 << 28;
const TAG_LIST = 2 << 28;
const TAG_TEXT = 3 << 28;
const TAG_INT = 4 << 28;
const TAG_BOOL = 5 << 28;

export class Arena {
  words = new Uint32Array(1 << 16);
  next = 1; // 0 is "absent"
  bytes = new Uint8Array(1 << 16);
  nextByte = 0;
  encoder = new TextEncoder();
  slotIds = new Map<string, number>();

  reset(): void {
    this.next = 1;
    this.nextByte = 0;
  }
  bump(n: number): number {
    const at = this.next;
    if (at + n > this.words.length) {
      const grown = new Uint32Array(Math.max(this.words.length * 2, at + n));
      grown.set(this.words);
      this.words = grown;
    }
    this.next = at + n;
    return at;
  }
  text(value: string): number {
    const need = value.length * 3;
    if (this.nextByte + need > this.bytes.length) {
      const grown = new Uint8Array(Math.max(this.bytes.length * 2, this.nextByte + need));
      grown.set(this.bytes);
      this.bytes = grown;
    }
    const start = this.nextByte;
    const { written } = this.encoder.encodeInto(value, this.bytes.subarray(start));
    this.nextByte = start + written;
    const at = this.bump(2);
    this.words[at] = start;
    this.words[at + 1] = written;
    return TAG_TEXT | at;
  }
  slotId(key: string): number {
    let id = this.slotIds.get(key);
    if (id === undefined) {
      id = this.slotIds.size + 1;
      this.slotIds.set(key, id);
    }
    return id;
  }
  value(value: unknown): number {
    if (value === undefined || value === null) return 0;
    if (typeof value === 'string') return this.text(value);
    if (typeof value === 'number') return TAG_INT | (value & 0x0fffffff);
    if (typeof value === 'boolean') return TAG_BOOL | (value ? 1 : 0);
    if (Array.isArray(value)) {
      const at = this.bump(1 + value.length);
      this.words[at] = value.length;
      for (let i = 0; i < value.length; i++) this.words[at + 1 + i] = this.value(value[i]);
      return TAG_LIST | at;
    }
    return TAG_NODE | this.node(value as Record<string, unknown>);
  }
  node(record: Record<string, unknown>): number {
    let slots = 0;
    for (const key in record) if (key.charCodeAt(0) === 95 /* _ */ || key === '$other' || key === '$text') slots++;
    const at = this.bump(2 + slots * 2);
    this.words[at] = record.$type as number;
    this.words[at + 1] = slots;
    let i = at + 2;
    for (const key in record) {
      if (!(key.charCodeAt(0) === 95 || key === '$other' || key === '$text')) continue;
      const slot = this.slotId(key);
      const word = this.value(record[key]);
      this.words[i] = slot;
      this.words[i + 1] = word;
      i += 2;
    }
    return at;
  }
}
