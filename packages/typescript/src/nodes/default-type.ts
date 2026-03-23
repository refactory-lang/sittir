import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { DefaultType } from '../types.js';


class DefaultTypeBuilder extends Builder<DefaultType> {
  private _children: Builder[] = [];

  constructor(children: Builder) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('=');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): DefaultType {
    return {
      kind: 'default_type',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as DefaultType;
  }

  override get nodeKind(): string { return 'default_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '=', type: '=' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { DefaultTypeBuilder };

export function default_type(children: Builder): DefaultTypeBuilder {
  return new DefaultTypeBuilder(children);
}

export interface DefaultTypeOptions {
  children: Builder | (Builder)[];
}

export namespace default_type {
  export function from(options: DefaultTypeOptions): DefaultTypeBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new DefaultTypeBuilder(_ctor);
    return b;
  }
}
