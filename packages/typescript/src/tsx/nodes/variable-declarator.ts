import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ArrayPattern, Expression, Identifier, ObjectPattern, TypeAnnotation, VariableDeclarator } from '../types.js';


class VariableDeclaratorBuilder extends Builder<VariableDeclarator> {
  private _name: Builder<ArrayPattern | Identifier | ObjectPattern>;
  private _type?: Builder<TypeAnnotation>;
  private _value?: Builder<Expression>;

  constructor(name: Builder<ArrayPattern | Identifier | ObjectPattern>) {
    super();
    this._name = name;
  }

  type(value: Builder<TypeAnnotation>): this {
    this._type = value;
    return this;
  }

  value(value: Builder<Expression>): this {
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
      name: this._name.build(ctx),
      type: this._type?.build(ctx),
      value: this._value?.build(ctx),
    } as VariableDeclarator;
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

export type { VariableDeclaratorBuilder };

export function variable_declarator(name: Builder<ArrayPattern | Identifier | ObjectPattern>): VariableDeclaratorBuilder {
  return new VariableDeclaratorBuilder(name);
}

export interface VariableDeclaratorOptions {
  name: Builder<ArrayPattern | Identifier | ObjectPattern>;
  type?: Builder<TypeAnnotation>;
  value?: Builder<Expression>;
}

export namespace variable_declarator {
  export function from(options: VariableDeclaratorOptions): VariableDeclaratorBuilder {
    const b = new VariableDeclaratorBuilder(options.name);
    if (options.type !== undefined) b.type(options.type);
    if (options.value !== undefined) b.value(options.value);
    return b;
  }
}
