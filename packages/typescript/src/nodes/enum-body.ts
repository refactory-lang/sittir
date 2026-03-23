import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ComputedPropertyName, EnumAssignment, EnumBody, Number, PrivatePropertyIdentifier, PropertyIdentifier, String } from '../types.js';
import { enum_assignment } from './enum-assignment.js';
import type { EnumAssignmentOptions } from './enum-assignment.js';


class EnumBodyBuilder extends Builder<EnumBody> {
  private _name: Builder<PropertyIdentifier | PrivatePropertyIdentifier | String | Number | ComputedPropertyName>[] = [];
  private _children: Builder<EnumAssignment>[] = [];

  constructor() { super(); }

  name(...value: Builder<PropertyIdentifier | PrivatePropertyIdentifier | String | Number | ComputedPropertyName>[]): this {
    this._name = value;
    return this;
  }

  children(...value: Builder<EnumAssignment>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('{');
    if (this._name.length > 0) {
      if (this._name.length > 0) parts.push(this.renderChildren(this._name, ', ', ctx));
      if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
      parts.push(',');
      if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
      parts.push(',');
    }
    parts.push('}');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): EnumBody {
    return {
      kind: 'enum_body',
      name: this._name.map(c => c.build(ctx)),
      children: this._children.map(c => c.build(ctx)),
    } as EnumBody;
  }

  override get nodeKind(): string { return 'enum_body'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '{', type: '{' });
    if (this._name.length > 0) {
      for (const child of this._name) {
        parts.push({ kind: 'builder', builder: child, fieldName: 'name' });
      }
      if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
      parts.push({ kind: 'token', text: ',', type: ',' });
      if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
      parts.push({ kind: 'token', text: ',', type: ',' });
    }
    parts.push({ kind: 'token', text: '}', type: '}' });
    return parts;
  }
}

export type { EnumBodyBuilder };

export function enum_body(): EnumBodyBuilder {
  return new EnumBodyBuilder();
}

export interface EnumBodyOptions {
  name?: Builder<PropertyIdentifier | PrivatePropertyIdentifier | String | Number | ComputedPropertyName> | (Builder<PropertyIdentifier | PrivatePropertyIdentifier | String | Number | ComputedPropertyName>)[];
  children?: Builder<EnumAssignment> | EnumAssignmentOptions | (Builder<EnumAssignment> | EnumAssignmentOptions)[];
}

export namespace enum_body {
  export function from(options: EnumBodyOptions): EnumBodyBuilder {
    const b = new EnumBodyBuilder();
    if (options.name !== undefined) {
      const _v = options.name;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.name(..._arr);
    }
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_x => _x instanceof Builder ? _x : enum_assignment.from(_x as EnumAssignmentOptions)));
    }
    return b;
  }
}
