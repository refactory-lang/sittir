import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ArrayType, PrimaryType } from '../types.js';


class ArrayTypeBuilder extends Builder<ArrayType> {
  private _children: Builder<PrimaryType>[] = [];

  constructor(children: Builder<PrimaryType>) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('[');
    parts.push(']');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ArrayType {
    return {
      kind: 'array_type',
      children: this._children[0]?.build(ctx),
    } as ArrayType;
  }

  override get nodeKind(): string { return 'array_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '[', type: '[' });
    parts.push({ kind: 'token', text: ']', type: ']' });
    return parts;
  }
}

export type { ArrayTypeBuilder };

export function array_type(children: Builder<PrimaryType>): ArrayTypeBuilder {
  return new ArrayTypeBuilder(children);
}

export interface ArrayTypeOptions {
  children: Builder<PrimaryType> | (Builder<PrimaryType>)[];
}

export namespace array_type {
  export function from(options: ArrayTypeOptions): ArrayTypeBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new ArrayTypeBuilder(_ctor);
    return b;
  }
}
