import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ReadonlyType } from '../types.js';


class ReadonlyTypeBuilder extends Builder<ReadonlyType> {
  private _children: Builder[] = [];

  constructor(children: Builder) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('readonly');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ReadonlyType {
    return {
      kind: 'readonly_type',
      children: this._children[0]?.build(ctx),
    } as ReadonlyType;
  }

  override get nodeKind(): string { return 'readonly_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'readonly', type: 'readonly' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { ReadonlyTypeBuilder };

export function readonly_type(children: Builder): ReadonlyTypeBuilder {
  return new ReadonlyTypeBuilder(children);
}

export interface ReadonlyTypeOptions {
  children: Builder | (Builder)[];
}

export namespace readonly_type {
  export function from(options: ReadonlyTypeOptions): ReadonlyTypeBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new ReadonlyTypeBuilder(_ctor);
    return b;
  }
}
