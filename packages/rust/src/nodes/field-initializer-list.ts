import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { BaseFieldInitializer, FieldInitializer, FieldInitializerList, ShorthandFieldInitializer } from '../types.js';


class FieldInitializerListBuilder extends Builder<FieldInitializerList> {
  private _children: Builder<BaseFieldInitializer | FieldInitializer | ShorthandFieldInitializer>[] = [];

  constructor() { super(); }

  children(...value: Builder<BaseFieldInitializer | FieldInitializer | ShorthandFieldInitializer>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('{');
    if (this._children.length === 1) {
      parts.push(',');
      parts.push(this.renderChild(this._children[0]!, ctx));
    } else if (this._children.length > 1) {
      parts.push(this.renderChildren(this._children, ' , ', ctx));
    }
    parts.push('}');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): FieldInitializerList {
    return {
      kind: 'field_initializer_list',
      children: this._children.map(c => c.build(ctx)),
    } as FieldInitializerList;
  }

  override get nodeKind(): string { return 'field_initializer_list'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '{', type: '{' });
    for (let i = 0; i < this._children.length; i++) {
      if (i > 0 || this._children.length === 1) parts.push({ kind: 'token', text: ',', type: ',' });
      parts.push({ kind: 'builder', builder: this._children[i]! });
    }
    parts.push({ kind: 'token', text: '}', type: '}' });
    return parts;
  }
}

export type { FieldInitializerListBuilder };

export function field_initializer_list(): FieldInitializerListBuilder {
  return new FieldInitializerListBuilder();
}

export interface FieldInitializerListOptions {
  children?: Builder<BaseFieldInitializer | FieldInitializer | ShorthandFieldInitializer> | (Builder<BaseFieldInitializer | FieldInitializer | ShorthandFieldInitializer>)[];
}

export namespace field_initializer_list {
  export function from(options: FieldInitializerListOptions): FieldInitializerListBuilder {
    const b = new FieldInitializerListBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
