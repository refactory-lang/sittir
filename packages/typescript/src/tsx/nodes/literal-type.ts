import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { False, LiteralType, Null, True, UnaryExpression, Undefined } from '../types.js';


class LiteralTypeBuilder extends Builder<LiteralType> {
  private _children: Builder<False | Null | True | UnaryExpression | Undefined>[] = [];

  constructor(children: Builder<False | Null | True | UnaryExpression | Undefined>) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): LiteralType {
    return {
      kind: 'literal_type',
      children: this._children[0]?.build(ctx),
    } as LiteralType;
  }

  override get nodeKind(): string { return 'literal_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { LiteralTypeBuilder };

export function literal_type(children: Builder<False | Null | True | UnaryExpression | Undefined>): LiteralTypeBuilder {
  return new LiteralTypeBuilder(children);
}

export interface LiteralTypeOptions {
  children: Builder<False | Null | True | UnaryExpression | Undefined> | (Builder<False | Null | True | UnaryExpression | Undefined>)[];
}

export namespace literal_type {
  export function from(options: LiteralTypeOptions): LiteralTypeBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new LiteralTypeBuilder(_ctor);
    return b;
  }
}
