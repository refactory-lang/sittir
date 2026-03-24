import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild, LeafOptions } from '@sittir/types';
import type { EscapeSequence, StringContent, StringLiteral } from '../types.js';


class StringLiteralBuilder extends Builder<StringLiteral> {
  private _children: Builder<EscapeSequence | StringContent>[] = [];

  constructor() { super(); }

  children(...value: Builder<EscapeSequence | StringContent>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('"');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): StringLiteral {
    return {
      kind: 'string_literal',
      children: this._children.map(c => c.build(ctx)),
    } as StringLiteral;
  }

  override get nodeKind(): 'string_literal' { return 'string_literal'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '"', type: '"' });
    return parts;
  }
}

export type { StringLiteralBuilder };

export function string_literal(): StringLiteralBuilder {
  return new StringLiteralBuilder();
}

export interface StringLiteralOptions {
  nodeKind: 'string_literal';
  children?: Builder<EscapeSequence | StringContent> | LeafOptions<'escape_sequence'> | LeafOptions<'string_content'> | (Builder<EscapeSequence | StringContent> | LeafOptions<'escape_sequence'> | LeafOptions<'string_content'>)[];
}

export namespace string_literal {
  export function from(input: Omit<StringLiteralOptions, 'nodeKind'> | Builder<EscapeSequence | StringContent> | LeafOptions<'escape_sequence'> | LeafOptions<'string_content'> | (Builder<EscapeSequence | StringContent> | LeafOptions<'escape_sequence'> | LeafOptions<'string_content'>)[]): StringLiteralBuilder {
    const options: Omit<StringLiteralOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<StringLiteralOptions, 'nodeKind'>
      : { children: input } as Omit<StringLiteralOptions, 'nodeKind'>;
    const b = new StringLiteralBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'escape_sequence': return new LeafBuilder('escape_sequence', (_v as LeafOptions).text!);   case 'string_content': return new LeafBuilder('string_content', (_v as LeafOptions).text!); } throw new Error('unreachable'); }));
    }
    return b;
  }
}
