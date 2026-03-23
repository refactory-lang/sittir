import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ParenthesizedType } from '../types.js';


class ParenthesizedTypeBuilder extends Builder<ParenthesizedType> {
  private _children: Builder[] = [];

  constructor(children: Builder) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('(');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push(')');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ParenthesizedType {
    return {
      kind: 'parenthesized_type',
      children: this._children[0]?.build(ctx),
    } as ParenthesizedType;
  }

  override get nodeKind(): string { return 'parenthesized_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '(', type: '(' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: ')', type: ')' });
    return parts;
  }
}

export type { ParenthesizedTypeBuilder };

export function parenthesized_type(children: Builder): ParenthesizedTypeBuilder {
  return new ParenthesizedTypeBuilder(children);
}

export interface ParenthesizedTypeOptions {
  children: Builder | (Builder)[];
}

export namespace parenthesized_type {
  export function from(options: ParenthesizedTypeOptions): ParenthesizedTypeBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new ParenthesizedTypeBuilder(_ctor);
    return b;
  }
}
