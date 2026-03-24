import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { BaseFieldInitializer, FieldInitializer, FieldInitializerList, ShorthandFieldInitializer } from '../types.js';
import { shorthand_field_initializer } from './shorthand-field-initializer.js';
import type { ShorthandFieldInitializerOptions } from './shorthand-field-initializer.js';
import { field_initializer } from './field-initializer.js';
import type { FieldInitializerOptions } from './field-initializer.js';
import { base_field_initializer } from './base-field-initializer.js';
import type { BaseFieldInitializerOptions } from './base-field-initializer.js';


class FieldInitializerListBuilder extends Builder<FieldInitializerList> {
  private _children: Builder<ShorthandFieldInitializer | FieldInitializer | BaseFieldInitializer>[] = [];

  constructor() { super(); }

  children(...value: Builder<ShorthandFieldInitializer | FieldInitializer | BaseFieldInitializer>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('{');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));
    parts.push('}');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): FieldInitializerList {
    return {
      kind: 'field_initializer_list',
      children: this._children.map(c => c.build(ctx)),
    } as FieldInitializerList;
  }

  override get nodeKind(): 'field_initializer_list' { return 'field_initializer_list'; }

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
  nodeKind: 'field_initializer_list';
  children?: Builder<ShorthandFieldInitializer | FieldInitializer | BaseFieldInitializer> | ShorthandFieldInitializerOptions | FieldInitializerOptions | BaseFieldInitializerOptions | (Builder<ShorthandFieldInitializer | FieldInitializer | BaseFieldInitializer> | ShorthandFieldInitializerOptions | FieldInitializerOptions | BaseFieldInitializerOptions)[];
}

export namespace field_initializer_list {
  export function from(input: Omit<FieldInitializerListOptions, 'nodeKind'> | Builder<ShorthandFieldInitializer | FieldInitializer | BaseFieldInitializer> | ShorthandFieldInitializerOptions | FieldInitializerOptions | BaseFieldInitializerOptions | (Builder<ShorthandFieldInitializer | FieldInitializer | BaseFieldInitializer> | ShorthandFieldInitializerOptions | FieldInitializerOptions | BaseFieldInitializerOptions)[]): FieldInitializerListBuilder {
    const options: Omit<FieldInitializerListOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<FieldInitializerListOptions, 'nodeKind'>
      : { children: input } as Omit<FieldInitializerListOptions, 'nodeKind'>;
    const b = new FieldInitializerListBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'shorthand_field_initializer': return shorthand_field_initializer.from(_v);   case 'field_initializer': return field_initializer.from(_v);   case 'base_field_initializer': return base_field_initializer.from(_v); } throw new Error('unreachable'); }));
    }
    return b;
  }
}
