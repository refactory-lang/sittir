import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { RestType } from '../types.js';


class RestTypeBuilder extends Builder<RestType> {
  private _children: Builder[] = [];

  constructor(children: Builder) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('...');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): RestType {
    return {
      kind: 'rest_type',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as RestType;
  }

  override get nodeKind(): string { return 'rest_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '...', type: '...' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { RestTypeBuilder };

export function rest_type(children: Builder): RestTypeBuilder {
  return new RestTypeBuilder(children);
}

export interface RestTypeOptions {
  children: Builder | (Builder)[];
}

export namespace rest_type {
  export function from(options: RestTypeOptions): RestTypeBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new RestTypeBuilder(_ctor);
    return b;
  }
}
