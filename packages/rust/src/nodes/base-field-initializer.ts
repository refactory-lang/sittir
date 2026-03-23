import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { BaseFieldInitializer, Expression } from '../types.js';


class BaseFieldInitializerBuilder extends Builder<BaseFieldInitializer> {
  private _children: Builder<Expression>[] = [];

  constructor(children: Builder<Expression>) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('..');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): BaseFieldInitializer {
    return {
      kind: 'base_field_initializer',
      children: this._children[0]?.build(ctx),
    } as BaseFieldInitializer;
  }

  override get nodeKind(): string { return 'base_field_initializer'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '..', type: '..' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { BaseFieldInitializerBuilder };

export function base_field_initializer(children: Builder<Expression>): BaseFieldInitializerBuilder {
  return new BaseFieldInitializerBuilder(children);
}

export interface BaseFieldInitializerOptions {
  children: Builder<Expression> | (Builder<Expression>)[];
}

export namespace base_field_initializer {
  export function from(options: BaseFieldInitializerOptions): BaseFieldInitializerBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new BaseFieldInitializerBuilder(_ctor);
    return b;
  }
}
