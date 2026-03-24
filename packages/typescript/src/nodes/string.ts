import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild, LeafOptions } from '@sittir/types';
import type { EscapeSequence, String, StringFragment } from '../types.js';


class StringBuilder extends Builder<String> {
  private _children: Builder<StringFragment | EscapeSequence>[] = [];

  constructor() { super(); }

  children(...value: Builder<StringFragment | EscapeSequence>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('"');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('"');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): String {
    return {
      kind: 'string',
      children: this._children.map(c => c.build(ctx)),
    } as String;
  }

  override get nodeKind(): 'string' { return 'string'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '"', type: '"' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '"', type: '"' });
    return parts;
  }
}

export type { StringBuilder };

export function string(): StringBuilder {
  return new StringBuilder();
}

export interface StringOptions {
  nodeKind: 'string';
  children?: Builder<StringFragment | EscapeSequence> | LeafOptions<'string_fragment'> | LeafOptions<'escape_sequence'> | (Builder<StringFragment | EscapeSequence> | LeafOptions<'string_fragment'> | LeafOptions<'escape_sequence'>)[];
}

export namespace string {
  export function from(input: Omit<StringOptions, 'nodeKind'> | Builder<StringFragment | EscapeSequence> | LeafOptions<'string_fragment'> | LeafOptions<'escape_sequence'> | (Builder<StringFragment | EscapeSequence> | LeafOptions<'string_fragment'> | LeafOptions<'escape_sequence'>)[]): StringBuilder {
    const options: Omit<StringOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<StringOptions, 'nodeKind'>
      : { children: input } as Omit<StringOptions, 'nodeKind'>;
    const b = new StringBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'string_fragment': return new LeafBuilder('string_fragment', (_v as LeafOptions).text!);   case 'escape_sequence': return new LeafBuilder('escape_sequence', (_v as LeafOptions).text!); } throw new Error('unreachable'); }));
    }
    return b;
  }
}
