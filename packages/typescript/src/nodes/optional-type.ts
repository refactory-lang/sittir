import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { OptionalType } from '../types.js';


class OptionalTypeBuilder extends Builder<OptionalType> {
  private _children: Builder[] = [];

  constructor(children: Builder) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('?');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): OptionalType {
    return {
      kind: 'optional_type',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as OptionalType;
  }

  override get nodeKind(): string { return 'optional_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '?', type: '?' });
    return parts;
  }
}

export type { OptionalTypeBuilder };

export function optional_type(children: Builder): OptionalTypeBuilder {
  return new OptionalTypeBuilder(children);
}

export interface OptionalTypeOptions {
  children: Builder | (Builder)[];
}

export namespace optional_type {
  export function from(options: OptionalTypeOptions): OptionalTypeBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new OptionalTypeBuilder(_ctor);
    return b;
  }
}
