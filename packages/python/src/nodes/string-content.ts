import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild, LeafOptions } from '@sittir/types';
import type { EscapeInterpolation, EscapeSequence, StringContent } from '../types.js';


class StringContentBuilder extends Builder<StringContent> {
  private _children: Builder<EscapeInterpolation | EscapeSequence>[] = [];

  constructor() { super(); }

  children(...value: Builder<EscapeInterpolation | EscapeSequence>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): StringContent {
    return {
      kind: 'string_content',
      children: this._children.map(c => c.build(ctx)),
    } as StringContent;
  }

  override get nodeKind(): 'string_content' { return 'string_content'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { StringContentBuilder };

export function string_content(): StringContentBuilder {
  return new StringContentBuilder();
}

export interface StringContentOptions {
  nodeKind: 'string_content';
  children?: Builder<EscapeInterpolation | EscapeSequence> | LeafOptions<'escape_interpolation'> | LeafOptions<'escape_sequence'> | (Builder<EscapeInterpolation | EscapeSequence> | LeafOptions<'escape_interpolation'> | LeafOptions<'escape_sequence'>)[];
}

export namespace string_content {
  export function from(input: Omit<StringContentOptions, 'nodeKind'> | Builder<EscapeInterpolation | EscapeSequence> | LeafOptions<'escape_interpolation'> | LeafOptions<'escape_sequence'> | (Builder<EscapeInterpolation | EscapeSequence> | LeafOptions<'escape_interpolation'> | LeafOptions<'escape_sequence'>)[]): StringContentBuilder {
    const options: Omit<StringContentOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<StringContentOptions, 'nodeKind'>
      : { children: input } as Omit<StringContentOptions, 'nodeKind'>;
    const b = new StringContentBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'escape_interpolation': return new LeafBuilder('escape_interpolation', (_v as LeafOptions).text!);   case 'escape_sequence': return new LeafBuilder('escape_sequence', (_v as LeafOptions).text!); } throw new Error('unreachable'); }));
    }
    return b;
  }
}
