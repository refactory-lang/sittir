import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { BracketedType, QualifiedType, Type } from '../types.js';


class BracketedTypeBuilder extends Builder<BracketedType> {
  private _children: Builder<Type | QualifiedType>[] = [];

  constructor(children: Builder<Type | QualifiedType>) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('<');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('>');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): BracketedType {
    return {
      kind: 'bracketed_type',
      children: this._children[0]?.build(ctx),
    } as BracketedType;
  }

  override get nodeKind(): string { return 'bracketed_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '<', type: '<' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '>', type: '>' });
    return parts;
  }
}

export type { BracketedTypeBuilder };

export function bracketed_type(children: Builder<Type | QualifiedType>): BracketedTypeBuilder {
  return new BracketedTypeBuilder(children);
}

export interface BracketedTypeOptions {
  children: Builder<Type | QualifiedType> | (Builder<Type | QualifiedType>)[];
}

export namespace bracketed_type {
  export function from(options: BracketedTypeOptions): BracketedTypeBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new BracketedTypeBuilder(_ctor);
    return b;
  }
}
