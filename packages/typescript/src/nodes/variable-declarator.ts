import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { VariableDeclarator } from '../types.js';


class VariableDeclaratorBuilder extends BaseBuilder<VariableDeclarator> {
  private _name: BaseBuilder;
  private _type?: BaseBuilder;
  private _value?: BaseBuilder;

  constructor(name: BaseBuilder) {
    super();
    this._name = name;
  }

  type(value: BaseBuilder): this {
    this._type = value;
    return this;
  }

  value(value: BaseBuilder): this {
    this._value = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    if (this._value) {
      parts.push('=');
      if (this._value) parts.push(this.renderChild(this._value, ctx));
    }
    return parts.join(' ');
  }

  build(ctx?: RenderContext): VariableDeclarator {
    return {
      kind: 'variable_declarator',
      name: this.renderChild(this._name, ctx),
      type: this._type ? this.renderChild(this._type, ctx) : undefined,
      value: this._value ? this.renderChild(this._value, ctx) : undefined,
    } as unknown as VariableDeclarator;
  }

  override get nodeKind(): string { return 'variable_declarator'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    if (this._value) {
      parts.push({ kind: 'token', text: '=', type: '=' });
      if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    }
    return parts;
  }
}

export function variable_declarator(name: BaseBuilder): VariableDeclaratorBuilder {
  return new VariableDeclaratorBuilder(name);
}
