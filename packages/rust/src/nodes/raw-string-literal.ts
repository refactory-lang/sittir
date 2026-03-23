import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { RawStringLiteral, StringContent } from '../types.js';


class RawStringLiteralBuilder extends Builder<RawStringLiteral> {
  private _children: Builder<StringContent>[] = [];

  constructor(children: Builder<StringContent>) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): RawStringLiteral {
    return {
      kind: 'raw_string_literal',
      children: this._children[0]?.build(ctx),
    } as RawStringLiteral;
  }

  override get nodeKind(): string { return 'raw_string_literal'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { RawStringLiteralBuilder };

export function raw_string_literal(children: Builder<StringContent>): RawStringLiteralBuilder {
  return new RawStringLiteralBuilder(children);
}

export interface RawStringLiteralOptions {
  children: Builder<StringContent> | string | (Builder<StringContent> | string)[];
}

export namespace raw_string_literal {
  export function from(options: RawStringLiteralOptions): RawStringLiteralBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new RawStringLiteralBuilder(typeof _ctor === 'string' ? new LeafBuilder('string_content', _ctor) : _ctor);
    return b;
  }
}
